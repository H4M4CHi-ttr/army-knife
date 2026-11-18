# Redis Cluster slots implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Explain recorded UTF-8 Redis key placement and hash tags offline.
**Architecture:** Pure bounded CRC16 calculation, one Vapor view, typed
five-language messages and static guides. Remove the prohibited GA4 bootstrap.
**Tech Stack:** Existing Vite+, Vue 3.6 RC/Vapor, shadcn-vue and Playwright.
**Spec:** `docs/superpowers/specs/2026-11-18-redis-slots-design.md`.

## Global constraints

- JSON array of 1–128 strings; raw UTF-8 8,192 bytes; decoded key 1,024 bytes.
- UTF-8 only, valid Unicode scalars, no normalization, first brace-pair rule.
- 32-row labelled preview, complete explicit JSON at most 64 KiB.
- Immediate through 2,048 UTF-16 units, otherwise 800ms/manual/cancel.
- Five languages/themes; no added dependencies, telemetry, network or storage.

## Review focus

- Empty first brace pair prevents later tags; nested braces select literal text.
- Empty/NUL/CR/astral/decomposed keys retain exact UTF-8 bytes.
- Malformed or rejected input invalidates every export; duplicates stay ordered.
- Same-slot reports include the full input and do not promise server success.
- Published-host tests enforce the same network policy as local production.

### Task 1: Calculation and privacy prerequisite

**Files:** `src/lib/tools/redis-slots{,.test,-sample}.ts`, `index.html`,
`src/analytics{,.test}.ts`, distribution verifier/privacy documentation.
**Produces:** `inspectRedisSlots(input: string): RedisSlotsReport` with `keys`
(key/keyBytes/hashTag/hashedBytes/crc16/slot), `distinctSlots`, `sameSlot`.

- [ ] Write/run failing CRC vector test: `123456789` yields `31c3`, slot 12739.
- [ ] Implement guards, JSON strings, tag selection and bitwise CRC16.
- [ ] Verify independent vectors, braces, Unicode, bounds and atomic failures.
- [ ] Make production-host privacy tests fail against GA4, then remove its
  initializer and CSP exceptions; update corresponding privacy text/assertions.

### Task 2: Interactive view and registration

**Files:** `RedisSlotsTool{.vue,.test.ts}`, `src/i18n/redis-slots.ts`, guide,
catalogue/icon/app/messages and static-guide integration.
**Consumes:** Task 1's report; existing CodeInput/useToolExecution/actions.

- [ ] Write/run failing real Vapor tests for sample/empty, preview/full copy,
  invalidation, imports, all locales and immediate/manual/cancel behavior.
- [ ] Implement one memory-only view; register the default-on tool and guides.
- [ ] Run focused/full units, types and production Vapor verification.

### Task 3: Browser evidence and delivery

**Files:** `tests/e2e/redis-slots.spec.ts`, `tests/public/redis-slots.spec.ts`,
README, testing/overlap/tool docs and synthetic screenshots.

- [ ] Verify Chromium/Firefox desktop/small: five locales/themes, keyboard,
  downloads, imports, deferred cancellation, lifecycle and exact-asset privacy.
- [ ] Commit and run final-head fonts/Rust/Clippy/WASM/types/lint/units/Vapor/
  script tests/build/dist/public collection/full browser gates.
- [ ] Independent immutable-diff review; fix material findings with regression.
- [ ] Update PR purpose/scope/results/limitations/screenshots; ready after gates.
- [ ] Check latest main/head/mergeability/checks/reviews, normally merge only
  successful final head, then verify main/automatic Pages/live behavior.
