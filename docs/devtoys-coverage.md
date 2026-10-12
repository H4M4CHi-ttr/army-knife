# DevToys overlap policy

This is a **2026-10-11 snapshot**, reviewed against the [official DevToys tool list](https://devtoys.app/) and the [default-tools repository](https://github.com/DevToys-app/DevToys.Tools). DevToys extensions are open-ended, so this is a comparison with the official bundled tools, with known older bundled tools treated conservatively. It is not a claim that no third-party DevToys extension offers a similar feature.

| Army Knife tool                        | Default | Reason                                                                                                                                                                                                  |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SRI integrity generator                  | Off     | Hashing overlaps with bundled hash generators; SRI-specific HTML is additional, but conservatively requires opt-in. No third-party dependency. |
| BOM & line-ending inspector              | Off     | Text encoding and conversion overlap some bundled tools, so conservative opt-in is used. |
| Magic bytes inspector                    | On      | Local fixed binary signatures with extension comparison, not a generic bundled DevToys format converter. |
| User-Agent inspector                     | On      | Passive browser/OS/client-hints heuristic analysis, distinct from bundled URL tools. |
| Set-Cookie attribute inspector           | On      | Static attribute/prefix/SameSite validation, distinct from bundled URL tools. |
| Base64 UTF-8 text converter            | Off     | Standard and URL-safe RFC 4648 text conversion overlaps with the official bundled Base64 encoder/decoder; explicitly opt in from Settings. No third-party package is added.                         |
| Linux permission calculator            | On      | Inspects chmod rwx/special mode bits, scoped symbolic changes, and separate umask creation examples. No corresponding bundled permission calculator appears in the reviewed official list.              |
| Shortcut investigator                  | On      | Looks up documented default shortcut assignments across applications and Web apps. No corresponding bundled shortcut dictionary appears in the reviewed official tool list.                             |
| HAR inspector                          | On      | Summarizes a recorded HTTP archive: request durations, status codes, response sizes, hosts, and media types. No corresponding bundled HAR analyzer appears in the reviewed official list.               |
| .env comparison and inspection         | On      | Parses environment definitions to compare keys and values and report duplicate definitions and malformed lines. This semantic configuration check is distinct from the bundled general text comparer.   |
| URL structure and ordered query editor | On      | Inspects URL components and edits query entries with their order, duplicate keys, and bare flags intact. The bundled URL encoder/decoder provides text conversion; see the source comparison below.     |
| PostgreSQL EXPLAIN JSON inspector      | On      | Inspects recorded plan nodes, row estimates, and timings. The bundled SQL formatter changes SQL presentation; it does not analyze PostgreSQL execution-plan JSON.                                       |
| CSV profiler                           | On      | Profiles columns in existing CSV/TSV data. This is distinct from the bundled JSON Array to Table/CSV converter.                                                                                         |
| Log explorer                           | On      | Filters existing log lines and aggregates severity and repeated messages. The bundled regular-expression tester focuses on testing patterns rather than this log-analysis workflow.                     |
| CIDR calculator, IPv4 and IPv6         | On      | No corresponding bundled tool in the official list.                                                                                                                                                     |
| Unicode invisible-character inspector  | On      | Focuses on code-point locations, bidi controls, joiners, variation selectors, and invisible formatting characters. This is distinct from the bundled text analyzer's general text utilities.            |
| JSON structural diff                   | On      | Compares the parsed JSON tree and reports JSON Pointer paths; ignores object-key order while preserving array order. It is distinct from the bundled text comparer and JSON formatter.                  |
| List operations                        | Off     | Union, intersection, and differences overlap with the bundled List Comparer.                                                                                                                            |
| JSON formatter                         | Off     | JSON formatting is a bundled DevToys feature.                                                                                                                                                           |
| WCAG contrast checker                  | Off     | Color Picker & Contrast shipped in DevToys 1.x. Even though it is absent from the current 2.0 list, treat it as overlap. See the [upstream report](https://github.com/DevToys-app/DevToys/issues/1483). |

Cron parsing and JSONPath testing are explicitly present in the official bundled list; neither is implemented in the initial release. If added later, they must be **off by default**. The same applies to Base64, JSON/YAML conversion, date conversion, URL/HTML encoding, hashes, UUIDs, and other listed bundled features.

Tool visibility preferences belong in browser settings. Tool input contents must not be persisted as part of those preferences. Newly introduced overlapping tools must stay off for existing users unless they explicitly enable them.

### Why the URL tool is enabled

The reviewed upstream [UrlEncoderDecoderGuiTool.cs](https://github.com/DevToys-app/DevToys.Tools/blob/main/src/DevToys.Tools/Tools/EncodersDecoders/Url/UrlEncoderDecoderGuiTool.cs) exposes an encode/decode switch, an optional multiline switch, a text input, and a converted text output. Its conversion path calls `UrlHelper.EncodeOrDecode`; it does not expose a parsed component view or an ordered query-entry editor.

Army Knife's URL tool accepts an absolute URL, shows its scheme, authority-related fields, path, and fragment, and edits an ordered sequence of query keys and values. Repeated keys remain separate entries, and a bare flag is distinguished from an explicit empty value. Query decoding and encoding are necessary parts of that editing operation. The app does not expose a standalone text URL encoder/decoder mode. A future standalone mode would be an overlapping feature and must be off by default. This classification is specific to the reviewed bundled implementation and should be revisited when upstream adds relevant capabilities.

## Five new local inspector tools

SRI and BOM inspection default off conservatively under the overlap policy; the other three default on. No additional runtime package or CDN is required.

- SRI: exact binary bytes, SHA-256/384/512 Web Crypto digests, Base64 integrity strings, HTML examples with placeholder local paths. Files up to **8 MiB**, hex input up to **64 Ki characters**. Does not fetch URLs or authenticate origins; does not modify the selected file.
- BOM: strict UTF-8/UTF-16LE/BE byte analysis, BOM and CRLF/LF/CR counts and proportions; supports deliberately requested BOM-free UTF-8 + chosen newline download only after valid strict decode. BOM-less UTF-16 inference is heuristic and clearly marked. Not an arbitrary charset detector. Files up to **8 MiB**.
- Magic Bytes: file signatures and last 128 bytes for ZIP trailer hints; the full file is never parsed. Multiple formats, extension and untrusted declared MIME mismatches may be flagged. No trust/malware guarantee, filename MIME data is not authoritative. Files up to **8 MiB**.
- User-Agent: text **8 KiB**, known-token classification only. Spoofed/frozen UA and missing Client Hints mean results are guesses, not a compatibility or security guarantee.
- Set-Cookie: text **64 KiB** and **64 physical non-empty header lines**, each a separate header, with semicolon-delimited attrs. Expires commas remain intact. Inspect flags, SameSite, Partitioned and name prefixes, including context-sensitive warnings about absent attributes. Does not accept comma-concatenated Set-Cookie headers as separate values, and does not perform HTTP requests. Cookie values do not reach results or exports.
- Binary tasks run in dedicated, cancellable Workers with a 15-second watchdog and in-memory output only. File reads have a size guard before allocation. Input data is never persisted, sent, or embedded in links. No new package licensing obligations.

## Calculation semantics and limits

### Base64 text conversion

- Local UTF-8 text ↔ RFC 4648 Base64, with explicit standard (padded) and URL-safe (unpadded) alphabets. Decoding permits both canonical padded and unpadded encodings, rejects whitespace, mixed alphabets, nonzero unused bits, and invalid UTF-8. Arbitrary binary files are not supported.
- Input is bounded to **256 KiB**. UTF-8 byte count (encode) and ASCII character count (decode) are validated without truncation. Unpaired UTF-16 surrogates are rejected to prevent silent replacement; decoding preserves a UTF-8 BOM.
- Inputs of up to **8,192 UTF-16 code units** are computed synchronously. Larger inputs use the common 800ms/manual execution controller and a dedicated cancellable same-origin Worker, with a 5-second timeout. Input/results remain in memory and are not logged, persisted, or transmitted.
- DevToys bundles Base64 encoding/decoding, so the tool is **off by default** on fresh installations and remains off for existing users until explicitly enabled. No extra dependency or downloaded model is introduced.

### Linux permissions

The [permission calculator specification](chmod.md) documents the complete
12-bit octal editor, explicit-class symbolic subset, GNU directory set-ID
preservation, five-digit GNU command examples, and separate bitwise umask
examples. Calculations are instant and bounded to 256 UTF-8 bytes / 32 symbolic
clauses. There is no filesystem, shell, ACL, or effective-access simulation.
The official DevToys list and default-tools tree were rechecked on 2026-10-12;
no corresponding bundled tool was found. This does not cover every extension.

### HAR

- Accepts a recorded [HAR 1.2](https://www.softwareishard.com/blog/har-12-spec/) `log.entries` document, with a **16 MiB UTF-8 input** and **100,000-entry** limit. Rust/WASM analysis runs inside a Web Worker. Recorded URLs are parsed as data and are never requested, replayed, or opened.
- Reports status-code counts, the most frequent **20 host and media-type groups**, and the **20 slowest requests**. Omitted groups are counted explicitly. This is an analyzer of the fields it uses, not a complete HAR schema validator.
- Known response bytes are `response.headersSize + response.bodySize` only when both values are known. Missing, null, or `-1` sizes contribute to the unknown count rather than an invented zero-size response. Decoded content sizes and vendor-specific fields do not substitute for these fields.
- Durations use recorded `entry.time`. Unknown durations are excluded from averages and slowest-request lists. Requests can overlap, so accumulated durations are not presented as page-load time.

### .env

- Each input allows **256 KiB UTF-8**, **10,000 physical lines**, **2,000 valid definitions including duplicates**, and keys of at most **128 ASCII identifier characters**. The parser is a documented dotenv-style subset, not a shell interpreter or a promise of compatibility with every dotenv library. [Node.js's environment-variable documentation](https://nodejs.org/api/environment_variables.html) also explains why dotenv syntax needs an explicit specification.
- Supports optional `export`, `#` comments outside quotes, and single- or double-quoted multiline values. CRLF/CR is normalized to LF. Double-quoted `\n` and `\r` become line breaks; other backslashes remain literal. There is no variable expansion, command substitution, file access, or shell execution.
- The last valid definition wins. All valid duplicate line numbers are retained, while at most **200 diagnostic rows per input** are returned; summary counts cover every detected issue. Malformed definitions are omitted and mark the comparison incomplete, so missing-key results are not silently presented as conclusive.
- Keys are case-sensitive and returned in stable ordinal order. Comparisons use decoded string values, not text-line ordering. Inputs, outputs, and diagnostic state remain in memory. The UI pages through **100 result rows** at a time; explicit copy/download includes all parsed keys and full values, including values hidden in the table.

### URL

- Accepts an absolute hierarchical URL with a non-empty host, limited to **16 KiB UTF-8** and **200 query entries**. Relative/opaque URLs, embedded control characters, malformed query percent encoding/UTF-8, and unpaired UTF-16 surrogates are rejected. Output produced by editing also has a **16 KiB** limit.
- Uses the [WHATWG URL Standard](https://url.spec.whatwg.org/) through the browser's `URL` and `URLSearchParams` APIs. Host case, IDNs, default ports, and path segments can be normalized. Credential fields, path, and fragment retain the parser's percent encoding. Constructing these URL objects does not contact the host.
- Query entries preserve order and duplicate keys. `flag` and `flag=` stay distinguishable; empty ampersand segments have no entries and are omitted. Editing uses form encoding: a space becomes `+`, a literal plus sign becomes `%2B`. No address is turned into a navigation link or opened by the tool.

### PostgreSQL EXPLAIN

- Accepts the [PostgreSQL EXPLAIN `FORMAT JSON` output](https://www.postgresql.org/docs/18/sql-explain.html) array, or one statement object with a `Plan` field. Input is limited to **512 KiB UTF-8**, JSON depth **64**, **50,000 JSON values**, **20 statements**, and **1,000 plan nodes** across all statements. The tool consumes existing output and has no database connection or SQL execution API.
- Numeric tokens are retained losslessly until a supported metric is read. Unknown fields such as a 64-bit `Query Identifier` are ignored without first rounding them into JavaScript numbers. Supported metrics reject negative values, invalid types, and decimal precision loss; estimated rows and loop counts must be safe integers. Duplicate JSON object keys are rejected, and parsed objects have no prototype.
- Plan nodes appear in deterministic depth-first order. The report includes node type, relation/index context, estimated and actual rows, actual loops, row-estimate ratio, costs, and recorded timings. Absent measurements remain null; zero estimates and unexecuted nodes have explicit states instead of fabricated finite ratios.
- [PostgreSQL's EXPLAIN interpretation guide](https://www.postgresql.org/docs/18/using-explain.html) specifies that actual rows and times are per-loop averages and that a parent's time includes child work. The inspector preserves those semantics, uses the statement's recorded planning/execution times, and never sums node times into a claimed wall-clock duration. Costs are planner units, not milliseconds; a `Seq Scan` or `Sort` node alone does not establish a performance problem.
- The UI pages through **100 nodes** at a time. Explicit copy/download contains the complete bounded report, regardless of the current filter or page.

### CIDR

- CIDR input must include a prefix length. IPv4 accepts exactly four decimal octets, without ambiguous leading zeroes. IPv6 accepts compressed forms and a final embedded IPv4 address; bracketed URL literals and zone identifiers are intentionally not accepted.
- Canonical IPv6 output follows [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952): lowercase, the longest leftmost zero run, and no compression of a single zero group. IPv4-mapped addresses use mixed notation.
- Every address and count is calculated using `bigint`. Counts are returned as decimal strings, including the exact `2^128` size of `::/0`.
- IPv4 `/31` uses the two-address point-to-point interpretation of [RFC 3021](https://www.rfc-editor.org/rfc/rfc3021). `/32` describes a single address. Neither has a directed broadcast entry.
- IPv6 has no broadcast entry and no invented generic usable-host count. The inclusive first and last addresses and total address count describe the mathematical range. IPv4 host counts are the conventional subnet calculation, not a guarantee that every address is globally routable or assignable.

### JSON

- Each input is limited to **512 KiB of UTF-8**, nesting depth **64**, and **50,000 parsed value nodes**. Comparison has a **100,000-node** traversal limit and returns at most **2,000 changes**. Truncated results are explicitly marked, and their summaries count only the returned changes.
- The parser rejects duplicate object keys instead of silently keeping the last value. It constructs objects with a null prototype, and comparisons use own-property checks, so keys such as `__proto__` and `constructor` are data.
- The parser rejects integers outside JavaScript's safe-integer range, overflow, underflow, and decimals whose significant digits would change in the shortest decimal round trip. For example, `9007199254740992`, `9007199254740991.1`, and `0.10000000000000001` are rejected. Ordinary decimals such as `0.1` are accepted. This protects comparisons and formatting from silently hiding numeric differences; it is not arbitrary-precision arithmetic.
- Numeric spellings such as `1`, `1.0`, and `1e0` compare as equal. Negative zero and zero compare as equal. Formatting normalizes numeric spellings.
- Paths use [RFC 6901 JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) escaping. Empty string means the document root; `/` refers to an object property whose name is empty. Array order is significant. Diff records are a change report, not an RFC 6902 patch-document API.

### Unicode

- Input is limited to **512 KiB of UTF-8**. At most **1,000 finding rows** and **20,000 preview characters** are rendered, while the total finding count covers the complete accepted input.
- Locations include a zero-based UTF-16 offset, a one-based code-point position, and one-based line and code-point column. CRLF is counted as one line break.
- Unicode joiners, variation selectors, unusual spaces, and directional controls can be legitimate language or emoji content. Detection is informational; the tool does not classify text as malicious and does not silently remove characters.
- Unicode property classifications and normalization use the browser's Unicode implementation. UTF-8 byte counts use `TextEncoder`; unpaired UTF-16 surrogates are shown explicitly and encode as replacement characters.

### Contrast

- Uses the [WCAG 2 relative luminance and contrast calculation](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) for **opaque sRGB** `#RGB` or `#RRGGBB` colors. Alpha colors are rejected instead of silently discarding transparency.
- Pass/fail thresholds use the unrounded ratio. Displaying `4.5` after rounding does not turn a value below `4.5` into a passing result.
- Normal-text AA uses `4.5:1`, large-text AA and non-text contrast use `3:1`, normal-text AAA uses `7:1`, and large-text AAA uses `4.5:1`. The two-color calculation does not by itself establish the accessibility of an entire interface.

## Vite+ references

The project uses VoidZero's **Vite+**, not only Vite. Its [local CLI documentation](https://viteplus.dev/guide/local-cli) supports project-pinned `vite-plus` installations; [test APIs](https://viteplus.dev/guide/test) are imported from `vite-plus/test` and configured in `vite.config.ts`. [Package management](https://viteplus.dev/guide/install) supports `vp install --frozen-lockfile`. The [CI guide](https://viteplus.dev/guide/ci) recommends the official `voidzero-dev/setup-vp` action with an exact release or commit SHA; the moving `v1` tag is no longer updated.
