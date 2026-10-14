# CORS response condition checker

Implements the bounded, offline workflow proposed in #56. The checker assumes a
cross-origin Fetch request. It never sends a request or a preflight, opens the
supplied origin, or reads browser cookies.

## Inputs and interpretation

- Request Origin: an exact serialized HTTP(S) origin (no path, slash, credentials,
  query or fragment), or `null`. The tool does not silently repair origin values.
- Request method: an HTTP token; Fetch's six normalized methods are uppercased.
  CONNECT, TRACE and TRACK are rejected.
- Credentials: whether the eventual request uses `credentials: include`.
- Explicit **CORS-unsafe request-header names**: comma-separated names, not values.
  Users determine these from the real request. This tool does not infer safelisting
  from Content-Type or other header values. Browser-controlled names are rejected.
- Separate actual-response and OPTIONS/preflight-response header blocks.
- An explicit force-preflight option and the preflight HTTP status (200–299 passes).

The check reports whether the supplied conditions **may allow** access. It is not
an actual browser test, a server security audit, or a guarantee. TLS, DNS, CSP,
redirects, mixed content, service workers, the preflight cache, browser extensions,
private-network access and browser cookie policies are outside scope. A CORS
failure does not necessarily prevent a request or its side effects.

## Rules

Uses the WHATWG Fetch [CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol),
[CORS-preflight fetch](https://fetch.spec.whatwg.org/#cors-preflight-fetch), and
[CORS check](https://fetch.spec.whatwg.org/#cors-check).

- Each response must have one matching Access-Control-Allow-Origin, or `*` only
  when credentials are not included. Origin matching is case-sensitive.
- With credentials included, Access-Control-Allow-Credentials must be exactly
  lowercase `true` on both responses. A wildcard allow-origin cannot pass.
- Non-safelisted methods, supplied unsafe header names or force-preflight require
  a separate preflight. The OPTIONS response must have a 2xx status.
- Allow-Methods is case-sensitive; Allow-Headers is case-insensitive. A wildcard
  is effective only without credentials. Authorization always needs an explicit
  Allow-Headers entry. GET/HEAD/POST need no Allow-Methods entry even when another
  condition requires preflight.
- Duplicate singleton headers fail rather than silently selecting a value.
  Repeated list headers are combined. Malformed header lines/lists are rejected.
- Vary: Origin is an advisory cache check when reflecting a specific origin;
  its absence does not itself cause CORS failure. A `null` origin also gets an
  explicit warning. Expose-Headers and Max-Age are outside the decision scope.

## Limits and execution

Each response block is at most 16 KiB UTF-8 and 100 physical lines. Origin is at
most 2 KiB, method 32 ASCII characters, unsafe header names 2 KiB / 32 entries,
and allow lists 128 tokens. Limits are rejected, never silently truncated. Numeric
input is only a three-digit HTTP status, validated as an integer from 100–599.

The bounded parser is pure TypeScript without added packages. Short inputs apply
immediately. A combined response length above 2,048 UTF-16 units uses the shared
800ms delay, manual apply and cancellation controls. Edits discard stale results.
Input and reports remain in memory; export occurs only through an explicit action.
The existing fonts, five locales, themes and Vapor/shadcn-vue conventions apply.

## Validation plan

Unit vectors cover exact/wildcard/null origins, credentials, duplicate and invalid
headers, case rules, Authorization, OPTIONS status, missing preflight, bounds and
Fetch method normalization. Production E2E covers all five locales, both themes,
keyboard input, mobile widths, delay/manual/cancel, privacy and explicit export in
Chromium and Firefox. The unchanged Rust/WASM and font pipelines still run in CI.
