# PostgreSQL WAL LSN comparison

## Intent and approach
One default-on data tool, `pg-lsn`, compares two recorded PostgreSQL WAL byte
positions without a database connection. Useful for reviewing replication or
recovery logs offline. The implementer selects exact BigInt subtraction plus
segment arithmetic under the autonomous scheduled-development request.
Alternatives considered: a generic hexadecimal converter duplicates DevToys;
WAL filename generation requires a timeline and boundary conventions and is
outside this small change. The official DevToys bundle was checked 2026-11-11
JST: no dedicated LSN comparison workflow; extensions are outside this comparison.

## Exact supported model
Each raw input is at most 64 UTF-8 bytes. Accept ASCII SP/HTAB only around
`[0-9A-Fa-f]{1,8}/[0-9A-Fa-f]{1,8}`. Reject line breaks, signs, prefixes,
Unicode lookalikes, missing halves, extra content and overflow. Canonical form
is uppercase, with leading zeroes removed independently (zero remains `0`).
Position = high * 2^32 + low; the complete unsigned 64-bit range is accepted.
`0/0` is valid pg_lsn arithmetic but explicitly marked as PostgreSQL's invalid
record-pointer sentinel. No record existence or validity is inferred.

Return exact decimal strings for byte positions, signed B-minus-A delta,
absolute distance, and whole MiB plus remaining bytes. Direction is forward,
backward or equal. WAL segment size is explicitly selected from powers of two
1..1024 MiB, default 16; MiB = 1,048,576 bytes. Per input, report zero-based
mathematical segment number = floor(position / segmentBytes) and offset =
position mod segmentBytes. At a boundary use the next segment with offset 0.
This is not pg_walfile_name's previous-file convention. No WAL filename,
timeline, number of retained files, byte contents or time lag is calculated.
The user must establish a common cluster/WAL history; LSNs contain no timeline.
No partial result after either invalid input/option. Errors never echo input.

## UI and privacy
Reuse Vapor, shadcn-vue Button, CodeInput, ApplyControl, OutputActions,
useToolExecution and existing Noto/Sarasa fonts. Two labeled inputs, a segment
size selector, sample/clear, exact summary, per-position details, explicit JSON
copy/download. Five locales, light/dark, keyboard and narrow widths.
These bounded inputs always run instantly even when auto-apply is disabled;
no heavy work/Worker/WASM or artificial debounce is needed. Rejected pastes
invalidate old exports until the rejected field is replaced. Navigation,
locale changes and reload clear data; preferences alone persist. No new
dependency, telemetry, external fonts, API, WebMCP or Pages destination/settings.

## Verification
Pure tests cover precision, high-half rollover, reverse/equal, zero sentinel,
every segment size, boundaries, malformed values and raw byte limits. Real
Vapor tests cover immediate dual-input/option edits, rejected-paste invalidation,
explicit JSON, localization and disposal. Production E2E runs Chromium/Firefox
desktop/small, five locales and both themes, keyboard, exact exports,
lifecycle, exact-dist-asset network/privacy audit and synthetic screenshots.
Run all existing type/lint/unit/Rust/WASM/Vapor/font/license/build/browser gates
on the final head; obtain independent review, normal merge, and confirm the
existing Pages deployment and live operation. A failed/unrun check is a blocker.

Sources: [pg_lsn](https://www.postgresql.org/docs/18/datatype-pg-lsn.html),
[WAL internals](https://www.postgresql.org/docs/18/wal-internals.html),
[segment sizes](https://www.postgresql.org/docs/18/app-initdb.html),
[pointer sentinel](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/include/access/xlogdefs.h),
[DevToys](https://devtoys.app/). No upstream source code is copied.
