# HTTP byte range inspector

Inspect one recorded `Range` field with a known selected-representation byte
length. This helps debug resumed downloads and overlapping multipart requests
without fetching a URL or reading a file. It is an arithmetic inspector, not a
prediction of a server response.

## Design and alternatives

A complete HTTP diagnostic panel would overlap planned work and mix unrelated
semantics. A Content-Range response validator is a separate workflow. This small
tool instead resolves request byte ranges against an explicit length and reports
inclusive offsets, exact byte counts and unique coverage. This scope was selected
under the user's recurring authorization to choose and deliver one tool.

Use a bounded pure TypeScript engine with BigInt, the existing Vapor view,
CodeInput, ApplyControl and OutputActions. No dependency, Worker or Rust changes
are needed for at most 32 members and 40-digit arithmetic. All five locales,
static guides, themes, keyboard controls and narrow widths use existing systems.

## Semantics

- Based on [RFC 9110 §14.1.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-14.1.2).
  Accept a value or one `Range:` line, with a case-insensitive `bytes` unit.
  ASCII space/tab is allowed around the field and comma-separated members,
  including after `=`. No whitespace inside a numeral/hyphen pair or before `=`.
- Only decimal closed (`0-499`), open (`500-`) and suffix (`-500`) forms.
  All numerals, including leading zeroes, have at most 40 digits. Leading zeroes
  are normalized in computed output; original member text remains available.
  Empty list members, repeated/folded fields, other units and other headers are
  rejected. This intentionally does not reproduce recipient error recovery.
- A reversed closed range invalidates the entire field, even if out of bounds.
  Closed ends clamp to length minus one; open ranges run to the end; a suffix
  longer than the representation selects it all. `-0` is unsatisfiable.
- Preserve member order, duplicates and individually unsatisfiable members.
  The set is satisfiable if any member is satisfiable. Per RFC 9110, a positive
  suffix on a zero-length representation is satisfiable but empty: offsets and
  Content-Range are null and byte count is zero. No invalid `0--1` is invented.
- Report the sum of resolved member byte counts separately from unique covered
  bytes (union of inclusive intervals). Overlap/duplicates can inflate the sum;
  adjacent intervals alone are not overlap. All counts and offsets are decimal
  strings through display/export; no Number rounding. Per-member Content-Range
  strings are arithmetic references, not complete response headers or responses.
- Server support, GET/preconditions/If-Range, content negotiation, multipart
  framing, coalescing and status selection are outside scope. Use the encoded
  representation size if Content-Encoding applies. Do not sum multipart overhead.

## Bounds and privacy

Range input: 8 KiB UTF-8, 32 members. Length: 56 raw bytes / 40 ASCII decimal digits (zero
allowed, outer ASCII space/tab accepted). Small combined input (up to 2,048 UTF-16 units) updates immediately;
otherwise existing 800ms delayed/manual controls with waiting/cancel state apply.
The bounded calculation itself is synchronous; cancel stops pending work only.
Malformed/oversized input clears the whole previous report; no partial result or
stale export. Pasted input is bounded before insertion. Input/results are held
only in memory and clear on navigation/reload. JSON copy/download is explicit
with a fixed download name. No URLs, network, persistence, telemetry, remote fonts
or executable user markup is added.

DevToys' [official bundled list](https://devtoys.app/) was checked on 2026-10-25
JST: no dedicated byte-range resolution workflow; default on. This is not a
claim about all community extensions.

## Verification

Pure vectors cover boundary/clamping/suffix/zero semantics, mixed satisfiability,
exact values above 2^53, interval union, invalid syntax and every bound. Vapor
view tests cover both inputs, invalidation, rejected paste, scheduling, manual
apply, cancel and disposal. Four-project Chromium/Firefox E2E covers five locales,
themes, keyboard, mobile widths, export, reload/navigation clearing and exact
distribution-asset privacy auditing with synthetic data. Existing full quality,
WASM, font/license and deployment gates remain required.
