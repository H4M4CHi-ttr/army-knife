# JWK / JWKS public-key inspector

## Purpose and design

Inspect a recorded public JWK or JWKS during identity-provider key rotation,
without retrieving a URL or sending keys to a service. Compare key IDs,
public-key structure and SHA-256 RFC 7638 thumbprints. This implements the
public inspection part of Issue #81; format conversion and signature checks
remain out of scope.

Approaches considered: a generic JSON view provides little help comparing keys;
importing every key into Web Crypto makes accepted curves browser-dependent;
bounded structural inspection plus native SHA-256 gives stable, useful key
identifiers. The last approach is the implementation choice under the user's
authorization to select and ship one complementary tool.

## Supported input and output

- One JWK object, or a JWKS object with a `keys` array (including an empty set).
- RSA: canonical, unsigned, unpadded base64url `n` and `e`; exact modulus bit
  length and decimal exponent. At most 1,024 modulus bytes / 8 exponent bytes.
- EC: P-256, P-384 and P-521 with fixed-width `x` and `y`.
- OKP: Ed25519, Ed448, X25519 and X448 with fixed-width `x`.
- Optional `kid`, `alg`, `use`, `key_ops` are type-checked and displayed.
  Unknown metadata, certificates, URLs and extensions are omitted from output
  and explicitly noted. No URL is fetched, linked or interpreted as markup.
- Private fields (`d`, `p`, `q`, `dp`, `dq`, `qi`, `oth`, `k`) and `oct` keys
  reject the whole document. This intentionally stricter public-only scope
  avoids exposing private material through result or export controls. Metadata
  may itself contain sensitive text; supported metadata remains visible.
- Duplicate `kid` and repeated public key material are reported independently.
  A small documented algorithm-family table highlights mismatches; unknown
  algorithms are explicitly unassessed. No inferred compatibility is a trust,
  mathematical-key-validity, certificate or signature-verification result.

Thumbprints hash only the required public members, in lexicographic member order
and compact JSON, encoded as UTF-8. Optional metadata is excluded. The result
contains each complete canonical thumbprint input to make comparison auditable.
No PEM/SPKI conversion, key generation, JWT verification or remote JWKS discovery.

The algorithm table assesses only RS256/384/512 and PS256/384/512 (RSA),
RSA-OAEP/-256/-384/-512 and RSA1_5 (RSA encryption), ES256/384/512 (matching
P-256/P-384/P-521), EdDSA (Ed25519/Ed448) and ECDH-ES with optional
+A128KW/+A192KW/+A256KW (EC or X25519/X448). `none` and HS256/384/512 mismatch
all supported public keys. All other identifiers are unassessed. This table
describes declared families, not recommended algorithms or browser support;
in particular, matching legacy RSA1_5 is not an endorsement of that algorithm.

## Bounds and lifecycle

Input: **64 KiB UTF-8**, **32 keys**, existing strict JSON depth **64** and
**50,000 nodes**. Duplicate JSON members and decimal precision loss are rejected.
Metadata strings: **256 UTF-16 code units**, key operations: **8** unique strings
of **32** code units. RSA modulus: **8,192 bits** maximum; EC/OKP lengths must
match the selected supported curve. No partial report on any rejection.

Up to **2,048 characters** starts immediately; larger input uses the existing
**800 ms** delay/manual controls. Bounded parsing is synchronous; a maximum of
32 short SHA-256 operations uses native Web Crypto, with a **5 second total
deadline**. Cancel/edit/navigation abort waiting and discard late digest results;
native digest computation itself cannot be interrupted. No Worker/WASM needed
for this small bounded hashing work. Running/waiting state remains visible.

Input/results exist only in memory and clear on navigation, locale changes and
reload. Copy/download are explicit. No new runtime package, telemetry, storage,
font, external request, WebMCP or deployment setting. Existing five locales,
Vue 3.6 RC Vapor, shadcn-vue, themes and self-hosted Noto/Sarasa are reused.

## Sources

Reviewed 2026-10-28 JST: [RFC 7517](https://www.rfc-editor.org/rfc/rfc7517),
[RFC 7518](https://www.rfc-editor.org/rfc/rfc7518),
[RFC 7638](https://www.rfc-editor.org/rfc/rfc7638),
[RFC 8037](https://www.rfc-editor.org/rfc/rfc8037).
The [official DevToys bundle](https://devtoys.app/) has JWT/certificate decoding
and hashes but no dedicated public JWK/JWKS comparison workflow; this tool
defaults on. Third-party extensions are outside this comparison.
