# Retry-After inspector design

## Intent and approaches

Inspect a recorded Retry-After field against an explicit response-receipt time,
without contacting a server. This complements Cache-Control and ETag inspection.
The [official DevToys bundled list](https://devtoys.app/) was checked on
2026-11-03 JST; it has no dedicated Retry-After workflow. Community extensions
are outside this comparison, so this tool defaults on.

Other candidates were Link-header relationship inspection and Accept negotiation.
Retry-After offers a smaller, independently useful API troubleshooting workflow.
A bounded TypeScript parser with BigInt arithmetic is chosen over Date.parse's
permissive parsing or a new dependency. These are implementer decisions under
the autonomous daily development request, not separate user design approvals.

## Contract

- One field value, optionally prefixed with case-insensitive `Retry-After:`.
  Outer SP/HTAB is allowed. Empty, repeated/folded fields, controls, lists,
  negative/fractional/exponent delays and non-ASCII whitespace are rejected.
- Non-negative decimal delay-seconds, at most 40 digits, normalized exactly.
- Strict sender-format IMF-fixdate with case-sensitive English weekday/month
  names and GMT. Verify calendar and weekday. Years 0001–9999; obsolete HTTP-date
  formats and leap seconds are explicitly unsupported, not classified as
  universally invalid HTTP. This is not a full HTTP recipient implementation.
- Required reference: explicit UTC `YYYY-MM-DDTHH:mm:ss[.SSS]Z`, 1–3 fractional
  digits optional, same year/calendar bounds; no implicit current clock, local
  time or timezone inference. It represents response receipt, not server Date.
- Exact remaining milliseconds and minimum whole seconds (positive fractions
  rounded up). Past dates clamp the remaining duration to zero and are marked
  past. The parsed target remains visible. No retry is scheduled or authorized.
- Delta addition uses BigInt. A target outside years 0001–9999 is unavailable,
  while exact duration remains available; never overflow or round large delays.
- Field max 8 KiB UTF-8; reference max 64 bytes. More than 2,048 combined
  characters uses the shared 800ms/manual/cancel waiting controls. Parsing within
  these bounds is synchronous; Rust/WASM/Worker is unnecessary for this task.
- Any change or rejected edit invalidates old output. Sample/clear resets child
  inputs and cancellation. Inputs/results clear on route, locale and reload.
  JSON export is explicit and all integer durations are decimal strings.
- Reuse five languages, Vapor, shadcn-vue controls, themes, self-hosted fonts and
  licensed assets. No dependencies, runtime external requests, input persistence,
  telemetry additions, WebMCP, publishing changes or unrelated PR changes.

## Verification and release

Literal unit vectors pin precision, strict date/weekday/calendar parsing,
fractional references, past/equal dates, target overflow and all limits. Real
Vapor/App tests pin activation, invalidation and delayed/manual/cancel behavior.
Four configured browser projects cover five locales, themes, keyboard, narrow
layout, explicit JSON, reload/navigation clearing and exact-dist-asset privacy.
Synthetic screenshots support review. Run all repository quality gates on the
final PR head, obtain independent review, merge normally after fresh checks,
then verify the existing Pages deployment and live feature.

Sources: [Retry-After](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3),
[HTTP date formats](https://www.rfc-editor.org/rfc/rfc9110.html#section-5.6.7).
