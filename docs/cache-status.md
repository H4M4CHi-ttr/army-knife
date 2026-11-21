# Cache-Status inspector

Paste a recorded Cache-Status field value or several complete `Cache-Status:`
lines. The result lists reported caches in wire order, from closest to the origin
to closest to the client. Each row shows the reported hit or forwarding reason,
remaining freshness in seconds and, when supplied, the next-hop HTTP status.
A negative TTL indicates staleness. A cache may still serve a stale hit. If
`fwd-status` is omitted, RFC 9211 uses the response status. The inspector has no
response status input, so it shows “Not supplied” and exports `null`. A false
`hit` on its own leaves the outcome unspecified.

```http
Cache-Status: shield; hit; ttl=-12
Cache-Status: "Edge cache"; fwd=stale; fwd-status=304; ttl=60; stored
```

Expand **Reported parameters** to see every parameter in order with its value.
Unknown forwarding reasons and extensions stay opaque. JSON keeps integers and
decimal extensions as exact strings, decodes quoted strings, keeps byte
sequences as Base64 text, and distinguishes false, zero, empty strings and
omitted fields. An explicit copy or download includes all reported parameters,
including any cache key.

The bounded parser supports the [RFC 9211](https://www.rfc-editor.org/rfc/rfc9211.html)
cache identifiers and [RFC 8941](https://www.rfc-editor.org/rfc/rfc8941.html) bare
parameter items. Strict diagnostics reject repeated keys on one cache,
simultaneous `hit` and `fwd`, forwarding-only parameters without `fwd`,
wrong types and next-hop status values outside 100–599. The input accepts up to
8,192 UTF-8 bytes, 32 physical lines, 64 cache entries and 16 parameters per
cache. It accepts LF or CRLF and one optional final line ending. Complete
field lines are checked independently. Folded lines, mixed headers and empty
list members are rejected. Any invalid input discards the whole report.

Inputs of at most 2,048 characters apply immediately. Longer inputs wait
800 ms and can be cancelled or manually applied. Input, results and diagnostics
stay in memory. Clearing, navigating away or reloading clears the input. The
inspector reads already recorded response metadata and does not contact
caches or verify the truth of their reported values.
