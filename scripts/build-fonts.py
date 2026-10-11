#!/usr/bin/env python3
"""Build the site's self-hosted fonts from checksum-pinned upstream archives.

Network access is limited to this build step. The resulting CSS uses relative
URLs, and no font service receives text entered into the application.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import logging
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tarfile
import tempfile
import urllib.request

import fontTools
from fontTools import subset
from fontTools.ttLib import TTFont
import py7zr


ROOT = Path(__file__).resolve().parent.parent
LOCK_PATH = ROOT / "scripts/font-sources.lock.json"
LICENSE_DIR = ROOT / "third-party/fonts"
OUTPUT = ROOT / "public/fonts"
MAX_SHARD_CODEPOINTS = 512
logging.getLogger("fontTools.subset").setLevel(logging.ERROR)


def sha256(path: Path) -> str:
    with path.open("rb") as file:
        return hashlib.file_digest(file, "sha256").hexdigest()


def charset_digest(codepoints: set[int]) -> str:
    return hashlib.sha256(
        ",".join(f"{cp:X}" for cp in sorted(codepoints)).encode("ascii")
    ).hexdigest()


def build_key() -> str:
    digest = hashlib.sha256()
    for path in (
        Path(__file__),
        LOCK_PATH,
        ROOT / "scripts/requirements-fonts.txt",
        *sorted(LICENSE_DIR.glob("*.txt")),
    ):
        digest.update(path.read_bytes())
    return digest.hexdigest()


def unicode_range(codepoints: set[int]) -> str:
    """Render exact, compact CSS ranges; no broad coverage claims."""
    values = sorted(codepoints)
    if not values:
        raise ValueError("Empty font subset")
    ranges: list[str] = []
    first = previous = values[0]
    for current in values[1:] + [None]:
        if current is not None and current == previous + 1:
            previous = current
            continue
        ranges.append(
            f"U+{first:X}" if first == previous else f"U+{first:X}-{previous:X}"
        )
        first = previous = current
    return ",".join(ranges)


def parse_unicode_range(value: str) -> set[int]:
    result: set[int] = set()
    for part in value.split(","):
        code = part.strip().upper().removeprefix("U+")
        if "?" in code:
            result.update(range(int(code.replace("?", "0"), 16), int(code.replace("?", "F"), 16) + 1))
        elif "-" in code:
            start, end = code.split("-")
            result.update(range(int(start, 16), int(end, 16) + 1))
        else:
            result.add(int(code, 16))
    return result


def safe_relative(value: str) -> Path:
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or "\\" in value:
        raise ValueError(f"Unsafe asset path: {value!r}")
    return Path(*path.parts)


def download(source: dict, cache: Path) -> Path:
    destination = cache / safe_relative(source["archive"])
    if destination.exists():
        if sha256(destination) != source["sha256"]:
            raise ValueError(f"Cached archive checksum mismatch: {destination}")
        return destination
    print(f"Fetching {source['archive']}", flush=True)
    request = urllib.request.Request(source["url"], headers={"User-Agent": "army-knife-font-build/1"})
    partial = destination.with_suffix(destination.suffix + ".part")
    try:
        with urllib.request.urlopen(request, timeout=120) as response, partial.open("wb") as file:
            shutil.copyfileobj(response, file, length=1024 * 1024)
        if sha256(partial) != source["sha256"]:
            raise ValueError(f"Downloaded archive checksum mismatch: {source['archive']}")
        partial.replace(destination)
    finally:
        partial.unlink(missing_ok=True)
    return destination


def copy_licenses(lock: dict, target: Path) -> list[str]:
    destination = target / "licenses"
    destination.mkdir()
    names = []
    for source in [lock["sarasa"], *lock["noto"].values()]:
        name = source["license"]
        original = LICENSE_DIR / safe_relative(name)
        if sha256(original) != source["licenseSha256"]:
            raise ValueError(f"Upstream license checksum mismatch: {name}")
        shutil.copyfile(original, destination / name)
        names.append(f"licenses/{name}")
    return names


def copy_noto(lock: dict, cache: Path, target: Path) -> dict[str, dict]:
    result = {}
    for name, source in lock["noto"].items():
        archive = download(source, cache)
        destination = target / "noto" / name
        (destination / "files").mkdir(parents=True)
        with tarfile.open(archive, "r:gz") as package:
            # Read known regular files individually; never unpack a tar tree.
            def read_member(path: str) -> bytes:
                member = package.getmember(path)
                if not member.isfile():
                    raise ValueError(f"Expected regular package member: {path}")
                file = package.extractfile(member)
                if file is None:
                    raise ValueError(f"Could not read package member: {path}")
                return file.read()

            css = read_member("package/wght.css").decode("utf-8")
            font_files = re.findall(r"url\(\./files/([a-z0-9-]+\.woff2)\)", css)
            if not font_files or re.search(r"url\((?!\./files/[a-z0-9-]+\.woff2\))", css):
                raise ValueError(f"Unexpected upstream CSS URLs: {name}")
            for filename in set(font_files):
                (destination / "files" / filename).write_bytes(read_member("package/files/" + filename))
            if hashlib.sha256(read_member("package/LICENSE")).hexdigest() != source["licenseSha256"]:
                raise ValueError(f"Package license differs from committed license: {name}")
            (destination / "font.css").write_text(css, encoding="utf-8")
            ranges = json.loads(read_member("package/unicode.json"))
            result[name] = {"css": css, "ranges": ranges, "family": source["family"], "fontFiles": len(set(font_files))}
    return result


def variation_pairs(font: TTFont) -> set[tuple[int, int]]:
    return {
        (selector, codepoint)
        for table in font["cmap"].tables
        if table.format == 14
        for selector, pairs in table.uvsDict.items()
        for codepoint, _glyph in pairs
    }


def make_shards(codepoints: set[int], ranges: dict[str, str]) -> list[tuple[str, set[int]]]:
    """Keep common shaping groups together; partition CJK by upstream frequency.

    Noto's numbered CJK groups put frequent characters together. Remaining
    Sarasa glyphs are retained in additional <=512-character shards, so this is
    not a text-limited build. Latin bases/marks and Hangul jamo stay together.
    """
    remaining = codepoints.copy()
    shards: list[tuple[str, set[int]]] = []

    def take(name: str, candidates: set[int], split: bool = True) -> None:
        selected = remaining & candidates
        remaining.difference_update(selected)
        values = sorted(selected)
        size = MAX_SHARD_CODEPOINTS if split else max(len(values), 1)
        for start in range(0, len(values), size):
            suffix = f"-{start // size}" if len(values) > size else ""
            shards.append((name + suffix, set(values[start : start + size])))

    take("latin", set(range(0x0250)) | set(range(0x0300, 0x0370)), split=False)
    take("jamo", set(range(0x1100, 0x1200)) | set(range(0x3130, 0x3190)) | set(range(0xA960, 0xA980)) | set(range(0xD7B0, 0xD800)), split=False)
    take("kana", set(range(0x3000, 0x3100)) | set(range(0xFF00, 0xFFF0)) | set(range(0x1B000, 0x1B170)))
    for key, value in ranges.items():
        name = "range-" + re.sub(r"[^a-z0-9-]", "", key.lower())
        take(name, parse_unicode_range(value))
    take("additional", remaining.copy())
    assert not remaining
    return shards


def rename_subset(font: TTFont, family: str, variant: str, shard: str, version: str, license_text: str) -> None:
    name_table = font["name"]
    compact = re.sub(r"[^A-Za-z0-9]", "", f"ArmyKnifeMono{variant}{shard}")
    replacements = {
        1: family,
        2: "Regular",
        3: f"{compact};{version};army-knife",
        4: f"{family} Regular",
        6: f"{compact}-Regular"[:63],
        16: family,
        17: "Regular",
        18: f"{family} Regular",
        21: family,
        22: "Regular",
        25: compact[:63],
    }
    for record in list(name_table.names):
        if record.nameID in replacements:
            name_table.setName(replacements[record.nameID], record.nameID, record.platformID, record.platEncID, record.langID)
    # Sarasa's source name table does not carry the complete license. Add it;
    # fontTools defaults would otherwise discard these licensing name IDs.
    for name_id, value in {
        **replacements,
        10: f"Modified WOFF2 subset of Sarasa Mono {variant} {version} for army-knife. Unicode-range partitioning and internal font-name changes; original authors do not endorse this derivative.",
        11: "https://github.com/be5invis/Sarasa-Gothic",
        13: license_text,
        14: "https://openfontlicense.org/",
    }.items():
        name_table.setName(value, name_id, 3, 1, 0x409)


def build_sarasa_variant(job: tuple[str, str, dict, str, str, str]) -> dict:
    variant, ttf_path, ranges, output_path, version, license_text = job
    target = Path(output_path)
    target.mkdir(parents=True)
    source = TTFont(ttf_path, lazy=False, recalcTimestamp=False)
    all_codepoints = set(source.getBestCmap())
    all_variations = variation_pairs(source)
    selectors = {selector for selector, _ in all_variations}
    source.close()
    family = f"Army Knife Mono {variant}"
    css_rules = []
    records = []
    shards = make_shards(all_codepoints, ranges)
    for index, (name, characters) in enumerate(shards):
        font = TTFont(ttf_path, recalcTimestamp=False)
        options = subset.Options()
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.name_legacy = True
        options.layout_features = ["*"]
        options.layout_scripts = ["*"]
        options.notdef_outline = True
        options.recalc_timestamp = False
        options.hinting = True
        # Variation selectors must be explicitly included for cmap format 14.
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=characters | selectors)
        subsetter.subset(font)
        # Some source glyphs have multiple Unicode aliases. fontTools keeps
        # those aliases when their shared glyph survives layout closure. Keep
        # the outlines/features, but expose only this shard's requested cmap.
        for table in font["cmap"].tables:
            if table.format != 14:
                table.cmap = {cp: glyph for cp, glyph in table.cmap.items() if cp in characters}
        rename_subset(font, family, variant, name, version, license_text)
        font.flavor = "woff2"
        filename = name + ".woff2"
        font.save(target / filename)
        actual_characters = set(font.getBestCmap())
        if actual_characters != characters:
            raise ValueError(f"Character coverage changed in {variant}/{name}")
        actual_variations = variation_pairs(font)
        expected_variations = {(selector, cp) for selector, cp in all_variations if cp in characters}
        if actual_variations != expected_variations:
            raise ValueError(f"Variation sequence coverage changed in {variant}/{name}")
        font.close()
        span = unicode_range(characters)
        css_rules.append(
            "@font-face {\n"
            f"  font-family: '{family}';\n"
            "  font-style: normal;\n"
            "  font-weight: 400;\n"
            "  font-display: swap;\n"
            f"  src: url(./{filename}) format('woff2');\n"
            f"  unicode-range: {span};\n"
            "}\n"
        )
        records.append({"file": f"sarasa/{variant}/{filename}", "unicodeRange": span, "codepoints": len(characters), "charsetSha256": charset_digest(characters), "variationSequences": len(actual_variations)})
        if index % 25 == 0 or index == len(shards) - 1:
            print(f"Sarasa {variant}: {index + 1}/{len(shards)} shards", flush=True)
    (target / "font.css").write_text("\n".join(css_rules), encoding="utf-8")
    return {"variant": variant, "family": family, "codepoints": len(all_codepoints), "charsetSha256": charset_digest(all_codepoints), "variationSequences": len(all_variations), "shards": records}


def compose_locale_css(lock: dict, noto: dict, target: Path) -> None:
    for locale, mapping in lock["locales"].items():
        ui = mapping["ui"]
        mono = mapping["mono"]
        ui_css = noto[ui]["css"].replace("url(./files/", f"url(./noto/{ui}/files/")
        mono_css = (target / "sarasa" / mono / "font.css").read_text().replace("url(./", f"url(./sarasa/{mono}/")
        # CSS is copied into the locale entry (no CSS @import waterfall).
        (target / f"{locale}.css").write_text(
            "/* Self-hosted Noto Sans and Sarasa-derived fonts; see ./licenses/. */\n"
            + ui_css + "\n" + mono_css,
            encoding="utf-8",
        )


def verify_output(target: Path, expected_key: str | None = None) -> dict:
    manifest = json.loads((target / "manifest.json").read_text())
    if expected_key is not None and manifest["buildKey"] != expected_key:
        raise ValueError("Font build cache is stale; rebuild fonts")
    actual_files = {path.relative_to(target).as_posix() for path in target.rglob("*") if path.is_file() and path.name != "manifest.json"}
    if actual_files != set(manifest["files"]):
        raise ValueError("Missing or untracked font build assets")
    for name, record in manifest["files"].items():
        path = target / safe_relative(name)
        if path.stat().st_size != record["bytes"] or sha256(path) != record["sha256"]:
            raise ValueError(f"Font asset integrity mismatch: {name}")
    for path in target.rglob("*.css"):
        css = path.read_text()
        if "@import" in css:
            raise ValueError(f"Unexpected CSS import: {path}")
        for url in re.findall(r"url\(([^)]+)\)", css):
            if not url.startswith("./") or ":" in url or "?" in url or "#" in url:
                raise ValueError(f"Non-local font URL: {url}")
            relative = safe_relative(url[2:])
            if not (path.parent / relative).is_file():
                raise ValueError(f"Missing font URL: {path}: {url}")
    for result in manifest["sarasa"]:
        all_characters: set[int] = set()
        all_variations: set[tuple[int, int]] = set()
        for record in result["shards"]:
            path = target / safe_relative(record["file"])
            with TTFont(path, lazy=False) as font:
                characters = set(font.getBestCmap())
                if characters != parse_unicode_range(record["unicodeRange"]):
                    raise ValueError(f"CSS/cmap disagreement: {path}")
                if charset_digest(characters) != record["charsetSha256"]:
                    raise ValueError(f"Subset character hash mismatch: {path}")
                if all_characters & characters:
                    raise ValueError(f"Overlapping Sarasa subset ranges: {path}")
                all_characters.update(characters)
                all_variations.update(variation_pairs(font))
                if font["name"].getDebugName(1) != result["family"]:
                    raise ValueError(f"Derivative internal family not renamed: {path}")
                if "SIL Open Font License" not in (font["name"].getDebugName(13) or ""):
                    raise ValueError(f"Missing embedded font license: {path}")
                if "Renzhi Li" not in (font["name"].getDebugName(0) or ""):
                    raise ValueError(f"Missing original font copyright: {path}")
        if len(all_characters) != result["codepoints"] or charset_digest(all_characters) != result["charsetSha256"]:
            raise ValueError(f"Incomplete source character coverage: {result['variant']}")
        if len(all_variations) != result["variationSequences"]:
            raise ValueError(f"Incomplete variation sequence coverage: {result['variant']}")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=Path(os.environ.get("ARMY_KNIFE_FONT_CACHE", str(ROOT / ".cache/fonts"))))
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--jobs", type=int, default=min(4, os.cpu_count() or 1))
    parser.add_argument("--check", action="store_true", help="Verify existing assets without downloading or generating anything")
    args = parser.parse_args()
    key = build_key()
    if args.check:
        manifest = verify_output(args.output, key)
        print(f"Verified {len(manifest['files'])} local font assets ({manifest['totalBytes']:,} bytes)")
        return 0
    if (args.output / "manifest.json").exists():
        existing = json.loads((args.output / "manifest.json").read_text())
        if existing.get("buildKey") == key:
            verify_output(args.output, key)
            print("Verified cached font build; no downloads required.")
            return 0
    lock = json.loads(LOCK_PATH.read_text())
    args.cache.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    # A killed build may leave its work directory behind. Keep raw TTFs and
    # partial assets outside public/ so Vite can never deploy that residue.
    with tempfile.TemporaryDirectory(prefix="army-knife-fonts-") as temporary:
        target = Path(temporary) / "output"
        target.mkdir()
        license_files = copy_licenses(lock, target)
        noto = copy_noto(lock, args.cache, target)
        archive = download(lock["sarasa"], args.cache)
        extracted = Path(temporary) / "ttf"
        variants = sorted({mapping["mono"] for mapping in lock["locales"].values()})
        members = [f"SarasaMono{variant}-Regular.ttf" for variant in variants]
        with py7zr.SevenZipFile(archive, mode="r") as package:
            available = set(package.getnames())
            if not set(members) <= available:
                raise ValueError("Sarasa archive is missing required regional Regular fonts")
            for member in package.list():
                if member.filename in members and (member.is_directory or member.is_symlink):
                    raise ValueError(f"Unexpected Sarasa archive member: {member.filename}")
            package.extract(path=extracted, targets=members)
        license_text = (LICENSE_DIR / lock["sarasa"]["license"]).read_text()
        ranges_by_variant = {}
        for locale, mapping in lock["locales"].items():
            # English reuses J's Latin shard; Japanese supplies the CJK grouping.
            if locale != "en":
                ranges_by_variant[mapping["mono"]] = noto[mapping["ui"]]["ranges"]
        jobs = [(variant, str(extracted / f"SarasaMono{variant}-Regular.ttf"), ranges_by_variant[variant], str(target / "sarasa" / variant), lock["sarasa"]["version"], license_text) for variant in variants]
        with concurrent.futures.ProcessPoolExecutor(max_workers=max(1, min(args.jobs, 4))) as executor:
            sarasa_results = list(executor.map(build_sarasa_variant, jobs))
        compose_locale_css(lock, noto, target)
        files = {path.relative_to(target).as_posix(): {"bytes": path.stat().st_size, "sha256": sha256(path)} for path in sorted(target.rglob("*")) if path.is_file()}
        manifest = {"schema": 1, "buildKey": key, "fontToolsVersion": fontTools.__version__, "sources": lock, "licenses": license_files, "locales": lock["locales"], "sarasa": sarasa_results, "files": files, "totalBytes": sum(value["bytes"] for value in files.values())}
        (target / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
        verify_output(target, key)
        if args.output.exists():
            shutil.rmtree(args.output)
        shutil.move(str(target), args.output)
        print(f"Built and verified {len(files)} font assets ({manifest['totalBytes']:,} bytes).", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError) as error:
        print(f"Font build failed: {error}", file=sys.stderr)
        raise SystemExit(1) from error
