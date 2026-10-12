#!/usr/bin/env python3
"""Rebuild the pinned 12-way browser classifier from the committed search corpus.

Input corpus.json is exported by compare-benchmark.test.ts from stable, authored
search intents and translated tool labels. Evaluation examples are NOT used to train.
scikit-learn==1.7.2, numpy from the pinned installation, Python 3.12.
"""
from __future__ import annotations

import gzip
import hashlib
import io
import json
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC

ROOT = Path(__file__).resolve().parents[2]
CORPUS = ROOT / "scripts" / "search-compare" / ".out" / "corpus.json"
OUTPUT = ROOT / "public" / "models" / "classifier-v1.json.gz"

def main() -> None:
    rows = json.loads(CORPUS.read_text(encoding="utf8"))["rows"]
    tools = {row["label"] for row in rows}
    assert len(rows) == 312 and len(tools) == 12, (len(rows), tools)
    vectorizer = TfidfVectorizer(
        analyzer="char", ngram_range=(2, 4), lowercase=True,
        dtype=np.float32, sublinear_tf=True,
    )
    features = vectorizer.fit_transform([row["text"] for row in rows])
    svm = LinearSVC(C=1.0, random_state=0, max_iter=4000)
    svm.fit(features, [row["label"] for row in rows])
    payload = {
        "format": "sklearn-tfidf-char-2-4-linear-svc-v1",
        "vocabulary": vectorizer.get_feature_names_out().tolist(),
        "idf": vectorizer.idf_.astype(np.float32).tolist(),
        "classes": svm.classes_.tolist(),
        "weights": svm.coef_.astype(np.float32).tolist(),
        "intercept": svm.intercept_.astype(np.float32).tolist(),
    }
    data = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf8")
    output = io.BytesIO()
    with gzip.GzipFile(fileobj=output, mode="wb", filename="", mtime=0, compresslevel=9) as archive:
        archive.write(data)
    compressed = output.getvalue()
    assert 100_000 < len(compressed) <= 600_000, len(compressed)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(compressed)
    print("Classifier features:", len(payload["vocabulary"]))
    print("Compressed bytes:", len(compressed))
    print("SHA-256:", hashlib.sha256(compressed).hexdigest())
    print("Model output:", OUTPUT.relative_to(ROOT))

if __name__ == "__main__":
    main()
