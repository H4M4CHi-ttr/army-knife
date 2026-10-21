# Server-Timing inspector

The **2026-10-22 JST** daily addition reads recorded server metrics without
contacting a server. Paste one raw field value or repeated `Server-Timing:` lines,
then inspect metric names, exact decimal durations, descriptions and parameters.
For example:

```http
Server-Timing: cache;desc="hit, edge", db;dur=53.25
Server-Timing: app;dur=47.2;desc="render"
```

This produces three independent metrics. The comma inside the cache description
stays in one value. Cache has no declared duration, so it is unavailable; it is
never turned into zero. Explicit JSON copy/download includes all parameter values.

## Interpretation and limits

- Inspect the sender grammar in [W3C Server Timing §2](https://www.w3.org/TR/server-timing/#the-server-timing-header-field),
  using HTTP tokens, quoted strings, escapes and optional whitespace around `=`.
  Support LF/CRLF field lines and Latin-1 quoted text. Reject other headers,
  status lines, obsolete folding, malformed quotes, missing parameter values and
  extraneous characters. This is intentionally stricter than a browser's recovery
  algorithm. No partial report is returned on syntax or limit errors.
- Preserve metric order, duplicate metric names and case. Parameter names are
  case-sensitive; interpret lowercase `dur` and `desc` only. For duplicate
  parameters, the first occurrence wins even if its duration is unsupported.
  Keep every later value visible with an ignored flag. Extension values remain
  visible without interpretation. Missing descriptions differ from empty strings.
- Interpret `dur` only as an unsigned decimal string: integers, `1.5`, `.5` and
  `1.` are supported, quoted or unquoted. Keep all digits and leading/trailing
  zeros. Signed, exponent and other notations receive a scope advisory and remain
  available in the parameter list. No `Number` conversion, rounding, numerical
  aggregation or browser floating-point emulation. This restriction is the tool's
  policy, not a claim that browsers reject every other notation.
- [W3C §3.2](https://www.w3.org/TR/server-timing/#duration-attribute) recommends
  milliseconds but the sender controls the unit. Metrics can overlap. No sum,
  start time, waterfall, cache status, bottleneck verdict or actual request timing
  is inferred. Timing-Allow-Origin and cross-origin exposure are not evaluated.
- **8 KiB UTF-8**, **32 physical lines**, **64 metrics**, **16 parameters per
  metric**, **64 characters per name**, **1,024 characters per decoded value**.
  A bounded linear scan runs as lightweight TypeScript. Inputs up to 2,048 UTF-16
  code units apply immediately; longer input uses the existing **800ms** delay,
  wait display, manual apply and pending cancellation. No long-running worker job
  is needed for an 8 KiB scan. Edits, rejected pastes, clear and navigation
  invalidate the previous result before export.

## Integration and privacy

Five localized Vapor views and static guides reuse shadcn-vue, responsive theme
tokens and the existing self-hosted licensed Noto/Sarasa fonts. Parameter lists
expand with a keyboard-accessible native disclosure. Inputs and results stay in
memory and clear on navigation/reload. No input in URLs, storage, logs, analytics
events or network requests. No dependency, analytics, telemetry, remote font,
WebMCP or publishing configuration is added.

The [official bundled DevToys tools](https://devtoys.app/), checked **2026-10-22 JST**,
do not list a dedicated Server-Timing inspector. Default **on**; this comparison
does not claim coverage of third-party extensions. Existing unfinished PRs #145
(six more languages) and #149 (ten other inspectors) have separate scope; no
incomplete daily-addition PR was found at the start. PR #153 is already merged.
No `AGENTS.md` or `.agents/skills` exists in this checkout.

## Verification

Pure tests cover sender syntax, precision, duplicate/case semantics, quoted
delimiters and escapes, malformed input and every hard cap. Vapor tests cover
immediate/800ms/manual/cancel behavior, invalidation and inert markup. The browser
suite exercises five languages, both themes, keyboard disclosures, responsive
layout, explicit JSON copy/download, clearing and exact-built-asset request audits
on Chromium/Firefox at desktop/small sizes. All existing Rust/WASM, lint, type,
Vapor, font, production, distribution/license and browser gates remain required.
