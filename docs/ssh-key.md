# SSH public-key inspector

Inspect one recorded OpenSSH .pub line, compute its SHA-256 fingerprint and
optionally compare a reference. Everything runs in the existing static Pages
application. There is no SSH connection, key generation, authentication, file
modification or remote-key retrieval.

## Use

1. Paste one plain public-key line or import a UTF-8 .pub file. The sample uses
   the existing public RFC 8037 Ed25519 vector with a synthetic comment.
2. Optionally paste only the SHA256: fingerprint from an independently obtained
   reference. For example, local read-only inspection uses:

~~~sh
ssh-keygen -lf ./example.pub -E sha256
~~~

3. Inspect format, bit count, blob bytes, exact RSA exponent/named curve,
   unverified comment and match/mismatch. Copy/download the fingerprint and full
   JSON independently. JSON retains the complete comment and normalized reference;
   directional characters are escaped without changing the decoded string.

The sample fingerprint is
SHA256:bbXpuKG6zhzdmnxq256TlqzFBzRl2f6OOg722cYNbU8.
A match establishes only equality of the supplied values, not a trusted owner,
host, valid signature or safe key.

## Formats and structural checks

Accepted key formats are ssh-ed25519, ssh-rsa and
ecdsa-sha2-nistp256/nistp384/nistp521. One leading SP/HT padding region and one
terminal LF or CRLF are allowed. The Base64 is standard, canonically padded or
unpadded, with no whitespace, URL-safe alphabet or nonzero unused bits.
Field-separator SP/HT is excluded from the comment; internal/trailing comment
text is retained. Multiple/wrapped records, sole-CR endings, BOM, controls and
unpaired UTF-16 surrogates are rejected. UTF-8 files decode strictly.

The reader checks every unsigned big-endian length against the remaining blob.
The embedded type must equal the textual type and no trailing bytes are allowed.
Ed25519 contains 32 public bytes. RSA e/n are positive minimal signed SSH mpints;
e is exported as an exact decimal string, including values above 2^53.
RSA bit count describes the modulus. Ed25519 reports 256 bits as OpenSSH does.
ECDSA reports the named curve size, validates curve/type agreement, uncompressed
point prefix/width and the P-521 coordinate top bits. Compressed points are
explicitly unsupported.

There is **no mathematical validation** of RSA parameters, primality, curve
membership or subgroup membership. A structurally-shaped invalid point may
receive a fingerprint. No claim is made that OpenSSH/server policy will accept
it. Strength, identity/trust, possession, revocation, certificates and signatures
are unassessed. The ssh-rsa key encoding does not select a signature algorithm;
the same encoding is also used with RSA/SHA-2 signatures.

Options-prefixed authorized_keys, known_hosts, private/PEM/RFC4716 keys,
certificates, FIDO/security-key encodings and other algorithms are unsupported.
There is no generic hash/format-conversion fallback for these inputs.

## Fingerprint and reference

Hash the complete decoded public blob, including its embedded type and fields,
not the textual keytype/Base64/comment/newline. Present SHA256: followed by
standard Base64 of the 32-byte digest with padding removed. For valid supported
canonical keys this agrees with OpenSSH's public-key serialization/fingerprint.

The reference is optional. Outer ASCII SP/HT/CR/LF is removed; the remaining
value must be the case-sensitive SHA256: prefix and exactly 43 canonical
unpadded standard-Base64 characters encoding 32 bytes. MD5, padded references,
internal whitespace and an entire ssh-keygen output line are not accepted.
Invalid references clear the report rather than silently disabling comparison.

## Bounds and execution

| Value | Limit |
| --- | --- |
| Raw key input | 16 KiB UTF-8 |
| Raw reference | 128 UTF-8 bytes, before outer-whitespace removal |
| Decoded blob | 4 KiB |
| Comment | 4 KiB UTF-8 |
| RSA exponent magnitude | 256 bytes, excluding necessary sign padding |
| Complete formatted JSON | 32 KiB |
| Native SHA-256 deadline | 5 seconds |

1 KiB is 1,024 bytes. Limits and unsupported/malformed input fail atomically;
no truncated or partial success is exported. Rejected edits/imports remove
previous output actions. Repair the relevant field, clear or reload the sample.

Up to 2,048 combined UTF-16 code units starts immediately even when saved
auto-apply is off. Larger input uses the existing 800ms/manual controls.
New edits, navigation, cancellation and the deadline discard late hash results.
The browser-native digest itself cannot be interrupted; at most 4 KiB is hashed.
No new Worker/WASM engine is warranted by these bounds. File input uses bounded,
strict local UTF-8 decoding.
The native picker explicitly includes `.pub`, regardless of the OS MIME mapping.

## Privacy, delivery and checks

Inputs/comments/results are memory-only and clear on tool/language navigation,
reload and disposal. They are not added to URLs, requests, cookies, storage,
telemetry or logs. Comments/URL-like strings remain inert, unverified data.
Only explicit copy/download exports data, with constant filenames. Existing
preference, analytics, CSP, Noto/Sarasa distribution and license settings stay
unchanged. No dependency, API, runtime font CDN or WebMCP is added.

This dedicated wire-format/fingerprint workflow defaults on: the official
DevToys bundled list was checked on 2026-11-15 JST and has no dedicated
counterpart. Generic hashing/Base64/certificate decoding and existing JWK
thumbprints differ. Community extensions are outside the comparison.

The 76 engine tests cover all types, canonical bytes, exact integers, malformed
lengths/mpints/points, bounds and native crypto failure/deadline/abort behavior.
Eighteen real Vapor cases cover five languages, exact independent copies,
rejected input, manual/cancel and late completion disposal. Production browser
coverage runs in Chromium/Firefox desktop/390px, including five independent
public fixtures, actual file/exports, privacy and SPA navigation. The unchanged
shared route test must locate ssh-key-input. Public tests run after the existing
main Pages deployment in all five locales and four browser projects.

Only published public coordinates/material and synthetic RSA data are fixtures;
no private keys or key-generation calls are needed. Python hashlib and read-only
ssh-keygen independently confirm all five fixture fingerprints/bit counts.

## Primary references

- [DevToys bundled list](https://devtoys.app/)
- [OpenSSH public-key line format](https://man.openbsd.org/sshd.8#AUTHORIZED_KEYS_FILE_FORMAT)
- [OpenSSH fingerprint command](https://man.openbsd.org/ssh-keygen.1)
- [SSH data types](https://www.rfc-editor.org/rfc/rfc4251#section-5)
- [RSA public-key encoding](https://www.rfc-editor.org/rfc/rfc4253#section-6.6)
- [RSA encoding versus SHA-2 signature algorithms](https://www.rfc-editor.org/rfc/rfc8332#section-3)
- [Ed25519 SSH format](https://www.rfc-editor.org/rfc/rfc8709#section-4)
- [ECDSA SSH format](https://www.rfc-editor.org/rfc/rfc5656#section-3.1)
- [Existing public Ed25519 vector](https://www.rfc-editor.org/rfc/rfc8037#appendix-A.2)
- [Public ECP coordinate fixtures](https://www.rfc-editor.org/rfc/rfc5903#section-8)
