# OAuth PKCE S256 generator (#80)

The 2026-10-20 JST daily addition implements one bounded browser-only OAuth test
utility. Fresh verifier/challenge pairs are generated only on an explicit action;
an existing verifier can also be checked. No OAuth endpoint is contacted.

## Contract

- `createPkce(request, signal?)` accepts either `{ mode: "generate", verifierLength,
  stateLength }` or `{ mode: "derive", verifier }` and returns a promise of
  `{ verifier, challenge, method: "S256", state: string | null }`.
- Generated verifier length is an integer **43–128** (default 43). Each character
  selects uniformly from the 64-character base64url alphabet using six random bits
  from `crypto.getRandomValues`; even the minimum has 258 random bits. Optional
  state uses independent random bytes, **16–128** characters (default 32); zero
  omits it. These state bounds are a tool policy, not an OAuth protocol limit.
- Existing verifiers must contain exactly 43–128 ASCII unreserved characters
  (`A–Z a–z 0–9 - . _ ~`). Whitespace, Unicode, invalid lengths, and malformed
  settings are rejected without trimming, truncating to a valid value, or echoing
  input in errors. Syntax validation does not establish a supplied value's entropy.
- S256 is `BASE64URL(SHA256(ASCII(verifier)))`, without padding. No plain mode.
  One pair and at most one state are produced per action; the entire result is
  under 500 ASCII bytes. The hash input is at most 128 bytes.
- Web Crypto hashing is asynchronous with a **5-second** watchdog. Abort stops
  waiting and discards the result; browsers do not support aborting the underlying
  digest. The shared execution controller invalidates old results on edits,
  cancellation, navigation, and locale changes. No Worker/WASM is useful for this
  bounded operation. Existing-verifier checks run immediately; generation is manual.
- Five localized Vapor views and static guides use existing shadcn-vue controls,
  theme tokens, bundled Noto and Sarasa-derived fonts. No dependency, runtime font,
  analytics, telemetry, WebMCP, network call, storage key or permission is added.
- Values live in component memory only, never URLs/storage/logs/network. Each
  output has an explicit copy button; no automatic export. Clear removes all
  fields/results; navigation/reload also clears them. Clipboard copy is an
  explicit user-controlled action and reports errors without logging data.
- Intended for local OAuth development: keep the verifier private, use a new pair
  per request and compare returned state in your OAuth client. This utility does
  not perform authorization, bind state to a session, or implement an OAuth client.

## Source and overlap review

[RFC 7636 §4 and Appendix B](https://www.rfc-editor.org/rfc/rfc7636.html#section-4)
are the transformation and syntax references. The bundled
[DevToys list](https://devtoys.app/) and
[default-tools source](https://github.com/DevToys-app/DevToys.Tools/tree/main/src/DevToys.Tools/Tools)
were checked on 2026-10-20 JST. There is no dedicated PKCE workflow there;
generic password/hash generation does not provide the linked verifier/S256/state
workflow. Default **on**. This comparison does not cover community extensions.

## Verification

Unit tests pin the RFC example, exact boundary lengths, complete allowed alphabet,
malformed settings, cryptographic failures, no-crypto behavior, aborts, stale async
results and the watchdog. Production-browser tests cover five languages, copy,
keyboard controls, light/dark at 390px and desktop, state omission, invalid input,
clearing/reload/navigation and exact-asset network/privacy checks. Existing
repository type, lint, Rust/WASM, Vapor, build and license/distribution gates remain
required. The RFC example is public test data and must never be reused as a secret.
