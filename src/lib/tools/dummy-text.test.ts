import { describe, expect, it } from "vite-plus/test";
import { DUMMY_LIMITS, generateDummyText } from "./dummy-text";

describe("reproducible local dummy text", () => {
  it("honors seed, language and unit", () => {
    const args = {locale:"ja" as const,unit:"paragraphs" as const,count:3,seed:42};
    const first = generateDummyText(args);
    expect(generateDummyText(args)).toBe(first);
    expect(first.split("\n\n")).toHaveLength(3);
    expect(generateDummyText({...args,seed:43})).not.toBe(first);
    expect(generateDummyText({...args,locale:"en"})).not.toBe(first);
    expect(generateDummyText({...args,unit:"sentences",count:2}).match(/\./g)).toHaveLength(2);
  });
  it("supports zero and Unicode scalar character count without truncating surrogate pairs", () => {
    expect(generateDummyText({locale:"la",unit:"sentences",count:0,seed:0})).toBe("");
    const input={locale:"ko" as const,unit:"characters" as const,count:1000,seed:0};
    expect(Array.from(generateDummyText(input))).toHaveLength(1000);
    expect(generateDummyText({...input,count:1})).toHaveLength(1);
    expect(generateDummyText({...input,count:DUMMY_LIMITS.characters}).length).toBe(DUMMY_LIMITS.characters);
  });
  it("rejects out-of-range and invalid options", () => {
    const input={locale:"en" as const,unit:"paragraphs" as const,count:1,seed:1};
    expect(() => generateDummyText({...input,count:31})).toThrowError("DUMMY_INVALID_OPTIONS");
    expect(() => generateDummyText({...input,seed:-1})).toThrowError("DUMMY_INVALID_OPTIONS");
    expect(() => generateDummyText({...input,locale:"unknown" as "en"})).toThrowError("DUMMY_INVALID_OPTIONS");
    expect(() => generateDummyText({...input,count:NaN})).toThrowError("DUMMY_INVALID_OPTIONS");
  });
});
