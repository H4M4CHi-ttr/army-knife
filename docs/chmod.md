# Linux permission calculator

This local TypeScript tool inspects mode bits without opening files, running
commands, or deciding whether a user can access a real path. It has no additional
dependency or imported dataset. Calculations update immediately; their work is
bounded by 12 bits and at most 32 symbolic clauses.

## Octal and permission matrix

Enter three or four octal digits, such as `644`, `0644`, `4755`, or `1777`.
The editor represents the complete 12-bit mode, including setuid, setgid, and
sticky. Its checkboxes and four-digit output describe the same bits. The symbolic
output has nine characters, without an `ls` file-type prefix. Lowercase `s`/`t`
means that the corresponding execute bit is also set; uppercase `S`/`T` means it
is absent. Invalid input removes the result instead of retaining an old mode.

Directory read permits listing names, write permits modifying directory entries,
and execute means search/traversal. These bits alone do not describe effective
access. ACLs, ownership, parent permissions, mount options, and platform behavior
can affect access or special bits. The interface describes common Linux uses of
setuid/setgid on executable files, group inheritance for setgid directories, and
the sticky restriction on deletion/renaming in directories.

The copied **GNU/Linux example** uses five octal digits, for example
`chmod 00755 -- ./path`. Its extra leading zero explicitly controls all special
bits, including directory set-ID bits that GNU chmod may preserve for a shorter
numeric operand. Replace the fixed example path deliberately before using it.
Copying does not execute anything, and the tool never reads the clipboard.

## Symbolic preview

The preview uses a documented subset of GNU chmod syntax:

- Every comma-separated clause explicitly names one or more of `u`, `g`, `o`,
  or `a`, then one operator (`+`, `-`, or `=`), then letters from `rwxst`.
- Only `=` accepts an empty permission list, for example `o=`. Omitted classes,
  `X`, permission copying (`g=u`), multiple operators in one clause, and internal
  whitespace are rejected. Leading/trailing whitespace around the whole input
  is accepted. Unsupported syntax produces an error, never an approximate result.
- Clauses run in order against the previous clause's result. `s` affects user
  and group set-ID bits; `t` affects the others/sticky position. Consequently
  `o+s` and `u+t` add nothing, while `o=s` still clears others permissions/sticky.
- For a regular file, `=` also clears unmentioned special bits for the selected
  classes. With the directory option, unmentioned user/group set-ID bits are
  preserved. An explicit `u-s` or `g-s` clears them. The sticky bit is cleared by
  an others assignment that omits `t` for either file type.
- This preview has a **256 UTF-8 byte / 32-clause** limit. Octal and umask fields
  have a **16-character raw input** limit. The UI does not silently truncate a
  pasted expression. A preview changes the octal editor only through **Use preview**.

Explicit classes mean umask does not filter these symbolic operations.
The directory switch changes preview assignment semantics; it does not turn the
octal editor into a simulation of an existing filesystem's chmod syscall.

## Separate umask examples

Enter three octal digits, or four digits with a leading zero. The examples show
`0666 & ~umask` for a newly created file and `0777 & ~umask` for a newly created
directory. These are common requested creation modes, not every application's
creation mode. There is no numeric subtraction and no grant of execute bits to
files. Default ACLs and inherited directory setgid are outside these examples.
The mask does not alter the mode editor or the explicit-class symbolic preview.

## Sources and verification

Semantics were checked against GNU Coreutils 9.12's
[mode structure](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html),
[symbolic modes](https://www.gnu.org/software/coreutils/manual/html_node/Symbolic-Modes.html),
[directory set-ID behavior](https://www.gnu.org/software/coreutils/manual/html_node/Directory-Setuid-and-Setgid.html),
and [numeric modes](https://www.gnu.org/software/coreutils/manual/html_node/Numeric-Modes.html).
These are references to behavior; no upstream code or documentation dataset is
included in the application.

Unit tests cover all 4,096 mode values, known special-bit vectors, sequential
symbolic changes, directory preservation, invalid inputs, bounds, and umask.
Real-App tests cover immediate updates and disposal. Production Chromium/Firefox
tests cover both viewport sizes, all five locales, native keyboard controls,
light/dark screenshots, explicit clipboard copy, reload/navigation disposal,
and the exact-asset network and preference-only storage audit.
