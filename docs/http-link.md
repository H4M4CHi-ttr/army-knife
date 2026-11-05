# HTTP Link header inspector

Inspect recorded pagination and resource relationships without contacting an API.
Paste one **field value**, without `Link:` or physical newlines. Join repeated
Link field values using commas. Use the sample button for synthetic data:

```text
<https://api.example.invalid/items?page=2>; rel="next"; title="Next, page", <?page=9>; rel=last
```

The two targets are displayed exactly as recorded. The comma in the quoted title
does not create another link. Commas/semicolons inside angle-bracket targets also
stay inside their reference. Target text is never rendered as a clickable link.

## Scope

This is a bounded **structure inspector**, based on the field syntax in
[RFC 8288 §3](https://www.rfc-editor.org/rfc/rfc8288.html#section-3). It is not a
complete RFC 8288 consumer or URI validator. It preserves unresolved targets,
parameter order, parameter-name case and exact percent escapes. Quoted strings
are unquoted once, including quoted-pairs. Exported `null` means a valueless
parameter; `""` means an explicitly empty quoted value. UI values use JSON string
notation to make that distinction visible.

The first case-insensitive `rel` provides the space-separated relations. Later
rel values remain in the parameter table and JSON, and are flagged as duplicate
names, but do not change the displayed relations. A missing rel receives an
explicit notice. Repeated `hreflang` is retained too; repeated parameter names
are observations, not a blanket invalidity verdict.

Registered relation names accept case-insensitive ASCII letter/digit/dot/hyphen
syntax. Extension relations require an absolute-URI lexical prefix and URI
characters, without a fragment. No IANA registry lookup or equivalence matching
is performed. The first rel cannot be empty, valueless or contain tabs/outer spaces.

URI references use the RFC 3986 ASCII character repertoire and well-formed `%HH`
triplets. Complete URI grammar and URL validity are **not** checked. In particular,
there is no base URI, relative resolution, anchor application, URL normalization,
scheme safety verdict, resource existence check or network access. Even
`javascript:` text is inert text, never a navigation action. `anchor`, `title*`,
media types and other attributes remain opaque: no charset decoding, effective
title selection or attribute-specific validation. Quoted text supports HTTP
HTAB, printable ASCII and Latin-1 obs-text; raw Unicode beyond Latin-1 is rejected.
For international titles, inspect the recorded encoded `title*` value instead.

## Bounds and lifecycle

- Raw input, before trimming/unquoting: **8 KiB UTF-8**.
- At most **32 nonempty links**, **64 comma slots** including empty slots, and
  **32 parameters per link**. A blank field value is one empty slot in the parser;
  an untouched UI shows no report.
- No truncation or partial report. Malformed structure or an exceeded bound
  invalidates the whole report. Error codes never interpolate input.
- Through **2,048 UTF-16 units**, edits apply synchronously. Larger inputs use
  the shared **800ms delayed/manual application** and pending cancellation.
  The bounded parser itself is synchronous; cancellation stops waiting work.
- Rejected edits clear existing reports and exports. Input/result data stay in
  memory; tool/language navigation and reload discard them. Only preferences use
  the existing preference store. JSON copy/download requires an explicit action.

No new dependencies, analytics, external fonts, URL parameters, storage keys,
runtime fetches, Worker/WASM code or Pages settings are introduced. Five locales,
Vapor, theme behavior and shared keyboard/input/export controls are preserved.

## Verification

`http-link.test.ts` covers exact unresolved pagination data, delimiter/escape
handling, duplicate/missing relations, opaque extension attributes, null versus
empty values, inert hostile text, malformed input and raw/structural boundaries.
`HttpLinkTool.test.ts` mounts the real Vapor view for immediate/deferred/manual
execution, cancellation, rejected edits, explicit copying, translations and
disposal. `tests/e2e/http-link.spec.ts` exercises all five locales, both themes,
keyboard/narrow layouts, real exact JSON downloads, memory lifecycle and
exact-dist-asset network/privacy auditing in all four configured browser projects.
The standard CI also runs all existing Rust/WASM, app, distribution, license and
browser checks. This does not test a live API or claim URI/RFC consumer conformance.
