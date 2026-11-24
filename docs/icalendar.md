# iCalendar inspector

Open a local UTF-8 `.ics` file, paste its text, or load the synthetic example. Use the
expandable VEVENT records to inspect the UID, summary, start/end, timestamp,
duration and sequence. The recurrence section preserves RRULE, RDATE, EXDATE and
legacy EXRULE definitions in source order. An override shows its recorded
RECURRENCE-ID and any RANGE separately from its rescheduled DTSTART. Use the
result actions to copy or save the JSON report.

The inspector accepts the selected content-line structures of
[RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), including line folding,
quoted parameters and the TEXT escapes for backslash, comma, semicolon and
newline. It accepts CRLF, LF and CR line endings and an optional initial BOM.
Files must decode as UTF-8 before unfolding. Legacy folds within a UTF-8
code point therefore cannot be recovered. Diagnostic line numbers are one-based
physical source lines. A closed VEVENT is retained if its enclosing VCALENDAR
is truncated. An unclosed VEVENT is reported and omitted.

| Date kind | Meaning in the source |
| --- | --- |
| DATE | An all-day value with `VALUE=DATE`; a recorded DTEND is exclusive. |
| UTC | A date-time with the `Z` suffix and no TZID. |
| TZID | A local date-time with a recorded time zone identifier. |
| Floating | A local date-time without a timezone suffix or identifier. |

The report preserves values as strings without applying offsets, calculating
durations or resolving recurrence. VTIMEZONE inventory reports declared TZIDs
and diagnoses missing references in the same calendar. It does not verify
observances or rules, or look up IANA zones. RDATE periods and RRULE parts remain
uninterpreted text. It does not resolve masters from a UID, apply overrides or
compare the RECURRENCE-ID type against a master event. Diagnostics report
selected syntax, field and structure problems. They do not validate all
RFC 5545 requirements. Alarm, attendee, attachment and other unsupported
properties or components are not included in the report.

Input is capped at 256 KiB (raw file bytes or UTF-8 of editable text after
browser newline normalization), 8,192 physical lines, 8,192 UTF-16 units per
unfolded line, 512 components and eight nesting levels. Reports larger than 1 MiB
are rejected. The preview includes up to 20 calendars, 20 event records and 20
time zones across those calendars, 20 recurrence properties per visible event
and 20 diagnostics. JSON includes every inspected record and up to 128
diagnostics with the total count. Malformed input can produce a partial report
with diagnostics. Exceeding a structural limit aborts analysis without a report.

Up to 4,096 UTF-16 units are inspected immediately. Larger inputs use the
existing 800 ms delay or manual apply, with a cancelable worker and five-second
timeout. Inputs and reports are memory-only. The tool does not access calendar
services, request external references, import into a calendar or send invitations.
The tool and worker use the repository MIT license and add no dependencies.
