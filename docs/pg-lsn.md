# PostgreSQL WAL LSN comparison

Two recorded WAL positions can be compared without connecting to PostgreSQL.
Use this when reviewing replication or recovery logs offline: the exact byte
gap is available even when the positions exceed JavaScript's safe integers.
The tool defaults on; the [official DevToys bundle](https://devtoys.app/) checked
2026-11-11 JST has no dedicated LSN workflow. Generic base conversion is a
different task; community extensions are outside this comparison.

## Use
1. Open the PostgreSQL WAL LSN tool and enter A (baseline) and B (comparison).
2. Set the cluster's WAL segment size explicitly; the initial value is 16 MiB.
3. Read the signed **B − A** byte distance, its absolute value, and its exact
   whole-MiB/remainder decomposition. All edits apply immediately.
4. Inspect canonical LSNs, decimal byte positions and mathematical segment
   numbers/offsets. Copy/download the complete JSON only when requested.

Synthetic example: A `0/FF000000`, B `1/01000000` gives **33,554,432 bytes**
(32 MiB). With 16 MiB segments, A is segment 255 and B is segment 257, both at
offset 0. Reversing A/B gives −33,554,432 bytes. Equal positions give zero.

## Arithmetic and limits
- [PostgreSQL's pg_lsn](https://www.postgresql.org/docs/18/datatype-pg-lsn.html)
  represents a 64-bit WAL byte position as two hexadecimal halves. Each half
  accepts 1–8 ASCII hex digits; lowercase and leading zeros normalize to
  uppercase without leading zeros. Formula: high × 2³² + low.
- Each raw input is at most **64 UTF-8 bytes**, before removing outer ASCII
  SP/HTAB. Internal spaces, line breaks, prefixes, signs, Unicode lookalikes,
  missing halves and overflow are rejected. No partial report on error.
- The full range `0/0` through `FFFFFFFF/FFFFFFFF` is exact. All calculated
  byte values and segment numbers are decimal strings in JSON; no floating
  point conversion or approximate unit formatting is used.
- `0/0` is accepted by pg_lsn arithmetic but flagged as the
  [invalid record-pointer sentinel](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/include/access/xlogdefs.h).
  It does not identify a real WAL record. Other accepted values are not
  checked against actual record boundaries or existing files.
- Segment size is a power of two from **1 through 1024 MiB**, matching
  [initdb's supported sizes](https://www.postgresql.org/docs/18/app-initdb.html).
  1 MiB = 1,048,576 bytes. It is an explicit assumption, not autodetection.
  Segment number is floor(position / size) and offset is position mod size.
  At an exact boundary the mathematical next segment has offset 0. This is
  deliberately different from `pg_walfile_name`'s previous-file convention.
  Segment-number distance does not count files that exist or must be retained.

## Scope and privacy
LSNs do not contain a timeline. Establish that both records belong to the same
cluster and compatible WAL history before comparing them. A positive gap is a
byte distance, not a time delay, row-change count, replication-health verdict
or guarantee that a record/file exists. No timeline/filename generation,
database connection, SQL execution, WAL decoding or live monitoring is done.
[WAL internals](https://www.postgresql.org/docs/18/wal-internals.html) explains
the position model and variable segment sizes.

The bounded computation is instant even when automatic deferred apply is off;
no heavy work, background job or cancellation delay is necessary. A rejected
paste clears the old report/export until that field is replaced. Sample and
clear reset both inputs and the segment size. Navigation, language changes
and reload discard inputs and results. Only the existing preferences persist.
The shared input also accepts explicitly dropped local UTF-8 files within
the same 64-byte limit; those files are read in memory without any upload.

Vapor UI, shadcn-vue buttons, five locales, light/dark, keyboard, small screens,
Noto/Sarasa fonts and explicit JSON exports reuse the existing app. There are
no added dependencies, telemetry, external fonts, APIs, WebMCP, storage keys or
Pages settings. Inputs/results never enter requests, URLs, logs or storage.

Pure and real Vapor tests cover precision, rollover, reverse/equal/zero, every
segment size, bounds, stale exports, localization and disposal. Production and
public E2E use Chromium/Firefox desktop/small, all five locales, both themes,
keyboard, JSON downloads and lifecycle/privacy checks with synthetic data.
