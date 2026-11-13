# PostgreSQL text-array codec implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert bounded PostgreSQL text-array values and JSON string/null arrays locally.

**Architecture:** Independent pure TypeScript codec, a Vapor view using the shared
execution/input/export controls, typed five-language messages and static guides.
No new dependency or worker; the 8 KiB scanner is bounded and larger inputs use
the existing delayed/manual controls.

**Tech Stack:** Existing pinned Vite+, Vue 3.6 RC/Vapor, shadcn-vue and Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-pg-text-array-design.md`.

## Global constraints

- Raw UTF-8 input: 8192 bytes; 256 items; each generated representation: 32768 bytes.
- PostgreSQL whitespace is ASCII SP/HTAB/LF/CR/FF/VT, not JavaScript `\s`.
- Accept empty arrays and one-dimensional, comma-delimited values only, with `array_nulls=on`.
- Up to 2048 UTF-16 units: immediate; otherwise shared 800ms/manual/cancel controls.
- No input/result network, logging, URL/storage, telemetry, font/CDN, WebMCP or settings change.

## Review focus

- Escaped NULL and escaped edge whitespace must not become null or disappear.
- Empty `{}` is zero-dimensional; root JSON null and nested arrays are unsupported.
- Numeric-looking values stay strings, including values above 2^53.
- Rejected file/paste and pending mode changes cannot leave stale exports.
- Full outputs are complete; only the item table is a clearly labelled 32-item preview.

### Task 1: Pure codec

**Files:** `src/lib/tools/pg-text-array{,.test,-sample}.ts`.
**Interfaces:** `decodePgTextArray(string)` / `encodePgTextArray(string)` return
`PgTextArrayReport {values: (string|null)[], array: string, json: string,
nullCount: number, emptyCount: number, dimensions: 0|1}`.

- [ ] Add failing examples: `{NULL,"NULL","",N\\ULL}` maps to null/string/empty/string;
  `{}` maps to `[]`; quoted numeric values retain all digits; escaped edge whitespace survives.
- [ ] Run `pnpm test src/lib/tools/pg-text-array.test.ts`; confirm missing implementation.
- [ ] Implement the bounded scanner, strict JSON shape/text checks and canonical encoder.
- [ ] Verify exact UTF-8/item/output boundaries, malformed/unsupported forms and round trips.
- [ ] Run the unit suite; retain one focused feature commit after integration.

### Task 2: View, messages and catalogue

**Files:** `src/components/tools/PgTextArrayTool{.vue,.test.ts}`, `src/i18n/pg-text-array.ts`,
`src/lib/pg-text-array-guide.ts`, `src/lib/catalog.ts`, `src/lib/tool-guides.ts`,
`src/i18n/messages.ts`, `src/App.vue`, `src/components/ToolIcon.vue`.

- [ ] Add failing real Vapor tests for both modes, empty/null values, explicit copy,
  complete output/32-item preview, rejected edits, 800ms/manual/cancel/disposal and locales.
- [ ] Implement bounded memory-only view and all five localized dictionaries/guides.
- [ ] Register the default-on tool and verify real view tests, type checks and full units.

### Task 3: Production evidence and delivery

**Files:** `tests/e2e/pg-text-array.spec.ts`, `tests/public/pg-text-array.spec.ts`,
`docs/pg-text-array.md`, README, coverage/testing docs and four synthetic screenshots.

- [ ] Exercise both modes in all four browser projects, five locales/themes, keyboard,
  complete actual downloads, rejection/import/BOM, delayed/manual/cancel, privacy and clearing.
- [ ] Save and inspect English light / Japanese dark desktop and 390px screenshots.
- [ ] Commit, run final-head fonts/Rust/Clippy/WASM/type/lint/all units/Vapor/scripts/build/
  distribution/public-test collection/dedicated E2E; record exact head and all outcomes.
- [ ] Push and create draft PR with purpose/use/scope/constraints/tests/images.
- [ ] Obtain independent immutable-diff review, fix findings and rerun affected final gates.
- [ ] Await full PR CI; refresh latest main, exact head, rules/checks/reviews; ready then normal merge.
- [ ] Verify exact main tree, existing main CI/Pages, public browser suite and live HTTP/mobile
  operation. Record URLs, SHAs and remaining blockers accurately; do not touch #169 or #145.
