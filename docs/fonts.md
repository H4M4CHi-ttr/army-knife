# Self-hosted multilingual fonts

The application loads font CSS and WOFF2 files from the same GitHub Pages origin
as the application. It does not call Google Fonts, a font CDN, a runtime subset
API, or a remote font conversion service. Build-time downloads contain no user
input. Runtime asset URLs are fixed paths and do not contain input text.

## Regional families

| UI locale | Interface family | Code family distributed by this project | Upstream code face |
| --- | --- | --- | --- |
| `ja` | Noto Sans JP Variable | Army Knife Mono J | Sarasa Mono J Regular |
| `en` | Noto Sans Variable | Army Knife Mono J | Sarasa Mono J Regular |
| `zh-CN` | Noto Sans SC Variable | Army Knife Mono SC | Sarasa Mono SC Regular |
| `zh-TW` | Noto Sans TC Variable | Army Knife Mono TC | Sarasa Mono TC Regular |
| `ko` | Noto Sans KR Variable | Army Knife Mono K | Sarasa Mono K Regular |

English reuses the Japanese Sarasa family's Latin subset. It does not download
all Japanese glyphs: CSS `unicode-range` causes the browser to request only the
files necessary for displayed text. Selecting a locale selects its regional
CJK glyph forms. The Sarasa build preserves the source font's entire character
inventory, so pasted text is not limited to the current UI translation.

`src/lib/fonts.ts` exports `setFontLocale(locale)`. Call it when initializing or
changing the application's locale, and handle its rejected promise if local
assets fail to load. The function updates the document language and swaps a
same-origin stylesheet. Stale asynchronous requests cannot overwrite a more
recent locale selection. Previously loaded stylesheets remain inactive for
quick subsequent switches. No font data is stored in localStorage.

`src/styles/fonts.css` defines `--font-sans` / `--font-ui` and `--font-mono` /
`--font-code`. Each language has suitable installed-font fallbacks, followed by
generic CSS families. Noto normal variable weights 100–900 are supplied. Code
fonts have the original Regular weight (400); browser-synthesized bold is not an
additional Sarasa face.

## Pinned sources

Versions and SHA-256 digests are recorded in
[`scripts/font-sources.lock.json`](../scripts/font-sources.lock.json).

- Sarasa Gothic **1.0.42**, official hinted `SarasaMono-TTF-1.0.42.7z` release.
- `@fontsource-variable/noto-sans` **5.3.0**.
- `@fontsource-variable/noto-sans-jp`, `noto-sans-sc`, `noto-sans-tc`, and
  `noto-sans-kr` **5.3.1**.
- Build tools and their dependencies are pinned in
  [`scripts/requirements-fonts.txt`](../scripts/requirements-fonts.txt).

Sarasa's release archive SHA-256 is copied from the official GitHub release
asset metadata. Noto package SHA-256 values were computed from the downloaded
versioned npm archives; npm's published SHA-512 integrity values are recorded
alongside them for provenance. Every downloaded archive is checked against the
committed SHA-256 before it is read.

## Building

Use Python 3.12 and an isolated virtual environment:

```sh
python -m venv .venv-fonts
.venv-fonts/bin/python -m pip install -r scripts/requirements-fonts.txt
.venv-fonts/bin/python scripts/build-fonts.py
.venv-fonts/bin/python scripts/build-fonts.py --check
```

On Windows, use `.venv-fonts\Scripts\python.exe` for the final three commands.
In GitHub Actions, install the requirements into the job's Python environment
and run `python scripts/build-fonts.py` before the Vite build.

The script generates `public/fonts/`; Vite copies that directory into the
deployment. Generated binary assets and source archives are not committed.
Raw TTF extraction and partial output use the operating system's temporary
directory, outside `public/`, so an interrupted build cannot deploy them.
Cache `.cache/fonts/` and `public/fonts/` in CI with a key derived from:

```text
scripts/build-fonts.py
scripts/font-sources.lock.json
scripts/requirements-fonts.txt
third-party/fonts/*.txt
```

The builder also computes its own content-derived build key. A cache hit is
validated before reuse; stale output is rebuilt. `--check` performs no network
requests. It fails when output is absent, stale, missing, modified, or refers to
non-local font URLs. `--cache PATH`, `--output PATH`, and `--jobs 1..4` can be used
to control build storage and concurrency. The default downloads approximately
189 MB of source archives once; only generated WOFF2/CSS/licenses are deployed.

### Subset strategy

Noto CSS and its referenced WOFF2 files are copied from the pinned Fontsource
packages without changing the font binaries. Only normal weight-axis files are
included; unused width axes and italic files are excluded.

Sarasa's four regional Regular TTFs are extracted from the pinned official
archive. The builder reuses each corresponding Noto CJK package's existing
Unicode groups, which group frequently used characters together. Sarasa glyphs
outside those groups are retained in additional subsets. Each ordinary shard
has at most 512 encoded characters. Latin base letters and combining marks, and
the Hangul jamo group, stay together as natural shaping groups even if they
exceed that target. Kana and full-width forms have dedicated groups.

For each Sarasa subset the builder:

1. Keeps hinting and all applicable OpenType layout features and scripts.
2. Includes all original variation selectors while subsetting, preserving the
   original encoded variation sequences for characters in that subset.
3. Changes the internal family, full name, unique identifier, and PostScript
   name to the Army Knife Mono derivative names.
4. Retains the original copyright and metadata, and adds the complete upstream
   OFL text and license URL to the font name table.
5. Writes WOFF2 and exact CSS `unicode-range` declarations.

The output manifest records every file's size and SHA-256, source versions and
licenses, each subset's character hash, and the complete character/variation
coverage of each regional source font. No timestamp is added to generated font
metadata. The script verifies every WOFF2 by reading it back, checking internal
names and licensing, comparing CSS ranges against its `cmap`, and checking the
union of character and variation coverage against the original source.

These checks establish character coverage and the presence of shaping tables;
they do not claim full functional equivalence with an unpartitioned desktop
font. In particular, Unicode-range partitioning can affect shaping sequences
that span multiple subset files. The interface provides system fallbacks for
unsupported scripts and symbols. Color emoji are not supplied by Sarasa.

## Licensing and attribution

The application code's license does **not** replace the fonts' licenses. The
fonts and their derivatives remain under the **SIL Open Font License 1.1**.
The unmodified upstream license texts are committed in
[`third-party/fonts/`](../third-party/fonts/) and copied into
`fonts/licenses/` in the deployed application.

Sarasa's upstream license contains these credits:

- Copyright 2015–2025 Renzhi Li (Belleve Invis).
- Portions copyright 2016 The Inter Project Authors.
- Portions copyright 2014–2021 Adobe Systems Incorporated, with Reserved Font
  Name **Source**.
- Portions copyright 2012 Google Inc.

The pinned Sarasa license does not declare “Sarasa” as a Reserved Font Name.
This project nevertheless gives modified subsets distinct internal names to
identify the derivative and avoid collisions with the original desktop fonts.
The UI may accurately describe them as **Sarasa Mono-derived subsets**. The
original authors do not sponsor or endorse this application's derivative.

The OFL allows use, bundling, redistribution, and modification under its terms;
subsetting is a modification. The derived font software must retain the OFL and
the required notices, must respect Reserved Font Names, and must not be sold on
its own. The license does not require the application or documents rendered
with the font to adopt the OFL. The bundled full license text is authoritative.

### Primary references

- [Sarasa Gothic upstream](https://github.com/be5invis/Sarasa-Gothic)
- [Sarasa 1.0.42 release](https://github.com/be5invis/Sarasa-Gothic/releases/tag/v1.0.42)
- [Sarasa 1.0.42 license](https://github.com/be5invis/Sarasa-Gothic/blob/v1.0.42/LICENSE)
- [Fontsource installation and self-hosting](https://fontsource.org/docs/getting-started/install)
- [Fontsource Unicode subsets](https://fontsource.org/docs/getting-started/subsets)
- [Fontsource variable fonts](https://fontsource.org/docs/getting-started/variable)
- [fontTools subset options](https://fonttools.readthedocs.io/en/latest/subset/index.html)
- [SIL OFL FAQ, including webfonts, subsetting, and Reserved Font Names](https://openfontlicense.org/ofl-faq/)

## Browser verification

After starting the built application, load a sample for each active locale with
`document.fonts.load`, rather than relying only on `document.fonts.check` (which
can also succeed when there is no matching webfont). A non-empty array of loaded
`FontFace` objects confirms a matching downloadable face is present:

```js
const faces = await document.fonts.load('14px "Army Knife Mono J"', 'abc 日本語')
if (!faces.length || faces.some((face) => face.status !== 'loaded')) {
  throw new Error('The local code font did not load')
}
```

Verify regional samples after switching to `zh-CN`, `zh-TW`, and `ko`, check
normal/bold Noto text, and inspect network requests for same-origin URLs and
missing assets. Include a test on the repository subpath `/army-knife/` so font
paths are checked under GitHub Pages hosting conditions. A two-cell CJK glyph
should occupy approximately twice the advance width of an ASCII glyph at the
same font size; UI letter-spacing can affect DOM measurements, so compare
canvas text metrics without extra spacing when verifying the font itself.
