import { describe, expect, it } from "vite-plus/test";
import { inspectForwarded } from "./forwarded";

describe("recorded Forwarded structure", () => {
  it("preserves field grouping, original names, values and source positions without trust inference", () => {
    expect(inspectForwarded('For=192.0.2.1;proto=https;host="example.test:8443", for="[2001:db8::1]:4711";by=_edge')).toEqual({
      elements: [
        { index: 1, parameters: [{ name: "For", value: "192.0.2.1" }, { name: "proto", value: "https" }, { name: "host", value: "example.test:8443" }], emptyParameterSlots: 0 },
        { index: 2, parameters: [{ name: "for", value: "[2001:db8::1]:4711" }, { name: "by", value: "_edge" }], emptyParameterSlots: 0 },
      ], emptyElements: 0,
    });
  });
  it("keeps values opaque, including invalid node/host/scheme semantics and prototype names", () => {
    expect(inspectForwarded('for=not-an-ip;host="not a host";proto="not a scheme";__proto__=x;constructor=y').elements[0]!.parameters).toEqual([
      { name: "for", value: "not-an-ip" }, { name: "host", value: "not a host" }, { name: "proto", value: "not a scheme" },
      { name: "__proto__", value: "x" }, { name: "constructor", value: "y" },
    ]);
    expect(inspectForwarded("for=unknown, for=_hidden").elements).toHaveLength(2);
  });
  it("decodes quoted pairs once and never splits quoted separators", () => {
    expect(inspectForwarded('for="a;b,c=1 \\"quote\\" \\\\ end";note="";x="\\a"').elements[0]!.parameters).toEqual([
      { name: "for", value: 'a;b,c=1 "quote" \\ end' }, { name: "note", value: "" }, { name: "x", value: "a" },
    ]);
    expect(inspectForwarded('for="\t ";x="\\\t"').elements[0]!.parameters.map(p => p.value)).toEqual(["\t ", "\t"]);
  });
  it("counts empty elements/parameter positions without silently changing recorded indices", () => {
    expect(inspectForwarded(' , ; ; , ;for=a;; \t, ,by=b; ')).toEqual({
      elements: [
        { index: 3, parameters: [{ name: "for", value: "a" }], emptyParameterSlots: 3 },
        { index: 5, parameters: [{ name: "by", value: "b" }], emptyParameterSlots: 1 },
      ], emptyElements: 3,
    });
  });
  it.each(["for=a;FOR=b", "x=a;X=b", "__proto__=x;__PrOtO__=y"])("rejects duplicate names within an element: %s", input => {
    expect(() => inspectForwarded(input)).toThrow(expect.objectContaining({ code: "FORWARDED_DUPLICATE" }));
  });
  it("allows the same name in distinct recorded elements", () => {
    expect(inspectForwarded("for=a, FOR=b").elements).toHaveLength(2);
  });
  it.each(["", " \t", ",,;;", "; ; ;"])("rejects a field with no recorded parameters: %j", input => {
    expect(() => inspectForwarded(input)).toThrow(expect.objectContaining({ code: "FORWARDED_EMPTY" }));
  });
  it.each([
    "Forwarded: for=a", "X-Forwarded-For: a", "for", "for=", "for =a", "for= a", "for\t=a", "for=\ta",
    "for=[::1]", "for=a:b", 'for="a" trailing', "for=a=b", 'for="unclosed', 'for="bad\\',
    "for=a\n", "for=a\r\n x=b", 'for="\0"', 'for="\u007f"', 'for="é"', "for=é", 'for="\\\n"',
  ])("rejects unsupported/malformed syntax atomically: %j", input => {
    expect(() => inspectForwarded(input)).toThrow(expect.objectContaining({ code: "FORWARDED_SYNTAX" }));
  });
  it("accepts every HTTP token character and ASCII quoted value", () => {
    const token = "!#$%&'*+-.^_|~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" + String.fromCharCode(96);
    expect(inspectForwarded(token + "=" + token).elements[0]!.parameters[0]).toEqual({ name: token, value: token });
    for (let code = 32; code <= 126; code++) {
      const value = String.fromCharCode(code);
      const quoted = value === '"' || value === "\\" ? "\\" + value : value;
      expect(inspectForwarded('x="' + quoted + '"').elements[0]!.parameters[0]!.value).toBe(value);
    }
  });
  it("enforces raw byte limits before syntax or trimming and never echoes rejected input", () => {
    expect(inspectForwarded("for=a" + " ".repeat(8187)).elements).toHaveLength(1);
    for (const input of ["for=a" + " ".repeat(8188), "é".repeat(4097)]) {
      expect(() => inspectForwarded(input)).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    }
    try { inspectForwarded("PRIVATE_FORWARDED_2719"); } catch (error) { expect(String(error)).not.toContain("PRIVATE_FORWARDED_2719"); }
  });
  it("enforces exact nonempty element and raw comma position boundaries", () => {
    const list = Array.from({ length: 32 }, (_, i) => "for=_" + i).join(",");
    expect(inspectForwarded(list).elements).toHaveLength(32);
    expect(() => inspectForwarded(list + ",for=_extra")).toThrow(expect.objectContaining({ code: "FORWARDED_LIMIT" }));
    expect(inspectForwarded("for=a" + ",".repeat(63)).emptyElements).toBe(63);
    expect(() => inspectForwarded("for=a" + ",".repeat(64))).toThrow(expect.objectContaining({ code: "FORWARDED_LIMIT" }));
  });
  it("enforces per-element parameter and raw semicolon position boundaries", () => {
    const pairs = Array.from({ length: 16 }, (_, i) => "x" + i + "=v").join(";");
    expect(inspectForwarded(pairs).elements[0]!.parameters).toHaveLength(16);
    expect(() => inspectForwarded(pairs + ";extra=v")).toThrow(expect.objectContaining({ code: "FORWARDED_LIMIT" }));
    expect(inspectForwarded("for=a" + ";".repeat(31)).elements[0]!.emptyParameterSlots).toBe(31);
    expect(() => inspectForwarded("for=a" + ";".repeat(32))).toThrow(expect.objectContaining({ code: "FORWARDED_LIMIT" }));
    expect(() => inspectForwarded(";".repeat(32) + ",for=a")).toThrow(expect.objectContaining({ code: "FORWARDED_LIMIT" }));
  });
});
