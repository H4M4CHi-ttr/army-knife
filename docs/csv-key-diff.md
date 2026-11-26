# CSV/TSV key diff

Paste or import the before and after exports, set each input to CSV (comma)
or TSV (tab), and select one or more shared column names. A composite key uses
the exact tuple of selected values in selection order. CSV/TSV carries no
typed nulls. The text `NULL` is a literal value. Missing fields, empty or
whitespace-only key fields and repeated key tuples fail the whole comparison.
Leading zeros, numbers beyond JavaScript's safe integer range, case, spaces
in nonblank values, and Unicode normalization differences are preserved.

The first record contains the column headings. Headings are case-sensitive,
distinct, and nonblank. Both sides accept RFC 4180-style quoting and doubled
quotes, including quoted TSV fields, and CRLF, LF, or CR record separators.
Separators inside quoted fields and literal embedded line breaks are preserved.
An initial UTF-8 BOM is accepted. Select the delimiter explicitly. A valid
single-column table can contain the other delimiter as literal text.
Records with inconsistent widths, malformed quotes, invalid UTF-8 files,
NUL characters, or invalid Unicode are rejected.

Rows and columns can be reordered without changing which values match. A
missing key tuple means its row was added or removed. A matched row is updated
if any cell differs, including presence or absence due to a column change.
Column additions and removals are listed once in the schema summary. An empty
cell is shown as an empty value, and an absent cell has no value on that side.
Removals and updates follow the before table order, then additions follow
the after table order. Cells follow the before heading order, then new
headings in after order.

## Download format

Download the full diff as UTF-8 CSV with CRLF record separators. Its header
is `kind,change,row,column,before,after`.

- `column` records describe added and removed headings, even for empty tables.
- `key` records identify changed rows and their exact key components. Their
  numeric `row` groups the components and cells within this report. Their
  `change` is the row status.
- `cell` records describe the changed values for that row. Their `change` is
  `added` for an after-only cell, `removed` for a before-only cell, and
  `updated` if both values exist. It distinguishes an absent side from a
  present empty value even when a CSV reader decodes both as empty strings.

Input headings and values are quoted with embedded quotes doubled. Text
that starts with a spreadsheet formula marker (including markers following
spaces or controls), a tab or line break, or an apostrophe is prefixed with
one protective ASCII apostrophe. A plain-text CSV consumer can remove one
leading apostrophe from these decoded fields to recover the originals.
Import columns as text in spreadsheet software to preserve exact numeric-looking
strings such as `001` and `9007199254740993`. The application does not evaluate
any input or formula.

## Limits and privacy

Each input is limited to 256 KiB UTF-8, 5,000 data records, 32 columns,
and 20,000 data cells. Each heading is limited to 128 UTF-8 bytes. The
raw header scan is bounded to 8,192 UTF-16 units. The CSV output limit is
16 MiB. Over-limit input produces an error, with no partial result.
The visible preview shows up to 20 changed rows, 12 changed cells per row,
and 160 UTF-16 units per displayed cell or key value. Truncated fields
end in an ellipsis. The download retains the full diff.

At or below 4,096 combined UTF-16 units, edits and key selection update the
result immediately. Larger input uses the existing 800 ms automatic delay
or manual apply and runs in a same-origin Worker that can be canceled, with a
five-second watchdog. Edits invalidate results and pending work. Each table
and report lives in browser memory and is cleared on navigation or reload.
Only an explicit download saves a report. The tool adds no dependency or
network service and uses the site's existing font assets.
