# .gitignore rule tester

Paste a repository root's `.gitignore` in the first field and one untracked
candidate path per line in the second. Use relative paths with `/` separators,
and append `/` to mark a directory. Every component before the final one is
also a directory. The optional Windows mode converts backslashes in candidate
paths to slashes. Remove drive names and UNC prefixes before pasting.
Backslashes remain literal path characters when this option is off and
continue to escape pattern characters in both modes.

A rule ending in `/` applies to directories. A leading or internal slash
anchors the rule to the root. Other rules match a basename at any depth.
The last matching rule decides each path, including any rule starting with
`!` that includes the path again. When an ancestor is still ignored, the
ignored directory closest to the root decides the result. An ignored path
then shows the ancestor and the rule that excludes it. This explains why
`!build/keep.txt` cannot override `build/` by itself.

The example also includes a negation that works. `logs/keep.log` is included
by `!keep.log` on line 5. `/docs/**/draft?.md` on line 6 ignores
`docs/notes/draft1.md`.

## Matching and input scope

- Matching is case-sensitive on UTF-8 bytes, with the Git meanings of
  `*`, `?`, `**`, bracket sets, ranges, negated sets and ASCII named classes.
  A multibyte character needs multiple `?` wildcards. Unicode normalization
  is never applied. [Git ignore format](https://git-scm.com/docs/gitignore).
- Each field accepts LF and CRLF. The leading UTF-8 BOM in the rule field is
  skipped. Spaces in candidate paths are significant. Trailing ordinary spaces
  in rules are removed unless escaped. Blank candidate lines are skipped. Other
  rows keep their order, input line number and duplicates.
- A malformed bracket expression or dangling escape never matches. The
  report lists these rule line numbers. Absolute paths and empty, `.` or `..`
  path components are invalid. The format excludes filenames with embedded
  line breaks and inputs with NUL or invalid Unicode.
- The model applies one root rule file to virtual untracked paths. It has
  no access to the Git index, nested `.gitignore` files, `.git/info/exclude`,
  global rules or symlink targets. The app uses TypeScript and Web Workers
  with existing dependencies and introduces no dependencies or attributions.
  Native Git is used by the development tests.

## Execution and report

Each field allows up to 64 KiB of UTF-8, 512 lines and 512 bytes per line.
Candidate paths can have up to 32 components. Small inputs run immediately.
Larger inputs run in a cancelable worker after an 800 ms wait or on manual
apply. Editing either field or changing separator mode discards stale results.
The matcher stops at 25 million token and byte steps and shares the existing
five-second worker timeout. Exceeding a work or time limit produces no report.
Split candidate paths into smaller batches and use the same rules for each
batch. If a single path still reaches the cap, the tool cannot produce a
complete result for that path and rule set.

The screen previews the first 32 rows. The explicit JSON download preserves
every row in input order, including invalid paths. Each row has its original
`row` number and `path`, a `status`, and, when available, the deciding
`rule` with `line` and `pattern`. An inherited exclusion also includes the
slash-delimited `ancestor`. The report includes counts and malformed rule line
numbers in `invalidRules`.

Inputs and results stay in browser memory until the tool is cleared or left.
The app makes no Git or filesystem calls. The optional download is a local
browser action.
