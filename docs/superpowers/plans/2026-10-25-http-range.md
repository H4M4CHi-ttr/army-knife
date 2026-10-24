# HTTP Byte Range Inspector Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; obtain an independent whole-branch review.

**Goal:** Resolve recorded HTTP byte ranges locally with exact offsets and unique coverage.
**Architecture:** Bounded pure TypeScript/BigInt engine, Vapor view, existing input/execution/output controls and localized static guides.
**Tech Stack:** Existing Vite+, Vue 3.6 RC/Vapor, shadcn-vue, TypeScript.
**Spec:** `docs/http-range.md`

## Global Constraints

- Only H4M4CHi-ttr/army-knife; preserve #145/#149 and mounted empty repository.
- No new dependency, input transmission/persistence, telemetry, publishing settings or remote fonts.
- Range 8 KiB / 32 members; all numerals and size at most 40 digits.
- Combined input up to 2,048 UTF-16 units instant; otherwise existing 800ms/manual/cancel.
- Five languages, themes, keyboard, mobile; final-head checks and normal merge/Pages verification.

## Review Focus

- Positive suffix on zero length is satisfiable but empty; no negative offsets.
- Reversed ranges invalidate the whole field even alongside a valid member.
- Duplicate/overlapping vs adjacent intervals have correct sum and unique totals.
- Huge values and leading zeroes remain exact strings, including exports.
- Either input edit/rejected paste/cancel/navigation invalidates old results and exports.

### Task 1: Engine

**Files:** `src/lib/tools/http-range.ts`, `src/lib/tools/http-range.test.ts`.
**Interfaces:** Produce `inspectHttpRanges(input: string, length: string): HttpRangeReport`, `HTTP_RANGE_LIMITS` and `HTTP_RANGE_SAMPLE`.
- [x] Write and run failing semantic/boundary/malformed/limit vectors.
- [x] Implement bounded parsing, BigInt resolution and union; pass vectors.

### Task 2: Integrated view

**Files:** `src/components/tools/HttpRangeTool.vue`, view tests, catalog/App/icon, `src/i18n/http-range.ts`, messages, `src/lib/http-range-guide.ts`, guides, README, overlap/testing docs.
**Interfaces:** Consume engine report; expose `/{locale}/tools/http-range/`.
- [x] Write and run failing view tests for immediate dual-input updates, lifecycle, scheduling and paste rejection.
- [x] Implement localized Vapor view/guides; type/unit/Vapor checks.
- [x] Commit, push isolated branch, initially draft PR.

### Task 3: Release

**Files:** `tests/e2e/http-range.spec.ts`, synthetic screenshots and evidence.
**Interfaces:** Exercise production route with exact-dist-asset privacy audit.
- [x] Five locales, themes/keyboard/mobile, errors, export, delay/manual/cancel, memory-only lifecycle in four projects.
- [x] Independent review; fix substantive findings with regression tests.
- [ ] All final-head checks, ready PR, recheck main/conflicts/head/checks/reviews; normal merge.
- [ ] Confirm main contains merge; monitor automatic Pages deployment and public UI or precise blocker.
