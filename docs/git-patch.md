# Git patch inspector (Issue #77)

Inspect recorded two-way `git diff --patch` text locally. Show a file selector,
rename/copy and mode metadata, exact hunk ranges, line numbers, additions and
removals, with keyboard-operable collapsed hunks. Never apply a patch, run Git,
open a path, fetch a URL, or interpret input as HTML. Input/results stay in memory;
copy/download is explicit. Reuse existing themes, five locales, local fonts,
Vapor, CodeInput and useToolExecution. No new dependencies or telemetry.

## Scope and alternatives

Use a bounded, linear TypeScript parser of the standard Git two-way patch format.
A third-party full patch engine would add dependencies and functionality outside
this inspection task. A generic text diff would duplicate existing comparison
work and lose the recorded hunk semantics. This choice is made under the recurring
task's authorization to select and implement an independent tool.

Accept standard `diff --git` sections, `---`/`+++` paths, `@@` two-way hunks,
index/mode/similarity metadata, paired rename/copy headers and the standard
`\\ No newline at end of file` marker. Preserve Git's quoted paths verbatim;
do not decode C escapes or infer a filesystem path. CRLF record separators are
normalized to LF; original blob newline bytes cannot be reconstructed. Numeric
hunk starts use decimal strings/BigInt; hunk lengths and totals are bounded
integers. Validate declared old/new counts and nonoverlapping hunk ranges.
This is a scoped structural inspector, not a guarantee that a patch can apply.

Reject malformed/truncated hunks, unsupported/unknown records, binary patches,
combined diff, mail preambles, and standalone non-Git unified diff. Never return
partial totals after an error. Empty files and metadata-only mode/rename/copy
sections are supported. With no text hunks, new/deleted files require an empty-blob
SHA-1/SHA-256 index abbreviation; rename/copy sections require 100% similarity,
and unequal index hashes or non-100% similarity reject a missing body. Pure mode
changes without an index remain supported. Display all accepted rows; do not silently truncate.

Limits: UTF-8 64 KiB, 2,000 physical lines, 50 files, 200 hunks total, hunk range
starts at most 20 decimal digits. Short input (up to 2,048 UTF-16 units) updates
immediately; longer bounded input uses the existing 800ms/manual apply controller.
Cancel stops pending work; the bounded synchronous parse itself is not interruptible.
No unbounded file processing or worker is introduced.

## Integration and validation

Tool ID `git-patch`, text category, enabled by default. The official DevToys list
and default tool categories were checked on 2026-10-24 JST; they include a text
comparer but no recorded Git patch inspector. Community extensions are outside
this comparison. Sources: https://devtoys.app/ and
https://github.com/DevToys-app/DevToys.Tools . Format reference:
https://git-scm.com/docs/diff-format .

Test changed/new/deleted files, omitted counts, zero ranges, renames/copies,
quoted paths, metadata-only files, CRLF, no-newline markers, large exact starts,
truncation, extra/overlapping rows, binary/combined records, bounds and inert
markup. Test view invalidation, rejected pastes, clear/disposal, scheduling,
keyboard, five languages, both themes, export and memory-only privacy. Run all
repository quality gates on the final commit and review screenshots before merge.

## Review and visual evidence

Independent read-only review of the initial implementation found one issue:
truncated new/deleted-file, edited mode, or rename/copy metadata could hide a
missing content body. Six reproductions failed before the fix and pass afterward;
the actual new guide's complete patch reports 14 additions while its truncated
header now rejects. The full unit suite passes 894 tests after this fix.

Local final code passed type checking, Vapor (38 SFCs), lint (10 pre-existing
warnings), 22 distribution/script tests, production build, 270 localized static
pages and the asset/font/license graph verification. Actual unchanged WASM smoke
checks passed; local Rust regeneration is unavailable. Local WASM/fonts were
reused only from successful exact-base main run 39868064022 attempt 3, with the
artifact ZIP digest verified. CI remains responsible for fresh final-head
Rust/Clippy/WASM/font generation and the entire Chromium/Firefox suite.

The complete Chromium suite passed 298 tests before the review fix; the final
code then passed all 16 dedicated Chromium tests, including the new truncation
regression. Local Firefox cannot run reliably in this cloud sandbox (initial
profile-directory failure; after configuring writable XDG paths, a target crash).
No browser-security flags were changed. Final CI results are recorded in the PR.

The following synthetic-example screenshots were inspected for clipped text,
control overlap and overflow at desktop and 390px width:

- [English light, desktop](screenshots/git-patch-en-light-desktop.png)
- [English light, small](screenshots/git-patch-en-light-small.png)
- [Japanese dark, desktop](screenshots/git-patch-ja-dark-desktop.png)
- [Japanese dark, small](screenshots/git-patch-ja-dark-small.png)
