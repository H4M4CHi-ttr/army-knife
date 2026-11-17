# WebSocket Accept calculator — 2026-11-18 JST

## Intent and choices

Help developers debug the RFC 6455 HTTP/1.1 opening handshake from recorded
field values, without opening a socket. Compute the expected response from a
client key and optionally compare a recorded Accept. The recurring request
delegates tool selection and delivery; these are implementer decisions.

A small native TypeScript validator and Web Crypto SHA-1 digest are selected.
A full handshake/header parser would require request/status/extension policy
and is outside this independent addition. General hash/Base64 converters do
not express the key + fixed GUID rule or recorded response comparison.

## Contract

- `inspectWebSocketAccept(key, recordedAccept?, signal?)` returns a complete
  `WebSocketAcceptReport`: normalized `key`, decoded `nonceHex`, `sha1Hex`,
  `expectedAccept`, `recordedAccept: string | null`, `matches: boolean | null`
  and `responseHeader`. Hash the encoded key's ASCII text plus the exact
  `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` GUID; never hash the decoded nonce.
- Each input is at most 128 raw UTF-8 bytes. Accept field values only, with
  optional outer ASCII SP/HTAB. Reject CR/LF, other controls, non-ASCII,
  prefixes, lists and duplicate fields. Key must be canonical padded standard
  Base64 for 16 bytes (24 characters); supplied Accept for 20 bytes (28).
  Nonzero pad bits are rejected as this tool's explicit strict sender subset;
  they are never silently re-encoded before hashing.
- Only an exactly empty optional input omits comparison. Whitespace-only,
  malformed or oversize supplied input rejects the entire report. A different
  well-formed response returns `matches: false`, never an error or partial
  success. Equality is case-sensitive.
- The view starts empty and updates immediately even with deferred auto-apply
  off. At most 60 ASCII bytes are digested. Native digest cannot be interrupted;
  cancellation stops waiting, removes listeners/timers and discards late
  results. A five-second watchdog reports failure. Show running state, cancel
  and explicit retry. Editing/rejection/clear/navigation/locale/disposal remove
  stale reports. Only explicit actions copy/download the complete JSON or
  response header. Preserve file BOM so it cannot silently change validation.
  From the start of either file read, hide both exports until every pending
  import succeeds; editing the other field cannot recompute from the old value.
  Display each input limit as 128 UTF-8 bytes.
- This checks two field values, not a full HTTP handshake, peer identity,
  nonce randomness, TLS, HTTP/2 extended CONNECT, connectivity or data frames.
  SHA-1 is fixed by this protocol. Do not generate keys or open connections.
- Reuse existing Vapor, shadcn-vue, inputs/actions, five locales, themes and
  licensed Noto/Sarasa fonts. No dependencies, settings/permissions changes,
  external input/result requests, new telemetry/CDN, input URL/storage or WebMCP.

## Evidence

Fresh main: `915e6a0175118279c870e982dd28ec24b426de89`. Only unrelated #145 is
open. The existing SSH inspector branch is separate work; leave it and #169
untouched. No AGENTS.md or checkout `.agents/skills` are present.

The [official DevToys bundled list](https://devtoys.app/) checked on
2026-11-18 JST has no dedicated WebSocket Accept workflow. Default on;
community extensions are outside the comparison.

Primary references: [RFC 6455 §§4.1, 4.2.1–4.2.2, 4.3](https://www.rfc-editor.org/rfc/rfc6455.html#section-4.2.2)
and [RFC 4648 §§3.5, 4](https://www.rfc-editor.org/rfc/rfc4648.html#section-3.5).
Implement independently from the described formats; copy no upstream code.

## Verification and delivery

Use the RFC example and independent Node hash vectors, byte/padding/grammar
boundaries, input-free failures, unavailable crypto, abort/watchdog cleanup.
Real Vapor and four-project Chromium/Firefox production tests cover match,
mismatch, omitted/empty response, two independent exports, keyboard/mobile,
five locales/themes, rejected edits, cancellation/retry and privacy/lifecycle.
Inspect synthetic screenshots and add existing-Pages public tests. Validate
final head with full required gates and independent review; normal SHA-guarded
merge only after all required CI/check/review conditions pass. Verify existing
main deployment and live operation; accurately report any unavailable checks.
