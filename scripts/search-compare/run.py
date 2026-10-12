#!/usr/bin/env python3
"""Offline comparison of actual app search, trained classifier, and Model2Vec.

The 120 held-out queries are never used for training or selecting parameters.
Python model timing is NOT a browser timing.
"""
from __future__ import annotations

import gzip
import json
import os
import time
from pathlib import Path

import numpy as np
import psutil
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC

HERE = Path(__file__).resolve().parent
OUT = HERE / ".out"
MODEL_REPO = "777Radik/potion-multilingual-128M-int8"
MODEL_COMMIT = "213e5d3998b7e347982d8dd37a041c527de9e509"
TOOL_IDS = ["har","env","url","explain","csv","logs","sets","cidr","unicode","json-diff","json-format","contrast"]


def mb(n):
    return f"{n / 1_000_000:.2f} MB" if n is not None else "n/a"


def latency(values):
    return {k: round(float(np.percentile(values, p)), 4)
            for k, p in (("p50_ms", 50), ("p95_ms", 95))}


def unit(v):
    a = np.asarray(v, dtype=np.float32)
    return a / np.maximum(np.linalg.norm(a, axis=1, keepdims=True), 1e-12)


def evaluate(rankings, expected, languages):
    def recall(ids, k):
        return round(100 * sum(expected[i] in rankings[i][:k] for i in ids) / len(ids), 2)
    ids = list(range(len(expected)))
    return {
        "top1": recall(ids, 1), "top3": recall(ids, 3),
        "empty": sum(not r for r in rankings),
        "per_locale": {
            language: {
                "count": len(group := [i for i, x in enumerate(languages) if x == language]),
                "top1": recall(group, 1), "top3": recall(group, 3),
            }
            for language in sorted(set(languages))
        }
    }


def report(result):
    labels = {
        "old_substring": "Old locale-only substring",
        "lexical": "Current 5-language intent index",
        "classifier": "TF-IDF character 2-4gram + LinearSVC",
        "hybrid": "RRF (intent index + classifier)",
        "model2vec_max": "Model2Vec int8, best prototype",
        "model2vec_centroid": "Model2Vec int8, per-tool centroid",
    }
    lines = [
        "# Army Knife: five-language search comparison", "",
        "- Held-out queries: **120** (2 new phrasings x 12 tools x 5 languages).",
        f"- Training text: **{result['train_examples']}** existing catalog names, descriptions, keywords and curated intent phrases.",
        "- Test examples were not used to train or tune the alternatives.",
        "- Only the intent index is running in the deployed browser app; classifier and Model2Vec here use a GitHub Actions Linux CPU runner.",
        "",
        "| Approach | Recall@1 | Recall@3 | p50 query | p95 query | Model data |",
        "|---|---:|---:|---:|---:|---:|---:|",
    ]
    for key, label in labels.items():
        x = result["methods"].get(key)
        if not x:
            lines.append(f"| {label} | not measured | — | — | — | — |")
            continue
        t = x.get("latency")
        timing = (f"{t['p50_ms']:.3f} ms", f"{t['p95_ms']:.3f} ms") if t else ("—", "—")
        size = mb(x["data_bytes"]) if "data_bytes" in x else "existing app bundle"
        lines.append(
            f"| {label} | {x['top1']:.1f}% | {x['top3']:.1f}% | {timing[0]} | {timing[1]} | {size} |"
        )

    lines += ["", "## Recall@1 by language", "",
              "| Language | Old | Intent | Classifier | Hybrid | M2V best | M2V centroid |",
              "|---|---:|---:|---:|---:|---:|"]
    for lang in result["languages"]:
        cells = []
        for name in labels:
            x = result["methods"].get(name)
            cells.append(f"{x['per_locale'][lang]['top1']:.1f}%" if x else "—")
        lines.append("| " + lang + " | " + " | ".join(cells) + " |")

    lines += [
        "", "## Transfer size, fairness, limitations", "",
        f"- Portable classifier coefficients, vocabulary and IDF: **{mb(result.get('classifier_export_bytes'))} gzip**. A JS implementation is not included.",
        f"- Pinned Model2Vec model files: **{mb(result.get('model_files_bytes'))}** on disk, without its JS/WASM runtime.",
        "- LinearSVC settings: C=1, fixed character n-grams of lengths 2-4; all methods use the identical pre-existing corpus.",
        "- Model2Vec compares cosine similarity against individual prototypes, or an averaged prototype per tool; both variants are reported.",
        "- Hybrid uses an untuned reciprocal rank fusion (k=15) of the existing intent ranker and the supervised classifier.",
        "- Query timing includes vectorization or embedding and ranking, but not first download, initialization or model index construction.",
        "- Timings are Python CPU versus JavaScript test-runner CPU, not matched browser executions.",
        "- Test prompts were authored for this evaluation, not collected from real users. This is a regression comparison, not a population accuracy estimate.",
        "- False-positive and unknown-intent rejection rates have not been calibrated.",
    ]
    if error := result.get("model_error"):
        lines += ["", "## Model2Vec error", "", error]
    text = "\n".join(lines) + "\n"
    (OUT / "report.md").write_text(text, encoding="utf8")
    print(text)
    if summary := os.getenv("GITHUB_STEP_SUMMARY"):
        with open(summary, "a", encoding="utf8") as f:
            f.write(text)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    lexical = json.loads((OUT / "lexical.json").read_text("utf8"))
    corpus = json.loads((OUT / "corpus.json").read_text("utf8"))["rows"]
    rows = lexical["examples"]
    expected = [r["expected"] for r in rows]
    languages = [r["language"] for r in rows]
    queries = [r["query"] for r in rows]
    text_data = [r["text"] for r in corpus]
    labels = [r["label"] for r in corpus]
    assert len(rows) == 120
    assert len(corpus) == 312, len(corpus)
    assert set(labels) == set(TOOL_IDS)
    proc = psutil.Process()
    result = {
        "queries": len(queries), "train_examples": len(corpus),
        "languages": sorted(set(languages)), "model": MODEL_REPO,
        "revision": MODEL_COMMIT, "methods": {},
    }
    for name, key in [("old_substring", "original"), ("lexical", "lexical")]:
        x = evaluate([r[key] for r in rows], expected, languages)
        if name == "lexical":
            x["latency"] = lexical["latency"]
        result["methods"][name] = x

    # Fixed baseline: train a real 12-class language-independent model.
    t = time.perf_counter()
    vectorizer = TfidfVectorizer(
        analyzer="char", ngram_range=(2, 4), lowercase=True,
        dtype=np.float32, sublinear_tf=True,
    )
    train_matrix = vectorizer.fit_transform(text_data)
    classifier = LinearSVC(C=1.0, random_state=0, max_iter=4000)
    classifier.fit(train_matrix, labels)
    train_time = time.perf_counter() - t
    predictions, classifier_timing = [], []
    for query in queries:
        begin = time.perf_counter_ns()
        score = classifier.decision_function(vectorizer.transform([query]))[0]
        predictions.append([str(classifier.classes_[i]) for i in np.argsort(score)[::-1]])
        classifier_timing.append((time.perf_counter_ns() - begin) / 1_000_000)
    x = evaluate(predictions, expected, languages)
    x["latency"] = latency(classifier_timing)
    x["training_seconds"] = round(train_time, 4)
    x["features"] = len(vectorizer.vocabulary_)
    result["methods"]["classifier"] = x

    portable = {
        "format": "sklearn-tfidf-char-2-4-linear-svc-v1",
        "vocabulary": vectorizer.get_feature_names_out().tolist(),
        "idf": vectorizer.idf_.astype(np.float32).tolist(),
        "classes": classifier.classes_.tolist(),
        "weights": classifier.coef_.astype(np.float32).tolist(),
        "intercept": classifier.intercept_.astype(np.float32).tolist(),
    }
    payload = gzip.compress(json.dumps(portable, ensure_ascii=False, separators=(",", ":")).encode("utf8"), compresslevel=9)
    result["classifier_export_bytes"] = len(payload)
    result["methods"]["classifier"]["data_bytes"] = len(payload)
    (OUT / "classifier-portable.json.gz").write_bytes(payload)
    # Exploration only: fixed, untuned reciprocal-rank fusion (k=15).
    # A tool absent from lexical results receives no lexical contribution.
    fused, fusion_times = [], []
    for example, query in zip(rows, queries):
        start = time.perf_counter_ns()
        cls_scores = classifier.decision_function(vectorizer.transform([query]))[0]
        cls_rank = [str(classifier.classes_[i]) for i in np.argsort(cls_scores)[::-1]]
        lex_rank = example["lexical"]
        cls_order = {label: i for i, label in enumerate(cls_rank)}
        lex_order = {label: i for i, label in enumerate(lex_rank)}
        combined = sorted(
            TOOL_IDS,
            key=lambda tool: (
                1.0 / (15 + cls_order[tool])
                + (1.0 / (15 + lex_order[tool]) if tool in lex_order else 0.0)
            ),
            reverse=True,
        )
        fused.append(combined)
        fusion_times.append((time.perf_counter_ns() - start) / 1_000_000)
    fused_score = evaluate(fused, expected, languages)
    fused_score["latency"] = latency(fusion_times)
    fused_score["data_bytes"] = len(payload)
    result["methods"]["hybrid"] = fused_score
    result["classifier_process_rss_bytes"] = proc.memory_info().rss

    # Real Model2Vec inference on a pinned MIT-licensed multilingual model.
    # The download is for CI research only; not a deployed app asset.
    try:
        from huggingface_hub import snapshot_download
        from model2vec import StaticModel

        before_rss = proc.memory_info().rss
        begin = time.perf_counter()
        model_path = Path(snapshot_download(
            MODEL_REPO,
            revision=MODEL_COMMIT,
            allow_patterns=["*.json", "*.safetensors"],
        ))
        result["model_download_seconds"] = round(time.perf_counter() - begin, 3)
        result["model_files_bytes"] = sum(p.stat().st_size for p in model_path.glob("*") if p.is_file())
        begin = time.perf_counter()
        model = StaticModel.from_pretrained(model_path)
        result["model_load_seconds"] = round(time.perf_counter() - begin, 3)
        result["model_load_rss_delta_bytes"] = proc.memory_info().rss - before_rss
        begin = time.perf_counter()
        prototypes = unit(model.encode(text_data))
        result["model_index_seconds"] = round(time.perf_counter() - begin, 3)

        by_tool = {label: np.array([i for i, x in enumerate(labels) if x == label])
                   for label in TOOL_IDS}
        centroids = unit(np.asarray([
            prototypes[by_tool[label]].mean(axis=0) for label in TOOL_IDS
        ]))
        m2v = {"model2vec_max": [], "model2vec_centroid": []}
        timings = []
        for query in queries:
            begin = time.perf_counter_ns()
            q = unit(model.encode([query]))[0]
            similarities = prototypes @ q
            max_scores = np.array([similarities[by_tool[label]].max() for label in TOOL_IDS])
            centroid_scores = centroids @ q
            m2v["model2vec_max"].append([TOOL_IDS[i] for i in np.argsort(max_scores)[::-1]])
            m2v["model2vec_centroid"].append([TOOL_IDS[i] for i in np.argsort(centroid_scores)[::-1]])
            timings.append((time.perf_counter_ns() - begin) / 1_000_000)
        for method, ranks in m2v.items():
            x = evaluate(ranks, expected, languages)
            x["latency"] = latency(timings)
            x["data_bytes"] = result["model_files_bytes"]
            result["methods"][method] = x
        result["model_process_rss_bytes"] = proc.memory_info().rss
    except Exception as exc:
        result["model_error"] = str(type(exc).__name__) + ": " + str(exc)
        (OUT / "results.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), "utf8")
        report(result)
        raise

    (OUT / "results.json").write_text(json.dumps(result, indent=2, ensure_ascii=False), "utf8")
    report(result)

    all_preds = {
        "old_substring": [r["original"] for r in rows],
        "lexical": [r["lexical"] for r in rows],
        "classifier": predictions,
        "hybrid": fused,
        "model2vec_max": m2v["model2vec_max"],
        "model2vec_centroid": m2v["model2vec_centroid"],
    }
    errors = {
        name: [
            {"language": languages[i], "query": queries[i],
             "expected": expected[i], "top3": predicted[i][:3]}
            for i in range(len(rows)) if expected[i] not in predicted[i][:3]
        ] for name, predicted in all_preds.items()
    }
    (OUT / "errors.json").write_text(json.dumps(errors, ensure_ascii=False, indent=2), "utf8")


if __name__ == "__main__":
    main()
