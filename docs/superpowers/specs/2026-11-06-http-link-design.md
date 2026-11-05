# HTTP Link header inspector

The scheduled task authorizes autonomous selection, implementation and delivery.
This design is the implementer's choice under that instruction.

## Intent and approaches

Inspect recorded API pagination and resource relationship headers locally. A
general URL editor cannot separate commas inside targets/quoted attributes or
associate `next`, `prev`, `preload` and multiple relations with their targets.
The official DevToys bundled list (checked 2026-11-06 JST) has no dedicated Link
header workflow, so this complementary tool defaults on; extensions are excluded.

Compared alternatives: full RFC 3986 resolution with an explicit response context
would add context/anchor semantics and a URI parser; an HTTP Accept negotiator
would need precedence and ambiguous server-selection rules. Choose a smaller
Link **structure inspector**, retaining unresolved references and opaque attributes.

## Contract

- Input is one combined field value, without `Link:` or physical newlines.
  Multiple field values can be joined with a comma. Parse angle targets,
  token/quoted/valueless parameters, quoted-pairs and comma-separated link values
  according to RFC 8288 §3 and HTTP quoted-string grammar.
- Targets remain exact, unresolved ASCII URI-reference text. Check URI character
  repertoire and percent triplets only, not complete URI grammar or URL validity.
  No base, anchor application, URI normalization, registry lookup, crawling,
  active link, script execution or HTTP requests.
- Preserve link/parameter order, case of parameter names, repeated attributes,
  exact percent escapes and unquoted parameter values. `null` is valueless;
  `""` is an empty quoted value. Unknown/extended attributes including `title*`
  stay opaque; no charset decoding or effective title/media interpretation.
- The first case-insensitive `rel` supplies space-separated relations. Later rel
  parameters are retained and identified as duplicates, not applied. Missing rel
  is explicitly flagged. Rel values use registered-token or absolute-URI lexical
  forms, without IANA validation. Empty or valueless first rel is rejected.
- Empty list slots are counted. Limits apply to raw input before processing:
  UTF-8 8 KiB, 32 links, 64 comma slots (including empty), 32 parameters per link.
  Malformed or over-limit input yields no partial report and no input in errors.
- At most 2,048 UTF-16 units applies immediately; larger input uses the shared
  800ms delayed/manual controls and pending cancellation. Parsing within the cap
  is synchronous; there is no claim of interrupting a running parser.
- Five languages, Vapor view, themes, keyboard/narrow layouts, static guides,
  explicit JSON copy/download and memory disposal follow existing tools. Rejected
  edits invalidate old reports. No new dependency, analytics, fonts or persistence.

## Verification

Pure tests pin delimiter/escape behavior, duplicate rel, opaque/valueless values,
empty slots, invalid grammar and all raw/structural boundaries. Real Vapor tests
pin scheduling, rejection, inert rendering, explicit export and disposal. Browser
tests cover five locales, both themes, Chromium/Firefox desktop/small, real JSON
downloads, manual/cancel, memory lifecycle and exact-dist privacy auditing.
Run the existing complete quality workflow on the final head, independent patch
review, normal merge checks and existing Pages deployment/public verification.

Sources: https://www.rfc-editor.org/rfc/rfc8288.html and https://devtoys.app/.
