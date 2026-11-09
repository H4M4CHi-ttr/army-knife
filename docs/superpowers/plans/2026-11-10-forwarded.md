# Forwarded Record Inspector Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in this session.

**Goal:** Inspect recorded Forwarded grouping without network or trust inference.
**Architecture:** Pure bounded parser, one Vapor view, five dictionaries and guides.
**Tech Stack:** Existing pinned Vite+, Vue 3.6 RC/Vapor, shadcn-vue, Playwright.
**Spec:** [Design](../specs/2026-11-10-forwarded-design.md)

## Global constraints
8192 raw bytes; 32 nonempty/64 raw elements; 16 parameters/32 semicolon slots
per element. ASCII structure only. No input/result transmission/storage/URL
state, new runtime dependency/CDN, WebMCP or deployment destination.
<=2048 code units instant; otherwise existing 800ms/manual/cancel.

## Review focus
Quoted delimiters/escapes, duplicate names, empty-slot caps, stale exports
after rejected edits, inert values/private state across navigation.

## Tasks
- [ ] Parser tests first: exact report, quote decoding, separators, empty counts, duplicates, raw byte/count boundaries and input-free errors; observe missing feature fail.
- [ ] Implement `inspectForwarded(input: string): ForwardedReport` and `FORWARDED_LIMITS` in `src/lib/tools/forwarded.ts`.
- [ ] Add `ForwardedTool.vue` and real Vapor tests for delay/manual/cancel/disposal, rejected paste, explicit JSON and five locales.
- [ ] Register catalogue/icon/async route/messages/guide; update README, testing and DevToys docs.
- [ ] Add four-project `tests/e2e/forwarded.spec.ts`: five languages/themes, keyboard/mobile, downloads, lifecycle/privacy and synthetic screenshots.
- [ ] Full CI on final head; independent immutable-diff review, fix material issues and repeat gates.
- [ ] Recheck latest main/head/checks/review/conflicts; ready/normal merge and verify existing Pages deployment/public operation, recording exact evidence/blockers.
