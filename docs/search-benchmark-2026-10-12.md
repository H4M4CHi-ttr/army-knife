# Multilingual natural-language tool search: comparative evaluation (2026-10-12)

## Scope

This evaluation compares five ways to rank Army Knife's **12 tools** (including the three DevToys-overlap tools that start disabled). It uses **120 separate candidate questions**, two per tool per language, in Japanese, English, Simplified Chinese, Traditional Chinese, and Korean. They were authored for this evaluation, *not* collected from users. The fixed training corpus contains **312** existing localized names/descriptions, technical keywords, and use-case phrases. These 120 questions were not used for model training, coefficient tuning, or RRF weight selection.

**Successful run:** [GitHub Actions #38186710168](https://github.com/H4M4CHi-ttr/army-knife/actions/runs/38186710168).  
**Machine-readable results, all ranked outputs, errors and classifier export:** [Artifact #11720036571](https://github.com/H4M4CHi-ttr/army-knife/actions/runs/38186710168/artifacts/11720036571).

## Accuracy

| Method | Recall@1 | Recall@3 | Additional model data |
|---|---:|---:|---:|
| Original current-language substring matcher | 0.0% | 0.0% | none |
| Current local multilingual intent index | 65.8% | 86.7% | no new model; app JS change ~5.8 kB gzip in initial build comparison |
| **Character n-gram TF-IDF + LinearSVC (trained)** | **72.5%** | 89.2% | **411,410 bytes gzip** (vocabulary, IDF, coefficients, intercept) |
| **RRF: intent index + trained classifier** | 70.8% | **94.2%** | same trained data |
| Quantized multilingual Model2Vec, max per-phrase cosine | 54.2% | 80.8% | **82,662,009 bytes** model files |
| Quantized multilingual Model2Vec, per-tool centroid cosine | 65.0% | 82.5% | same model files |

The hybrid uses fixed reciprocal-rank fusion with k=15, without hyperparameter fitting to the evaluation data.

### Recall@1 by UI/query language

| Language | Intent | Classifier | Hybrid | Model2Vec max | Model2Vec centroid |
|---|---:|---:|---:|---:|---:|
| English | 66.7% | 62.5% | 62.5% | 58.3% | 66.7% |
| Japanese | 58.3% | 70.8% | 62.5% | 58.3% | 58.3% |
| Korean | 66.7% | 83.3% | 83.3% | 54.2% | 70.8% |
| Simplified Chinese | 75.0% | 83.3% | 79.2% | 58.3% | 70.8% |
| Traditional Chinese | 62.5% | 62.5% | 66.7% | 41.7% | 58.3% |

The oldest substring matcher requires every space-separated part to be a literal substring of the current UI language's text; it therefore fails every full task sentence in this particular set. This comparison is not a benchmark of general-purpose text retrieval engines.

## Timings and memory (GitHub-hosted CPU runner, not browser)

| Method | Query p50 | Query p95 |
|---|---:|---:|
| Current TypeScript intent search (Vite test runtime) | 0.123 ms | 0.214 ms |
| Classifier (Python/scikit-learn) | 0.155 ms | 0.201 ms |
| Hybrid (Python inference + rank fusion) | 0.170 ms | 0.213 ms |
| Model2Vec (Python) | 0.082 ms | 0.105 ms |

The processes and runtimes are different. **Do not use these sub-millisecond differences to predict JavaScript/WASM browser speed.** Initialization, first model download, and index generation are excluded.

For the particular Python Model2Vec run, the model loading step increased the process RSS by **1,345,183,744 bytes** (about 1.35 GB), and the resulting process used **1,493,008,384 bytes RSS**. The process after fitting the scikit-learn classifier used **134,119,424 bytes RSS**. This is a Python-loader observation, **not** a browser WASM memory measurement; the browser's int8 model representation could be much more compact. Even so, it is an important reason to validate peak browser memory before opting in to Model2Vec.

## Observed failure patterns

- Shared-list tasks phrased as missing names are often confused with JSON diff, dotenv diff or CSV.
- 'How often did each exception occur in service output?' was outside the lightweight lexicon and did not rank logs in the top three for several approaches.
- Some phrasing about invisible whitespace and nested object changes creates ambiguity across text, JSON, and table tools.
- Hybrid RRF reduced out-of-top-3 errors from **16/120** for the intent index to **7/120**. Classifier alone had **13/120** such errors.

## Recommendation

1. **Keep the zero-model multilingual intent index as the default** for its transfer size and extensibility. It remains fully browser-local and accommodates newly added language packs without changing the scoring code.
2. Prototype the 0.41 MB trained classifier as an **optional enhanced ranker**. A sixth language requires adding intent examples and retraining the classifier, while the baseline index needs only a language pack.
3. For a UI showing three suggestions, compare the hybrid's stronger Recall@3 (94.2%) against the classifier's better first suggestion (72.5%). Prefer measured browser usability to an arbitrary rank-fusion parameter.
4. **Do not ship the 82.66 MB Model2Vec model by default** on the evidence from this small benchmark.
5. Before shipping any classifier, implement and verify a small **browser JS/WASM TF-IDF + linear decision function**, test cold-start size and peak RAM, calibrate unknown-query rejection, and evaluate held-out queries collected independently from real users across languages.

## Reproducibility and limitations

The fixed query fixture is in `scripts/search-compare/heldout.json`. The production search corpus/ranks are exported by `src/lib/search/compare-benchmark.test.ts`, and the trained models and metrics by `scripts/search-compare/run.py`. The standalone GitHub Actions workflow `.github/workflows/search-compare.yml` runs the comparison on the experiment PR, independently of standard deployment CI.

- Classifier: scikit-learn 1.7.2, character 2–4-gram TF-IDF, LinearSVC C=1.0.
- Model2Vec: `777Radik/potion-multilingual-128M-int8` pinned to revision `213e5d3998b7e347982d8dd37a041c527de9e509`.
- Model2Vec accuracy here is from **untrained cosine retrieval**; fine-tuning or a different model might perform better.
- No statistically representative confidence intervals, out-of-domain false-positive tests, browser latency tests or browser memory figures have been established.
- The classifier export includes trained data only; its browser inference implementation has **not** been completed.
