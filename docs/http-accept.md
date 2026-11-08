# HTTP Accept negotiation preview

## Intent and bounded model

Compare a recorded Accept field value with one offered Content-Type per line,
without sending requests or loading representations. The daily autonomous task
selects this complement to the existing MIME dictionary and HTTP inspectors.
No dedicated Accept negotiation tool appears in the [official bundled DevToys
list](https://devtoys.app/) checked 2026-11-09 JST; community extensions are
outside this comparison. It defaults on.

The model follows [RFC 9110 sections 12.4–12.5.1](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1):
first find each offer's most specific matching range (exact type/subtype before
type/* before */*, then more matching parameters), then use that range's q.
A specific q=0 overrides a positive wildcard. Missing q is 1; weights are exact
integer thousandths, with no floating-point parsing. A checkbox distinguishes
an absent Accept field (all offers q=1) from a present empty field (none match).
Unused Accept text is disabled and ignored in absent mode.

Type/subtype and parameter names are case-insensitive. Quoted parameter values
are unescaped; charset values are case-insensitive, all other values compare
literally and case-sensitively. Extra offer parameters are allowed. The tool does
not consult media-type registrations or infer default parameters/charset,
structured suffix aliases, charset aliases, language or encoding preferences.
Thus it is an explicit literal-parameter model, not a universal server emulator.
Only full */* and type/* wildcards are supported; embedded asterisks and wildcard
offers are unsupported. Any q parameter is interpreted as weight regardless of
position; duplicate parameter names, quoted q, old valueless accept extensions,
whitespace around '=' and full header blocks are rejected. Empty comma and
semicolon slots are accepted within the limits. Quoted delimiters remain data.
If equally specific matching ranges disagree on q, the whole input is reported
as ambiguous rather than guessing an undocumented tie rule.

The report retains ranges in source order and offers in offered order, including
all governing range indexes (one-based). Positive offers are also ranked by q,
with offered order as this preview's explicit tie rule. A selected offer is only
this model's first positive candidate. No acceptable offer does not guarantee
HTTP 406: servers can disregard Accept. No HTTP request, response, file mutation,
actual server configuration test, MIME sniffing or content validation occurs.

## Bounds, UI and privacy

Each raw input is capped at 8,192 UTF-8 bytes before trimming. Accept allows
32 nonempty ranges / 64 comma slots including empties; offers allow 32 nonempty
LF/CRLF-separated lines / 64 line slots including empties. Each entry has at
most 16 unique parameters (including q), in at most 32 semicolon slots. Printable
ASCII plus HTAB is supported; LF/CRLF only separate offered lines. Invalid,
unsupported, ambiguous or rejected edits remove all results and exports; no
partial or truncated report is returned. Errors use fixed localized codes and
do not echo input.

Small combined input up to 2,048 UTF-16 code units updates immediately. Larger
input uses the existing 800ms delayed/manual apply and cancellable waiting.
The bounded synchronous TypeScript operation needs no Worker/WASM or dependency
change. The real Vapor view uses CodeInput, ApplyControl and OutputActions,
five UI/guide languages, both themes, keyboard controls and stacked narrow
layout. Input/report clear on navigation, locale change and reload. They remain
in memory except explicit report JSON copy/download. No new runtime requests,
telemetry, fonts, URL data, persistence, WebMCP or publishing settings are added.

## Implementation and verification plan

1. Add pure grammar/precedence tests, exact q boundaries, absent/empty behavior,
   parameter matching, ambiguous ties, hostile strings and raw/count limits.
2. Integrate the real Vapor dual-input view and absent checkbox, localized
   errors/guides, default-on catalog entry, icon and lazy route. Test stale output
   invalidation per input, rejected edit isolation and execution/disposal.
3. Run dedicated production E2E for five locales, both themes, keyboard and
   390px layout in Chromium/Firefox; verify real JSON downloads, memory-only
   lifecycle and exact-dist-asset request audit; capture synthetic screenshots.
4. Obtain independent read-only review, fix findings, run the unchanged full
   final-head quality gates, ready and merge normally, then verify main's
   existing Pages run and the deployed feature.

Baseline main: af03557. No AGENTS.md or .agents/skills exists in this checkout.
The mounted codex-cloud-empty repository and unrelated PR #145 are untouched.
