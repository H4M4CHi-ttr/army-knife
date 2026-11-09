# Forwarded proxy record inspector

## Intent and approach
One default-on network tool, `forwarded`, to read recorded RFC 7239 parameter
grouping without contacting addresses or authenticating a client/proxy chain.
Use a bounded TypeScript state machine. Vary key comparison would require
field-specific normalization; full trust validation needs deployment context.
This structure-only choice is the implementer's judgment under the autonomous
scheduled-development request.

## Exact supported model
Raw UTF-8 input <=8192 bytes. ASCII HTAB/SP/VCHAR only, field values without
header names, line folding or X-Forwarded-* syntax. HTTP token names and token
or quoted-string values. Quoted-pairs decode once; delimiters inside quotes
remain data. Whitespace is allowed around list separators, not around "=".
Names are case-insensitively unique per element; original names/values/order
remain in arrays. Empty quoted values and unknown extensions are preserved.
Empty comma elements (including semicolon-only elements) and semicolon
positions are counted explicitly. At least one parameter is required.

Limits: 32 nonempty elements, 64 comma positions, 16 unique parameters and
32 semicolon positions per element, including empty positions. No partial
report on error. Stable codes never echo input. Report:
`{ elements: [{ index, parameters: [{ name, value }], emptyParameterSlots }], emptyElements }`.
Index is the original one-based comma position. Known field meanings are
labels only. Node/address/host/scheme validity, IANA registration, physical
hop count, completeness, integrity, client IP, routing and TLS are not inferred.

## UI and privacy
Reuse real Vapor, shadcn-vue Button, CodeInput, ApplyControl, OutputActions,
useToolExecution and existing Noto/Sarasa fonts. Five locales, light/dark,
keyboard and responsive layout. <=2048 UTF-16 units instant; larger input
uses existing 800ms/manual/pending-cancel controls. Synchronous bounded parsing
cannot be interrupted mid-call. Input/report/rejected edits stay in memory,
cleared by navigation, locale change and reload. Existing preferences alone
persist. Explicit full JSON copy/download; values are inert text, never HTML,
links, requests, logs, URL state or storage.

## Verification
Parser boundaries/quotes/duplicates, real Vapor lifecycle/export/i18n and
Chromium/Firefox desktop/390px production E2E in all four projects with
five languages/themes, keyboard, exact-asset privacy audits and synthetic
screenshots. No package/font/telemetry/WebMCP/Pages setting additions.
Selected executor failed startup before checkout; authoritative validation
must use the existing full PR CI (Rust/WASM/type/lint/unit/Vapor/font/license/
build/all browsers). Never call a non-run check successful. Public functional
verification at the existing Pages destination remains required.
