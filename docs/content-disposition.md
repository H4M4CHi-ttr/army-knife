# Content-Disposition inspector

This browser-only tool helps diagnose download-name encoding and unexpected path
information in a recorded HTTP response. Paste one raw value or one
`Content-Disposition:` line; one final LF/CRLF is allowed for clipboard use.
It never fetches a URL, opens a payload or uses the declared name for its own
download. Its JSON export always uses `army-knife-content-disposition.json`.

The parser follows the response-field rules in
[RFC 6266 sections 4.1–4.3](https://www.rfc-editor.org/rfc/rfc6266.html#section-4.1)
and the extended-value notation in
[RFC 8187 section 3.2.1](https://www.rfc-editor.org/rfc/rfc8187.html#section-3.2.1).
Type and parameter names are matched case-insensitively. Token and quoted-string
values are handled, including escaped quotes/backslashes and literal delimiters
inside quotes. Repeated parameters invalidate the entire report; neither the
first nor last duplicate is selected. Folded lines, multiple fields, comma-joined
values and MIME continuation parameters such as `filename*0*` are rejected.
This is a bounded inspection profile, not browser error recovery or a complete
HTTP/MIME validator. It does not interpret multipart/form-data.

`filename*` uses unquoted `charset'language'value`. Percent escapes are decoded
once; plus stays plus. UTF-8 decoding rejects invalid sequences and preserves a
leading BOM. Legacy ISO-8859-1 maps each byte directly, including 80–9F, rather
than using the browser's Windows-1252 alias. Modern producers should use UTF-8.
Other charset names and their encoded values are preserved without guessing.
The language field is optional; only ASCII subtag shape is checked, without
BCP 47 registration or full semantic validation. Raw field text is restricted
to HTTP byte-valued characters; raw Unicode above U+00FF must use filename*.

If supported, filename* is preferred regardless of parameter order. The plain
filename is retained as a legacy fallback, with no percent or RFC 2047 decoding.
An unsupported filename* charset leaves the preferred name unresolved, even when
a plain fallback exists. Missing and empty names are distinct. Unknown types
and parameters remain visible without implying actual browser behavior.

Filename advisories inspect both declared names for path separators, selected
control/invisible/direction characters, leading/trailing whitespace, trailing
dots, common Windows device/special names, platform-restricted punctuation and
literal `%HH`. Strings are quoted for display, with controls and selected format
characters escaped. The original strings remain in JSON. These finite heuristics
do not validate every filesystem, Unicode spoofing case, extension or payload.
No sanitized name or safety verdict is produced.

Input is at most 8 KiB UTF-8; there are at most 32 parameters, 64 characters per
type/parameter name, and 1,024 characters per unescaped parameter value (including
the encoded extended notation). Size or syntax failure discards all output.
At 2,048 UTF-16 code units or fewer, bounded parsing runs immediately. Larger
inputs use the shared 800ms delay, manual apply, countdown and pending cancellation.
Changing input or rejecting a paste clears stale exports. All input/results stay
in memory, and clear on tool/language navigation and reload. Explicit JSON export
includes names and extension values; no input enters storage, URL, logs or requests.

The five current locales, Vapor UI, local fonts and light/dark themes are reused.
No dependency, telemetry or deployment changes are included. The
[official DevToys bundled list](https://devtoys.app/) checked on 2026-10-23 JST has
no dedicated response Content-Disposition workflow; this tool is enabled by
default. This does not make a claim about third-party extensions.

Unit tests cover precedence, quoting, strict decoding, legacy bytes, malformed
and duplicate fields, unsupported charsets, bounds, prototype-like names and
filename advisories. Real Vapor tests cover immediate/deferred/manual operation,
cancellation/disposal, paste rejection, escaping and privacy. Four-project
Playwright tests cover five locales, both themes, keyboard controls, responsive
layout, explicit JSON export, reload/navigation clearing and exact-dist-asset
network audits. CI also runs the existing Rust/WASM, font, distribution and license
gates on the final head.
