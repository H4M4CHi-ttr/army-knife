# Retry-After Inspector Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Native execution is selected under the autonomous daily task.

**Goal:** Inspect recorded Retry-After delays and sender-format dates locally.

**Architecture:** A pure bounded parser returns exact decimal duration strings.
The Vapor component reuses execution and I/O controls. Catalog, five-language
messages and static guides expose the tool without loading analysis in guides.

**Tech Stack:** Existing Vue 3.6 RC/Vapor, TypeScript, BigInt and Playwright.

**Spec:** `docs/superpowers/specs/2026-11-03-retry-after-design.md`

## Global Constraints

- 8 KiB field / 64-byte reference / 40-digit delay / years 0001–9999.
- Explicit UTC reference; strict IMF-fixdate only; no leap seconds.
- Immediate through 2,048 characters, otherwise 800ms/manual/cancel.
- Five locales; no input persistence, network processing or new dependencies.
- Draft PR first; final-head gates and ordinary merge; existing Pages verification.

## Review Focus

- Calendar normalization must not accept impossible dates or wrong weekdays.
- Date millisecond differences must round positive seconds upward.
- Huge delays must preserve every digit and omit unrepresentable target dates.
- Rejected edits must remove prior output and disable stale export.
- Cancel/sample, route and language changes must discard pending results.

### Task 1: Exact parser

Files: `src/lib/tools/retry-after.ts`, `retry-after-sample.ts`,
`retry-after.test.ts` in that directory.
Interface: `inspectRetryAfter(input: string, reference: string): RetryAfterReport`.
Report: kind, normalized value/reference/target, declared delay, wait milliseconds,
minimum whole seconds and past-date flag; integer durations are strings.

- [ ] Write literal tests for 120 seconds, exact huge delays, IMF-fixdate,
  .001/.999 references, past/equal, leap/calendar/weekday and size limits.
- [ ] Run tests and observe missing feature failure.
- [ ] Implement strict parsing and BigInt addition/difference; pass parser tests.
- [ ] Commit parser and tests.

### Task 2: Vapor integration and guides

Files: `RetryAfterTool.vue`, `src/i18n/retry-after.ts`,
`src/lib/retry-after-guide.ts`, catalog/messages/guides/App/icon registration,
real-App integration test, README, policy and `docs/retry-after.md`.

- [ ] Write activation/lifecycle tests; observe missing view failure.
- [ ] Add two labeled bounded CodeInputs, shared ApplyControl and explicit JSON.
- [ ] Add five complete locale dictionaries and guides, default-on registration.
- [ ] Pin rejected-edit, stale output, manual/cancel/sample and locale disposal.
- [ ] Run typecheck, unit and Vapor gates; commit integration and documentation.

### Task 3: Browser verification and release

File: `tests/e2e/retry-after.spec.ts`; synthetic screenshots in `docs/screenshots`.

- [ ] Add five-locale/theme/keyboard/width vectors, exact export, lifecycle,
  date errors/bounds, delay/manual/cancel and exact-asset privacy checks.
- [ ] Run all local available gates and all four browser projects.
- [ ] Obtain independent review and address material findings with regression tests.
- [ ] Push a new branch, create draft PR with scope, commands, limits and evidence.
- [ ] Ensure full final-head CI passes, mark ready, re-read main/head/checks/reviews,
  ordinary merge, then track Pages and verify the public behavior.
