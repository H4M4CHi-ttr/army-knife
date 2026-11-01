# ETag precondition inspector design

## Intent and approaches

Help diagnose cache validation and optimistic-update conditions from recorded
ETag, If-Match and If-None-Match field values, without making an HTTP request.
The official [DevToys bundled list](https://devtoys.app/) was checked on
2026-11-02 JST: generic hashes/text comparison do not perform this workflow.
Community extensions are outside the comparison. This complements the existing
Cache-Control inspector and defaults on.

Alternatives considered: Accept negotiation would broaden matching policy;
Link-header inspection would focus on navigation metadata. ETag conditions have
a compact, useful comparison model. Within that tool, a small bounded scanner
is chosen over splitting on commas (commas are legal inside tags) or adding a
runtime parser package. This is the implementer's choice under the autonomous
tool-selection request, not a claim of a separate design approval.

## Inputs and model

- GET, HEAD, POST, PUT, PATCH or DELETE; no generic "other" method. OPTIONS,
  TRACE, CONNECT and extension methods are outside this model.
- Whether a selected representation exists. Its current ETag may be unknown.
  When absent, the retained current-ETag input is disabled, unused and omitted
  from exported results. Active malformed fields reject the whole report.
- Separate presence controls for If-Match and If-None-Match: `null` means absent;
  an enabled empty string is a present empty list, not an absent header.
- Field values only, without header names or line breaks. OWS is SP/HTAB.
  Entity tags use a case-sensitive optional `W/`, quoted opaque values, literal
  backslashes and case-sensitive comparisons. Visible ASCII and U+0080–U+00FF
  field-octet representations are accepted; no Unicode normalization/encoding
  conversion. Higher Unicode and controls outside the entity-tag grammar fail.
- Bare `*` must occupy the whole conditional field; quoted `"*"` is a tag.
  Empty list members are tolerated within bounds and their ignored count shown.

If-Match uses strong comparison before If-None-Match uses weak comparison.
Unresolved current tags produce an explicitly unassessed outcome, except for
facts decidable without them (wildcards, no representation, empty lists, and
weak candidates that cannot strongly match). A failed/unassessed If-Match skips
the next comparison; its field is still syntax-checked. Per-tag rows show true,
false or unassessed, and skipped headers remain labeled skipped.

Result: proceed / not-modified / precondition-failed / unassessed, the deciding
field, the usual modeled status (304/412 or null), current representation state,
parsed tags and comparison details. This is **not a server response predictor**:
ordinary authorization/errors/redirects, dates, If-Range, caches and content
negotiation are not evaluated. An If-Match failure on POST/PUT/PATCH/DELETE also
shows RFC 9110's already-applied-change success exception. Proceed does not mean
HTTP 200. Unknown data never becomes a guessed status.

## Limits and lifecycle

- Active field values total at most **8 KiB UTF-8**; at most **64 tags** and
  **64 ignored empty members** per conditional field; each tag at most **512
  UTF-8 bytes**, including its syntax. Limits are implementation bounds.
- Up to **2,048 characters** updates immediately; larger values use shared
  **800 ms** delayed/manual controls with waiting feedback and cancellation.
  The bounded parse/comparison itself is synchronous; no Worker/WASM is needed.
- All edits, rejected paste/import, method/presence/existence changes invalidate
  old exports. Sample reload also restarts after cancellation. Inputs/results
  clear on navigation, locale changes and reload; no user data enters storage,
  URLs, network, logs or telemetry. JSON copy/download is explicit and includes
  the supported active ETag values, which can themselves be sensitive.
- Reuse Vue 3.6 RC/Vapor, shadcn-vue, five locales, themes, existing self-hosted
  Noto/Sarasa and licenses. No dependency, analytics, CI/Pages setting or WebMCP
  change. PR #145 and unrelated analytics work remain separate.

## Structure and verification

Pure sample constants feed both static guides and the view without importing
the analysis engine into the static generator. The engine exposes
`inspectEtags(EtagInput): EtagReport`; the Vapor view uses CodeInput,
useToolExecution, ApplyControl and OutputActions. The tool ID is `etag`.

Independent literal fixtures pin comparison matrices, presence/empty semantics,
wildcards, precedence, unknowns, grammar/octet edges and all bounds. Real Vapor
tests pin activation, invalidation, cancellation and explicit export. Chromium
and Firefox at desktop/small widths cover five locales, themes, keyboard, real
file import/export and exact-dist-asset privacy. Screenshots contain synthetic
revision tags. Existing full quality gates remain mandatory on the final head,
followed by normal PR integration, existing Pages and live browser verification.

Sources: [RFC 9110 entity tags](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.3),
[lists](https://www.rfc-editor.org/rfc/rfc9110.html#section-5.6.1),
[If-Match](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1),
[If-None-Match](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.2),
[evaluation and precedence](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.2).
