# Exact CIDR aggregation

Collapse a recorded list of aligned IPv4 **or** IPv6 CIDRs into the minimal
equivalent prefix set. This complements the existing single-CIDR calculator.
It never expands the union, fills gaps, enumerates hosts, connects to a network
or configures a routing/firewall policy.

Input is a JSON string array with one address family and explicit decimal prefix
lengths. Duplicates and contained networks count once. Output is deterministic,
numerically sorted and non-overlapping. Address arithmetic uses BigInt; counts
are decimal strings including every address, not usable-host counts.

```json
["192.0.2.0/25", "192.0.2.128/25", "192.0.2.64/26", "192.0.2.0/25", "198.51.100.0/24"]
```

This gives `192.0.2.0/24` and `198.51.100.0/24`, exactly 512 unique addresses.
The IPv6 example combines two /65 siblings and a contained /128 into
`2001:db8::/64`, exactly `18446744073709551616` addresses. IPv6 /0 has exactly
`340282366920938463463374607431768211456` addresses; it is not enumerated.

## Strict input and bounds

- 1–128 JSON strings, raw UTF-8 input at most 8,192 bytes, each CIDR at most 64
  ASCII characters. JSON escapes are decoded before CIDR validation.
- Require a network-aligned address. Nonzero host bits are **rejected**, not
  automatically masked. Require an explicit decimal prefix and reject leading
  zero prefix lengths, IPv4 leading zeros, whitespace, zones, brackets, expanded
  netmasks, raw IP intervals, missing/invalid prefixes and family mixtures.
- The first invalid CIDR's 1-based item position is shown without echoing it in
  the error. Bad JSON/BOM, nonstrings, bounds or any invalid item prevent every
  output/export. There is no valid-looking partial union.
- Mapped IPv6 remains IPv6 and retains the existing parser's dotted mapped
  notation. It cannot be combined with IPv4 in one list. Accepted alternate IPv6
  spelling is rendered using the existing canonical formatter.
- At most 128 complete output prefixes, 128 KiB pretty JSON and 8 KiB plain text.
  The complete list is in a wrapping keyboard-scrollable region. No data is
  truncated. Independent copy/download actions export the full JSON or full
  newline-terminated CIDR list, including lines outside the visible scroll area.
- Up to 2,048 UTF-16 input units updates immediately even with auto-apply off.
  Larger input uses 800ms/manual apply with cancellation and waiting state.
  Pending imports invalidate exports; superseded reads are discarded.
- CR/CRLF imports/pastes preserve raw bytes in the existing protected read-only
  preview. Replace to resume editing; original bytes can be downloaded explicitly.

## Meaning and privacy

This is address-set union, not policy optimization: ACL order, allow/deny actions,
route ownership, assignability, reachability, permissions and deployment success
are not modeled. Counts include network/broadcast/all IPv6 addresses. The new
workflow implements only the CIDR-union subset of [proposal #60](https://github.com/H4M4CHi-ttr/army-knife/issues/60);
raw intervals, intersection and subtraction remain open work. That issue is not
closed by this addition.

Inputs, files and results stay in memory and clear on tool/language navigation or
reload. No API, telemetry, external font, DNS/network lookup, input URL/storage,
command execution or WebMCP is added. Both exports require an explicit action.
GitHub Pages serves the existing app/font assets. There are no new dependencies.

## References and evidence

- [Python strict networks and collapse](https://docs.python.org/3.12/library/ipaddress.html)
- [RFC 4632 CIDR](https://www.rfc-editor.org/rfc/rfc4632.html)
- [Official DevToys bundled list](https://devtoys.app/), checked 2026-11-21 JST:
  no dedicated CIDR aggregation workflow, so this tool defaults on. Community
  extensions are outside the comparison.

Pure tests compare all prefix widths and deterministic corpora against native
Python `ipaddress.collapse_addresses`, using numeric endpoints for mapped IPv6
spelling differences. Shared CIDR tests retain existing parser behavior. Actual
Vapor tests and Chromium/Firefox desktop/small production tests cover five
languages, both themes, exact totals/exports/downloads, imports, cancellation,
lifecycle and the shared exact-asset privacy audit. Live Pages tests check real
operation and the deployed Git revision. Images use documentation addresses.
