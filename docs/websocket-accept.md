# WebSocket Accept calculator

Added for 2026-11-18 JST. This offline tool helps debug an RFC 6455 HTTP/1.1
opening handshake from two recorded field values. It opens no connection.

## Use

1. Paste the value of `Sec-WebSocket-Key`, without its header name.
2. Optionally paste the recorded `Sec-WebSocket-Accept` value. Leave this field
   completely empty to calculate only. Whitespace alone is an invalid response.
3. Read the expected Accept and the case-sensitive comparison. Copy or download
   the complete JSON report or the expected response-header line independently.

The public RFC example key `dGhlIHNhbXBsZSBub25jZQ==` produces
`s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`. The sample uses only these public synthetic values.

The calculation is `Base64(SHA-1(encodedKey + GUID))`, with the fixed
`258EAFA5-E914-47DA-95CA-C5AB0DC85B11` GUID. The encoded ASCII key text is hashed;
the decoded nonce is displayed in hex for debugging and is **not** the digest
input. SHA-1 is the protocol's fixed calculation. No random keys are generated.
The expected digest is also shown as 40 hex digits, with no numeric conversion.

## Exact supported input

Each field accepts at most **128 raw UTF-8 bytes**, before whitespace removal.
Only outer ASCII SP/HTAB are removed. The key must be standard Base64 for exactly
16 bytes: 22 alphabet characters followed by `==`. A supplied response must be
standard Base64 for exactly 20 bytes: 27 alphabet characters followed by `=`.

This tool deliberately requires canonical zero pad bits. RFC 4648 requires
encoders to emit them and permits decoders to reject nonzero bits; this strict
subset is not a claim that every server rejects the same inputs. The tool never
repairs/re-encodes a key before hashing. It rejects Base64URL, missing/extra
padding, CR/LF/folding, other controls/Unicode whitespace, a header name, duplicate
fields or a comma-separated list. It expects individual field values, not a full
HTTP capture. Explicitly dropped UTF-8 files are local, keep their BOM and pass
the same bounds/grammar; malformed UTF-8 is rejected.

All validation is atomic: an invalid or rejected edit removes the entire result
and both exports. `recordedAccept: null` and `matches: null` mean comparison was
omitted; `matches: false` means a well-formed recorded value differs. No result
is truncated. Header text is a single field line, not a complete HTTP response.

## Execution and privacy

The maximum hash input is 60 ASCII bytes. Edits run immediately, including when
the shared deferred auto-apply preference is off. The running status states a
five-second maximum; Cancel stops waiting, clears the watchdog and discards any
late result. A retry button is available after cancellation or failure. The
native Web Crypto digest itself cannot be interrupted. Unsupported/failed native
SHA-1 and the five-second watchdog produce localized, input-free errors.

Input and output exist only in memory and clear on tool/locale navigation,
reload or disposal. Rejected edits, replacement, clear and newer digest requests
invalidate old work. Both exports are also invalid from the start of either file
read until all pending reads finish successfully. An edit to the other field
cannot expose a result computed from the previous, still-loading value. There are no input/result
requests, sockets, logs, URL or persistent storage. Export occurs only after an
explicit action. No dependency, telemetry, external font/CDN, WebMCP or
deployment/permission setting is added.
The existing app's preference storage and site analytics policy remain as
documented in README; this tool does not add events or send input to them.

## Boundaries and references

A matching value checks this protocol calculation only. It does not validate a
complete handshake, request/response status and other fields, peer identity,
nonce randomness, TLS, HTTP/2 extended CONNECT, connectivity or data frames.
No live client/server behavior is inferred.

The [official DevToys bundled list](https://devtoys.app/) checked on
2026-11-18 JST lists no dedicated WebSocket Accept workflow. General Base64 and
hash tools do not implement this structured comparison. The tool defaults on;
community extensions are outside the comparison.

Primary references:

- [RFC 6455 §4.1](https://www.rfc-editor.org/rfc/rfc6455.html#section-4.1),
  [§§4.2.1–4.2.2](https://www.rfc-editor.org/rfc/rfc6455.html#section-4.2.1) and
  [§4.3](https://www.rfc-editor.org/rfc/rfc6455.html#section-4.3): nonce length,
  encoded-key/GUID calculation and field grammar.
- [RFC 4648 §3.5](https://www.rfc-editor.org/rfc/rfc4648.html#section-3.5) and
  [§4](https://www.rfc-editor.org/rfc/rfc4648.html#section-4): canonical pad bits
  and standard Base64 alphabet/padding.

The implementation is independently written from the formats; no upstream code
is copied. Five localized static guides use the existing Noto/Sarasa distribution.
