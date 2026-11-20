# Exact CIDR aggregation

## Intent and current context

Collapse a recorded list of network-aligned IPv4 **or** IPv6 CIDRs into the
smallest equivalent prefix set. Remove duplicates/containment and merge adjacent
blocks only when the address union is unchanged. Useful for reviewing address
allowlists; no routing, firewall or remote system is accessed or configured.

Latest main is 45bf09e959b1c31693840d9002c200bf7bdb1b08. The only open PR is
unrelated language expansion #145. Existing single-CIDR inspection has no list
aggregation. No AGENTS.md or checkout .agents/skills exists; applicable cloud
design/plan/TDD/review/verification skills are used. The daily instruction for
automation 6acbb349c24c8191b2f935f7a07c93c4 explicitly authorizes implementation,
push, draft PR, review, normal guarded merge and existing Pages verification.
SSH branches, other repositories and codex-cloud-empty remain outside the work.

## Approaches and selection

1. Extend the single-CIDR calculator with several list/set modes: larger shared
   UI and regression surface; defer.
2. Add one dedicated, bounded exact-union workflow with the existing parser and
   formatter: selected. Keep explicit prefixes and reject host bits and mixed
   families, so there is no silent address-set expansion.
3. Implement all of issue #60 (raw intervals, A/B union/intersection/difference):
   broader than one small daily addition. This is a union-only CIDR subset;
   reference #60 without closing it. Its mixed-family rejection is retained.

## Contract

`aggregateCidrs(input: string): CidrAggregateReport` takes a JSON array of 1–128
strings, preserving raw JSON bytes for the input bound. Raw UTF-8 input at most
8,192 bytes; each decoded CIDR at most 64 ASCII characters. Require an explicit
decimal prefix. Reject whitespace inside/around values, IPv4 leading zeros,
zone IDs, brackets, netmasks, raw intervals, invalid prefix lengths, nonzero host
bits, mixed IPv4/IPv6, BOM, malformed JSON, nonstrings and exceeded limits.
An indexed `CidrAggregateEntryError` identifies the first bad item without echoing
its text; parse/shape/count errors have no item index. Any invalid item prevents
all output, including export. Never trim or silently mask host bits.

Reuse existing `parseCidr` and `formatAddress` by exporting those two existing
helpers without changing their behavior; existing single-CIDR APIs stay intact.
Their normal IPv6 spelling and IPv4-mapped IPv6 notation are retained. Mapped
IPv6 stays IPv6; it is never treated as an IPv4 member.

Report `{ version, inputCount, prefixes: [{ cidr, prefix, first, last,
addressCount }], addressCount }`. Prefixes are deterministic, non-overlapping,
minimal and sorted numerically. Counts include every address, not usable-host
counts. All address arithmetic uses BigInt; serialized counts are exact decimal
strings, through 2^128 for IPv6 /0. Input count/prefix length are safe small
integers. Output has at most 128 prefixes, JSON at most 128 KiB, and plain CIDR
list at most 8 KiB. No truncation or partial result is accepted.

Sort inclusive intervals, merge overlaps/adjacency, then cover each union interval
with largest aligned power-of-two blocks that fit. Work is bounded by 128 inputs
and 128 address bits, so no Worker or runtime package is needed. Native Python
`ipaddress.collapse_addresses` supplies independent test expectations; compare
numeric ranges/prefix lengths where its mapped-address spelling differs.

## UI, execution and privacy

One Vapor view with the existing CodeInput/useToolExecution/OutputActions. IPv4
and IPv6 examples use documentation addresses only. Show family, input/output
counts and exact unique-address count. Render the complete plain CIDR list in
a bounded, wrapping, keyboard-scrollable region; explicitly label that scrolling
shows all prefixes. Separate explicit plain-list and complete-JSON copy/download
actions; no preview-only export. No links are created from input.

Through 2,048 UTF-16 input units update immediately even when auto-apply is off;
larger input uses 800ms/manual apply, waiting display and cancellation. Invalidate
exports on edits/rejected pastes/import start. Discard late reads after replacement
or disposal. Preserve raw CR/CRLF and BOM using existing CodeInput options.
Tool/language navigation and reload clear input/results. Five languages, both
themes, shadcn-vue, Vue 3.6 RC/Vapor and Noto/Sarasa licensing remain aligned.

Input/files/results stay in memory. No input URL/storage, external transmission,
API, telemetry, external font, WebMCP, command execution, hostname resolution or
reachability lookup. This models address-set union only; address counts do not
imply assignability, ACL precedence, route ownership or permission to deploy.

## Delivery and verification

Default on: no dedicated CIDR aggregation workflow is in the official DevToys
bundle checked 2026-11-21 JST. Community extensions are outside this comparison.
No dependencies, workflow budgets, permissions, protection or hosting changes.

Test precise /0, /32, /128, host-bit rejection, duplicates, containment, siblings,
non-alignable adjacency, gaps, mapped forms, 128-bit edges, order independence,
all bounds and indexed atomic errors against independent Python expectations.
Real Vapor tests cover both exports, locales, imports, timing/cancel and clearing.
All four Chromium/Firefox desktop/small projects cover five locales, both themes,
keyboard/mobile, actual downloads, raw byte boundaries and exact-asset privacy.
Add live Pages cases with the shared manifest/revision parser. Complete every
repository gate on final head and an independent review before normal SHA-guarded
merge; confirm main, automatic Pages and actual live operation/revision. Do not
count interrupted, failed or unexecuted verification as success.

## Primary references

- https://docs.python.org/3.12/library/ipaddress.html (strict networks and collapse)
- https://www.rfc-editor.org/rfc/rfc4632.html (CIDR and address aggregation)
- https://devtoys.app/ (official bundled tools, checked 2026-11-21 JST)
- https://github.com/H4M4CHi-ttr/army-knife/issues/60 (broader proposal remains open)
