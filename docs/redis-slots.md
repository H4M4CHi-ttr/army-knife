# Redis Cluster hash slots

Recorded UTF-8 keys can be inspected without contacting Redis or any other
service. This helps explain CROSSSLOT errors and deliberate hash tags. This is
local arithmetic, not a topology viewer or an executable Redis client.

## Input and calculation

Enter a JSON array of **1–128 strings**. `[""]` denotes the empty key; an empty
editor has no result. JSON escapes express NUL, carriage return and newline.
Spaces are part of the key. Keys are encoded as UTF-8 without trimming or
Unicode normalization. Arbitrary binary keys are outside this tool.

The first opening brace and the first following closing brace select their
interior only if it is nonempty. An empty pair does not cause a later search.
For example, `foo{}{bar}` hashes the whole key; `foo{{bar}}zap` selects `{bar`;
`foo{bar}{zap}` selects `bar`. This follows the
[Redis Cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/#hash-tags).

The independent implementation uses CRC16/XMODEM (poly `0x1021`, initial/final
XOR zero, no reflection) modulo 16384. `123456789` gives CRC `31c3`, slot 12739.
The two `user1000` example tags share slot 3443; the empty key has slot 0.
Slots and byte counts fit exact JavaScript integers; CRC is four-digit lowercase
hexadecimal. Output preserves input order and duplicate entries.

## Bounds and output

- Raw input: **8,192 UTF-8 bytes**, including JSON syntax and whitespace.
- Each decoded key: **1,024 UTF-8 bytes**. A surrogate pair is one Unicode
  scalar; lone raw or escaped surrogates are rejected rather than replaced.
- Malformed JSON, BOM, nonstrings and invalid counts reject the entire report.
- Input through **2,048 UTF-16 units** applies immediately, even with delayed
  auto-apply off. Longer input uses existing **800ms/manual/cancel** controls.
  The bounded synchronous calculation needs no Worker or WASM.
- The keyboard-focusable, horizontally scrollable table explicitly previews
  **32 rows**. Copy/download includes all accepted rows and full-input totals,
  capped at **64 KiB**. Keys and selected hash text are displayed as JSON strings; Unicode format,
  direction and line-separator controls are shown as escapes without changing
  the original keys in the exported report. The slot column is visible before
  horizontally scrolling the remaining columns on small screens.

Each row contains `key`, `keyBytes`, nullable `hashTag`, `hashedBytes`, `crc16`
and `slot`. The report also has `distinctSlots` and boolean `sameSlot`. A single
key has `sameSlot: true`. Equality may be a collision; it proves neither key
identity nor successful multi-key commands. The tool checks no key existence,
node ownership, migrations, availability or glob-pattern optimizations.

## Lifecycle, privacy and reuse

The existing Vue 3.6 Vapor view, shadcn-vue controls, five languages, dark/light
themes and licensed self-hosted Noto/Sarasa fonts are reused. There are no new
dependencies. Inputs/results live only in memory and clear on tool/language
navigation or reload. Imports read local UTF-8 files and preserve BOM for
rejection. From import start, stale exports are hidden. Clear/sample invalidates
late reads. Copy/download is explicit. No input/result URL or persistent storage,
database call, external API, WebSocket, telemetry, font CDN or WebMCP is used.

The pre-existing GA4 initializer and its external CSP exceptions are removed to
honor the recurring request's explicit telemetry prohibition. The distribution
verifier rejects any reintroduced third-party script/image/connect permission.
E2E audits include serving the actual distribution under the published hostname,
where hostname-conditional tracking previously ran, as well as live Pages checks.

This is a complementary default-on workflow: no dedicated Redis Cluster key-slot
tool appears in the [official DevToys bundled list](https://devtoys.app/) checked
2026-11-18. General hashes and text converters differ. Community extensions are
outside this comparison.
