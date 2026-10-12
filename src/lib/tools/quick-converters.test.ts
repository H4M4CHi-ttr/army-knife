import { describe, expect, it } from "vite-plus/test";
import {
  convertDataUnits,
  convertCssUnits,
  convertRadixInteger,
  convertUnicodeEscape,
  createSlugs,
  normalizeUnicode,
  QUICK_LIMITS,
} from "./quick-converters";

const row = (result: ReturnType<typeof convertDataUnits>, unit: string) =>
  result.rows.find((item) => item.label === unit)?.value;

describe("data size / transfer rate conversion (#96)", () => {
  it("distinguishes SI from IEC and 1 byte from 8 bits", () => {
    const result = convertDataUnits("1", "MiB");
    expect(row(result, "B")).toBe("1,048,576");
    expect(row(result, "MB")).toBe("1.048576");
    expect(row(result, "b")).toBe("8,388,608");
    expect(convertDataUnits("1000", "kB").rows.find((r) => r.label === "MB")?.value)
      .toBe("1");
    expect(row(convertDataUnits("1024", "KiB"), "MiB")).toBe("1");
    expect(row(convertDataUnits("1", "B"), "b")).toBe("8");
  });

  it("converts rate units independently of storage size", () => {
    const rate = convertDataUnits("1", "MB/s", true);
    expect(row(rate, "Mbps")).toBe("8");
    expect(row(rate, "kB/s")).toBe("1,000");
    expect(row(rate, "MiB/s")).toBe("0.95367431640625");
    expect(() => convertDataUnits("1", "MB/s")).toThrowError();
  });

  it("handles negatives and exact high-precision decimals with BigInt", () => {
    expect(row(convertDataUnits("-1", "B"), "b")).toBe("-8");
    expect(row(convertDataUnits("0.125", "B"), "b")).toBe("1");
    expect(row(convertDataUnits("0.000000000000000000000001", "B"), "b")).toBe("0.000000000000000000000008");
    expect(row(convertDataUnits("999999999999999999999999", "B"), "b"))
      .toBe("7,999,999,999,999,999,999,999,992");
  });

  it("flags repeating fractions as approximate rather than asserting precision", () => {
    const value = row(convertDataUnits("1", "b"), "kB");
    expect(value).toBe("0.000125");
    const result = convertDataUnits("1", "B");
    expect(result.rows.find((r) => r.label === "GiB")!.value).toMatch(/^≈ /);
    expect(result.notice).toBe("rounded");
  });

  it.each(["1e3", "Infinity", "1.2.3", "", "1.".repeat(60), "0." + "1".repeat(25)])(
    "rejects invalid values %j", (input) => {
      expect(() => convertDataUnits(input, "B")).toThrowError();
    },
  );
});

describe("CSS relative lengths (#102)", () => {
  const ctx = { root: "16", element: "20", width: "1440", height: "900" };
  it("uses separate root and element font contexts", () => {
    const result = convertCssUnits("32", "px", ctx);
    expect(row(result, "rem")).toBe("2");
    expect(row(result, "em")).toBe("1.6");
    expect(row(convertCssUnits("1", "rem", ctx), "px")).toBe("16");
    expect(row(convertCssUnits("1", "em", ctx), "px")).toBe("20");
  });
  it("uses viewport width for vw and height for vh and permits zero/negative lengths", () => {
    expect(row(convertCssUnits("10", "vw", ctx), "px")).toBe("144");
    expect(row(convertCssUnits("10", "vh", ctx), "px")).toBe("90");
    expect(row(convertCssUnits("0", "px", ctx), "rem")).toBe("0");
    expect(row(convertCssUnits("-16", "px", ctx), "rem")).toBe("-1");
  });
  it("makes rounding visible instead of pretending exact equality", () => {
    const result = convertCssUnits("16", "px", ctx);
    expect(row(result, "vw")).toBe("≈ 1.111111");
    expect(result.notice).toBe("rounded");
  });
  it.each(["0", "-2", "NaN", "1e2", "a"])("rejects invalid root size %s", (root) => {
    expect(() => convertCssUnits("1", "px", { ...ctx, root })).toThrowError();
  });
  it("rejects very large values and unsupported units", () => {
    expect(() => convertCssUnits("1000001", "px", ctx)).toThrowError();
    expect(() => convertCssUnits("10", "pt" as never, ctx)).toThrowError();
  });
});

describe("signed integer radix conversion (#4)", () => {
  it("converts beyond JavaScript's safe integer range without losing digits", () => {
    const result = convertRadixInteger("9007199254740993", 10);
    expect(result.rows.map((item) => item.value)).toEqual([
      "100000000000000000000000000000000000000000000000000001",
      "400000000000000001",
      "9007199254740993",
      "20000000000001",
      "2GOSA7PA2GX",
    ]);
  });

  it("accepts signs, leading zeros and case-insensitive digits, then normalizes output", () => {
    expect(convertRadixInteger("+0002a", 16).rows.map((item) => item.value))
      .toEqual(["101010", "52", "42", "2A", "16"]);
    expect(convertRadixInteger("-00a", 36).rows.map((item) => item.value))
      .toEqual(["-1010", "-12", "-10", "-A", "-A"]);
    expect(convertRadixInteger("-000", 2).rows.every((item) => item.value === "0")).toBe(true);
  });

  it.each([
    ["2", 2], ["8", 8], ["G", 16], ["0x10", 16], ["1_000", 10],
    ["1.5", 10], ["+", 10], [" 10", 10], ["10 ", 10], ["１", 10],
  ] as const)("rejects unsupported integer syntax %j in base %i", (input, base) => {
    expect(() => convertRadixInteger(input, base)).toThrowError();
  });

  it("bounds valid input and rejects unsupported bases", () => {
    expect(convertRadixInteger("1".repeat(QUICK_LIMITS.radixBytes), 10).rows[2]?.value)
      .toBe("1".repeat(QUICK_LIMITS.radixBytes));
    expect(() => convertRadixInteger("1".repeat(QUICK_LIMITS.radixBytes + 1), 10))
      .toThrowError();
    expect(() => convertRadixInteger("10", 3)).toThrowError();
  });
});

describe("Unicode normalization (#106)", () => {
  it("compares canonical composing/decomposing sequences without modifying source", () => {
    const original = "e\u0301";
    const composed = normalizeUnicode(original, "NFC");
    expect(original).toBe("e\u0301");
    expect(composed.output).toBe("é");
    expect(composed.rows.find((r) => r.label.startsWith("NFC"))?.value).toBe("U+00E9");
    expect(composed.rows.find((r) => r.label.startsWith("NFD"))?.value).toBe("U+0065 U+0301");
    expect(normalizeUnicode("é", "NFD").output).toBe(original);
  });
  it("warns about compatibility changes while preserving emoji", () => {
    const result = normalizeUnicode("①💻", "NFKC");
    expect(result.output).toBe("1💻");
    expect(result.notice).toBe("compatibility");
    expect(normalizeUnicode("👩‍💻").output).toBe("👩‍💻");
  });
  it("reports unpaired surrogates and enforces its bounded input", () => {
    const report = normalizeUnicode("\ud800");
    expect(report.notice).toBe("unpaired");
    expect(() => normalizeUnicode("x".repeat(QUICK_LIMITS.inputBytes + 1))).toThrowError();
  });
});

describe("slug generation (#107)", () => {
  it("normalizes accents, punctuation, repeats and selected separators", () => {
    expect(createSlugs("Café Déjà Vu\nCafé Déjà Vu", "ascii").output)
      .toBe("cafe-deja-vu\ncafe-deja-vu-2");
    expect(createSlugs("HELLO, World!", "unicode", "_").output).toBe("hello_world");
    expect(createSlugs("foo\nfoo-2\nfoo").output).toBe("foo\nfoo-2\nfoo-3");
  });
  it("keeps Unicode scripts with no silent transliteration", () => {
    expect(createSlugs("東京 日本語 👩‍💻").output).toBe("東京-日本語");
    expect(() => createSlugs("東京", "ascii")).toThrowError();
  });
  it("rejects unsupported or oversized input", () => {
    expect(() => createSlugs("a\n".repeat(101))).toThrowError();
    expect(() => createSlugs("a".repeat(QUICK_LIMITS.inputBytes + 1))).toThrowError();
    expect(() => createSlugs("x", "unknown" as never)).toThrowError();
  });
});

describe("Unicode escape conversion (#109)", () => {
  const original = "A😀e\u0301";
  it("round trips UTF-16 escapes including astral surrogate pairs", () => {
    const encoded = convertUnicodeEscape(original, "js-utf16");
    expect(encoded.output).toBe("\\u0041\\uD83D\\uDE00\\u0065\\u0301");
    const decoded = convertUnicodeEscape(encoded.output, "js-utf16", "decode");
    expect(decoded.output).toBe(original);
  });
  it("round trips Unicode scalar and U+ notations", () => {
    const scalar = convertUnicodeEscape("A😀", "js-codepoint");
    expect(scalar.output).toBe("\\u{41}\\u{1F600}");
    expect(convertUnicodeEscape(scalar.output, "js-codepoint", "decode").output).toBe("A😀");
    const uplus = convertUnicodeEscape("A😀", "uplus");
    expect(uplus.output).toBe("U+0041 U+1F600");
    expect(convertUnicodeEscape(uplus.output, "uplus", "decode").output).toBe("A😀");
  });
  it.each([
    ["\\uD83D", "js-utf16"],
    ["\\u{110000}", "js-codepoint"],
    ["\\uD83D\\u0041", "js-utf16"],
    ["U+D800", "uplus"],
    ["U+110000", "uplus"],
    ["alert(1)", "js-codepoint"],
    ["\\u{}", "js-codepoint"],
    ["\\u{1F600}raw", "js-codepoint"],
  ] as const)("rejects invalid/unpaired escape %s", (input, notation) => {
    expect(() => convertUnicodeEscape(input, notation, "decode")).toThrowError();
  });
  it("rejects invalid raw surrogates and caps details without truncating output", () => {
    expect(() => convertUnicodeEscape("\ud800")).toThrowError();
    const result = convertUnicodeEscape("a".repeat(100), "uplus");
    expect(result.rows.length).toBe(64);
    expect(result.notice).toBe("partial");
    expect(result.output.split(" ").length).toBe(100);
  });
});
