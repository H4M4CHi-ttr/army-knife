# Offline data, log, web and database inspectors

PR #149 adds ten complementary workflows. The 2026-10-27 JST scheduled task
finishes this existing PR before adding another tool or PR. The implementation
uses the repository's pinned Vue 3.6 RC Vapor views, shadcn-vue controls,
five locales and existing self-hosted Noto/Sarasa fonts. No package, telemetry,
runtime API, font CDN, WebMCP or deployment setting is added.

## Input, execution and output

Input and reports live in memory. Navigation, locale changes and reload clear
them; only existing validated preferences persist. Copy and download require an
explicit user action. Recorded URLs, SQL, DSNs and XML are data: nothing is
fetched, executed, connected or rendered as HTML. A rejected paste/file invalidates
the previous report and its export controls; a new edit, sample or clear recovers.

- Ordinary input: **64 KiB UTF-8**. JSON Pointer restore alone accepts **128 KiB**
  so an accepted flatten report can be pasted back without truncation.
- Line-oriented inputs and CSV/SQLite/XML records: **2,000**; JSON Pointer:
  **2,000 nodes**, depth **64**. JSON numbers must survive the existing strict
  parser's decimal round trip; duplicate JSON keys are rejected.
- Preview: **100 rows**, with an explicit limit notice. Export includes the full
  bounded result, not just the preview. Frequency tables are not silently capped.
- Output: **128 KiB**. Exceeding this limit returns a translated error and no
  partial export. NDJSON/log/XML malformed-record counts remain explicit.
- Inputs up to **2,048 UTF-16 code units** run immediately. Larger inputs use the
  existing **800 ms** delay/manual control and a dedicated same-origin Worker.
  The cancel button also cancels pending work. Abort, timeout (**5 seconds**),
  edits and disposal terminate the Worker and discard late results.
- Sitemap uses Window `DOMParser`; at most 64 KiB / 2,000 entries are parsed
  synchronously after the same delay/manual controls. Its synchronous parsing
  cannot be interrupted mid-call. It rejects DTD/entity declarations before parsing.

## Tool semantics

| Tool | Supported behavior and deliberate limits |
| --- | --- |
| NDJSON | Nonblank JSON values are checked independently. Counts, types, all top-level key frequencies and physical error line numbers are exported. Bad/precision-losing rows do not discard good rows and mark the report unclean. |
| JSON Pointer | A typed RFC 6901 node list records every container and scalar, including empty containers, empty/slash/tilde/numeric keys. Restore accepts that format, not arbitrary flattened maps or JSON Patch; it rejects duplicate/missing parents, non-scalar value nodes and sparse/out-of-order array indexes. Objects use null prototypes. Numeric spellings and object key order may normalize. |
| CSV → INSERT | RFC 4180 style comma-separated headers, doubled quotes and embedded newlines. At most 256 distinct column identifiers. Table/column names are ASCII identifiers (table may be qualified). Every non-NULL cell remains text; the explicit nonempty NULL marker is distinct from an empty string. Batches contain 1–500 rows. PostgreSQL uses explicit E strings; MySQL UTF-8 hex expressions are independent of SQL quoting modes; SQLite doubles quotes. NUL/unpaired surrogates are rejected. SQL is never executed; schema/column types and actual server behavior are not predicted. |
| SQLite plan | Reads four-column pipe/TSV or JSON arrays/objects from EXPLAIN QUERY PLAN, with exact safe-integer nonnegative IDs/parents and string detail. Counts SCAN/SEARCH/TEMP B-TREE and shows bounded indentation. Cycles/missing parents warn; no cost or performance guarantee is inferred. |
| JSONL logs | Uses level, service, string/numeric requestId/traceId and timestamp/time. An optional request ID filter matches exactly; malformed ID types count as invalid rows. Times are integer Unix milliseconds within Date range or explicit-zone RFC 3339 at millisecond precision. Invalid/absent times are counted and ordered last, stably; extended-year numeric instants sort by time. All level/service frequencies and the complete bounded timeline are exported. |
| Stack traces | Heuristically recognizes JS/Python/Java/.NET frames. Grouping uses exception type and the first 30 normalized frames, ignoring line numbers; it is not complete language parsing or a source-map service. Paths and text following the exception-type colon are omitted from reports. The short FNV fingerprint is noncryptographic and is not anonymization or a security identifier. |
| robots.txt | Offline agent/group and anchored path matching with `*`, terminal `$`, longest literal rule and Allow tie precedence. Matching is bounded dynamic programming, without regex backtracking. Empty Allow/Disallow still end an agent-list section. Percent encoding, Unicode octet equivalence, crawler normalization, redirects, fetching and client-specific policies are not reproduced; the heuristic warning always applies. Path ≤2,048 characters, agent ≤200. |
| sitemap.xml | Standard sitemap namespace, urlset/sitemapindex, URL/host/duplicate counts, lastmod, priority/changefreq checks. Unexpected namespaces/fields, duplicate fields, nested loc markup and malformed dates count as invalid entries. Extensions are unsupported and therefore flagged, not silently validated. lastmod supports a calendar date or explicit-zone timestamp with ≤3 fractional digits. No XSD validation or crawling; the CSV export is recorded text and may still contain invalid entries. |
| ISO duration | Integer Y/M/D/H/M and isolated W, seconds with ≤3 fractional digits, optional leading minus. Each component ≤1,000,000. Calendar Y/M remain distinct from fixed milliseconds. UTC month addition clamps the day, then adds fixed time; original offsets/local DST, intervals, fractional months/days and leap seconds are unsupported. References require real Gregorian dates, explicit known offset, year 0001–9999 and millisecond precision; 24:00 and -00:00 are rejected. |
| PostgreSQL DSN | PostgreSQL URI and quoted/backslash-escaped keyword values. Named password/passfile/secret/token/key/credential fields and arbitrary server `options` are masked in all result/copy/download text. Other fields remain visible; this is not a general secret scrubber. It does not reproduce full libpq URI/multi-host/failover/default resolution, validate a connection or promise effective TLS. Duplicate keyword arguments are rejected. |

## Classification and references

These dedicated workflows default on. The [official bundled DevToys list](https://devtoys.app/)
was checked on 2026-10-27 JST: general JSON/SQL/XML formatting, JSONPath, text
comparison and date conversion do not provide these particular inspections.
This comparison excludes community extensions. Existing overlapping tools remain opt-in.

The bundled [Date converter source](https://github.com/DevToys-app/DevToys.Tools/blob/de655a558b1d0e32a2ee8df2cb2a02eefe0b46e0/src/DevToys.Tools/Tools/Converters/Date/DateConverterGuiTool.cs)
was also checked at commit `de655a5`; it converts dates/epochs rather than adding
ISO duration calendar components.

Protocol references: [RFC 6901](https://www.rfc-editor.org/rfc/rfc6901),
[SQLite EXPLAIN QUERY PLAN](https://sqlite.org/eqp.html),
[RFC 9309](https://www.rfc-editor.org/rfc/rfc9309),
[sitemap format](https://www.sitemaps.org/protocol.html),
[RFC 3339](https://www.rfc-editor.org/rfc/rfc3339),
[PostgreSQL connection strings/options](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING).
The supported subsets and limitations above take precedence over any inference
of complete conformance from a tool's short name.

## Verification and independent review

`backlog.test.ts` covers each parser and its limits, strict numeric handling,
round-trip restore, complete frequency exports, exact fractional milliseconds,
calendar rollover rejection, adversarial robots patterns, secret masking and
inert XML. `BacklogTool.test.ts` exercises the real Vapor view's rejected-input,
pending/manual/cancel/disposal behavior. `backlog-runner.test.ts` checks Worker
cleanup, late replies, errors and the five-second watchdog with a lifecycle harness;
real Worker success is tested separately in the browsers.

`tests/e2e/backlog.spec.ts` runs all ten samples in five languages and both themes
on Chromium/Firefox desktop/small projects, keyboard controls, responsive widths,
actual Worker delay/manual execution, >64 KiB restore, explicit full downloads,
password/options/message redaction, errors, reload clearing and rejected-input
export invalidation. Its exact-dist-asset audit checks same-origin GETs, no query
or request body, no WebSocket, no private-marker leakage and no browser errors.
Local E2E does not load the published site's existing analytics or test GA delivery.

Three independent read-only reviewers reproduced the prior parser/precision,
privacy and robots performance errors. Regression tests were observed failing
before their fixes. No review finding is accepted merely because old CI passed.
The final PR records the immutable head, fresh complete CI, synthetic screenshots
and the normal merge/deployment evidence.
