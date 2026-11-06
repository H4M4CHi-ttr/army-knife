# Recorded HSTS header inspector

## Intent and scope

Inspect one recorded `Strict-Transport-Security` field value to debug its exact
duration, `includeSubDomains`, duplicate directives and opaque extensions. No
host input, connection, policy installation or preload submission is involved.
The implementer selected this bounded tool under the recurring autonomous
development request. Existing Link, Cache-Control, CORS and cookie tools do not
interpret HSTS. No dedicated workflow appears in the [official DevToys bundled
list](https://devtoys.app/) checked 2026-11-07 JST; community extensions are outside
this comparison, so the new tool defaults on.

The model follows [RFC 6797 sections 6.1 and 8.1](https://www.rfc-editor.org/rfc/rfc6797#section-6.1).
Names are case-insensitive; every directive, including an unknown extension,
must be unique. One `max-age` with an unsigned decimal value is required. Quoted
values are unescaped before checking digits. `includeSubDomains` is valueless.
Empty semicolon slots and surrounding ASCII spaces/tabs are accepted; empty
unquoted values, commas between fields, folded lines and full header blocks
are rejected. The tool accepts a printable ASCII subset of field syntax (plus
HTAB whitespace/quoted text); non-ASCII octets and obsolete folding are explicitly
unsupported, rather than a claim that all such RFC inputs are invalid.

Unknown directives retain source spelling, order, null/empty distinction and
unescaped opaque values. Quoted semicolons, commas and escaped ASCII characters
remain in their value. A valueless `preload` is identified separately, but is
still an extension outside RFC 6797. `preload=value` remains an opaque extension,
not a preload request marker. Presence never proves list membership or readiness;
see the [preload project's explanation](https://hstspreload.org/).

`max-age` is limited to 40 decoded digits and calculated with BigInt. JSON uses
decimal strings for seconds and whole days, with exact hour/minute/second
remainders. Leading zeroes are retained in the directive but normalized in the
summary. A day means 86,400 seconds, not a calendar period. Zero means removal
of this issuing host's dynamic policy, not a global HSTS disable: independent
subdomain policies, ancestor policies and preload state are not evaluated.
Nonzero values describe a declared lifetime, not a browser's effective expiry.
Secure receipt, certificates, browser caps/state and live site safety are not
checked. This is not a browser conformance or security assessment.

## Limits, UI and privacy

Raw input is at most 4,096 UTF-8 bytes before trimming; at most 32 nonempty
directives and 64 semicolon slots including empties. Any error or unsupported
input removes the entire report and exports; there are no partial results.
Small edits run immediately. Above 2,048 UTF-16 characters, existing 800ms
delayed/manual/cancel controls apply. These bounds need only synchronous
TypeScript, without a Worker/WASM change or new dependency.

One Vapor view uses CodeInput, ApplyControl and OutputActions, five languages,
existing fonts/themes, keyboard controls and narrow layouts. Values render as
plain text. Input and report are memory-only and clear on tool navigation,
language change and reload. Only explicit copy/download exports the full JSON.
No new requests, storage, telemetry, URL data, runtime fonts, WebMCP or publishing
configuration are added.

## Approach

A pure parser plus a dedicated view offers a small, testable workflow. Extending
the general Cache-Control parser would couple unrelated semantics. A live HSTS
checker would require requests and cannot satisfy the task's privacy constraint.
The implementation uses the existing shared UI and execution lifecycle.

## Review focus

Check quote-aware delimiters and unescaping, case-insensitive duplicates for
unknown names, zero versus inherited/preloaded state, exact large durations,
invalid or rejected edits clearing old exports, and inert extension rendering.
