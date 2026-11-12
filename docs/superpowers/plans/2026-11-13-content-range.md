# Content-Range Inspector Implementation Plan

> Use superpowers:executing-plans in this session.

**Goal:** Exact local inspection of one recorded byte Content-Range field.
**Architecture:** Bounded TypeScript/BigInt, one Vapor view, five messages/guides.
**Design:** [Contract and scope](../specs/2026-11-13-content-range-design.md).
**Constraints:** No dependency, external input/result transport/storage, font,
telemetry, WebMCP or deployment change. Existing request-range tool stays separate.

## 1. Pure engine

Files: `src/lib/tools/content-range.ts`, `.test.ts`, `content-range-sample.ts`.
- [ ] Write tests for known/unknown/unsatisfied-zero intervals, inclusive counts,
  large exact values, all 40-digit/256-byte bounds, syntax and atomic errors.
- [ ] Run focused tests RED before implementation; implement contract; GREEN.

## 2. Integrated workflow

Files: `ContentRangeTool.vue`, `.test.ts`, `src/i18n/content-range.ts`, guide,
catalogue/App/icons/messages/guide registry; README/overlap/testing/scope docs.
- [ ] Real Vapor tests before view: empty/sample, null vs zero, immediate auto-off,
  rejected paste/file/BOM/UTF-8, exact explicit JSON, five locales and disposal.
- [ ] Implement one default-on network tool with complete wrapping values and
  explicit unsupported/unknown semantics. No heavy execution/worker required.
- [ ] Run focused/full unit, type and lint gates; document exact scope and limits.

## 3. Final verification and delivery

Files: `tests/e2e/content-range.spec.ts`, `tests/public/content-range.spec.ts`,
synthetic screenshots.
- [ ] Four projects/five locales/themes, keyboard/mobile, exact JSON/download,
  bounds/import/rejection/manual-preference/lifecycle, exact-asset privacy.
- [ ] Extend existing public Pages suite with the new operation check.
- [ ] Inspect synthetic screenshots; commit final code and run applicable full
  local gates and dedicated four-project E2E on that commit.
- [ ] Independent immutable-head review, repair material findings and verify.
  Push own branch; draft PR with purpose/use/scope/tests/limits/screenshots.
- [ ] Require final-head full CI; recheck current main/head/check/review/conflicts;
  ready and ordinary merge guarded by exact head. Confirm main tree/SHA,
  existing deployment and public tests/browser operation. Report exact blockers.

Review focus: off-by-one boundaries; integer precision and 41-digit derived
counts; null vs zero/false; unsatisfied syntax vs response-body size; scope
claims; raw bounds/ASCII/BOM; stale exports after rejected edits and disposal.
