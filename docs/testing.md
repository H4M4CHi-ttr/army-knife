# Testing and deployment

## PostgreSQL text-array coverage (2026-11-14 JST)

`src/lib/tools/pg-text-array.test.ts` covers quoted/escaped/case-insensitive NULL,
empty and numeric-looking strings, ASCII vs Unicode whitespace, all non-NUL
ASCII round trips, Unicode/BOM/surrogate handling, malformed and unsupported
dimensions/SQL/JSON forms, exact raw UTF-8/item/output bounds and atomic errors.
The real Vapor suite exercises both modes, explicit complete copy, the labelled
32-item preview, file/paste rejection, immediate work with auto off, deterministic
800ms/manual/cancel/mode/disposal behavior and all five locales.
`tests/e2e/pg-text-array.spec.ts` runs 40 production cases across Chromium/Firefox
desktop/390px projects: five locales, both themes, keyboard, independent copy and
actual downloads, valid/invalid file imports, BOM, stale-output invalidation,
deferred controls, clearing and exact-dist-asset network/privacy auditing.
Real-browser CR/CRLF/escaped-CR cases reproduce textarea normalization and verify
raw paste/import, protected read-only preview, keyboard edits, original-byte
download and explicit replacement. The opt-in CodeInput behavior is used only
by this tool's PostgreSQL input; existing tools keep their previous behavior.
`tests/public/pg-text-array.spec.ts` adds 20 actual Pages checks after deployment.
Synthetic screenshots contain no real database values. See [scope](pg-text-array.md).

## Recorded Content-Range coverage (2026-11-13 JST)

The [bounded byte-field inspector](content-range.md) checks inclusive endpoints,
known/unknown/unsatisfied-zero states, adjacent large integers, 40 input digits
and 41 derived digits, canonical form, raw UTF-8/ASCII limits and atomic errors.
Real Vapor covers null/zero/false, immediate auto-off behavior, rejected paste,
explicit local file/BOM/UTF-8 rejection, exact JSON, five locales and disposal.
Four-project production E2E checks five languages/themes, keyboard/mobile,
actual downloads, input lifecycle and exact-dist-asset privacy. Public checks
extend the existing Pages suite. No status, body or real transfer is validated.

## DNS TXT coverage (2026-11-12 JST)

The [bounded TXT codec](dns-txt.md) checks 255/256-octet boundaries, UTF-8
scalars crossing fragments, exact decimal/quoted escapes, empty values, BOM,
strict decoding and every raw/data/count cap. Real Vapor checks both modes,
intentional empty exports, rejected edits, five locales, inert text and
instant/800ms/manual/cancel/disposal. Four-project production E2E covers
five locales, themes, keyboard/mobile, exact downloads, state clearing and
exact-dist-asset privacy. Public tests extend the existing Pages suite.
These verify text conversion, not DNS publication or mail authentication.
Reader/actual-worker tests cover opt-in file BOM preservation with unchanged
defaults. Real Vapor and browser drops cover BOM-only/prefixed files and
multibyte byte-limit rejection retaining invalid state after async fallback.

## PostgreSQL WAL LSN coverage (2026-11-11 JST)

`src/lib/tools/pg-lsn.test.ts` checks exact 64-bit arithmetic, adjacent values
above Number.MAX_SAFE_INTEGER, high-half rollover, signed/equal/zero cases,
all supported segment sizes, raw UTF-8 bounds and input-free syntax errors.
`PgLsnTool.test.ts` mounts real Vapor and checks dual-input/segment updates,
immediate operation with auto-apply off, either rejected paste, stale exports,
explicit JSON, all five locales and remount clearing.
`tests/e2e/pg-lsn.spec.ts` runs Chromium/Firefox desktop/small with five locales,
themes, keyboard, responsive screenshots, exact downloads, bounds/lifecycle
and exact-dist-asset network/privacy auditing. `tests/public/pg-lsn.spec.ts`
exercises the same existing Pages destination after deployment. These checks
verify offline arithmetic, not a live database or replication condition.

## Forwarded coverage (2026-11-10 JST)

The [recorded structure inspector](forwarded.md) covers exact grouping,
quoted delimiters/pairs, original order, empty positions, opaque/prototype-like
names, duplicates, strict ASCII and raw byte/count boundaries. Actual Vapor
tests check five locales, inert output, explicit JSON, rejected edits and
instant/800ms/manual/cancel/disposal behavior. Four-project production E2E
checks all five languages/themes, keyboard/mobile, exact download, memory-only
lifecycle and exact-dist-asset privacy. Synthetic screenshots are attached.
No node/host/scheme semantic validation or trusted client inference is made.

After the existing Pages deployment succeeds, the contents-read-only
`verify-public` job runs `pnpm exec playwright test --config playwright.public.config.ts`.
It checks actual published operation in all four Chromium/Firefox projects,
five locales and both themes, attaches screenshots, and verifies private-marker
absence from requests/storage/URL. The site's pre-existing Analytics remains;
the stricter same-origin asset audit applies to the local production tests.


## HTTP Accept coverage (2026-11-09 JST)

The [bounded negotiation preview](http-accept.md) checks exact q grammar and all
1,001 thousandths, specificity before q, explicit exclusion, absent/empty fields,
quoted delimiters, literal parameter matching, ambiguity and raw/count limits.
Real Vapor tests check both inputs, independent rejected edits, inert rendering,
exact explicit JSON copy, five locales and combined-input delayed/manual/cancel
execution and disposal. Dedicated Chromium/Firefox desktop/390px E2E covers
five locales, both themes, keyboard, JSON download, memory-only clearing and
exact-dist-asset request/privacy audits, with synthetic screenshots. This is
a local model; no live server behavior or HTTP 406 response is verified.

## JSON Merge Patch coverage (2026-11-08 JST)

The [RFC 7396 local preview](json-merge-patch.md) covers recursive object merging,
null member deletion, unchanged keys, non-object/array replacement and root null.
Pure cases cover dangerous property names, duplicate decoded keys, precision
rejection and raw byte/depth/node/formatted-output limits. Real Vapor cases
check both inputs' invalidation and independent rejected-edit state, falsy root
outputs, inert rendering, explicit merged-document copy, five locales and the
combined-input 800ms/manual/cancel/disposal lifecycle. Dedicated production E2E
runs in all four Chromium/Firefox desktop/390px projects with five locales,
both themes, keyboard, actual JSON download, memory-only clearing and an
exact-distribution request/privacy audit. Synthetic screenshots are attached.
These checks do not issue HTTP PATCH requests or simulate a particular server.

## HSTS coverage (2026-11-07 JST)

The [recorded HSTS inspector](hsts.md) uses a bounded ASCII field-value model.
Pure tests cover RFC examples, quoted digits/delimiters, all-name duplicate
rejection, opaque extensions, exact BigInt duration, zero and raw byte/digit/
directive/slot boundaries. Real Vapor tests cover all-or-nothing invalidation,
inert values, explicit exact JSON copy, rejected paste, five locales and
800ms/manual/cancel/disposal. `tests/e2e/hsts.spec.ts` checks the production
route in all four Chromium/Firefox desktop/390px projects: five languages,
both themes, keyboard, exact JSON download, memory-only lifecycle and the
exact-dist-asset request/privacy audit. Synthetic screenshots are attached.
These tests do not install a browser policy or query a host/preload service.

## HTTP Link coverage (2026-11-06 JST)

The [bounded Link structure inspector](http-link.md) preserves unresolved targets,
quoted separators, ordered/opaque attributes and first-rel precedence. Parser
tests exercise escapes, missing/repeated rel, null/empty values, malformed
structure and exact byte/link/slot/parameter limits. Real Vapor tests cover
inert rendering, invalidation, 800ms/manual/cancel flow, explicit copy, translations
and disposal. `tests/e2e/http-link.spec.ts` checks five locales, both themes,
keyboard/narrow layout, actual exact JSON downloads, rejected paste, manual-mode
persistence, navigation/reload/locale clearing and exact-dist privacy in all four
Chromium/Firefox desktop/small projects. There is no live API or URI validation.

## Trace Context coverage (2026-11-05 JST)

The [bounded Trace Context specification](trace-context.md) defines recorded
Level 1 version 00 values, exact hexadecimal IDs, bit-mask interpretation and
ordered opaque vendor entries. Pure tests cover all 256 flag bytes, nonzero
IDs, unsupported versions, key/value grammar, duplicate and empty members and
exact raw byte/count limits. Real Vapor tests cover dual-input invalidation,
rejected edits, inert text, explicit copy, translations and memory disposal.
`tests/e2e/trace-context.spec.ts` runs five locales and both themes in all four
Chromium/Firefox desktop/390px projects, verifies actual JSON downloads and
navigation/reload/locale clearing, and audits exact-dist-asset requests for
input leakage. These checks do not test a live tracing backend or propagation.

The repository's [GitHub Actions workflow](../.github/workflows/ci.yml) tests the production build on every pull request, push to `main`, and manual workflow run. A successful run on `main` deploys that same build to GitHub Pages. Pull requests and manual runs on other branches run the complete quality gate without deploying.

## Reproducible build inputs

| Component               | Version or lock                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Linux runner            | `ubuntu-24.04`                                                                                               |
| Vue / Vapor             | `3.6.0-rc.11`, including the test-only server renderer                                                       |
| Vite+                   | `1.1.0`                                                                                                      |
| Node.js                 | `24.19.0`                                                                                                    |
| pnpm                    | `11.25.0`, selected by `package.json`                                                                        |
| JavaScript dependencies | `pnpm-lock.yaml`, installed with `vp install --frozen-lockfile`                                              |
| Rust                    | `1.99.0`, with Clippy and `wasm32-unknown-unknown`                                                           |
| Rust dependencies       | Exact direct versions and `crates/army-knife-core/Cargo.lock`; Cargo commands use `--locked`                 |
| wasm-bindgen CLI        | `0.2.129`, installed with `cargo install --locked`; the build script also verifies that it matches the crate |
| Python                  | `3.12.12`                                                                                                    |
| Font build dependencies | Exact versions in `scripts/requirements-fonts.txt`                                                           |
| Upstream fonts          | Versioned download URLs and SHA-256 checksums in `scripts/font-sources.lock.json`                            |
| Browser binaries        | The versions selected by the locked Playwright package                                                       |

Actions use explicit release versions; the report uploader is additionally pinned to its full commit SHA. The `setup-vp` action is pinned to `v1.21.2`. Its `version` and `node-version` inputs select Vite+ and Node, and its package manager support reads the project's `packageManager` field. Installation is a separate, visible `vp install --frozen-lockfile` step. See the [Vite+ CI guide](https://viteplus.dev/guide/ci) and the [pinned action definition](https://github.com/voidzero-dev/setup-vp/blob/v1.21.2/action.yml).

The font source archives and generated output are cached together under a key that includes the source lock, build script, and pinned Python requirements. Every restored build still passes the font script's manifest, file checksum, naming, and license checks. Rust dependencies, crate outputs, and the exact wasm-bindgen executable have separate caches. Caches accelerate verified work; they do not replace tests or checksum checks.

## Quality gate

The quality job has a 40-minute timeout so the complete browser suite and report upload fit after the build gates. With 924 browser cases, the 2026-11-06 Link addition's first complete CI attempt reached the former 30-minute job cap after 910 passing cases and no assertion failures; the remaining cases and report upload were unverified. The per-test 45-second timeout, two CI workers, retries and four browser projects retain their existing settings. It performs these steps in order:

1. Install locked JavaScript dependencies and the pinned Python font dependencies.
2. Build fonts and run `python scripts/build-fonts.py --check` against the resulting assets.
3. Run native Rust tests and `cargo clippy --all-targets --locked -- -D warnings`.
4. Compile the Rust crate for `wasm32-unknown-unknown` and generate browser bindings with the matching wasm-bindgen CLI.
5. Load and execute the actual generated `.wasm` in Node through `pnpm test:wasm`. This verifies the CSV, log, set, and HAR operations, structured errors, limits, and large integer preservation across the JavaScript/WASM boundary.
6. Type-check the Vue application, run the Vite+ unit tests, and run `pnpm verify:vapor` for production Vapor compilation and VDOM interoperability.
7. Produce the production build for `/army-knife/` and verify its deployable asset graph with `pnpm verify:dist`.
8. Install Chromium and Firefox with their system dependencies and run all Playwright projects against the built site.
9. Upload the browser report and visual evidence, including on browser test failure. Only a fully successful `main` run uploads the Pages artifact.

The pure TypeScript tests cover IPv4 and IPv6 parsing and subnet boundaries, exact address counts, bounded JSON parsing and structural diffs, JSON Pointer escaping, decimal precision rejection, prototype-safe objects, Unicode positions and invisible character classification, WCAG contrast thresholds, preference storage validation and migration, dotenv diagnostics and comparison, ordered URL query editing, PostgreSQL EXPLAIN metrics, and automatic/manual execution scheduling. Boundary and failure cases are tested alongside successful examples.

The App integration tests use `@vue/test-utils` and happy-dom to mount the actual Vue application, settings dialog, and tool components. They execute the real JSON comparison and inspect its displayed changes, enforce disabled-tool routing, check that CSV and log inputs are discarded on navigation, and verify theme, language, opt-in, and preference-only persistence through the UI. Only the network-dependent font loader is replaced in this suite. WASM success is never simulated; the routing test verifies that switching tools before the 800ms automatic deadline cancels the pending engine start. Small JSON input updates synchronously; large input waits for the debounce or an explicit manual action. The compiled engine and real browser loading are verified separately by the WASM smoke test and Playwright.

## CORS checker coverage

`src/lib/tools/cors.test.ts` exercises origin serialization and exact matching,
credentials on both responses, wildcard exceptions including Authorization,
Fetch method normalization, forced preflight, response status, repeated singleton
and list fields, Vary advisories, malformed input, and byte/line/list limits.
`tests/e2e/cors.spec.ts` runs the production Vapor view in all four browser projects:
five locales, empty/error/result states, keyboard checkboxes, light/dark screenshots,
responsive widths, 800ms/manual/cancel behavior, stale output removal, explicit JSON
download and reload clearing. Its own exact-dist-asset audit also rejects external
requests, query strings, request bodies, WebSockets, private-marker leakage and
browser errors. These tests check the offline analyzer; they do not contact a
cross-origin server or claim a complete browser CORS conformance test.

## Browser coverage

The [Docker image reference inspector](image-reference.md) adds default/explicit
registry, repository/tag grammar, alias/case, exact port text, IPv6, digest
precedence and input/structure boundary tests. Real Vapor tests check immediate
updates, all-or-nothing invalidation, localized errors, explicit export and
disposal. Its four-project browser suite covers five languages, themes,
keyboard/narrow layouts, exact JSON, rejected paste, saved auto-apply off,
navigation/reload clearing and exact-distribution network/privacy audits.

The [Retry-After inspector](retry-after.md) adds exact 40-digit delay, fractional
receipt, calendar/weekday, past/equal, unsupported-date and size-limit vectors.
Real Vapor tests cover rejected-edit invalidation and execution lifecycle.
Its dedicated four-project browser suite covers five locales, both themes,
keyboard/narrow layouts, explicit exact JSON, delayed/manual/cancel behavior,
memory-only clearing and exact-dist-asset privacy with synthetic screenshots.

The [ETag precondition inspector](etag.md) adds literal strong/weak, six-method,
present-empty/absent, wildcard, unknown, precedence, grammar/octet and limit
unit tests. Real Vapor tests check activation, stale-report invalidation,
pending/manual/cancel flow and exact explicit export. `tests/e2e/etag.spec.ts`
covers five locales, themes, keyboard and narrow layouts, real file import and
JSON download, rejected input, memory-only clearing and an exact-dist-asset
network/privacy audit in all four specified Chromium/Firefox projects.
Its 304/412 values describe the bounded model, not live server behavior.

The public [JWK/JWKS inspector](jwk.md) adds published RFC 8037 thumbprint,
canonical base64url/unsigned integer, exact RSA exponent, EC/OKP length,
private-material rejection, metadata, duplicate ID/material, algorithm-family,
deadline and cancellation tests. Its real Vapor tests cover delayed/manual
execution, rejected-input invalidation, explicit copy and late digest disposal.
`tests/e2e/jwk.spec.ts` checks all five locales, both themes, keyboard and narrow
layout, real JSON download/file import, exact integers, private-input rejection,
reload/locale clearing and exact-dist-asset request/privacy auditing in the four
specified Chromium/Firefox projects. Synthetic screenshots contain public test
vectors only. Structural acceptance never means cryptographic validity.

PR #149's ten inspectors have [dedicated parser, Vapor/Worker lifecycle and
four-project browser coverage](backlog.md#verification-and-independent-review).
It includes the five-locale/theme samples, strict JSON/date regressions,
adversarial robots patterns, >64 KiB JSON Pointer restore, secret redaction,
explicit downloads, cancelled pending work, rejected-input invalidation,
reload clearing and the exact-dist-asset privacy audit. Screenshots use synthetic
examples only. No WASM success is mocked or replaced for the full quality gate.

The Content-Disposition inspector adds strict response-field and extended-value
unit tests plus real Vapor execution/lifecycle tests. Its dedicated four-project
browser suite covers all five locales, both themes, keyboard operation, exact
filename* decoding/priority, errors and bounds, delayed/manual/cancel behavior,
explicit JSON export, input clearing and the exact-dist-asset privacy audit.
See [its specification and limits](content-disposition.md).

The lightweight converter engines have dedicated pure TypeScript regression tests in `src/lib/tools/quick-converters.test.ts` for SI/IEC precision, CSS font/viewport contexts, exact signed radix conversion, Unicode normalization, Slug collisions, and U+/JS escape parsing including invalid scalar values. `tests/e2e/quick.spec.ts` covers all five locales in Chromium and Firefox across desktop/small viewports, explicit opt-in, errors, and no secret persistence or network-parameter leakage. Radix coverage includes a value above JavaScript's safe-integer range and invalid base digits.

Base64 text conversion includes RFC 4648, Unicode, BOM, invalid UTF-8, alphabet/padding and size-limit unit tests. `tests/e2e/base64.spec.ts` covers fresh-install opt-in, standard and URL-safe conversions in all five locales across Chromium/Firefox desktop/small, noncanonical/error handling, Worker execution, output download and privacy checks.

The Linux permission calculator adds exhaustive 12-bit mode tests and bounded
symbolic/umask vectors. Its real-App tests exercise synchronous matrix/input
updates, special bits, preview errors and disposal. `tests/e2e/chmod.spec.ts`
checks Chromium/Firefox at both sizes, all five locales, keyboard checkboxes,
light/dark visual evidence, clipboard output, and input privacy.

The shortcut dictionary additionally has normalization and data-integrity tests plus real-App integration tests for focus-only capture, ordered strokes, OS distinctions, modifier-only prefixes, manual/on-screen input, filters, provenance, and all five locales. `tests/e2e/shortcuts.spec.ts` covers the production shortcut view in all four projects, including keyboard operation, responsive themes, source visibility, query clearing, and the exact-asset network/privacy audit. These tests validate the investigator; vendor bindings remain documentation-checked rather than execution-tested in each vendor application.

The HTML accessibility checker tests the limited rule set, input/finding bounds, incomplete-result state, and cancellation between scan batches. Its four-project browser test pastes scripts and remote resource URLs, verifies that neither executes nor makes a request, and checks responsive output; a successful screenshot is attached to the browser report.

[Playwright's configuration](../playwright.config.ts) runs the same scenarios in four projects:

| Project            | Engine   | Viewport    |
| ------------------ | -------- | ----------- |
| `chromium-desktop` | Chromium | 1440 × 1000 |
| `firefox-desktop`  | Firefox  | 1440 × 1000 |
| `chromium-small`   | Chromium | 390 × 844   |
| `firefox-small`    | Firefox  | 390 × 844   |

Tests start a fresh production preview at `http://127.0.0.1:4173/army-knife/`. Reusing an existing server is disabled, so a developer's unrelated or stale server cannot satisfy the test. Browser contexts use English initially, UTC, reduced motion, and blocked service workers. The suite explicitly exercises all five supported locales.

The browser scenarios verify:

- DevToys overlaps are disabled initially; opt-in, opt-out, theme, and language preferences survive reloads.
- The production WebAssembly asset is used for CSV, log, set, and HAR processing. Downloaded results are checked against the full expected data, including integers larger than JavaScript's safe integer range and quoted CSV fields.
- IPv6 `/0` produces the exact `2^128` address count, `/31` handles both point-to-point hosts, and changing valid lightweight input immediately replaces the old result.
- Unicode findings identify invisible and bidirectional controls with the expected positions.
- Large JSON input resets an 800ms countdown on every edit. Playwright Clock checks the remaining-time label and progress bar, then verifies the latest result. Manual apply bypasses waiting, manual-only mode persists, and stale results cannot be downloaded.
- HAR results count HTTP failures, aggregate only known response sizes, group hosts, and rank actual slow requests. Recorded URLs are never fetched.
- Dotenv comparisons distinguish missing, changed, and equal values and report duplicates; values are initially hidden in the result table but explicit exports include the full report.
- URL query editing preserves repeated keys, order, and bare flags and updates the output immediately.
- PostgreSQL EXPLAIN keeps per-loop rows/times, does not add parent and child durations, and accepts unrelated 64-bit identifiers without rounding.
- Vapor-rendered results and child component slots react to locale changes through the VDOM settings dialog.
- Structural JSON diffs escape JSON Pointer paths and reject inputs whose numeric precision would be lost.
- Internal tool, home, category, and language navigation keeps one document, updates the normal URL and page metadata, and supports Back/Forward. Refreshing a normal tool URL still loads its complete static HTML. Switching tools, changing language, or refreshing clears inputs.
- Inputs never appear in local storage, session storage, or the page URL. Reloading clears inputs while preserving only validated preferences.
- Each locale activates the correct self-hosted Noto and code font CSS, and those font faces actually load.
- The settings dialog accepts keyboard operation, traps focus while open, closes with Escape, and restores focus to its trigger.
- Both themes fit desktop and small viewports without page-level horizontal overflow. Screenshots are attached for human review.
- The HTML accessibility checker keeps pasted markup inert, performs no request for embedded resource URLs, does not persist input, and allows long scans to be canceled.

Every scenario also has a network audit. Analytics is enabled only for the published `h4m4chi-ttr.github.io/army-knife/` host; the local Playwright test host never loads the Google tag. This audit checks tool-input privacy during local tests, not live GA4 event delivery. The test walks the exact files in `dist` to build an allowed asset path set. Browser requests must be same-origin `GET` requests for those files or the site root, with no query string or request body. A private input marker must not appear in a URL, header, or body, and no WebSocket may open. Browser errors and loading errors fail the test. This checks observable browser behavior for the tested workflows; the production asset verification and content security policy provide additional coverage of the shipped bundle.

The suite uses [Playwright Clock](https://playwright.dev/docs/clock) for deterministic countdown testing, [Playwright downloads](https://playwright.dev/docs/downloads), [network events](https://playwright.dev/docs/network), and a [managed test web server](https://playwright.dev/docs/test-webserver). The viewport projects exercise layout in Chromium and Firefox at small widths; they do not emulate mobile Safari or claim coverage of every device.

## Reviewing the artifacts

Each run that reaches the browser tests uploads `browser-report-<run ID>-<attempt>` for 14 days. This artifact contains:

- `playwright-report/`: the HTML report and its embedded attachments.
- `test-results/`: screenshots and retained failure traces.

Open `playwright-report/index.html` from the downloaded artifact to inspect the test results and the explicit light/dark dashboard, IPv6, countdown, HAR, dotenv, URL editor, PostgreSQL plan, and HTML accessibility checker screenshots. The report is retained on successful runs too, so visual review does not depend on a failure. Failed scenarios retain a Playwright trace and an automatic failure screenshot. The suite uses one retry on CI; the report shows both the first attempt and the retry where applicable.

To inspect the report with Playwright's report viewer, run `pnpm exec playwright show-report /path/to/playwright-report`. Visual artifacts support review; there are no screenshot baseline comparisons that would silently accept a layout change.

## Running the checks

With the pinned runtimes installed, the following commands mirror the CI build and analysis gates:

```sh
vp install --frozen-lockfile
python -m pip install --requirement scripts/requirements-fonts.txt
pnpm build:fonts
python scripts/build-fonts.py --check
rustup toolchain install 1.99.0 --profile minimal --component clippy --target wasm32-unknown-unknown
export RUSTUP_TOOLCHAIN=1.99.0
cargo install wasm-bindgen-cli --version 0.2.129 --locked
cargo test --manifest-path crates/army-knife-core/Cargo.toml --locked
cargo clippy --manifest-path crates/army-knife-core/Cargo.toml --all-targets --locked -- -D warnings
pnpm build:wasm
pnpm test:wasm
pnpm typecheck
vp test
pnpm verify:vapor
vp build
pnpm verify:dist
```

Run the browser gate against the completed production build with:

```sh
pnpm exec playwright install --with-deps chromium firefox
pnpm test:e2e
```

GitHub Actions is the reference environment for the full browser gate. Its uploaded reports provide evidence for all four browser projects.

## Pages deployment and permissions

The workflow's default token permission is `contents: read`. Pull request code runs under that read-only job; it receives no Pages write or identity-token permission. The checkout does not persist Git credentials.

The separate deployment job depends on the entire quality job, runs only for `main`, and has a five-minute timeout. It uses the `github-pages` environment, `pages: write`, and `id-token: write` to deploy the tested Pages artifact. Concurrent Pages deployments are serialized.

In the repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. The pinned [`configure-pages` action](https://github.com/actions/configure-pages/blob/v5.0.0/action.yml) has `enablement: false`; the workflow does not use an administrator token or attempt to enable Pages through an alternate path. A repository that has not enabled Pages will fail at configuration, leaving the quality report available for review. Once Pages is configured, rerun the workflow on `main`.

The Pages artifact is created by [`upload-pages-artifact`](https://github.com/actions/upload-pages-artifact/blob/v4.0.0/action.yml) and published by [`deploy-pages`](https://github.com/actions/deploy-pages/blob/v4.0.5/action.yml). The job output exposes the resulting site URL. Dependency and font downloads happen during the build; the deployed application serves its scripts, WASM, styles, and fonts from the GitHub Pages site itself.

## PKCE coverage (2026-10-20 JST)

`src/lib/tools/pkce.test.ts` checks the RFC 7636 Appendix B vector, exact 43/128
character boundaries, full unreserved alphabet, state omission/limits, malformed
settings, cryptographic failures, aborts and the five-second watchdog. The Vapor
view tests pin manual generation, immediate S256 checking, explicit per-field
copy, invalidation and late-result disposal on edits/clear/cancel/unmount.
`tests/e2e/pkce.spec.ts` covers five languages, light/dark, keyboard controls,
actual native digest values, privacy, reload/navigation and oversized pastes in
all Chromium/Firefox desktop/small projects. It audits the exact built asset graph
and fails on private-marker leakage, unexpected network calls or browser errors.

## Cache-Control coverage (2026-10-21 JST)

`src/lib/tools/cache-control.test.ts` checks response field grammar, quoted commas
and escapes, repeated directives/fields, exact decimal seconds, qualified fields,
unknown/prototype-like names, malformed input and every input/structure bound.
The Vapor view tests exercise immediate/deferred updates, the 800ms boundary,
manual apply, pending cancellation, rejected-paste recovery and inert text.
`tests/e2e/cache-control.spec.ts` runs all five languages, both themes and
Chromium/Firefox desktop/small. It verifies keyboard operation, JSON copy/download,
reload/navigation clearing and the exact-built-asset network/privacy audit. These
tests exercise the offline inspector, not browser HTTP-cache conformance.

## Git patch coverage (2026-10-24 JST)

The [Git patch specification](git-patch.md) defines the supported two-way format
and explicit failure of binary/combined/truncated input. Pure tests check hunk
counts, exact large line numbers, zero/omitted ranges, metadata, CRLF and bounds.
Real Vapor view tests cover selection, stale-result removal, delayed/manual/cancel
operation, disposal, rejected pastes, inert markup and memory-only data. The
four-project browser suite covers five languages, themes, keyboard controls,
explicit whole-report export and the exact-dist-asset network privacy audit.

## HTTP byte range coverage (2026-10-25 JST)

The [byte range specification](http-range.md) defines exact inclusive interval
resolution, suffix/zero semantics, strict grammar and bounds. Unit tests cover
large decimal precision, clamping, mixed satisfiability and union vs member sums.
Real Vapor tests cover dual-input invalidation, paste rejection, delayed/manual
apply, cancel and disposal. The four-project browser suite checks five locales,
themes, keyboard, narrow widths, explicit JSON exports, lifecycle clearing and
the exact-distribution-asset network/privacy audit with synthetic values.

## IDN / Punycode domain coverage (2026-10-26 JST)

`src/lib/tools/idn.test.ts` covers RFC/Unicode vectors, separator and width mapping,
emoji, normalized spelling, round trips, script advisory limitations, malformed
ACE, IP/URL rejection, byte/label/domain limits and input-free error messages.
`IdnTool.test.ts` exercises real Vapor updates, all-or-nothing invalidation,
rejected paste, deferred/manual/cancel/dispose behavior and memory-only rendering.
`tests/e2e/idn.spec.ts` runs the production route in all four browser projects:
five locales, themes, keyboard, responsive screenshots, exact JSON export,
malformed inputs, bounds, delayed/manual/cancel and navigation/reload clearing.
Its exact-dist-asset audit checks external requests, query/body/header leakage,
WebSockets and browser errors. Synthetic domains are rendered only as text.
This verifies the offline inspector, not domain safety or a DNS service.
