# Git branch-name checker

Checks proposed **literal UTF-8 branch names**, without running Git or contacting
a repository. Useful for diagnosing CI/release naming failures before creating a
branch. Input is a JSON string array, so empty names, whitespace and escaped
controls are unambiguous. Original order, duplicates, case and Unicode spelling
remain unchanged. There is no trimming, normalization or automatic repair.

Names are checked as branches under `refs/heads/`. Single-level names and `@`
are permitted. `HEAD` and a leading hyphen are forbidden. Slash components
cannot be empty, start with a dot or end in lowercase `.lock`. Consecutive dots,
a final dot, `@{`, ASCII controls/space/DEL and Git's forbidden punctuation
`~ ^ : ? * [ \\` are diagnosed. Dot before an internal slash, uppercase `.LOCK`,
and non-ASCII characters are allowed when the other rules hold. Displayed JSON
escapes invisible/direction controls; exported JSON retains the original strings.

Each report row contains the name, exact UTF-8 byte count, `valid` boolean,
`fullRef` (null for invalid syntax), and stable issue codes. For example:

```json
["feature/checkout", "HEAD", "@", "refs/heads/main"]
```

Three names are syntactically valid and HEAD is reserved. The last name is
literal, so its full ref is `refs/heads/refs/heads/main`. Previous-checkout
expressions such as `@{-1}` are never expanded and fail literal syntax. This
models the documented branch syntax outside a repository; it does not query Git.

## Bounds and operation

- 1–128 JSON strings, raw UTF-8 input 8,192 bytes, each decoded name 512 bytes.
  These are tool limits, **not Git's name limits**. Invalid JSON/BOM, nonstrings,
  lone surrogates or exceeded bounds return no partial report.
- A syntax-invalid name produces a diagnostic row. Counts and JSON include every
  row; the table explicitly previews at most 32. Full pretty JSON is capped at
  128 KiB and exported only by explicit copy/download.
- Through 2,048 UTF-16 input units, updates are immediate even with auto-apply
  off. Larger input uses 800ms/manual apply with cancellable waiting. Local
  imports hide previous exports while pending and discard superseded reads.
- CR/CRLF pastes/imports preserve original bytes and use the existing protected
  read-only preview. Replace to edit again; original bytes can be downloaded.
- Inputs/results stay in memory and are cleared by tool/language navigation or
  reload. No API, repository, telemetry, external font, WebMCP, URL input state or
  persistent input storage is used. The deployed app uses GitHub Pages only.

## Limits of a valid result

Syntax does not establish existence, permissions, remote hosting rules, prefix
collisions (`foo` vs `foo/bar`), filesystem/case/Unicode portability, or shell
safety. Git permits characters that need shell quoting. This tool neither
generates nor executes a shell command. It does not validate a full ref, tag,
revision or refspec expression; apparent full refs remain literal branch names.
Success does not guarantee branch creation or a push will work.

The existing Git patch and conflict inspectors handle different recorded data.
No dedicated Git branch checker appears in the [official DevToys bundle](https://devtoys.app/)
checked 2026-11-20 JST, so this complementary tool defaults on. Third-party
extensions are outside the comparison. No dependency is added.

## References and verification

- [Git check-ref-format manual](https://git-scm.com/docs/git-check-ref-format)
- [Git reference rules and literal branch check](https://github.com/git/git/blob/master/refs.c)
- [Upstream syntax cases](https://github.com/git/git/blob/master/t/t1402-check-ref-format.sh)

Pure tests compare edge cases and all non-NUL ASCII characters against native
Git outside a repository using argument arrays, without shell interpolation or
repository writes. NUL and escaped invalid Unicode have separate tests. Real
Vapor and native Chromium/Firefox tests cover five languages, both themes,
keyboard/mobile, exact downloads, imports, cancellation, clearing and the shared
exact-distribution-asset privacy audit. Public CI checks the existing Pages
deployment and exact merge revision. Screenshots contain synthetic names only.
