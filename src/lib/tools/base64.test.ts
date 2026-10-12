import { describe, expect, it } from "vite-plus/test";
import { BASE64_LIMITS, transformBase64 } from "./base64";

const encode = (value: string, variant: "standard" | "url" = "standard") =>
  transformBase64(value, "encode", variant);
const decode = (value: string, variant: "standard" | "url" = "standard") =>
  transformBase64(value, "decode", variant);

describe("strict browser-local Base64 text converter", () => {
  it("encodes RFC 4648 vectors, empty input, and byte counts", () => {
    expect(encode("")).toEqual({ output: "", inputBytes: 0, outputBytes: 0 });
    expect(encode("f").output).toBe("Zg==");
    expect(encode("fo").output).toBe("Zm8=");
    expect(encode("foo").output).toBe("Zm9v");
    expect(encode("foob").output).toBe("Zm9vYg==");
    expect(encode("fooba").output).toBe("Zm9vYmE=");
    expect(encode("foobar").output).toBe("Zm9vYmFy");
    expect(encode("こんにちは 👋")).toEqual({
      output: "44GT44KT44Gr44Gh44GvIPCfkYs=",
      inputBytes: 20,
      outputBytes: 28,
    });
  });

  it("supports Base64URL without padding, strict alphabets, and both padding styles", () => {
    expect(encode("💻", "standard").output).toBe("8J+Suw==");
    expect(encode("💻", "url").output).toBe("8J-Suw");
    expect(decode("8J-Suw", "url").output).toBe("💻");
    expect(decode("8J-Suw==", "url").output).toBe("💻");
    expect(decode("8J+Suw==", "standard").output).toBe("💻");
    expect(decode("Zg").output).toBe("f");
    expect(decode("Zg==").output).toBe("f");
    expect(decode("Zm8").output).toBe("fo");
    expect(() => decode("8J+Suw", "url")).toThrowError("BASE64_INVALID_INPUT");
    expect(() => decode("8J-Suw", "standard")).toThrowError("BASE64_INVALID_INPUT");
  });

  it("rejects malformed input, invalid lengths, whitespace, and noncanonical pad bits", () => {
    for (const bad of ["A", "A===", "Zg=", "Zg===", "Zg==\n", " Zg==", "Zg== ", "Z h", "Zg!!", "Zh", "Zm9="]) {
      expect(() => decode(bad), bad).toThrowError("BASE64_INVALID_INPUT");
    }
    expect(() => decode("Zg", "bad" as "url")).toThrowError("INVALID_REQUEST");
    expect(() => transformBase64("hi", "bad" as "encode", "standard")).toThrowError("INVALID_REQUEST");
  });

  it("preserves UTF-8 BOM and rejects invalid UTF-8 and lone surrogates", () => {
    expect(decode("77u/Qk9N").output).toBe("\uFEFFBOM");
    expect(encode(decode("77u/Qk9N").output).output).toBe("77u/Qk9N");
    for (const invalid of ["/w==", "//8=", "wA=="]) {
      expect(() => decode(invalid), invalid).toThrowError("INVALID_UTF8");
    }
    expect(() => encode("\ud800")).toThrowError("BASE64_INVALID_TEXT");
    expect(() => encode("\udc00")).toThrowError("BASE64_INVALID_TEXT");
    expect(encode("\ud83d\udcbb").output).toBe("8J+Suw==");
  });

  it("enforces limits before expensive work without silently truncating results", () => {
    const max = BASE64_LIMITS.inputBytes;
    const raw = "a".repeat(max);
    expect(encode(raw).inputBytes).toBe(max);
    expect(decode("YWFh".repeat(max / 4)).output).toBe("a".repeat((max / 4) * 3));
    expect(() => encode("a".repeat(max + 1))).toThrowError("INPUT_TOO_LARGE");
    expect(() => encode("日".repeat(Math.ceil(max / 3) + 1))).toThrowError("INPUT_TOO_LARGE");
    expect(() => decode("a".repeat(max + 1))).toThrowError("INPUT_TOO_LARGE");
  });
});
