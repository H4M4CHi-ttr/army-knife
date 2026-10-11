import { describe, expect, it } from "vite-plus/test";
import { inspectUnicode, UNICODE_LIMITS } from "./unicode";

describe("Unicode inspector", () => {
  it("detects invisible format characters without changing the input", () => {
    const input = "pay\u200bload\u202e.txt\ufeff";
    const result = inspectUnicode(input);
    expect(result.findings.map((finding) => finding.codePoint)).toEqual([
      "U+200B",
      "U+202E",
      "U+FEFF",
    ]);
    expect(result.visualized).toBe("pay⟦U+200B⟧load⟦U+202E⟧.txt⟦U+FEFF⟧");
    expect(input).toBe("pay\u200bload\u202e.txt\ufeff");
  });

  it("tracks UTF-16 and code-point offsets separately across emoji and CRLF", () => {
    const result = inspectUnicode("A😀\r\nB\u200b");
    expect(result).toMatchObject({ utf16Length: 7, codePoints: 6, lineCount: 2 });
    expect(result.findings[0]).toMatchObject({ utf16Offset: 6, position: 6, line: 2, column: 2 });
  });

  it("recognizes legitimate joiners and variation selectors without calling them malicious", () => {
    const result = inspectUnicode("👩\u200d💻 ✈\ufe0f");
    expect(result.findings.map((finding) => finding.kind)).toEqual(["joiner", "variation"]);
    expect(result.findings[1]?.name).toBe("VARIATION SELECTOR-16");
    expect(inspectUnicode(String.fromCodePoint(0xe0100)).findings[0]?.name).toBe(
      "VARIATION SELECTOR-17",
    );
  });

  it("finds supplementary tag characters and unpaired surrogates", () => {
    expect(inspectUnicode(String.fromCodePoint(0xe0061)).findings[0]).toMatchObject({
      codePoint: "U+E0061",
      kind: "tag",
      name: "TAG a",
      escape: "\\u{e0061}",
    });
    expect(inspectUnicode("\ud800").findings[0]?.kind).toBe("invalid");
  });

  it("separates ordinary whitespace from unusual spaces and optional control inspection", () => {
    expect(inspectUnicode("a \t\r\n").totalFindings).toBe(0);
    expect(inspectUnicode("a \t\r\n", true).totalFindings).toBe(3);
    expect(inspectUnicode("\u00a0\u3000").findings.map((finding) => finding.kind)).toEqual([
      "space",
      "space",
    ]);
    expect(inspectUnicode("x\r\ny\rz\n").lineCount).toBe(4);
  });

  it("reports normalization differences and UTF-8 size", () => {
    expect(inspectUnicode("e\u0301")).toMatchObject({ isNfc: false, isNfkc: false, utf8Bytes: 3 });
    expect(inspectUnicode("Ａ")).toMatchObject({ isNfc: true, isNfkc: false });
  });

  it("counts every finding while bounding the display and rejecting oversized input", () => {
    const report = inspectUnicode("\u200b".repeat(UNICODE_LIMITS.findings + 1));
    expect(report.totalFindings).toBe(UNICODE_LIMITS.findings + 1);
    expect(report.findings).toHaveLength(UNICODE_LIMITS.findings);
    expect(report.truncated).toBe(true);
    const preview = inspectUnicode("a".repeat(UNICODE_LIMITS.previewCharacters + 1));
    expect(preview.previewTruncated).toBe(true);
    expect(preview.visualized).toHaveLength(UNICODE_LIMITS.previewCharacters);
    expect(() => inspectUnicode("あ".repeat(180_000))).toThrow(
      expect.objectContaining({ code: "INPUT_TOO_LARGE" }),
    );
  });
});
