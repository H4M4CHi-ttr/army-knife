# SSH public-key fingerprint inspector

## Intent and approach

Inspect one recorded OpenSSH public-key line and compare its SHA-256 fingerprint
with an optional reference, entirely inside the existing Pages application.
This helps check deployment/user/host public-key copies without submitting keys
to a diagnostic service. It neither creates credentials nor connects to SSH.

The agent selected this bounded native TypeScript + Web Crypto approach under
the user's recurring authorization to choose and ship one complementary tool.
A Worker/WASM engine would add lifecycle and delivery cost for at most 4 KiB
of decoded bytes. Generic text hashing would hash the wrong representation and
would not inspect the embedded SSH fields. No new runtime dependency is needed.
Source-map inspection was considered as another useful workflow, but its mapping
and position-lookup model is substantially larger than this independent change.

The official DevToys bundled list was checked on 2026-11-15 JST: no dedicated
SSH public-key wire-format/fingerprint comparison workflow appears. Generic
Base64/hash/certificate tools and the existing JWK inspector differ. Community
extensions are outside this comparison. Tool id ssh-key defaults on.

## Accepted inputs and bounds

- One plain keytype + standard Base64 + optional UTF-8 comment line, with
  optional leading SP/HT and a single terminal LF or CRLF.
- ssh-ed25519, ssh-rsa, and ecdsa-sha2-nistp256/nistp384/nistp521 only.
- No options-prefixed authorized_keys, known_hosts, private/PEM/RFC4716 keys,
  certificates, FIDO/security-key formats, other algorithms, or multiple keys.
- Raw key input: 16 KiB UTF-8. Decoded blob: 4 KiB. Comment: 4 KiB UTF-8.
  RSA exponent magnitude: 256 bytes. Complete formatted JSON output: 32 KiB.
- Standard Base64 may use canonical padding or omit it. Whitespace, URL-safe
  alphabet, incorrect padding, nonzero unused bits, and invalid lengths fail.
- Reject NUL/C0 controls except field HT and the terminal CR/LF, C1 controls,
  unpaired UTF-16 surrogates, BOM and invalid UTF-8 files.
- Field-separator SP/HT is excluded from the comment; internal/trailing comment
  text is retained. Comments do not participate in fingerprinting.
- Optional reference input: 128 raw UTF-8 bytes. Outer ASCII SP/HT/CR/LF may be
  removed; the remaining value must be SHA256: plus exactly 43 canonical
  unpadded standard-Base64 characters encoding 32 bytes. Empty means omitted.

## Structural and comparison semantics

Read length-prefixed SSH strings with unsigned big-endian 32-bit lengths and
check every boundary before slicing. Embedded and textual types must agree;
the entire blob must be consumed. Ed25519 has exactly 32 key bytes. RSA e/n
are positive, minimal, signed SSH mpints; preserve the exponent as an exact
decimal string and report the modulus bit length. ECDSA curve/type must agree,
with the expected fixed-length uncompressed SEC1 point and P-521 top-bit bounds.
Compressed points are explicitly unsupported.

This is structural inspection, not mathematical key validation. RSA primality,
curve membership/subgroup checks, key strength, possession, trust, revocation,
certificates and actual OpenSSH/server acceptance are not assessed. ssh-rsa is
the public-key format name here; it does not select or recommend a signature.

Hash the complete decoded public blob with native SHA-256 and show SHA256:
plus standard Base64 with padding removed. For valid supported canonical keys,
this agrees with ssh-keygen -lf ... -E sha256. A reference matches only if its
canonical fingerprint string equals the computed one; a match establishes only
equality of the supplied values. There are no HTTP/SSH/DNS requests.

~~~ts
interface SshKeyReport {
  type: "ssh-ed25519" | "ssh-rsa" |
    "ecdsa-sha2-nistp256" | "ecdsa-sha2-nistp384" | "ecdsa-sha2-nistp521";
  keyBits: number;
  blobBytes: number;
  exponent: string | null;
  curve: string | null;
  comment: string;
  fingerprint: string;
  expectedFingerprint: string | null;
  matches: boolean | null;
}
inspectSshKey(input: string, expected?: string, signal?: AbortSignal): Promise<SshKeyReport>
~~~

All failures are atomic and input-free error codes. Invalid key/reference edits
or rejected imports/pastes immediately remove prior output actions.

## View and execution

Use SshKeyTool.vue with real Vapor, existing shadcn buttons, CodeInput,
ApplyControl, OutputActions, EmptyResult and useAppI18n. Primary input id is
ssh-key-input, matching the unchanged shared route test. The reference uses
CodeInput with file=false and id ssh-key-expected.

Use one replaceable input-state object so samples/clears and rejected-edit flags
invalidate execution atomically. Input plus reference up to 2,048 UTF-16 units
starts immediately, even with saved auto-apply off. Above that, use existing
800 ms/manual controls. Show native hash busy/cancel state; use a five-second
watchdog, abort listener cleanup and late-result disposal. Cancellation cannot
stop an already-started browser-native digest, but stops waiting/publication.
No Worker is necessary for these limits.

Show algorithm, key bits, blob bytes, curve/exact RSA exponent, safely visible
comment, fingerprint and optional match/mismatch. Independently copy/download
the full fingerprint and complete JSON with constant filenames. Escape
directional/control characters in visible comments and wrap long values.
The sample is a published public test vector with synthetic comment/reference;
no private key, key generation, authentication or clipboard auto-reading.

Provide five translations and localized static guides, both themes, keyboard
operation and 390px layouts. Inputs/results stay in memory and clear on
tool/language changes, reload, or disposal. No input in URLs, logs, cookies,
storage or requests; existing preferences and font/analytics configuration stay
unchanged. No API, telemetry, font CDN, WebMCP or new publication configuration.

## Verification and delivery

Core tests pin published/independently calculated fingerprints, every supported
format, comments/padding invariance, mismatch, exact large exponent, adversarial
lengths/mpints/points, both input limits, byte limits, native failures, timeout,
abort and late completion. Real Vapor tests pin rejection and lifecycle.
Production browser tests cover all five locales/themes, real file/exports,
manual/cancel, clearing and exact-dist request/privacy audits in four projects.
Public tests cover five locales in the same four browser projects.

Run final-head type/lint/all-unit/Rust/Clippy/actual-WASM/Vapor/build/font/
distribution/license/static-page checks and browser gates. One fresh independent
reviewer reviews the immutable whole branch. Push one small branch, draft PR,
fix material findings, ready, recheck main/head/rules/checks/reviews, normal merge.
Verify exact main tree, existing Pages deployment, public browser tests and
five-language HTTP plus direct Japanese 390px operation. Never touch #169/#145,
other repositories, protection/billing/credentials, or force/admin operations.

## Primary references

- https://devtoys.app/
- https://man.openbsd.org/sshd.8#AUTHORIZED_KEYS_FILE_FORMAT
- https://man.openbsd.org/ssh-keygen.1
- https://www.rfc-editor.org/rfc/rfc4251#section-5
- https://www.rfc-editor.org/rfc/rfc4253#section-6.6
- https://www.rfc-editor.org/rfc/rfc8709#section-4
- https://www.rfc-editor.org/rfc/rfc5656#section-3.1
- https://www.rfc-editor.org/rfc/rfc8332#section-3
- https://www.rfc-editor.org/rfc/rfc8037#appendix-A.2
- https://www.rfc-editor.org/rfc/rfc5903#section-8 (public coordinates only)
- OpenSSH sshkey.c fingerprint serialization/Base64 presentation, inspected
  afresh as primary implementation evidence; no upstream code is copied.
