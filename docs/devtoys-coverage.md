# DevToys overlap policy

Reviewed against the [official DevToys tool list](https://devtoys.app/) on **2026-10-11**, and the [default-tools repository](https://github.com/DevToys-app/DevToys.Tools). DevToys extensions are open-ended, so this is a comparison with the official bundled tools, with known older bundled tools treated conservatively. It is not a claim that no third-party DevToys extension offers a similar feature.

| Army Knife tool                       | Default | Reason                                                                                                                                                                                                  |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CIDR calculator, IPv4 and IPv6        | On      | No corresponding bundled tool in the official list.                                                                                                                                                     |
| Unicode invisible-character inspector | On      | Focuses on code-point locations, bidi controls, joiners, variation selectors, and invisible formatting characters. This is distinct from the bundled text analyzer's general text utilities.            |
| JSON structural diff                  | On      | Compares the parsed JSON tree and reports JSON Pointer paths; ignores object-key order while preserving array order. It is distinct from the bundled text comparer and JSON formatter.                  |
| List operations                       | Off     | Union, intersection, and differences overlap with the bundled List Comparer.                                                                                                                            |
| JSON formatter                        | Off     | JSON formatting is a bundled DevToys feature.                                                                                                                                                           |
| WCAG contrast checker                 | Off     | Color Picker & Contrast shipped in DevToys 1.x. Even though it is absent from the current 2.0 list, treat it as overlap. See the [upstream report](https://github.com/DevToys-app/DevToys/issues/1483). |

Cron parsing and JSONPath testing are explicitly present in the official bundled list; neither is implemented in the initial release. If added later, they must be **off by default**. The same applies to Base64, JSON/YAML conversion, date conversion, URL/HTML encoding, hashes, UUIDs, and other listed bundled features.

Tool visibility preferences belong in browser settings. Tool input contents must not be persisted as part of those preferences. Newly introduced overlapping tools must stay off for existing users unless they explicitly enable them.

## Calculation semantics and limits

### CIDR

- CIDR input must include a prefix length. IPv4 accepts exactly four decimal octets, without ambiguous leading zeroes. IPv6 accepts compressed forms and a final embedded IPv4 address; bracketed URL literals and zone identifiers are intentionally not accepted.
- Canonical IPv6 output follows [RFC 5952](https://www.rfc-editor.org/rfc/rfc5952): lowercase, the longest leftmost zero run, and no compression of a single zero group. IPv4-mapped addresses use mixed notation.
- Every address and count is calculated using `bigint`. Counts are returned as decimal strings, including the exact `2^128` size of `::/0`.
- IPv4 `/31` uses the two-address point-to-point interpretation of [RFC 3021](https://www.rfc-editor.org/rfc/rfc3021). `/32` describes a single address. Neither has a directed broadcast entry.
- IPv6 has no broadcast entry and no invented generic usable-host count. The inclusive first and last addresses and total address count describe the mathematical range. IPv4 host counts are the conventional subnet calculation, not a guarantee that every address is globally routable or assignable.

### JSON

- Each input is limited to **512 KiB of UTF-8**, nesting depth **64**, and **50,000 parsed value nodes**. Comparison has a **100,000-node** traversal limit and returns at most **2,000 changes**. Truncated results are explicitly marked, and their summaries count only the returned changes.
- The parser rejects duplicate object keys instead of silently keeping the last value. It constructs objects with a null prototype, and comparisons use own-property checks, so keys such as `__proto__` and `constructor` are data.
- The parser rejects integers outside JavaScript's safe-integer range, overflow, underflow, and decimals whose significant digits would change in the shortest decimal round trip. For example, `9007199254740992`, `9007199254740991.1`, and `0.10000000000000001` are rejected. Ordinary decimals such as `0.1` are accepted. This protects comparisons and formatting from silently hiding numeric differences; it is not arbitrary-precision arithmetic.
- Numeric spellings such as `1`, `1.0`, and `1e0` compare as equal. Negative zero and zero compare as equal. Formatting normalizes numeric spellings.
- Paths use [RFC 6901 JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) escaping. Empty string means the document root; `/` refers to an object property whose name is empty. Array order is significant. Diff records are a change report, not an RFC 6902 patch-document API.

### Unicode

- Input is limited to **512 KiB of UTF-8**. At most **1,000 finding rows** and **20,000 preview characters** are rendered, while the total finding count covers the complete accepted input.
- Locations include a zero-based UTF-16 offset, a one-based code-point position, and one-based line and code-point column. CRLF is counted as one line break.
- Unicode joiners, variation selectors, unusual spaces, and directional controls can be legitimate language or emoji content. Detection is informational; the tool does not classify text as malicious and does not silently remove characters.
- Unicode property classifications and normalization use the browser's Unicode implementation. UTF-8 byte counts use `TextEncoder`; unpaired UTF-16 surrogates are shown explicitly and encode as replacement characters.

### Contrast

- Uses the [WCAG 2 relative luminance and contrast calculation](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) for **opaque sRGB** `#RGB` or `#RRGGBB` colors. Alpha colors are rejected instead of silently discarding transparency.
- Pass/fail thresholds use the unrounded ratio. Displaying `4.5` after rounding does not turn a value below `4.5` into a passing result.
- Normal-text AA uses `4.5:1`, large-text AA and non-text contrast use `3:1`, normal-text AAA uses `7:1`, and large-text AAA uses `4.5:1`. The two-color calculation does not by itself establish the accessibility of an entire interface.

## Vite+ references

The project uses VoidZero's **Vite+**, not only Vite. Its [local CLI documentation](https://viteplus.dev/guide/local-cli) supports project-pinned `vite-plus` installations; [test APIs](https://viteplus.dev/guide/test) are imported from `vite-plus/test` and configured in `vite.config.ts`. [Package management](https://viteplus.dev/guide/install) supports `vp install --frozen-lockfile`. The [CI guide](https://viteplus.dev/guide/ci) recommends the official `voidzero-dev/setup-vp` action with an exact release or commit SHA; the moving `v1` tag is no longer updated.
