import { describe, expect, it } from "vite-plus/test";
import { ToolError } from "./errors";
import { decodePgTextArray, encodePgTextArray } from "./pg-text-array";

function rejects(run: () => unknown, code: string) {
  expect(run).toThrowError(expect.objectContaining({ code }));
}

describe("PostgreSQL text[] values", () => {
  it.each([
    ["{}", []],
    [" \t{ \r\n\v\f }\n", []],
    ["{NULL,nUlL,Null}", [null, null, null]],
    [String.raw`{NULL,"NULL",N\ULL,""}`, [null, "NULL", "NULL", ""]],
    ['{"", " ", "\t"}', ["", " ", "\t"]],
    ["{  a b \t, c \r\n}", ["a b", "c"]],
    [String.raw`{\ a\ ,\ \ }`, [" a ", "  "]],
    [String.raw`{a\,b,\{x\},a\"b,c\\d}`, ["a,b", "{x}", 'a"b', "c\\d"]],
    ["{1,9007199254740993,true,NaN}", ["1", "9007199254740993", "true", "NaN"]],
    ['{"é","日本語","😀","\ufeff"}', ["é", "日本語", "😀", "\ufeff"]],
    ["{nullx,NULLx,null ; }", ["nullx", "NULLx", "null ;"]],
    ["{\u00a0a\u00a0}", ["\u00a0a\u00a0"]],
    ['{"a\nb\rc\td\ve\ff"}', ["a\nb\rc\td\ve\ff"]],
  ] as const)("decodes %j without coercion or whitespace loss", (input, values) => {
    const result = decodePgTextArray(input);
    expect(result.values).toEqual(values);
    expect(JSON.parse(result.json)).toEqual(values);
    expect(result.dimensions).toBe(values.length ? 1 : 0);
  });

  it("encodes every string with literal backslash/quote escaping, distinguishing null and empty", () => {
    const result = encodePgTextArray('["a,b",null,"NULL","","a\\\"b","c\\\\d","日本語"]');
    expect(result.array).toBe(String.raw`{"a,b",NULL,"NULL","","a\"b","c\\d","日本語"}`);
    expect(result.values).toEqual(["a,b", null, "NULL", "", 'a"b', "c\\d", "日本語"]);
    expect(result.nullCount).toBe(1); expect(result.emptyCount).toBe(1);
    expect(result.dimensions).toBe(1);
  });
  it("encodes [] as a zero-dimensional PostgreSQL empty array", () => {
    expect(encodePgTextArray("[]")).toMatchObject({ array: "{}", json: "[]", dimensions: 0, nullCount: 0, emptyCount: 0 });
  });
  it("keeps numeric-looking strings and prototype-looking strings verbatim", () => {
    const result = encodePgTextArray('["9007199254740993","01","__proto__","constructor"]');
    expect(result.array).toBe('{"9007199254740993","01","__proto__","constructor"}');
  });
  it.each(["", "null", "[]", "ARRAY[1]", "'{x}'", "{}::text[]", "{x}junk", "{}{}", "{", "}",
    "{,}", "{a,}", "{,a}", "{a,,b}", '{""x}', '{x"y"}', '{"a""b"}', '{"a\\}', "{a\\}", "\ufeff{}", "\u00a0{}"])(
    "rejects malformed values or SQL wrappers %j atomically", input => rejects(() => decodePgTextArray(input), "PG_ARRAY_SYNTAX"),
  );
  it.each(["{{x}}", "{ { } }", "[1:1]={x}", "[0:1]={a,b}"])("refuses dimensions rather than discarding them: %j", input => {
    rejects(() => decodePgTextArray(input), "PG_ARRAY_DIMENSIONS");
  });
  it.each(["[", "[,]", '["x",]', "[NaN]", "\ufeff[]"])("rejects malformed JSON %j", input => {
    rejects(() => encodePgTextArray(input), "PG_ARRAY_JSON_SYNTAX");
  });
  it.each(["{}", "null", '"x"', "1", "[1]", "[false]", "[{}]", '[null,["x"]]'])("requires flat JSON string/null arrays: %j", input => {
    rejects(() => encodePgTextArray(input), "PG_ARRAY_JSON_SHAPE");
  });
  it.each(["{\u0000}", "{}\u0000ignored", "{\ud800}", "{\udc00}"])("rejects NUL or malformed UTF-16 in source %j", input => {
    rejects(() => decodePgTextArray(input), "PG_ARRAY_TEXT");
  });
  it.each(['["\\u0000"]', '["\\ud800"]', '["\\udc00"]'])("rejects non-text JSON string scalars %j", input => {
    rejects(() => encodePgTextArray(input), "PG_ARRAY_TEXT");
  });
  it("accepts valid escaped JSON surrogate pairs and embedded BOM", () => {
    expect(encodePgTextArray('["\\ud83d\\ude00","\\ufeff"]').array).toBe('{"😀","\ufeff"}');
  });
  it("enforces raw bytes before trimming and accepts the exact 8192-byte edge", () => {
    expect(decodePgTextArray(" ".repeat(8190) + "{}").values).toEqual([]);
    rejects(() => decodePgTextArray(" ".repeat(8191) + "{}"), "INPUT_TOO_LARGE");
    for (const convert of [decodePgTextArray, encodePgTextArray]) {
      const input = convert === decodePgTextArray ? '{"' + "é".repeat(4094) + '"}' : '["' + "é".repeat(4094) + '"]';
      expect(convert(input).values).toEqual(["é".repeat(4094)]);
      rejects(() => convert(input + "é"), "INPUT_TOO_LARGE");
    }
  });
  it("accepts all 256 items and rejects item 257 in both directions", () => {
    const pg = "{" + Array(256).fill("x").join(",") + "}";
    expect(decodePgTextArray(pg).values).toHaveLength(256);
    expect(encodePgTextArray(JSON.stringify(Array(256).fill(null))).nullCount).toBe(256);
    rejects(() => decodePgTextArray("{" + Array(257).fill("x").join(",") + "}"), "PG_ARRAY_COUNT");
    rejects(() => encodePgTextArray(JSON.stringify(Array(257).fill(null))), "PG_ARRAY_COUNT");
  });
  it("accepts exactly 32768 output bytes and refuses complete-looking truncated expansion", () => {
    const result = decodePgTextArray('{"' + "\u0001".repeat(5460) + '"}');
    expect(new TextEncoder().encode(result.json)).toHaveLength(32768);
    expect(JSON.parse(result.json)).toEqual(["\u0001".repeat(5460)]);
    rejects(() => decodePgTextArray('{"' + "\u0001".repeat(5461) + '"}'), "PG_ARRAY_OUTPUT_LIMIT");
  });
  it("round-trips all non-NUL ASCII scalars, Unicode, null and empty without interpreting escapes", () => {
    const values = [...Array.from({ length: 127 }, (_, i) => String.fromCharCode(i + 1)), "日本語😀", "\\n", null, ""];
    const encoded = encodePgTextArray(JSON.stringify(values));
    expect(decodePgTextArray(encoded.array).values).toEqual(values);
  });
  it("uses stable input-free errors", () => {
    try { decodePgTextArray('{PRIVATE_PG_ARRAY_7301"}'); throw new Error("accepted"); }
    catch (error) { expect(error).toBeInstanceOf(ToolError); expect(String(error)).not.toContain("PRIVATE_PG_ARRAY_7301"); }
  });
});
