# PostgreSQL text[] ↔ JSON

Convert an existing PostgreSQL array value to a JSON array, or a JSON array to
PostgreSQL array parameter text. This is an independent local codec: it does not
connect to a database, execute SQL or decide a column's type.

## Use

1. Choose PostgreSQL → JSON (default) or JSON → PostgreSQL. Changing format clears
   the previous input/result. Paste text, select a UTF-8 file, or load the synthetic sample.
2. Check the complete JSON and canonical array outputs, item/null/empty-string
   counts and the typed item preview. Copy/download each complete output explicitly.
3. For more than 2,048 UTF-16 units use the shared 800ms automatic delay or manual
   apply. Editing removes stale exports immediately; pending work can be cancelled.
   Short input stays immediate when delayed auto-apply is off. This bounded
   synchronous calculation cannot be interrupted once started.

Example PostgreSQL value (without SQL's outer single quotes):

```text
{"a,b",NULL,"NULL","","a\"b","c\\d","日本語"}
```

The corresponding JSON is:

```json
["a,b", null, "NULL", "", "a\"b", "c\\d", "日本語"]
```

There are seven items, one null and one empty string. `9007199254740993` in a
PostgreSQL text element becomes a JSON **string**, retaining every digit. JSON
numbers are rejected rather than coerced or rounded.

## Accepted format and semantic boundaries

The model is PostgreSQL 18's comma-delimited `text[]` input format with
`array_nulls=on`, restricted to empty or one-dimensional values without dimension
decorations. `{}` corresponds to `[]`; PostgreSQL calls this empty array
zero-dimensional. A null element, empty string and an entirely null array differ:
bare root `NULL` / root JSON `null` are not accepted.

- Elements are whole double-quoted strings or unquoted text. Backslash escapes the
  next character literally; `\n` means `n`, not a line break or a C/JSON escape.
- Bare, unescaped `NULL` is case-insensitive null. Quoting or escaping it makes it
  text. Empty strings must be quoted. Leading/trailing unquoted ASCII whitespace
  is discarded; internal, quoted and escaped whitespace survives.
- Whitespace outside values is ASCII space/tab/LF/CR/form-feed/vertical-tab.
  Non-ASCII spaces are data within an element, not syntax whitespace.
- All accepted non-null values remain strings. The JSON direction requires a
  flat array of strings/nulls; booleans, numbers, objects and nested arrays fail.
- Canonical output double-quotes every string, escapes backslash/double quote,
  uses bare NULL for null, and joins with commas. Original spelling, quote choices
  and insignificant whitespace are normalized, not preserved.
- Reject dimension prefixes (even an explicit lower bound of 1), nested arrays,
  SQL outer string quotes, casts, ARRAY expressions and trailing data. Never
  discard dimensions or flatten arrays. Other element types/delimiters, binary
  array formats, locale/type coercion and database configuration are outside scope.
- Output is **array parameter text**. It is not a SQL-escaped string literal or
  executable statement. A database may have different type/configuration rules;
  a successful conversion does not verify a real database operation.

## Limits, completeness and privacy

- Input limit: **8 KiB raw UTF-8**, checked before whitespace removal; **256 items**
  including nulls and empty strings. NUL and unpaired UTF-16 surrogates fail.
- Each complete representation is limited to **32 KiB after escaping**. A small
  control-rich PostgreSQL value can expand beyond that JSON output limit; the
  whole conversion is rejected. There is no truncated/partly accepted conversion.
- The detail table renders the **first 32 items** and explicitly labels shown/
  total counts. Both output blocks and explicit downloads contain every item.
- Files decode strictly as UTF-8 and retain BOM. An outer BOM is a syntax error;
  a BOM character within a text value is retained. Rejected imports/pastes hide
  old outputs until accepted replacement/sample input arrives.
- Input, output and errors stay in memory. Mode/tool/language changes or reload
  discard them. No input/result request, log, URL, cookie or persistent storage
  is added. Assets/fonts use existing fixed local paths. No new dependency,
  telemetry, font CDN, database API, WebMCP or deployment settings are added.

## Implementation, references and verification

The native TypeScript scanner follows the documented grammar independently;
no PostgreSQL implementation code is copied. JSON parsing is native, followed
by strict string/null shape and Unicode checks. Counts are bounded integers;
element contents are never converted to JavaScript numbers. Real Vapor and
four-project production/public tests check the user-visible workflow, including
exact exports, keyboard/themes/mobile, pending cancellation and privacy.

Primary references: [PostgreSQL 18 §8.15.2 / §8.15.6](https://www.postgresql.org/docs/18/arrays.html)
and [`array_nulls`](https://www.postgresql.org/docs/18/runtime-config-compatible.html#GUC-ARRAY-NULLS).
The [official DevToys bundled list](https://devtoys.app/) was rechecked on
2026-11-14 JST; this dedicated array-value codec defaults on. Community extensions
are outside the comparison. The existing JSON, DSN and LSN tools serve different
workflows. This change does not complete unrelated broader backlog issues.
