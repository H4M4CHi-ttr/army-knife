# PostgreSQL text-array codec — 2026-11-14 JST

## Intent and scope

Convert recorded PostgreSQL `text[]` values to JSON arrays and back without a
database, SQL execution, or type coercion. Preserve order, empty strings, literal
`NULL`, SQL null elements, quotes, backslashes, whitespace and Unicode exactly.
Accept empty arrays and one-dimensional, comma-delimited values only, with
`array_nulls=on`. PostgreSQL's empty `{}` has zero dimensions and maps to `[]`.
Reject dimension decorations, nested arrays, SQL string wrappers/casts/ARRAY
expressions, non-string/non-null JSON items, NUL and malformed UTF-16.

## Approaches and implementer decisions

- A native bounded TypeScript scanner plus JSON's native parser is selected:
  no dependency, readable quote/escape/null rules, and no numeric conversion.
- A broad PostgreSQL multidimensional/type parser would need dimension and type
  metadata that plain JSON cannot preserve. It is outside this small tool.
- SemVer and broader zone-file tools were considered; the former is listed as
  a DevToys community extension, and the latter would add a much wider grammar.
  This codec is a separate workflow from the existing JSON, DSN, LSN and TXT tools.

These are the implementer's decisions under the user's recurring authorization
to select and ship one tool, not additional user-selected requirements.

## Contract

- `decodePgTextArray(input: string): PgTextArrayReport` and
  `encodePgTextArray(input: string): PgTextArrayReport` return `values`, canonical
  `array`, two-space JSON `json`, `nullCount`, `emptyCount` and `dimensions: 0 | 1`.
- Raw UTF-8 input: 8192 bytes; 256 items; each generated representation: 32768
  bytes. Reject atomically on syntax, character, count or output limits.
- PostgreSQL whitespace is ASCII SP/HTAB/LF/CR/FF/VT, not JavaScript `\s`.
  Quotes enclose a whole element. Backslash quotes the next character verbatim.
  Unquoted edge whitespace is discarded; quoted/escaped whitespace is retained.
  Only unquoted, unescaped case-insensitive NULL denotes a null element.
- Encoding quotes every string and escapes only backslash and double quote.
  Null is bare NULL. The generated value is parameter text, not a quoted SQL
  literal, executable statement or guarantee about a database's configuration.
- The view starts empty, defaults to decode, and clears on mode change. Full
  output requires explicit copy/download; the detail table previews 32 items
  with explicit shown/total counts. It never presents a truncated conversion.
- Up to 2048 UTF-16 units: immediate; otherwise shared 800ms/manual/cancel
  controls. At these fixed bounds no heavy worker is necessary. Editing,
  rejected imports, mode/navigation/language changes and disposal invalidate
  exports and pending work. Preserve file BOM so syntax cannot silently change.
- Reuse Vapor, shadcn buttons, CodeInput, OutputActions, useToolExecution, five
  locales, both themes, keyboard and 390px layouts. Add no dependency, external
  input/result request, telemetry, font/CDN, URL/storage input or WebMCP.

## Evidence and boundaries

Fresh main: 024ed94d0dcc8b43095bf501f5d120ecd7b4fad2. Open PRs: unrelated #145
only; no unfinished daily PR or active array branch/issue. #169 is untouched.
The [official DevToys bundled list](https://devtoys.app/) was checked on
2026-11-14 JST: no dedicated PostgreSQL text-array codec; community extensions
are outside this comparison. Default on (`devtoys: false`).

Primary format references: [PostgreSQL 18 arrays, 8.15.2 and 8.15.6](https://www.postgresql.org/docs/18/arrays.html),
[`array_nulls`](https://www.postgresql.org/docs/18/runtime-config-compatible.html#GUC-ARRAY-NULLS),
and the upstream `ReadArrayToken` in REL_18_STABLE `arrayfuncs.c`. The scanner is
implemented independently from the documented grammar; no upstream code is copied.

## Verification and delivery

Test null/quoted/escaped distinctions, empty/numeric-looking/Unicode values,
ASCII whitespace, malformed quoting, unsupported dimensions/types, source and
output boundaries, many items, exact round trips and no partial output. Real
Vapor and production Chromium/Firefox desktop/small tests must exercise both
modes, five locales/themes, explicit exports, file/paste rejection, deferred
manual/cancel/disposal and privacy. Run final-head full quality gates, independent
review, draft/ready normal merge with exact head checks, then existing main CI,
Pages and published operation checks. Do not modify other repos/PRs or settings.
