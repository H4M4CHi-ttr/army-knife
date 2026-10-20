# Response Cache-Control inspector

The **2026-10-21 JST** daily addition helps inspect recorded response caching
directives without contacting the origin. Related to the Cache-Control part of
#53; the broader header-diagnostics issue remains open.

## Input and report

Paste one raw field value or repeated `Cache-Control:` lines. Names are
case-insensitive. The scanner preserves ordering, duplicate directives, quoted
commas and escaped characters. It reports RFC 9111 response directives plus
`immutable`, `stale-while-revalidate`, and `stale-if-error`. Unknown extensions stay
visible but are not evaluated. Request-only directives receive that same treatment.

For example, `public, max-age=60, MAX-AGE=120, x-cache="edge, local"` returns four
rows. Both `max-age` rows have duplicate warnings; the tool does not choose an
effective value. The quoted comma remains part of one extension argument.

Numeric arguments must be unsigned decimal integers. Quoted numeric arguments are
accepted with a sender-format advisory. Declared seconds are normalized as strings,
so values above `Number.MAX_SAFE_INTEGER` remain exact. Caches can limit their
numeric range. `private` and `no-cache` distinguish bare directives from qualified
field-name lists, with an advisory for unquoted lists. Invalid known arguments,
unexpected flag arguments, unknown extensions, and duplicates are disclosed.

This is a directive inspector, not a cacheability result or cache simulator.
Request conditions, status, `Age`, `Date`, `Expires`, validators, `Vary`, heuristic
freshness, other headers, intermediaries and implementation-specific support are
outside the calculation. `no-cache` permits storage with validation restrictions;
`no-store` has a `must-understand` exception. None of these directives guarantees
privacy. The tool makes no requests, fetches no pasted URLs, and executes no input.

## Bounds and UI

- **8 KiB UTF-8**, **32 physical lines**, **128 directives**, **64 characters per
  name**, **1,024 characters per decoded argument**. Syntax or limit failures
  discard the entire report. No truncated success or silently omitted rows.
- Single-line raw values or only named fields; no status line, other headers,
  obsolete folding or spaces around `=`. HTTP token and quoted-string characters
  are supported, including Latin-1 obs-text within quoted strings. Empty list
  members are ignored within the global byte bound.
- A linear scan of at most 8 KiB is lightweight TypeScript on the UI thread.
  Inputs up to 2,048 UTF-16 code units apply immediately. Longer ones use the shared
  **800ms** delay, wait-progress display, manual apply and pending cancellation.
  There is no long-running worker job to interrupt. Edits, rejected pastes,
  clear and navigation invalidate old results before exporting is possible.
- Five localized Vapor views and static guides reuse shadcn-vue controls,
  light/dark tokens and licensed self-hosted Noto/Sarasa assets. Directive cards
  stack on small screens and support long names/values without horizontal overflow.
- Input and output remain in memory. JSON copy/download is explicit. No input in
  URLs, persistent storage, logs, network requests or analytics events. No new
  dependency, analytics, telemetry, font CDN, WebMCP or publishing configuration.

## Primary references and overlap

- [RFC 9111 §5.2](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2): syntax,
  response directives, duplicates, quoted arguments and caching qualifications.
- [RFC 5861](https://www.rfc-editor.org/rfc/rfc5861.html): stale extensions.
- [RFC 8246](https://www.rfc-editor.org/rfc/rfc8246.html): immutable, including
  ignoring supplied arguments.
- [Official bundled DevToys tools](https://devtoys.app/), checked **2026-10-21 JST**:
  no dedicated response Cache-Control inspector appears in the list. Default **on**;
  this comparison does not cover third-party extensions.

## Verification

Pure tests cover syntax, quoted escapes/commas, repeated fields, exact large
integers, qualified fields, unknown/prototype-like names and every hard cap. Vapor
view tests cover immediate updates, 800ms/manual/cancel, rejected paste recovery,
stale-output removal and inert untrusted text. Chromium/Firefox desktop/small
tests cover all five locales, both themes, keyboard controls, exports, reload and
navigation clearing, and an exact-built-asset privacy/network audit. Existing
Rust/WASM, type, lint, Vapor, production, font and distribution/license gates remain
required; no existing check is disabled.

Synthetic example screenshots: [English desktop, light](screenshots/cache-control-en-light.png)
and [Japanese small viewport, dark](screenshots/cache-control-ja-dark.png).
