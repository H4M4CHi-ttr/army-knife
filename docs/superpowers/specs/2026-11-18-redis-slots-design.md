# Redis Cluster hash slots — 2026-11-18 UTC

## Intent and decisions

Inspect the slot placement of recorded UTF-8 keys without connecting to Redis.
Help diagnose CROSSSLOT mistakes and explain the first-pair hash-tag rule.
Tool selection and delivery are delegated by the recurring development request.
Native TypeScript with a small independently implemented CRC16/XMODEM routine
fits this bounded workload. A live client or generic checksum tool would not
serve this offline workflow. Binary-key/hex modes and node mapping are excluded.

## Contract

- `inspectRedisSlots(input: string): RedisSlotsReport` accepts one JSON array of
  1–128 strings, at most 8,192 raw UTF-8 bytes. Each decoded key is at most 1,024
  UTF-8 bytes. Empty strings, NUL and other escaped controls are legitimate keys.
  Reject lone UTF-16 surrogates in raw or decoded strings; never trim, normalize,
  coerce numbers or strip BOM. Unsupported/malformed input fails atomically.
- Hash exactly the UTF-8 bytes. Use the first `{` and the first following `}`;
  only a nonempty interior replaces the full key. Do not search for a later
  pair after `{}`. CRC16: polynomial 0x1021, zero init/xor, no reflection;
  slot is CRC16 modulo 16384. Report each key in order, UTF-8 byte length,
  nullable tag, hashed byte length, four-digit CRC16 hex and integer slot.
  Preserve duplicate keys. `distinctSlots` and `sameSlot` cover all rows.
- Only 32 rows appear in a labelled preview. Explicit copy/download exports
  the complete JSON report, capped at 64 KiB. Render keys/tags as JSON strings
  so control/invisible characters cannot misrepresent row boundaries.
- Empty editor means no result; `[""]` explicitly calculates the empty key.
  At most 2,048 raw UTF-16 units updates immediately, even with auto off.
  Larger input uses existing 800ms/manual scheduling, pending/loading and
  cancellation. Edits, rejected imports, clearing, locale/navigation and
  disposal invalidate output. Read local UTF-8 files through existing bounds
  and preserve BOM for rejection. CR/CRLF paste/import uses the existing
  protected read-only preview and explicit replacement/original-byte download.
  No streaming or unlimited-file mode.
- Same-slot equality does not establish command compatibility, topology,
  availability, key existence or distinct key identity; CRC/slot collisions
  are possible. No Redis, HTTP or WebSocket connection is opened.
- Reuse Vite+, Vue 3.6 RC/Vapor, shadcn-vue, five languages, themes and licensed
  Noto/Sarasa subsets. No dependency, WebMCP, input/result URL/storage/network,
  runtime font service or telemetry. Remove the existing GA4 bootstrap and
  its CSP exceptions to satisfy this run's explicit telemetry prohibition;
  update privacy text and verify the production hostname path too.

## Repository and sources

Fresh main is `995f31c3c805e1922e284732d989c0470891b1b5` (#174 merged).
No AGENTS.md exists in the target checkout or /workspace ancestors.
Only #145 is open; prior design identifies it as independent language work.
Leave #145 and the separate SSH branch untouched; no unfinished scheduled PR.
The official [DevToys list](https://devtoys.app/) checked 2026-11-18 has no
dedicated Redis Cluster slot workflow. Default on; extensions are excluded.
Primary reference: [Redis Cluster specification, key distribution and hash tags](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/#key-distribution-model).
No upstream implementation is copied.

## Verification and delivery

Use the documented CRC vector, independent Python `binascii.crc_hqx` vectors,
all brace rules, UTF-8/JSON boundaries, errors and full-export limits. Real
Vapor and Chromium/Firefox desktop/small tests cover five locales/themes,
keyboard, actual downloads, scheduling/cancel, imports and memory-only privacy.
Record synthetic screenshots and add existing-Pages tests. Run the complete
repository gates on final head, get an independent immutable-diff review,
verify checks/review conditions/main/head immediately before a normal merge,
then verify automatic Pages deployment and the actual published tool.

## Independent review fixes

The initial immutable review identified raw CRLF-paste normalization at the input
cap and a weaker live request-path audit. Regression tests reproduce both.
Use the existing raw-CR input option; publish a build-only revision/file inventory
verified against dist, and share its strict path parser across local/live audits.
This adds no app request, runtime dependency or workflow permission.
