# Literal Git branch-name checker

## Intent and scope

Check proposed CI/release branch names without invoking Git or contacting a
repository. Show each literal name, its UTF-8 byte count, syntax result, reasons,
and `refs/heads/` reference when valid. This does not check existence, permissions,
remote hosting rules, prefix collisions, filesystem portability or shell safety.
No commands are generated or executed. Previous-checkout expressions are never
expanded. A successful syntax check is not permission to create a branch.

The daily instruction authorizes autonomous selection, implementation, draft PR,
review, normal merge and existing Pages verification. Implementation choices here
are the agent's decisions. Latest main is c2f00abcc5aa1e03f25179191dbc965a6b588228;
the only open PR is unrelated language expansion #145. The SSH branch is excluded.
No AGENTS.md or checkout .agents/skills exists. Applicable cloud skills are used.

## Approaches

1. Line-delimited names are convenient, but cannot unambiguously represent empty
   names, embedded controls and leading/trailing whitespace.
2. A JSON string array preserves every literal and permits precise diagnostics.
   Choose this bounded approach, following the existing Redis inspector UI.
3. A full ref/revision/refspec workbench adds modes and repository-dependent
   expansion. Defer it; this addition checks literal branch names only.

## Contract

`inspectGitBranches(input: string): GitBranchesReport` parses 1–128 JSON strings.
Raw input is limited to 8,192 UTF-8 bytes; each decoded name to 512 bytes; complete
pretty-printed JSON output to 128 KiB. These are tool limits, not Git limits.
Malformed JSON, a BOM, nonstrings, excess bounds and lone UTF-16 surrogates fail
atomically with input-free errors. Syntax-invalid names produce diagnostic rows,
not partial parser failure. Empty names are represented by JSON empty strings.
Order and duplicates stay intact. No trimming, Unicode normalization, automatic
repair, slash collapsing, history lookup or shorthand expansion occurs.

Literal branch rules follow `git check-ref-format --branch` outside a repository:
one-level names and `@` are allowed; `HEAD` and a leading hyphen are forbidden.
Empty slash components, components starting with a dot or ending in `.lock`,
consecutive dots, a final dot, `@{`, ASCII controls/space/DEL and `~^:?*[\\`
are rejected. `.lock` and `HEAD` are case-sensitive. A dot before an internal
slash and punctuation not forbidden by Git stay valid. A provided `refs/heads/x`
is itself a literal branch name, resolving to `refs/heads/refs/heads/x`.

Report: `{ branches: [{ name, nameBytes, valid, fullRef, issues }], validCount,
invalidCount }`. `fullRef` is null for invalid rows; issue codes are stable,
deduplicated and translated only for display. Original names remain in exports.
The table shows 32 explicitly labelled preview rows; counts and JSON include all
rows. Display JSON escapes Unicode format/line/direction controls as well as
ASCII controls, and uses inert text. The syntax status remains visible on mobile
before long names; the table is keyboard-scrollable.

## Execution and privacy

Use the existing Vue 3.6 RC/Vapor, shadcn-vue, CodeInput, useToolExecution and
OutputActions. Up to 2,048 UTF-16 input units executes immediately, including
auto-off; larger input uses 800ms/manual apply and cancellable waiting. Imports
hide stale outputs immediately; late reads are discarded. Preserve BOM and raw
CR/CRLF using existing CodeInput options. Copy/download is explicit. Navigation,
locale switching and reload clear input/results. Five languages, both themes,
self-hosted Noto/Sarasa and all current licenses are retained.

No dependencies, Worker/WASM work, server/API calls, telemetry, external fonts,
WebMCP, input URL or persistent input storage are added. Bounded linear text
checking needs no worker. The official DevToys bundle has no dedicated Git branch
workflow, so this complementary tool defaults on. Community extensions are not
part of that comparison. Existing overlap defaults stay unchanged.

## Evidence and completion

Test official edge cases and a broad corpus against the installed Git executable
outside any repository, without shell interpolation or repository mutations.
Pure and real Vapor tests cover bounds, diagnostics, preview/full export,
instant/deferred/manual/cancel, imports and lifecycle. Four Chromium/Firefox
desktop/small projects cover five locales, themes, keyboard, actual downloads,
privacy and synthetic screenshots. Extend existing live Pages checks; shared
exact-asset manifest parser verifies deployed revision. Run all repository gates
on final head, obtain independent review, then inspect exact SHA/check/review/
main conditions before normal guarded merge. Verify automatic Pages and live
operation; incomplete or failed runs are never success.

## Primary references (checked 2026-11-20 JST)

- https://git-scm.com/docs/git-check-ref-format
- https://github.com/git/git/blob/master/refs.c (`check_branch_ref`, ref syntax)
- https://github.com/git/git/blob/master/t/t1402-check-ref-format.sh
- https://devtoys.app/ (official bundled list; no dedicated branch checker)
