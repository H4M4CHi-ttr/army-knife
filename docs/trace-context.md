# W3C Trace Context inspector

## Purpose and scope

Inspect recorded `traceparent` and optional `tracestate` values offline to debug
correlation IDs, the sampled bit and vendor entry order. The tool never starts a
trace, records telemetry, sends headers, queries a tracing service or interprets
vendor values. A sampled bit is a caller recommendation, not proof of collection.
IDs stay lowercase hexadecimal strings, including leading zeroes; no conversion
to JavaScript numbers occurs.

The implementation targets the [W3C Trace Context Level 1 Recommendation,
23 November 2021](https://www.w3.org/TR/2021/REC-trace-context-1-20211123/),
sections 3.2 and 3.3. This is a bounded syntax inspector, not a propagator or a
claim of full tracing-system conformance. Future versions are explicitly
unsupported; `ff` is forbidden. Version `00` must have exactly 55 characters,
lowercase hex, nonzero 32-character trace ID and 16-character parent ID.
All 256 flag bytes are decoded by a bit mask: bit 0 is sampled, other bits are
preserved and flagged as outside this Level 1 model, never silently cleared.
This does not certify sender conformance or identify the currently running span.

Supply values only in two separate fields; HTTP header names, full request
blocks, B3 and vendor formats are outside scope. Outer ASCII spaces/tabs are
removed from traceparent. No newline, Unicode whitespace or case normalization.

`tracestate` preserves entry order and opaque printable ASCII values. Simple
keys start with a lowercase letter, up to 256 characters. Tenant keys use a
1–241 character tenant (initial lowercase letter/digit), `@`, and 1–14 character
system ID (initial lowercase letter). Remaining key characters are lowercase
letters, digits, `_`, `-`, `*`, `/`. Keys must be unique. Values have 1–256
printable ASCII characters excluding comma and equals. Surrounding member
spaces/tabs are OWS and removed; spaces after `=` belong to the opaque value,
while tabs inside values are invalid. Spaces around `=` are not accepted.
An empty field and empty/OWS-only comma members are accepted and counted,
without invented vendor entries. The application accepts at most 32 comma
slots, including empty ones, following the Level 1 list ABNF.

## Bounds, behavior and privacy

- Raw UTF-8 limits, before outer OWS removal: traceparent **128 bytes**;
  tracestate **512 bytes**, including commas and OWS. The latter is an application
  input cap, not a universal W3C maximum. No truncation or partial result.
- At most 640 input bytes makes synchronous TypeScript processing appropriate;
  no Worker/WASM or new dependency is needed. Edits apply immediately, including
  with global auto-apply off. Errors, rejected edits and clears remove the entire
  report and export controls. Invalid tracestate discards this inspector's whole
  report; actual propagators can handle the two headers independently.
- Existing Vapor, shadcn-vue controls, five locales, self-hosted fonts, themes,
  keyboard support and 390px layout. Plain text rendering only.
- Input/result state is memory-only; navigation, locale changes and reload clear
  it. Explicit copy/download exports the complete JSON report, including opaque
  vendor values. No URL/storage/log/request persistence, new telemetry, external
  fonts, runtime API, WebMCP, credential, security or deployment configuration.
- Defaults on: no dedicated Trace Context workflow was present in the
  [official DevToys bundled list](https://devtoys.app/) checked 2026-11-05 JST.
  This comparison excludes community extensions. JSONL traceId aggregation and
  general JWT/hex tools do not inspect these propagation fields.

## Approach

Chosen by the implementer under the recurring autonomous-development request:
a pure bounded parser and one dedicated Vapor view with existing CodeInput,
useToolExecution and OutputActions. A broad HTTP-block parser adds ambiguity
and unrelated scope; a tracing simulator would imply backend behavior we cannot
verify. Neither is needed for recorded context inspection.

## Implementation and verification plan

1. Pure parser (`src/lib/tools/trace-context.ts`) and synthetic sample: first
   write/run failing tests; then verify W3C vectors, every flag byte, all-zero
   IDs, future versions, case/control errors, simple/tenant key grammar, opaque
   values, duplicates, empty members and exact byte/count/length boundaries.
2. `TraceContextTool.vue`, five-locale message module, guide, catalog/icon and
   lazy App routing: first test the missing view; then verify immediate dual
   input invalidation, rejected-paste recovery, explicit copy, translation and
   unmount. Keep existing font and execution infrastructure.
3. Four-project browser scenarios: five locales, light/dark, keyboard, narrow
   screens, actual JSON download, all-or-nothing failures, both input limits,
   navigation/reload/locale clearing and exact-dist-asset request audit. Capture
   only synthetic examples for PR screenshots. Run full repository quality
   gates on the final commit and independent content review without submitting
   an approval. Start with a Draft PR; ready only after validation.
4. Recheck latest main, expected head SHA, conflicts, checks and review rules;
   merge normally without overrides. Verify main and existing Pages deployment,
   then exercise the published tool. Report concrete failures without claiming
   success for an unavailable gate.

Review focus: edge OWS versus value spaces; reserved flag bits versus version;
empty-member count versus vendor count; invalid/rejected second input clearing
old exports; untrusted vendor strings rendered inert and absent from requests.
