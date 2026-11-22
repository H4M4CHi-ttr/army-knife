# HTTP Cache Age calculator

Paste the recorded response's `Date:` line and, if present, its `Age:` line.
Enter the recorded request send time, response receipt time and evaluation time
from the same clock, in UTC. Use the timestamps corresponding to the same
recorded response. Results update immediately once all inputs are supplied.

```http
Date: Mon, 23 Nov 2026 00:00:00 GMT
Age: 15
```

| Recorded time | UTC value |
| --- | --- |
| Request | `2026-11-23T00:00:11.250Z` |
| Response | `2026-11-23T00:00:12.500Z` |
| Evaluation | `2026-11-23T00:00:20.875Z` |

| Stage | Calculation | Sample |
| --- | --- | --- |
| Apparent age | Positive part of receipt minus Date | 12.500 s |
| Response delay | Receipt minus request | 1.250 s |
| Corrected Age | Age header seconds plus response delay | 16.250 s |
| Corrected initial age | Larger of apparent age and corrected Age | 16.250 s |
| Resident time | Evaluation minus receipt | 8.375 s |
| Age at evaluation | Corrected initial age plus resident time | 24.625 s |

The tool always uses the conservative maximum from
[RFC 9111 §4.2.3](https://www.rfc-editor.org/rfc/rfc9111.html#section-4.2.3)
and shows which value determined the estimate. If Age is absent, it uses zero
for the header. Date later than receipt is flagged as possible clock skew and
apparent age is clamped to zero. Other clock differences can still affect the
estimate. The tool uses the explicitly supplied evaluation time.

## Input and scope

- Up to 512 UTF-8 bytes of Date/Age lines. The text editor uses line breaks
  normalized by the browser, and the parser accepts LF or CRLF with an optional
  final line ending. Header names are case-insensitive. Other headers, status
  lines, folded lines, duplicate fields and comma-joined Age values are rejected.
- Date is required for the conservative calculation. It accepts canonical
  IMF-fixdate in GMT (years 1900–9999) with a matching weekday. Legacy date forms
  and leap seconds are outside this calculator's supported input.
- [RFC 9111 §5.1](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.1)
  describes how a cache can handle lists and invalid values. This calculator
  requires one unambiguous non-negative decimal integer of 1–40 digits when Age
  is supplied. Large values use exact BigInt milliseconds, including beyond
  JavaScript's safe-integer range. Output seconds retain three decimal places.
- Use `YYYY-MM-DDTHH:mm:ss[.sss]Z` for each observation (years 0001–9999, at
  most three fractional digits, up to 24 bytes). Equal times are allowed.
  Require request ≤ response ≤ evaluation. Incomplete, invalid or rejected
  input clears the estimate.
- Input and result live in browser memory. Clear, leave the tool, switch
  languages or reload to discard them. Calculation uses already recorded data
  with no requests or automatic export. Light/dark and all five locales are
  available.
- The estimate covers elapsed age. Cache-Status shows reported hits and TTL;
  Cache-Control explains directives. Freshness lifetime, Vary, storage and reuse,
  safety, revalidation and live cache behavior are outside this calculation.
  This addition addresses the Age calculation within [#53](https://github.com/H4M4CHi-ttr/army-knife/issues/53).
