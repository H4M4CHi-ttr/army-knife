# ETag precondition inspector

Compare recorded entity tags when diagnosing cache validation or lost-update
guards. This complements Cache-Control inspection and the bundled DevToys
hash/text tools. The [official bundled list](https://devtoys.app/) was checked
on 2026-11-02 JST; no dedicated ETag conditional-request workflow was found.
Third-party extensions are outside that comparison. The tool defaults on.

## Use

1. Enter the current ETag **field value**, including quotes, if known. Choose
   whether the selected representation exists and one of the six methods.
2. Enable If-Match and/or If-None-Match and enter their field values. An enabled
   empty field is a present empty list; an unchecked field is absent. Blank
   current input means unknown, while `""` is a known empty opaque tag.
3. Read each condition's comparison and the usual modeled outcome. Copy or
   download JSON explicitly when needed. Exports contain active tag values;
   retained inactive values are omitted.

The synthetic example has current `"revision-2"`, matching strong If-Match,
and weak If-None-Match containing `W/"revision-2"`. GET gives a modeled 304;
PUT gives 412. Making the current tag weak fails the strong If-Match guard,
skips the next comparison and shows the already-applied-change exception.

## Model and syntax

The origin-server model assumes ordinary request checks pass. If-Match is
evaluated first with strong comparison; If-None-Match uses weak comparison.
Tags compare case-sensitively without normalization or decoding. A weak tag
never strongly matches. Bare `*` tests representation existence; quoted `"*"`
is an ordinary tag. An unresolved current tag leaves the outcome unassessed
unless the available facts decide it. No status is guessed.

Values use an optional uppercase `W/` and a quoted opaque value. Backslashes
are literal, commas inside quotes remain part of a tag, and SP/HTAB outside
tags is optional whitespace. Empty list members are ignored within bounds,
with their count disclosed. Header names, line breaks, whitespace inside tags,
controls and Unicode above U+00FF are rejected. U+0080–U+00FF represent field
octets; this tool does not recover their original wire encoding. Nonprinting
U+0080–U+009F characters are JSON-escaped on screen and in JSON text, preserving
the exact decoded values. Markup is rendered as text.

All active fields are validated before a report, including a later condition
whose comparison would be skipped. Malformed or excessive input produces no
partial result and immediately invalidates old exports. Disabling a condition
or the current representation stops using its retained value. Sample, Clear,
navigation, locale changes and component disposal invalidate pending imports
or evaluation. Input and results remain only in memory; they are not sent,
saved in storage or added to URLs. Existing analytics is unchanged.

## Limits and scope

- Active fields together: **8,192 UTF-8 bytes**, measured before trimming.
- Each conditional field: **64 tags** and **64 ignored empty elements**.
- Each quoted tag, including optional weak prefix: **512 UTF-8 bytes**.
- Up to **2,048 characters** updates immediately. Larger bounded input waits
  **800ms** or for manual Apply; the shared countdown and Cancel stop pending
  work. The small synchronous comparison needs no Worker or WASM.
- GET, HEAD, POST, PUT, PATCH and DELETE only. OPTIONS, TRACE, CONNECT and
  extension methods are outside this model. Dates, If-Range, caches, content
  negotiation, authorization, redirects and ordinary request errors are not
  assessed. The model does not send an HTTP request or predict a live response.
- A failed If-Match on a state-changing request can yield 2xx when an origin
  verifies the change already succeeded; the inspector cannot determine that
  exception. Continue means normal processing, without inferring HTTP 200.

All five UI languages, themes, static guides, keyboard controls and narrow
layouts use the existing Vapor/shadcn-vue UI and self-hosted fonts. No new
dependency, telemetry, font source, runtime API or deployment setting is added.

## Verification and sources

Pure literal fixtures cover strong/weak matrices, all six methods, presence,
unknowns, precedence, quoted commas/backslashes/octet edges and every bound.
Real Vapor tests cover activation, invalidation, cancellation and explicit JSON
copy. The production Chromium/Firefox desktop/small suite exercises five
locales and both themes, keyboard, import/download, limits, manual/delayed
execution, input clearing and the exact-dist-asset privacy audit. Screenshots
use synthetic revision tags.

The implementation follows RFC 9110's [entity tags](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.3),
[list syntax](https://www.rfc-editor.org/rfc/rfc9110.html#section-5.6.1),
[If-Match](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1),
[If-None-Match](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.2)
and [precondition evaluation](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.2).
