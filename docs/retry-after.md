# HTTP Retry-After inspector

Paste one recorded Retry-After value (or `Retry-After:` line) and the UTC time
the response was received. The tool separates decimal delay-seconds from strict
sender-format IMF-fixdate, shows the normalized target and exact milliseconds,
and rounds positive fractional seconds upward for a whole-second comparison.
It does not contact a server or start a retry. The sample is synthetic.

`Retry-After: 120` received at `2026-11-03T00:00:00.250Z` has target
`2026-11-03T00:02:00.250Z`. The sample date `Tue, 03 Nov 2026 00:02:00 GMT`
instead leaves **119750 ms**, or **120 whole seconds**, from that same receipt.

## Exact model and supported input

- Delay-seconds are unsigned decimal integers, zero included, at most 40 digits.
  Leading zeroes normalize; sign, fraction, exponent and hex forms are rejected.
  BigInt preserves precision; JSON durations are strings. A target beyond years
  0001–9999 is explicitly unavailable while the exact duration remains available.
- Date input uses strict, case-sensitive IMF-fixdate: English weekday/month,
  fixed spaces and `GMT`. Calendar date and weekday must agree. Obsolete RFC 850
  and asctime forms, leap seconds and year zero are unsupported. The error makes
  clear that unsupported old dates are not necessarily invalid HTTP.
- This deliberately inspects sender format, **not** every valid HTTP recipient
  input: RFC 9110 requires real recipients to accept obsolete HTTP dates too.
- Receipt is required in UTC `YYYY-MM-DDTHH:mm:ss[.SSS]Z`, optionally 1–3
  fractional digits, year 0001–9999. No local time, offsets, implicit current
  clock or server `Date` substitution. Missing or invalid receipt yields no report.
- Remaining time is `max(0, target − receipt)`. A past target is marked past
  and retained as the original target. Equal time is zero without the past flag.
  Whole seconds are the ceiling of positive remaining milliseconds divided by
  1000. This is a fixed comparison, not a live countdown.
- It does not model clock skew, transit delays, status-dependent handling,
  backoff, jitter, client limits, safety/idempotency or permission to retry.

## Limits and privacy

Field max **8 KiB UTF-8**; receipt max **64 bytes**; delay max **40 digits**.
Outer ASCII SP/HTAB is allowed around the field value and optional field prefix.
Controls, Unicode whitespace, repeated/folded fields and comma lists are rejected
as a whole. The date's own comma is parsed as part of IMF-fixdate.

At most 2,048 combined UTF-16 code units updates immediately; longer input uses
the shared 800ms/manual execution controls with visible waiting and cancellation.
The bounded parser itself is synchronous. Rejected edits invalidate old reports
and exports. Sample and clear reset pending/rejected input. Five languages,
themes, keyboard controls and narrow layouts reuse existing Vapor/shadcn assets.

Inputs and results stay in memory and clear on navigation, language change and
reload. JSON copy/download is explicit. No input enters URL, storage, logs or
network requests. No dependencies, fonts, telemetry, WebMCP or publishing settings
are added. DevToys's [official bundled list](https://devtoys.app/) was checked on
2026-11-03 JST; no dedicated Retry-After workflow was found, so this tool defaults
on. This comparison excludes community extensions.

## Verification

`src/lib/tools/retry-after.test.ts` pins literal precision, fractional receipt,
calendar/weekday, past/equal, target overflow and limit vectors.
`src/components/tools/RetryAfterTool.test.ts` mounts the real Vapor view and pins
immediate results, explicit copying, rejected-edit invalidation and execution
lifecycle. `tests/e2e/retry-after.spec.ts` runs in the four configured Chromium /
Firefox desktop/small projects: all five locales, themes, keyboard, width,
exact JSON download, malformed/unsupported/bounded input, delayed/manual/cancel,
language/reload clearing and exact-dist-asset privacy. Screenshots use synthetic
dates and delays only. Existing aggregate Rust/WASM, unit, Vapor, type, lint,
production, license/static-page and browser gates remain required.

Sources: [RFC 9110 Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3),
[HTTP date formats](https://www.rfc-editor.org/rfc/rfc9110.html#section-5.6.7).
