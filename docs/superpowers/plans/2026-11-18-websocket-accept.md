# WebSocket Accept implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compute and compare recorded RFC 6455 WebSocket Accept field values locally.

**Architecture:** Bounded pure validation plus an abort-aware Web Crypto digest;
one Vapor view, typed five-language messages and static guides. No new dependency.

**Tech Stack:** Existing Vite+, Vue 3.6 RC/Vapor, shadcn-vue and Playwright.

**Spec:** `docs/superpowers/specs/2026-11-18-websocket-accept-design.md`.

## Global constraints

- Each input is at most 128 raw UTF-8 bytes; key 16 decoded bytes, Accept 20.
- Canonical padded standard Base64, outer SP/HTAB only, unprefixed field values.
- Exactly empty optional input omits comparison. Reject all malformed input atomically.
- Immediate execution, five-second watchdog, cancel/retry with late-result disposal.
- No sockets, input/result network/storage/URL, telemetry/CDN, dependencies or settings change.

## Review focus

- Hash encoded key + exact GUID, not decoded nonce or a re-encoded invalid key.
- Noncanonical pad bits and Unicode whitespace cannot be silently repaired.
- An exactly empty response omits comparison; nonempty whitespace fails.
- Either rejected edit and late crypto completion cannot restore stale exports.
- Two exports remain independent and input clears across app/locale navigation.

### Task 1: Protocol calculator

**Files:** `src/lib/tools/websocket-accept{,.test,-sample}.ts`.
**Interface:** `inspectWebSocketAccept(key: string, recordedAccept?: string, signal?: AbortSignal): Promise<WebSocketAcceptReport>`
with `key`, `nonceHex`, `sha1Hex`, `expectedAccept`, nullable `recordedAccept` and
`matches`, and `responseHeader`.

- [ ] Write a failing RFC vector test: key `dGhlIHNhbXBsZSBub25jZQ==` gives
  Accept `s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`, nonce hex `7468652073616d706c65206e6f6e6365`.
- [ ] Run the focused test; confirm missing implementation before adding it.
- [ ] Implement bounded canonical validation and abort-aware five-second digest.
- [ ] Verify independent vectors, all validation boundaries, null/false semantics,
  crypto failure sanitization, abort, timeout and cleanup; run all units.

### Task 2: Interactive view and catalogue

**Files:** `WebSocketAcceptTool{.vue,.test.ts}`, `src/i18n/websocket-accept.ts`,
`src/lib/websocket-accept-guide.ts`, catalogue, icon, app, messages and guides.
**Consumes:** Task 1's interface; existing `CodeInput`, `useToolExecution` and actions.

- [ ] Write/run failing real Vapor tests for empty/match/mismatch, omitted/invalid
  Accept, independent exports, rejected edits, actual crypto and five locales.
- [ ] Implement the memory-only immediate view with running/cancel/retry states.
- [ ] Test controlled slow crypto cancellation, supersession, timeout and disposal.
- [ ] Register default-on tool and verify focused/full units, types and Vapor.

### Task 3: Browser evidence and delivery

**Files:** `tests/e2e/websocket-accept.spec.ts`, `tests/public/websocket-accept.spec.ts`,
`docs/websocket-accept.md`, README, testing/overlap docs, synthetic screenshots.

- [ ] Verify actual native browser cryptography, five locales/themes, keyboard,
  narrow layout, independent actual downloads, invalidation, privacy and clearing
  in all four specified projects; collect and inspect screenshots.
- [ ] Commit and run final-head fonts/Rust/Clippy/WASM/types/lint/units/Vapor/scripts/
  build/dist/public collection/full browser gates; record exact outcomes.
- [ ] Push isolated branch, create draft PR with complete scope/tests/constraints/images.
- [ ] Obtain independent immutable-diff review and fix material findings with regression tests.
- [ ] Confirm full CI on final head, latest main, conflicts, checks and review conditions.
  Ready and normal merge only on success, then verify main/Pages/live operation.
