# HTML hreflang pair inspection

Enter the two pages’ absolute HTTP or HTTPS URLs and paste the corresponding
HTML. Use the full HTML document, a `<head>…</head>` block, or a bare snippet
of elements normally allowed in a head. The language maps list declarations in
source order and show their line numbers. The sample uses only `example.test`.

## Comparison

- Each page needs a language link to itself and a language link to the other
  page. The labels in each direction must match the other page’s self labels.
- The optional `x-default` can share a URL with a language link. It does not
  supply a language-specific self or return link.
- Repeated language/URL pairs, conflicting URLs for a language in one head,
  and differing destinations for the same language between heads are flagged.
  Links that declare `media` are flagged and excluded from matching.
- Unsubmitted destinations are displayed as unverified, even if the two maps
  agree about those URLs. A missing third-page declaration on one side alone
  is outside the pair checks.
- The language check recognizes `x-default` and a two-letter ASCII language
  with optional four-letter script and optional two-letter region, separated
  by hyphens and compared case-insensitively. This is a syntax check. It
  does not verify assigned codes, aliases, or the language of page content.

The tool compares serialized browser URLs. Scheme and host case, default ports,
internationalized hostnames, and dot segments follow the URL standard. Different
path case, non-root trailing slashes, query text and order, or fragments remain
distinct. Cross-domain pairs work. Relative and scheme-relative URLs, credentials,
backslashes, invalid percent escapes and embedded whitespace are rejected.
The two submitted URLs must identify distinct destinations.

## Parsing and limits

The pinned parse5 library constructs plain JavaScript data in memory. Only
direct HTML link children of the parsed head with an `alternate` relation and
a `hreflang` attribute are read. Attribute entities are decoded. Comments, raw
text, template descendants, body content and links recovered from after the
closing head are excluded. HTML recovery errors other than an omitted doctype
are flagged because declarations may be missing.

Limits are 64 KiB of raw UTF-8 per HTML source, 2,048 raw UTF-8 bytes per page URL,
and 64 declarations per head. Decoded declaration values are limited to 2,048
bytes per `href` and 64 bytes per `hreflang`. Exceeding a limit discards the
report. The fields use the app’s protected preview when a pasted source
contains carriage returns, so limits apply before HTML normalizes line endings.
Inputs totaling up to 4,096 UTF-16 units run immediately. Larger inputs run in
a cancellable worker after an 800 ms delay or on manual apply and time out
after five seconds.

The tool keeps input and results in memory and clears them on navigation or
reload. It does not render the pasted HTML or request its URLs, resources or
scripts. Scope is the submitted HTML heads. Live responses, HTTP Link headers,
XML sitemaps, canonical and indexing checks, and Search Console are outside it.

[Google Search Central hreflang guidance](https://developers.google.com/search/docs/specialty/international/localized-versions)
