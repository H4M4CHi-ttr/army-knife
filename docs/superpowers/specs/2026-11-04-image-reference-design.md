# Docker image reference inspector

Add one default-on, offline developer tool. A pasted named Docker image reference
is split into registry, port, repository path, tag and digest. Show Docker Hub,
`library/` and `latest` defaults explicitly, retain a supplied tag, and separately
show the pull reference with digest precedence. A tag can move; a declared digest
does not establish image existence, fetched content, platform, trust or safety.

The existing catalog, README, overlap policy, active branches and open PRs were
checked on 2026-11-04 JST. Only unrelated language PR #145 is open. Neither Army
Knife nor the [DevToys bundled list](https://devtoys.app/) has this workflow.
Community extensions are outside the overlap comparison.

## Semantics and boundaries

Use an independent small TypeScript parser based on the [Docker naming docs](https://docs.docker.com/reference/cli/docker/image/tag/)
and Distribution reference definitions at commit
[`0965666a6ade2e06035fe352e38344be1e68951a`](https://github.com/distribution/reference/tree/0965666a6ade2e06035fe352e38344be1e68951a).
Refer to `regexp.go`, `normalize.go` and `reference.go` for grammar, domain
detection, Docker Hub aliasing and digest precedence. Do not vendor upstream code.

- Input is one named reference, at most UTF-8 1 KiB before outer ASCII space/tab
  trimming. Reject controls, Unicode whitespace, URLs, command lines, repeated
  separators and whole-input failures. No partial report or executable command.
- Repository paths are lowercase ASCII components, permitting a dot, one/two
  underscores or a run of dashes between alphanumerics. Normalized path maximum
  is 255 characters, excluding registry, tag and digest. Tags are case-sensitive
  ASCII word/dot/dash, start with a word character, maximum 128 characters.
- The first slash component is a registry if `localhost`, contains dot/colon,
  or has uppercase characters. Preserve registry spelling and decimal port
  text; no DNS, port range or reachability claim. Normalize exact lowercase
  `index.docker.io` to `docker.io`. Only exact `docker.io` adds `library/` for
  a single-component path. Bare names always refer to Docker Hub repositories.
- Support bracketed hex IPv6 and check its group layout; no zone identifiers or
  dotted IPv4 tails. This is deliberately stricter than Distribution's permissive
  IPv6 regex. Do not repair or lowercase input.
- Support declared `sha256` (64 lowercase hex) and `sha512` (128 lowercase hex).
  Other algorithms are explicitly unsupported, not universally invalid. No
  digest calculation or content verification. Reject raw 64-hex IDs and bare
  SHA-256/SHA-512 digests; this tool requires a repository name.
- Add `latest` only when neither tag nor digest is given. Preserve an explicit
  tag beside a digest in the normalized report, but remove it in the pull
  reference. Mark the tag ignored for selection. Avoid claiming a digest pins a
  particular platform or tag equivalence.

## User interface and privacy

Use existing Vapor, CodeInput, ApplyControl, OutputActions and localized guide
patterns. An input bound below the shared 2,048-character threshold keeps all
work lightweight and immediate, even when global auto-apply is off. There is no
heavy path requiring a Worker or debounce. Display explicit defaults, mutable-tag
or unverified-digest advice, and tag precedence. Responsive definition lists must
wrap long references. All five languages, both themes and keyboard sample/clear
are required. Errors/rejected pastes immediately remove results and exports.

Only explicit copy/download exports JSON. Inputs/results stay in component memory
and clear on navigation, locale change and reload. No network calls, URL/storage
input persistence, telemetry changes, external runtime assets or new dependencies.

## Validation

Observe failing pure parser tests first, then implement; cover default/explicit
registries, namespace ambiguity, alias/case, ports/IPv6, tag+digest, precise bounds,
unsupported algorithms and invalid/inert input. Test actual Vapor invalidation,
explicit export, rejection recovery, locale parity and disposal. Add four-project
production E2E for five locales, themes, keyboard/narrow widths, exact JSON,
navigation/reload clearing and exact-distribution network/privacy audits.

Run the repository's full final-head quality gate, including fonts/licenses,
Rust/Clippy/WASM smoke, typecheck, unit, Vapor, script verifier tests, lint,
production build/distribution and configured Chromium/Firefox E2E. Obtain
independent review, fix substantive findings, create draft PR, mark ready only
after validation, recheck final head/main/checks/review policy and merge normally.
Verify the existing Pages workflow and the actual deployed artifact and public
feature in both engines at desktop/mobile widths.
