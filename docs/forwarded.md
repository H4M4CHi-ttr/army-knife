# Forwarded proxy record inspector

Read the grouped parameters in a recorded HTTP Forwarded field without
contacting a proxy or host. This complements the existing HAR, CORS and
Trace Context tools: it helps inspect a reverse proxy's recorded metadata.

## Use
Open the tool, paste only the field value, or load the synthetic example:

```text
for=192.0.2.1;proto=https;host="example.test:8443", for="[2001:db8::1]:4711";by=_edge;note="synthetic, recorded"
```

Two elements appear in comma order. Each element preserves parameter name
spelling, decoded value and order. JSON string notation makes empty values,
backslashes and tabs explicit. Positions are the original one-based comma
positions; empty elements leave gaps. Empty comma elements and each nonempty
element's empty semicolon positions are counted. Semicolon-only elements count
as empty elements. All accepted parameters are displayed and exported; there
is no hidden preview truncation.

Small edits run immediately. Above 2,048 UTF-16 units use the existing
800ms delay or manual apply control; cancel stops pending work. The bounded
synchronous parser cannot be interrupted mid-call. Copy/download explicitly
exports the whole report to `army-knife-forwarded.json`.

## Exact supported subset
- [RFC 7239](https://www.rfc-editor.org/rfc/rfc7239.html) list/pair grouping,
  HTTP token names and token/quoted-string values. Quoted-pairs decode once.
  Quoted comma/semicolon/equals signs are values, never separators.
- ASCII HTAB, SP and visible characters only. Raw UTF-8 <=8 KiB, checked
  before trimming or parsing.
- <=32 nonempty elements and <=64 comma positions including empty elements.
  Each element: <=16 unique parameters, <=32 semicolon positions including
  empty positions. These limits also cover separator-only input.
- Whitespace around separators is accepted; whitespace around "=" is rejected.
  All parameters require "=" and a token or quoted value; quoted empty values
  are preserved. Names, including unknown extensions, must be unique per
  element ignoring case. The same name is allowed in different elements.
- At least one parameter is required. Header names/blocks, line folding,
  non-ASCII quoted text and X-Forwarded-* are outside this subset. Any malformed,
  unsupported or over-limit input clears the entire report and exports.

The result is a **structure inspection, not semantic validation**. for/by node
syntax, IP addresses, ports, host grammar, protocol schemes and IANA registration
are not checked. For example, `for="not an IP"` is displayed as recorded text.
Known parameter descriptions indicate their specified meanings only. The tool
never labels the first value a real client or selects a trusted entry.
Order does not prove authenticity, completeness or the physical network path.
Missing proxies/parameters, rewritten records, TLS and server trust configuration
cannot be inferred from this field. See RFC 7239 sections 4, 5 and 8.1.

## Privacy and classification
Input/report stay in memory; navigation, locale change and reload clear them.
Existing preferences alone persist. No input/result in URLs, storage, logs,
network requests or rendered HTML/links. Explicit JSON may contain recorded
addresses and opaque values: export only when intended.

Five locales, both themes and the existing self-hosted Noto/Sarasa fonts are
used. No runtime package, font/CDN, telemetry, API or WebMCP is added.
The tool defaults on: the [official DevToys bundled list](https://devtoys.app/)
checked 2026-11-10 JST has no dedicated Forwarded record workflow.
General text comparison differs; community extensions are outside this comparison.

## Verification
`forwarded.test.ts` covers quoted delimiters/pairs, empty positions, opaque
and prototype-like names, strict syntax, duplicates and raw/count limits.
`ForwardedTool.test.ts` mounts the actual Vapor view for export/inert values,
five locales, rejected-input invalidation and pending/manual/cancel/disposal.
`tests/e2e/forwarded.spec.ts` uses all four specified Chromium/Firefox desktop/
390px projects for five locales, both themes, keyboard, layout, exact JSON
download, memory clearing and exact-dist-asset network/privacy audits.
Synthetic screenshots are attached to the existing browser-report artifact.

The selected executor failed startup, so no local command success is claimed.
Existing full PR CI is the authoritative type/lint/unit/Rust/WASM/Vapor/font/
distribution/license/build/browser check. The first test-only commit failed
on the deliberately absent parser module (run 42709293722).

After the existing deployment succeeds, the read-only `verify-public` job
runs `playwright.public.config.ts` against the existing Pages URL, in all
four browser projects and five locales, and attaches both-theme screenshots.
It installs only the locked test tools and needs only existing contents-read
permissions. It creates no deployment or runtime configuration. The public
site's pre-existing Analytics module remains present; the local exact-asset
audit is separate, and public checks assert no synthetic private-marker leak
without claiming the published site has no existing Analytics requests.
