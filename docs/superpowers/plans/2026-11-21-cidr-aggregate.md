# Exact CIDR aggregation implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline; request one independent whole-branch review before merge.

**Goal:** Collapse aligned IPv4 or IPv6 CIDRs into the exact minimal prefix union.
**Architecture:** Reuse existing IP parser/formatter; bounded pure BigInt interval
union and covering; one memory-only Vapor view with two explicit exports.
**Tech Stack:** Existing TypeScript, Vite+, Vue 3.6 RC/Vapor, shadcn-vue.
**Spec:** `docs/superpowers/specs/2026-11-21-cidr-aggregate-design.md`.

## Global constraints

- 1–128 JSON strings, raw UTF-8 8,192 bytes, CIDR 64 ASCII characters.
- Single family; explicit prefix, aligned network; reject rather than trim/mask.
- At most 128 complete output prefixes, JSON128KiB/plain8KiB; no partial exports.
- Exact BigInt counts; immediate <=2,048 UTF-16 units, otherwise800ms/manual/cancel.
- Five languages/themes, no input transmission/persistence/URL/telemetry/WebMCP.
- No dependency, workflow, budget, protection, permission, billing or Pages changes.

## Review focus

- Adjacent blocks that are not siblings cannot expand into a larger prefix.
- Containment and duplicates must not inflate total address counts.
- IPv6 /0, highest /128 and adjacent addresses above 2^53 stay exact.
- Rejected/pending input hides both exports, and late reads cannot restore them.
- Every displayed/exported prefix belongs to the complete union; no silent omission.

### Task 1: Exact pure union

**Files:** `src/lib/tools/cidr-aggregate{,.test,-sample}.ts`; two existing helper
exports in `src/lib/tools/cidr.ts`.
**Produces:** `aggregateCidrs(input): CidrAggregateReport` and indexed
`CidrAggregateEntryError` per spec; shared limits and example constants.

- [ ] Write/run failing merge/gap/containment/precision/strict-input/index/bound tests.
- [ ] Export shared parser/formatter without behavior changes; implement minimal union.
- [ ] Compare deterministic corpora with native Python collapse and mapped-range signatures.
- [ ] Run focused and existing CIDR tests; record actual outcomes.

### Task 2: Vapor view and localized integration

**Files:** `CidrAggregateTool{.vue,.test.ts}`, `src/i18n/cidr-aggregate.ts`,
`src/lib/cidr-aggregate-guide.ts`, catalog/App/icon/messages/tool-guides.
**Consumes:** Task1report/limits/examples/errors; existing shared controls.

- [ ] Write/run failing actual Vapor tests for samples, exact totals, indexed errors,
  complete independent copies, imports/late reads, locales, timing/cancel/disposal.
- [ ] Implement view and all five localized guides; default-on registration.
- [ ] Run focused/full units, old search quality, type and Vapor checks.

### Task 3: Browser evidence and delivery

**Files:** local/public CIDR aggregation E2E, README, testing/overlap/tool docs,
synthetic EN-light/JA-dark desktop/small screenshots.

- [ ] Check four projects/five locales/themes, keyboard/mobile, real complete downloads,
  memory lifecycle, raw CRLF byte boundary and exact-distribution request audit.
- [ ] Run all repository gates on immutable final commit and review whole branch.
- [ ] Fix material findings with regression; update draft PR and ready after verification.
- [ ] Check fresh main/head/mergeability/required checks/reviews, normally merge guarded SHA.
- [ ] Recover existing automatic main/Pages/live-test results; verify actual tool and
  public-assets revision before reporting completion. Keep broader #60 open.
