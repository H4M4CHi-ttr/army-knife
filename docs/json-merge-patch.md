# JSON Merge Patch preview

## Intent and scope

Preview the result of applying one JSON Merge Patch to a target document using
[RFC 7396](https://www.rfc-editor.org/rfc/rfc7396). This is useful for checking an
API PATCH body before using it elsewhere. Object members merge recursively,
null-valued patch members remove a key, and arrays and other non-object patches
replace the entire value. A top-level null patch replaces the document with null.
An object patch applied to a non-object starts from an empty object.

This is a local preview: no HTTP request, file modification, schema validation,
authorization or server-side behavior is simulated. It does not generate patches
or implement the separate JSON Patch operation format (RFC 6902). The existing
JSON comparison and Pointer tools do not apply Merge Patch. The official
[DevToys bundled list](https://devtoys.app/) checked 2026-11-08 JST has no dedicated
Merge Patch workflow; community extensions are outside the comparison. Default on.

## Bounds and precision

Each raw input is limited to 16 KiB UTF-8, depth 32 (root depth zero), and 2,000
JSON values including containers. The result is limited to depth 32, 4,000
values, and 128 KiB UTF-8 in its two-space formatted representation. Every
failure clears the entire result and exports; there are no partial outputs.
Duplicate object keys and numbers that lose decimal digits through JavaScript
conversion are rejected by the existing bounded JSON parser. Unsafe integers,
overflow and underflow are rejected rather than rounded. Ordinary decimals such
as 0.1 are accepted by decimal round-trip comparison. Whitespace, key ordering,
number spelling and negative-zero spelling are not preserved. This is a JSON
value transformation, not a byte-preserving editor.

Objects use null prototypes and own-key access, so keys such as __proto__,
constructor and prototype remain ordinary data. The implementation must not
mutate either parsed source while constructing the result. User strings render
as inert text, and the explicit JSON copy/download exports only the merged
document, without an added report wrapper.

## UI and privacy

The target and patch use the existing bounded CodeInput and execution controls.
Combined input length up to 2,048 UTF-16 code units applies immediately; larger
edits use the existing 800ms delay or manual apply, with pending cancellation.
The small bounded computation uses TypeScript, without new dependencies or
Worker/WASM changes. The Vapor view, static guide, five locales, existing fonts,
both themes, keyboard interaction and narrow layouts follow the existing app.
Rejected edits invalidate old exports until the same input is replaced with an
accepted edit. Sample/clear replace both inputs; navigation, locale change and
reload clear them. Input and result remain in memory, except explicit copy/download. No
new request, telemetry, storage, URL data, font source, WebMCP or deployment
setting is added.

## Implementation and review plan

1. Test recursive merging, null deletion, missing keys, root/array replacement,
   no mutation, dangerous property names, precision, duplicate keys and exact
   input/output/depth/node limits; implement the bounded pure transformation.
2. Add the real Vapor dual-input view, messages, guide, default-on catalog entry,
   icon and lazy route. Test stale-result invalidation per input, empty/scalar
   outputs, explicit export, disposal and delayed/manual/cancel behavior.
3. Add production browser coverage in Chromium/Firefox at desktop/390px for five
   languages, themes, keyboard, actual download, memory lifecycle, invalid edits
   and an exact-distribution request/privacy audit. Capture synthetic screenshots.
4. Obtain independent review, resolve material issues, and run the unchanged
   complete CI gates on the final head. Recheck main/head/review rules, ready and
   merge normally, then verify the existing main Pages run and deployed tool.

Repository baseline: main 146ab98. AGENTS.md and .agents/skills are absent in
this checkout; the mounted codex-cloud-empty repository is not modified.

## Independent review and verification

An independent read-only reviewer inspected all 18 initial changed files, the
follow-up at e06abb3 and the shared JSON parser, execution, input/output and
routing code. It reported no remaining material findings. Its separate
Map-based oracle/adversarial checks passed 6,020 deterministic cases, including
recursive/scalar behavior, idempotence, prototype keys and precision rejection.
It also passed 54 focused pure/Vapor/i18n cases and loaded the static-page graph
directly in Node, checking all five catalog/guide locales. This is a content
review, not a GitHub approval, and remains conditional on complete quality gates.
The final hint-only delta was reviewed in all five languages and names the
fields rather than their position, so it also describes the stacked layout.

The dedicated production suite passed all 32 Chromium/Firefox desktop/390px
cases with no retries or skips. Local Firefox initially crashed before page
creation because the outer process sandbox made /proc/self/uid_map read-only.
An approved run outside that outer sandbox passed with Firefox's own sandbox
unchanged; no test or browser security preference was disabled. English light
and Japanese dark screenshots were checked at desktop and narrow widths for
wrapping, clipping and control overlap, using synthetic data only:
[desktop light](screenshots/json-merge-patch-en-light-desktop.png),
[narrow light](screenshots/json-merge-patch-en-light-small.png),
[desktop dark](screenshots/json-merge-patch-ja-dark-desktop.png),
[narrow dark](screenshots/json-merge-patch-ja-dark-small.png).

The repository's existing final-commit CI and main Pages run remain the complete
release gates. No workflow, timeout, retry, test or publishing setting is changed.
