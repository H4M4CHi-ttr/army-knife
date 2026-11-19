# Git branch-name checker implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline; one independent whole-branch review before merge.

**Goal:** Explain literal Git branch-name syntax offline for CI/release names.
**Architecture:** Bounded pure TypeScript checker with a memory-only Vapor view,
existing execution/input/output controls and shared exact-asset browser audit.
**Tech Stack:** Existing Vite+, Vue 3.6 RC/Vapor, shadcn-vue, TypeScript; no packages.
**Spec:** `docs/superpowers/specs/2026-11-20-git-branch-design.md`.

## Global constraints

- Raw UTF-8 input 8,192 bytes; 1–128 strings; each name 512 bytes; JSON 128 KiB.
- Immediate through 2,048 UTF-16 units, otherwise 800ms/manual/cancel.
- 32 preview rows, complete exports; no trim/repair/normalization/expansion.
- Five locales/themes, no external data transmission, persistence or WebMCP.
- Keep all tests, protection, permissions, budget and Pages settings unchanged.

## Review focus

- `@`, `HEAD`, leading hyphens and literal full-looking refs differ from generic ref checks.
- `.lock` is per component/case-sensitive; a dot before a slash is allowed.
- Unicode format characters stay valid where Git permits them but render visibly.
- Rejected/pending input invalidates every export; late reads cannot restore it.
- Full counts/exports include invalid rows and rows beyond the labelled preview.

### Task 1: Pure literal syntax checker

**Files:** `src/lib/tools/git-branch{,.test,-sample}.ts`.
**Produces:** `inspectGitBranches(input: string): GitBranchesReport` per spec.

- [ ] Write/run failing tests for valid `@`, reserved HEAD, all syntax issues,
  literal refs/controls/Unicode, count/name/raw byte boundaries, atomic failures.
- [ ] Implement bounded parse and linear diagnostics; preserve order and names.
- [ ] Verify against Git via argument arrays outside a repository; no Git writes.
- [ ] Run focused units and record evidence.

### Task 2: Vapor UI and localized integration

**Files:** `GitBranchTool{.vue,.test.ts}`, `src/i18n/git-branch.ts`,
`src/lib/git-branch-guide.ts`, catalog/App/icon/messages/tool-guides.
**Consumes:** Task 1 report; existing CodeInput/execution/output components.

- [ ] Write/run failing actual Vapor tests for sample, translated diagnostics,
  full copy/32 preview, rejected edits/imports and execution/lifecycle controls.
- [ ] Implement one view, five messages/static guides and default-on registration.
- [ ] Run focused tests, type and Vapor checks; fix failures.

### Task 3: Delivery and exact-head/public verification

**Files:** `tests/e2e/git-branch.spec.ts`, `tests/public/git-branch.spec.ts`,
README, docs/testing, docs/devtoys-coverage, docs/git-branch and screenshots.

- [ ] Add four-project five-locale/theme/keyboard/mobile/download/privacy tests.
- [ ] Verify synthetic screenshots; run all final-head repository gates.
- [ ] Independent immutable branch review; repair material issues with regression.
- [ ] Update draft PR with scope, limits, actual results and screenshots; ready.
- [ ] Recheck latest main/head/conflicts/checks/reviews; guarded normal merge.
- [ ] Recover existing main run results; verify automatic Pages, all live tests
  and public-assets revision. Record actual success/failure/unexecuted distinctly.
