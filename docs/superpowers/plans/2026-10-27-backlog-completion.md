# Complete PR #149 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Independent reviewers inspect the changed engines and final patch.

**Goal:** Finish the existing ten-tool PR before starting another scheduled feature.

**Architecture:** Preserve the existing shared Vapor view and bounded pure parsers. Use the current execution controller and cancellable Worker for larger jobs; keep sitemap XML inert and bounded on the main thread. Repair demonstrated parser and lifecycle errors without changing other branches or analytics.

**Tech Stack:** Repository-pinned Vite+, Vue 3.6 RC/Vapor, shadcn-vue, TypeScript, existing Rust/WASM and local Noto/Sarasa assets.

**Spec:** User's 2026-10-27 JST scheduled request, PR #149, README.md, docs/testing.md, docs/devtoys-coverage.md, docs/vapor.md, docs/fonts.md; completion semantics recorded in docs/backlog.md.

## Global Constraints

- Only H4M4CHi-ttr/army-knife; finish #149, no additional PR or IDN reimplementation.
- No input/result transmission, URL persistence, durable input storage, new telemetry, external runtime fonts, WebMCP, dependencies, credentials, or hosting settings.
- Preserve main's existing tools, five locales, themes and conservative DevToys opt-in policy.
- Do not bypass protection, force push, weaken tests, change GA or another contributor's branch.
- Verify the final head and main with the complete existing CI workflow; inability to run a check is a blocker, not success.

## Review Focus

- Small adversarial robots patterns must finish in bounded time and remain cancellable for larger work.
- SQLite IDs and duration fractions must never silently round or normalize invalid data.
- Invalid/out-of-range timestamps must produce a clear diagnostic instead of losing all valid records.
- Secret-bearing DSN parameters and malformed formats must not reach displayed or exported values.
- Rejected input, pending cancellation, navigation and reload must invalidate stale output.

### Task 1: Integrate current main

Files: src/App.test.ts, src/lib/preferences.test.ts, src/lib/catalog.ts, src/i18n/messages.ts.

- [x] Inspect main, repository instructions (no AGENTS.md or .agents/skills present), docs, tools and open PRs.
- [x] Restore #149 to draft; merge main locally, retaining both message/catalog additions and catalog-derived expectations.
- [x] Verify integration with type checking, unit and Vapor tests.

### Task 2: Repair reproduced parser and lifecycle failures

Files: src/lib/tools/backlog-{core,web,runner}.ts; src/components/tools/BacklogTool.vue; src/i18n/backlog.ts; associated tests.

- [x] Add regression assertions for reviewer reproductions and stale exports; run them to observe the expected failures.
- [x] Repair each demonstrated failure, preserving explicit scope and bounded input/output.
- [x] Run focused tests, then all unit tests; respond to independent reviewers with regression evidence.
- [x] Add browser checks for real Workers, invalid input, explicit export, keyboard, five locales, themes, privacy and clearing.

### Task 3: Evidence and release

Files: docs/backlog.md, docs/testing.md, docs/devtoys-coverage.md, README.md, tests/e2e/backlog.spec.ts, docs/screenshots/backlog-*.png.

- [x] Document exact semantics, approximations and rejected formats; recheck official bundled DevToys coverage.
- [ ] Verify typecheck, lint, all unit, Rust/Clippy/WASM, Vapor, production build, distribution/licenses and all four browser projects at final head.
- [ ] Record synthetic screenshots and concrete CI/review evidence in #149; mark ready only after checks and significant findings are resolved.
- [ ] Recheck latest main, conflicts, exact head and repository merge rules; perform ordinary merge.
- [ ] Check final main workflow, existing Pages deployment and public feature behavior in Chromium and Firefox. Report any precise remaining blocker.

Execution evidence: local type checking, 1,036 unit tests, 43 Rust tests, Clippy,
actual WASM, 41 Vapor SFCs, 22 verification-script tests, font/license/distribution
checks and 18 dedicated Chromium desktop/small E2E cases passed. Sixteen synthetic
screenshots were inspected. Local Firefox starts with workspace XDG paths but its
content processes cannot write `/proc/self/uid_map` in this container; the unmodified
four-project CI is the release gate for both browsers. Final head, CI, normal merge
and public deployment results are recorded in PR #149.
