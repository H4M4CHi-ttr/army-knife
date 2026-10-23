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
sections are supported. Display all accepted rows; do not silently truncate.

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
