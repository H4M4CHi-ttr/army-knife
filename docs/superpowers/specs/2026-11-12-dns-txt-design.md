# DNS TXT split / restore

## Intent and scope

Prepare a long UTF-8 verification/SPF/DKIM value as quoted DNS TXT RDATA,
and recover the exact joined text from those fragments. One offline codec;
no zone loading, DNS lookup or mail-policy validation. Backlog #61 (whole
zones) and #62 (SPF/DMARC semantics) remain separate. The official bundled
[DevToys list](https://devtoys.app/) was checked on 2026-11-12 JST: generic
escaping has overlap, but this DNS byte-fragment workflow is complementary.
Community extensions are outside that comparison. Default on, no packages.

Alternatives: a whole-zone parser is too broad for this daily change; a
generic escape converter duplicates existing tools. This codec makes the
255-octet boundary and exact reconstruction directly reviewable.

## Contract

`splitDnsTxt(text)` and `restoreDnsTxt(rdata)` return `DnsTxtReport` with
`text`, `dataBytes`, `wireBytes`, `segments: {index, bytes, literal}[]`, and
`rdata`. Counts are bounded exact integers. `wireBytes` includes each
character-string's length octet, but no owner, RR header or DNS packet.

Raw text is bounded to 8192 UTF-8 bytes, rejecting unpaired UTF-16 surrogates
instead of replacing them. Generate chunks of at most 255 octets, including
one zero-byte chunk for empty text. Printable ASCII is literal except quote
and backslash; those are escaped, other bytes use three decimal digits.
One chunk is quoted; multiple chunks use one outer parenthesized group.

Restore accepts at most 65536 raw UTF-8 bytes, 64 quoted ASCII fragments,
255 decoded octets each, and 8192 combined octets. Outer SP/HTAB/CR/LF is
allowed. Fragments require whitespace; line breaks between fragments need
one outer pair of parentheses. No nesting, comments, headers, unquoted
strings, multiple records or raw controls/non-ASCII inside quotes.
`\DDD` is exactly three decimal digits in 000..255; a backslash before a
printable non-digit ASCII character quotes it once (`\n` means `n`).
Join bytes without inserted spaces, then decode strict UTF-8 with BOM
preserved; individual fragments may divide a UTF-8 scalar. Preserve parsed
fragment boundaries, including empty fragments, in canonical output.
Invalid UTF-8 and every exceeded bound produce a stable input-free
ToolError and no partial result. Tool bounds intentionally cover less than
the full protocol range. DNS TXT can contain binary data; this is a UTF-8
text codec, not a universal binary decoder.

References checked: [RFC 1035 §§3.3, 3.3.14, 5.1](https://www.rfc-editor.org/rfc/rfc1035.html),
[RFC 7208 §3.3](https://www.rfc-editor.org/rfc/rfc7208.html#section-3.3).
Concatenation is this tool's text interpretation and suits SPF-like values;
it does not assert application semantics for arbitrary TXT records. DNS
provider forms may require different quoting; no publishability verdict.

## Interaction and privacy

One Vapor view with mode selection, bounded CodeInput, sample and clear,
ApplyControl, canonical RDATA, reconstructed text, complete segment table,
and explicit text copy/download. An untouched field has no report; an
explicit empty edit in split mode produces `""`. Mode changes clear input
and results. Rejected edits invalidate exports; sample/clear reset rejection.
Up to 2048 UTF-16 units applies immediately even with auto off. Larger
input uses existing 800ms/manual/cancel execution; bounded synchronous work
cannot be interrupted after it starts. All accepted segments are rendered.
Five locales, both themes, keyboard and 390px widths use existing patterns.

Inputs/results stay in component memory, clearing on tool/locale navigation
and reload. Explicitly dropped UTF-8 files use CodeInput's local reader.
The view opts into BOM preservation through both local and worker file
readers. Other callers retain existing defaults. Async rejected imports
notify rejection after the empty-model fallback, so a host cannot turn a
rejected drop into an intentional empty TXT export.
No input/result requests, logs, URL/storage writes, new telemetry/font CDN,
WebMCP or deployment configuration. Existing site preferences remain.

## Verification and delivery

TDD byte boundaries, exact round trips, empty/BOM/control/escape cases,
invalid UTF-8/surrogates, all caps and grammar errors. Real Vapor lifecycle,
instant/deferred/manual/cancel, rejected edit, exact explicit exports and
five-language tests. Four-project production E2E checks themes/keyboard/
mobile, downloads, clearing and exact-dist-asset privacy. Add public checks
to the existing Pages suite. Run all applicable final-commit static/unit/
Rust/WASM/font/Vapor/build/distribution checks and full browser CI.
Independent immutable-head review, fix material findings, draft PR, ready
only when final checks and current main permit normal merge; then verify
main SHA, existing deployment and published operation.
