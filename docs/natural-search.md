# Local multilingual task search

Army Knife searches *what someone wants to do*, not only exact tool names.

## Design and privacy

- Zero-dependency, synchronous local search index: no model download, outside search API, telemetry, or CDN.
- Indexes all supported languages (ja, en, zh-CN, zh-TW, ko) regardless of the selected UI locale.
- Sources are tool names/descriptions in existing translations, technical keywords, and three intent phrases per tool per language.
- Unicode NFKC normalization, case folding, and CJK 2/3-grams work without relying on segmentation dictionaries.
- Word weights depend on frequency across tools, with higher priority for name and whole-phrase matches. Stable tie ordering follows the tool catalog.
- Search input remains in memory. The search engine never writes to storage or sends requests.
- Filtering by enabled tools, category, and favorites is preserved.

**Limit:** This is task-oriented lexical retrieval with multilingual curated intents, not neural semantic embedding. Unseen paraphrases and misspellings can still fail.

The incremental compressed bundle size should be measured in a production build. There are no new package dependencies or model assets.

## Add a language later

1. Register the UI language in the existing i18n stack (translations, supported locale/preferences, and font handling).
2. Add one entry in `src/lib/search/intents.ts` using stable tool IDs; supply at least two varied natural-language goals per tool.
3. Add the localized placeholder and accessible label to `src/i18n/search.ts`.
4. Extend the fixture in `src/lib/search/index.test.ts` with examples in the new language and run both unit and browser tests.

**The search engine itself needs no changes.** It accepts additional `SearchLanguagePack` entries through `createToolSearch`. The automated sixth-language test demonstrates this, independently of UI language support.

## Verification

`src/lib/search/index.test.ts` checks:
- 5 languages x 6 representative tasks (30 queries) with Recall@1 and Recall@3, compared against the original current-locale substring search.
- Dictionary completeness, Unicode normalization, cross-language behavior, disabled tool filtering, and dynamic registration of a sixth language.

`tests/e2e/app.spec.ts` also checks the actual app search interface in Chromium and Firefox (desktop and mobile), locale switching, Enter-to-open, and storage/network restrictions.

The fixture is deliberately a **small regression set**, not a representative semantic-search benchmark. A future comparison with dedicated classifiers or Model2Vec should use held-out paraphrases, mistakes, mixed-language queries, and ambiguous tasks; measure per-language Recall@1 / Recall@3, false positives, bundle size, latency and memory.

## Future experiments

- Benchmark a dedicated multilingual intent classifier or compact cross-lingual static embedding model independently of production code.
- Use an optional user-controlled download; never fetch a model just to open the tool list.
- Enable experimental semantic search only if measured gains justify initial transfer and peak memory.
