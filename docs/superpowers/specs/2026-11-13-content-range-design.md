# Recorded Content-Range byte inspector

## Purpose and choice

Inspect a recorded byte Content-Range to check an interval's arithmetic while
debugging partial downloads. Existing `http-range` resolves request ranges
against an explicit size and generates reference values; it does not parse
recorded response fields, unknown complete lengths or unsatisfied ranges.
The general response-header backlog #53 remains a separate broad task.
A whole response/body validator would add unnecessary protocol scope.

The [official DevToys bundled list](https://devtoys.app/) was checked on
2026-11-13 JST. This dedicated response-range workflow is complementary;
community extensions are outside that comparison. Default on, no dependencies.

## Contract

`inspectContentRange(input: string): ContentRangeReport`, with `unit: "bytes"`,
`kind: "range" | "unsatisfied"`, `canonical`, `first`, `last`, `rangeBytes`,
`completeLength`, `bytesBefore`, `bytesAfter`, `coversWholeRepresentation`.
Integer properties are decimal strings or null; no BigInt reaches JSON and
no numeric input is converted through Number. Null means unknown/inapplicable,
never zero. `coversWholeRepresentation` is boolean/null and purely arithmetic.

Raw input is at most 256 UTF-8 bytes before trimming. ASCII only, with outer
SP/HTAB; optional case-insensitive `Content-Range:` and surrounding field OWS.
Require one SP after the case-insensitive bytes unit. Accept only:
`bytes first-last/length`, `bytes first-last/*`, or `bytes */length`.
Decimal parts are ASCII digits, at most 40 each, including leading zeroes.
Canonical output removes the field name and leading zeroes. CR/LF, folding,
multiple fields/ranges, alternate units, signs, other separators and internal
OWS are rejected. Each error has a stable input-free ToolError code and no
partial/previous report. Byte-bound failures use the existing size code.

For a range: first <= last; known complete length > last; inclusive count
last-first+1; prefix count first; known suffix length-last-1. Whole coverage
requires first=0 and last+1=known length. Unknown length leaves suffix and
coverage null. An unknown-length interval can yield 41 derived digits from
40-digit inputs. For unsatisfied syntax, only completeLength is known (zero
is accepted); all interval/count/coverage fields are null. An unsatisfied
range never means an empty response body. Counts describe representation
bytes, not received progress, wire framing or decompressed file size.

Reference: [RFC 9110 §§14.1, 14.4](https://www.rfc-editor.org/rfc/rfc9110.html#section-14.4),
checked fresh. The tool does not infer 206/416, compare an original request,
parse multipart bodies, validate Content-Length/Content-Encoding, recombine
data or prove successful/safe resumption. No HTTP request is sent.

## View, lifecycle and privacy

One Vapor view using CodeInput, Button, ApplyControl, OutputActions and
useToolExecution. At 256 bytes the complete workload is light: always instant,
including when deferred auto-apply is off. Empty initial/cleared input has no
report. Accepted edits replace it; errors/rejections remove it and its exports.
Sample/clear reset rejection via keyed input. Explicit complete JSON copy and
download; full values render inertly with wrapping. Five locales, both themes,
keyboard and 390px widths follow existing styles. No output truncation.

The sample is a synthetic interval above Number.MAX_SAFE_INTEGER with exact
1000-byte interval and suffix counts. Other samples demonstrate unknown total
and unsatisfied zero length. Inputs/results stay in component memory and clear
on tool/locale navigation and reload. Explicitly dropped UTF-8 files use the
existing local reader with preserveBom=true: a BOM is retained and rejected
by the ASCII grammar, matching pasted BOM behavior. Invalid UTF-8/byte limits
reject atomically. No inputs/results in requests, logs, URL or storage; no new
telemetry, font CDN, package, WebMCP, host or deployment configuration.

## Verification and delivery

TDD engine: inclusive/known/unknown/unsatisfied/zero and 40/41-digit bounds,
large adjacent integers, canonical spelling, raw/ASCII grammar and input-free
errors. Real Vapor: exact outputs, null vs zero, instant manual-preference
behavior, rejected edits/imports, explicit JSON, all locales and disposal.
Production E2E: four Chromium/Firefox desktop/small projects, five locales and
themes, keyboard/layout, exact downloads, file/error/bound/lifecycle behavior
and exact-dist-asset privacy. Add 20 checks to the existing public suite.
Final-commit font/Rust/WASM/type/lint/unit/Vapor/build/distribution/license
gates plus full regression CI. Independent immutable-head review and fixes;
draft PR, check current main/head/review/checks, ready and normal guarded merge.
Verify merged main, existing Pages deployment and real published operation.
