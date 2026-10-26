# IDN / Punycode domain inspector

Issue #87: compare a recorded Unicode domain with its browser-normalized ASCII
form, label boundaries and Unicode code points, without resolving or opening it.

## Design and alternatives

Selected under the recurring authorization to deliver one complementary tool.
The existing URL editor does not decode A-labels or expose label/script details;
open PRs #145 and #149 do not implement this workflow. A complete UTS #39 spoof
detector requires versioned Unicode data and broader policy decisions. A remote
DNS/reputation service conflicts with local-only processing. This bounded tool
instead uses the browser's WHATWG URL / non-transitional UTS #46 host mapping,
an RFC 3492 Punycode decoder and strict round trips through that same host mapper.
No package, Worker, Rust, telemetry, font or publishing configuration changes.

## Input and interpretation

- One domain only, up to 2 KiB UTF-8. File drops are rejected before reading.
  No surrounding whitespace, URLs, ports,
  credentials, paths, percent escapes, controls or unpaired surrogates.
- Map U+3002, U+FF0E and U+FF61 domain separators to ASCII dots. Permit one final
  root dot and retain it in both outputs. Reject empty labels, IP addresses and
  host forms the browser converts to IP addresses (including legacy IPv4).
- After browser normalization, enforce a DNS hostname subset: 1–63 ASCII bytes
  per LDH label, no leading/trailing hyphen, at most 253 bytes excluding a final
  root dot, at most 127 labels. This is deliberately stricter than WHATWG URL's
  non-strict domain-to-ASCII operation. Underscore service labels are unsupported.
- Decode each `xn--` label using RFC 3492; reject invalid scalar values and
  require its decoded form to map back to exactly the same ASCII label. Preserve
  the submitted text separately; case, width and other browser mappings can
  change it. Output is browser-normalized Unicode, not the original spelling.
- Show each normalized label's ASCII, Unicode and every code point. No truncated
  reports. Unicode version/UTS #46 acceptance follows the installed browser;
  this is not a strict IDNA2008 validator or a DNS registration check. Emoji may
  be accepted by browser mapping without being registrable.

## Advisory scope

Classify Latin, Greek, Cyrillic, Han, Hiragana, Katakana, Hangul, Arabic, Hebrew
and Devanagari scripts, plus Common/Inherited/Other. This is a limited script
inventory, not Script_Extensions or a complete confusable database. Per-label
mixing of multiple identified scripts is flagged; the normal Japanese
Han/Hiragana/Katakana combination is exempt. Common/Inherited are excluded and
Other triggers an explicit unclassified-script advisory. Greek/Cyrillic letters
get a separate possible Latin-lookalike advisory, including single-script labels.
Every report says that no warning is a safety verdict. No skeleton, brand
matching, ownership, reachability, TLS, phishing or reputation verdict is made.

## Execution and privacy

At most 128 UTF-16 input units apply immediately; longer input uses the existing
800ms delayed/manual apply and cancel controls. Bounded normalization/decoding
is synchronous; cancellation stops waiting. The lower threshold lets long
domains remain editable without repeated automatic analysis. Errors or rejected
pastes clear the whole report and export. Inputs/results stay in memory and clear
on navigation/reload. Fixed-name JSON copy/download occurs only by explicit
action. Input is never a link, a request, a stored value or a page URL.

The [official DevToys bundled tool list](https://devtoys.app/) was checked on
2026-10-26 JST: no dedicated IDN/Punycode inspector, so default on. Third-party
extensions are outside this comparison.

## Verification

Pure tests: multilingual/Punycode vectors, emoji, separator/case/width mapping,
round trips, malformed ACE/controls/surrogates, IP confusion, byte/label/domain
bounds, script advisories and exact exports. Vapor view tests: instant updates,
errors, paste rejection, delayed/manual/cancel/disposal and memory-only output.
Chromium/Firefox desktop/small E2E: five languages, themes, keyboard, exports,
lifecycle, malformed inputs and exact-distribution-asset network auditing.
The existing type/unit/lint/Rust/WASM/Vapor/build/dist/font/license/full-browser
gate remains unchanged and must pass on the final PR revision.

References: [WHATWG URL](https://url.spec.whatwg.org/#idna),
[RFC 3492](https://www.rfc-editor.org/rfc/rfc3492.html#section-6.2).
