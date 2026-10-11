# Testing and deployment

The repository's [GitHub Actions workflow](../.github/workflows/ci.yml) tests the production build on every pull request, push to `main`, and manual workflow run. A successful run on `main` deploys that same build to GitHub Pages. Pull requests and manual runs on other branches run the complete quality gate without deploying.

## Reproducible build inputs

| Component               | Version or lock                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Linux runner            | `ubuntu-24.04`                                                                                               |
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

The quality job has a 25-minute timeout and performs these steps in order:

1. Install locked JavaScript dependencies and the pinned Python font dependencies.
2. Build fonts and run `python scripts/build-fonts.py --check` against the resulting assets.
3. Run native Rust tests and `cargo clippy --all-targets --locked -- -D warnings`.
4. Compile the Rust crate for `wasm32-unknown-unknown` and generate browser bindings with the matching wasm-bindgen CLI.
5. Load and execute the actual generated `.wasm` in Node through `pnpm test:wasm`. This verifies the CSV, log, and set operations, structured errors, limits, and large integer preservation across the JavaScript/WASM boundary.
6. Type-check the Vue application and run the Vite+ unit tests.
7. Produce the production build for `/army-knife/` and verify its deployable asset graph with `pnpm verify:dist`.
8. Install Chromium and Firefox with their system dependencies and run all Playwright projects against the built site.
9. Upload the browser report and visual evidence, including on browser test failure. Only a fully successful `main` run uploads the Pages artifact.

The pure TypeScript tests cover IPv4 and IPv6 parsing and subnet boundaries, exact address counts, bounded JSON parsing and structural diffs, JSON Pointer escaping, decimal precision rejection, prototype-safe objects, Unicode positions and invisible character classification, WCAG contrast thresholds, and preference storage validation. Boundary and failure cases are tested alongside successful examples.

The App integration tests use `@vue/test-utils` and happy-dom to mount the actual Vue application, settings dialog, and tool components. They execute the real JSON comparison and inspect its displayed changes, enforce disabled-tool routing, check that CSV and log inputs are discarded on navigation, and verify theme, language, opt-in, and preference-only persistence through the UI. Only the network-dependent font loader is replaced in this suite. WASM success is never simulated; the routing test verifies that entering text and switching tools does not start the engine. The compiled engine and real browser loading are verified separately by the WASM smoke test and Playwright.

## Browser coverage

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
- The production WebAssembly asset is used for CSV, log, and set processing. Downloaded results are checked against the full expected data, including integers larger than JavaScript's safe integer range and quoted CSV fields.
- IPv6 `/0` produces the exact `2^128` address count, `/31` handles both point-to-point hosts, and changing an input clears its old result.
- Unicode findings identify invisible and bidirectional controls with the expected positions.
- Structural JSON diffs escape JSON Pointer paths and reject inputs whose numeric precision would be lost.
- Inputs never appear in local storage, session storage, or the page URL. Reloading clears inputs while preserving only validated preferences.
- Each locale activates the correct self-hosted Noto and code font CSS, and those font faces actually load.
- The settings dialog accepts keyboard operation, traps focus while open, closes with Escape, and restores focus to its trigger.
- Both themes fit desktop and small viewports without page-level horizontal overflow. Screenshots are attached for human review.

Every scenario also has a network audit. The test walks the exact files in `dist` to build an allowed asset path set. Browser requests must be same-origin `GET` requests for those files or the site root, with no query string or request body. A private input marker must not appear in a URL, header, or body, and no WebSocket may open. Browser errors and loading errors fail the test. This checks observable browser behavior for the tested workflows; the production asset verification and content security policy provide additional coverage of the shipped bundle.

The suite uses [Playwright downloads](https://playwright.dev/docs/downloads), [network events](https://playwright.dev/docs/network), and a [managed test web server](https://playwright.dev/docs/test-webserver). The viewport projects exercise layout in Chromium and Firefox at small widths; they do not emulate mobile Safari or claim coverage of every device.

## Reviewing the artifacts

Each run that reaches the browser tests uploads `browser-report-<run ID>-<attempt>` for 14 days. This artifact contains:

- `playwright-report/`: the HTML report and its embedded attachments.
- `test-results/`: screenshots and retained failure traces.

Open `playwright-report/index.html` from the downloaded artifact to inspect the test results and the explicit light/dark dashboard and IPv6 result screenshots. The report is retained on successful runs too, so visual review does not depend on a failure. Failed scenarios retain a Playwright trace and an automatic failure screenshot. The suite uses one retry on CI; the report shows both the first attempt and the retry where applicable.

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
