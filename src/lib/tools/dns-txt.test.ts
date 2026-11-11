import { describe, expect, it } from "vite-plus/test";
import { DNS_TXT_LIMITS, restoreDnsTxt, splitDnsTxt } from "./dns-txt";

const quote = (value: string) => '"' + value + '"';
const errorCode = (run: () => unknown, code: string) =>
  expect(run).toThrowError(expect.objectContaining({ code }));

describe("DNS TXT UTF-8 split / restore", () => {
  it("splits octets at 255 and reports only RDATA wire size", () => {
    const a = splitDnsTxt("a".repeat(255));
    expect(a.segments.map(s => s.bytes)).toEqual([255]);
    expect(a.wireBytes).toBe(256);
    expect(a.rdata).toBe(quote("a".repeat(255)));
    const b = splitDnsTxt("a".repeat(256));
    expect(b.segments.map(s => s.bytes)).toEqual([255, 1]);
    expect(b.wireBytes).toBe(258);
    expect(b.rdata).toBe('(\n  "' + "a".repeat(255) + '"\n  "a"\n)');
    expect(restoreDnsTxt(b.rdata)).toEqual(b);
  });
  it("joins bytes before decoding a UTF-8 scalar split across fragments", () => {
    const text = "verification=" + "x".repeat(241) + "あ";
    const report = splitDnsTxt(text);
    expect(report.dataBytes).toBe(257);
    expect(report.wireBytes).toBe(259);
    expect(report.segments).toEqual([
      { index: 1, bytes: 255, literal: quote("verification=" + "x".repeat(241) + "\\227") },
      { index: 2, bytes: 2, literal: '"\\129\\130"' },
    ]);
    expect(restoreDnsTxt(report.rdata).text).toBe(text);
    expect(restoreDnsTxt('"\\240\\159" "\\152\\128"').text).toBe("😀");
  });
  it("represents empty content and preserves parsed empty boundaries", () => {
    expect(splitDnsTxt("")).toEqual({
      text: "", dataBytes: 0, wireBytes: 1,
      segments: [{ index: 1, bytes: 0, literal: '""' }], rdata: '""',
    });
    const parsed = restoreDnsTxt('"" "a" ""');
    expect(parsed.text).toBe("a");
    expect(parsed.wireBytes).toBe(4);
    expect(parsed.segments.map(s => s.bytes)).toEqual([0, 1, 0]);
    expect(parsed.rdata).toBe('(\n  ""\n  "a"\n  ""\n)');
  });
  it("escapes quotes, slashes, controls and non-ASCII bytes deterministically", () => {
    const text = 'a"\\\0\t\n\r\u007féあ';
    const report = splitDnsTxt(text);
    expect(report.rdata).toBe('"a\\"\\\\\\000\\009\\010\\013\\127\\195\\169\\227\\129\\130"');
    expect(restoreDnsTxt(report.rdata).text).toBe(text);
  });
  it("quotes non-digit ASCII once; decimal escapes are three decimal digits", () => {
    expect(restoreDnsTxt('"\\n\\t\\;\\(\\)\\.\\"\\\\"').text).toBe('nt;()."\\');
    expect(restoreDnsTxt('"\\065\\032\\0489"').text).toBe("A 09");
    expect(restoreDnsTxt('"a;b()"').text).toBe("a;b()");
  });
  it("preserves BOM, NUL, CRLF and Unicode without normalization", () => {
    for (const text of ["\ufeffa", "\0", "\r\n", "e\u0301", "é", "😀漢字"]) {
      expect(restoreDnsTxt(splitDnsTxt(text).rdata).text).toBe(text);
    }
  });
  it("accepts outer ASCII whitespace and a single multiline group", () => {
    expect(restoreDnsTxt(' \r\n\t"abc"\r\n ').text).toBe("abc");
    expect(restoreDnsTxt(' (\r\n\t"a"\r\n "b" \t) \n').text).toBe("ab");
    expect(restoreDnsTxt('("a")').rdata).toBe('"a"');
    expect(restoreDnsTxt('"a"\t"b"').text).toBe("ab");
  });
  it("round trips all ASCII bytes, including every escaped control", () => {
    const text = Array.from({ length: 128 }, (_, n) => String.fromCharCode(n)).join("");
    expect(restoreDnsTxt(splitDnsTxt(text).rdata).text).toBe(text);
  });
  it("accepts exact text and decoded limits, rejecting excess atomically", () => {
    expect(DNS_TXT_LIMITS).toEqual({
      textBytes: 8192, rdataBytes: 65536, segments: 64, segmentBytes: 255, deferredCharacters: 2048,
    });
    for (const text of ["x".repeat(8192), "é".repeat(4096)]) {
      const report = splitDnsTxt(text);
      expect(report.dataBytes).toBe(8192);
      expect(restoreDnsTxt(report.rdata)).toEqual(report);
    }
    for (const text of ["x".repeat(8193), "é".repeat(4097), " ".repeat(100000)]) {
      errorCode(() => splitDnsTxt(text), "INPUT_TOO_LARGE");
    }
    const tooMuch = '(\n' + Array.from({ length: 33 }, () => quote("x".repeat(255))).join("\n") + '\n)';
    errorCode(() => restoreDnsTxt(tooMuch), "DNS_TXT_DATA_LIMIT");
  });
  it("bounds raw RDATA before trimming or parsing", () => {
    expect(restoreDnsTxt('""' + " ".repeat(65534)).dataBytes).toBe(0);
    for (const value of ['""' + " ".repeat(65535), "é".repeat(32769)]) {
      errorCode(() => restoreDnsTxt(value), "INPUT_TOO_LARGE");
    }
  });
  it("bounds segment bytes and segment count, including empty segments", () => {
    expect(restoreDnsTxt(quote("\\065".repeat(255))).dataBytes).toBe(255);
    errorCode(() => restoreDnsTxt(quote("\\065".repeat(256))), "DNS_TXT_SEGMENT_LIMIT");
    expect(restoreDnsTxt(Array(64).fill('""').join(" ")).wireBytes).toBe(64);
    errorCode(() => restoreDnsTxt(Array(65).fill('""').join(" ")), "DNS_TXT_COUNT_LIMIT");
  });
  it.each(["\ud800", "\udc00", "a\ud800b", "\ud800\ud800", "\udc00\ud800"])(
    "rejects unpaired UTF-16 rather than replacing %j", text => {
      errorCode(() => splitDnsTxt(text), "DNS_TXT_UNICODE");
    },
  );
  it.each(['"\\255"', '"\\192\\128"', '"\\227\\129"', '"\\237\\160\\128"', '"\\244\\144\\128\\128"'])(
    "rejects non-UTF-8 binary RDATA %j", value => {
      errorCode(() => restoreDnsTxt(value), "DNS_TXT_UTF8");
    },
  );
  it.each([
    "", " ", "()", "(", ")", '("a"', '"a")', '(("a"))', '("a") "b"',
    '"a""b"', '"a"\n"b"', '"a"\r"b"', '"a"\r\n"b"', '"a"\u00a0"b"',
    'TXT "a"', 'example.test. IN TXT "a"', 'a', '"a" ;comment', '("a";x\n)',
    '"unterminated', '"a\\', '"\\1"', '"\\12"', '"\\12a"', '"\\256"', '"\\999"',
    '"a\nb"', '"a\tb"', '"a\rb"', '"a\0b"', '"é"', '"\\é"', '"\\\n"',
    '"PRIVATE_DNS_TXT" trailing',
  ])("rejects unsupported syntax atomically and without echoing %j", value => {
    errorCode(() => restoreDnsTxt(value), "DNS_TXT_SYNTAX");
    try { restoreDnsTxt(value); } catch (error) {
      expect((error as Error).message).toBe("DNS_TXT_SYNTAX");
    }
  });
});
