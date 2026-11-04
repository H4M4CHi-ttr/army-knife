import { describe, expect, it } from "vite-plus/test";
import { inspectTraceContext, TRACE_CONTEXT_LIMITS } from "./trace-context";

const parent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
const inspect = (state = "") => inspectTraceContext(parent, state);

describe("W3C Level 1 recorded Trace Context", () => {
  it("keeps IDs exact and vendor order opaque", () => {
    expect(inspect("rojo=00f067aa0ba902b7,congo=t61rcWkgMzE")).toEqual({
      traceparent: parent, version: "00", traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
      parentId: "00f067aa0ba902b7", flags: "01", sampled: true, otherFlags: "00",
      entries: [{ position: 1, key: "rojo", value: "00f067aa0ba902b7" }, { position: 2, key: "congo", value: "t61rcWkgMzE" }],
      emptyMembers: 0,
    });
    expect(inspectTraceContext("00-00000000000000000000000000000001-0000000000000001-00").traceId).toBe("00000000000000000000000000000001");
  });
  it("masks the sampled bit for every flag byte without losing other bits", () => {
    for (let n = 0; n < 256; n++) {
      const flags = n.toString(16).padStart(2, "0");
      expect(inspectTraceContext(parent.slice(0, -2) + flags)).toMatchObject({ flags, sampled: Boolean(n & 1), otherFlags: (n & 254).toString(16).padStart(2, "0") });
    }
  });
  it.each([
    "", parent.toUpperCase(), parent + "-extra", parent.slice(0, -1), "traceparent: " + parent,
    parent + "\n", "\u00a0" + parent, parent.replace("4bf", "4Bf"), parent.replace("00f0", "00F0"),
    parent.replace("4bf92f3577b34da6a3ce929d0e0e4736", "0".repeat(32)), parent.replace("00f067aa0ba902b7", "0".repeat(16)),
    parent.replace(/.$/, "g"), parent.replace(/.$/, "\0"), `${parent},${parent}`,
  ])("rejects malformed traceparent without echoing input: %j", value => {
    expect(() => inspectTraceContext(value)).toThrow("TRACE_PARENT_SYNTAX");
  });
  it("distinguishes forbidden and unsupported versions", () => {
    expect(() => inspectTraceContext("ff" + parent.slice(2))).toThrow("TRACE_PARENT_SYNTAX");
    for (const version of ["01", "02", "fe"]) expect(() => inspectTraceContext(version + parent.slice(2))).toThrow("TRACE_CONTEXT_VERSION");
  });
  it("accepts outer ASCII OWS and accounts for empty members", () => {
    expect(inspectTraceContext(` \t${parent}\t `, " , \t, a= opaque  value \t, b=two, ")).toMatchObject({ traceparent: parent, emptyMembers: 3, entries: [{ position: 1, key: "a", value: " opaque  value" }, { position: 2, key: "b", value: "two" }] });
    expect(inspect().entries).toEqual([]); expect(inspect().emptyMembers).toBe(0);
    expect(inspect(" \t").emptyMembers).toBe(1);
    expect(inspect(",".repeat(31)).emptyMembers).toBe(32);
    expect(inspect("a=x,\t,b=y").entries.map(e => e.key)).toEqual(["a", "b"]);
  });
  it.each(["a", "a0_*/-", "a".repeat(256), "1@a", "a@b", `${"1".repeat(241)}@${"z".repeat(14)}`, "proto__@a", "constructor", "tostring"])("accepts key %s", key => {
    expect(inspect(`${key}=x`).entries[0]?.key).toBe(key);
  });
  it.each(["1", "A", "_a", "a.b", "a:b", "@a", "a@", "a@1", "a@@b", "a@b@c", "a".repeat(257), `${"a".repeat(242)}@b`, `a@${"b".repeat(15)}`, "__proto__"])("rejects invalid key %s", key => {
    expect(() => inspect(`${key}=x`)).toThrow("TRACE_STATE_SYNTAX");
  });
  it.each(["a=", "a= \t", "a =x", "a\t=x", "a=\tx", "a=x\ty", "a=x=y", "a=é", "a=x\nb=y", "a=x\rb=y", "a=\x7f", "a=\x1f", "a=x\u00a0", "tracestate: a=x", "a=x,a=y", "constructor=x,constructor=y"])("rejects invalid tracestate %j", state => {
    expect(() => inspect(state)).toThrow("TRACE_STATE_SYNTAX");
  });
  it("preserves inert markup and arbitrary allowed ASCII without decoding", () => {
    const value = "<script>alert('PRIVATE_TRACE_9173')</script> https://example.invalid/%2F+?&";
    expect(inspect(`a=${value}`).entries[0]?.value).toBe(value);
    const printable = Array.from({ length: 94 }, (_, i) => String.fromCharCode(i + 33)).filter(c => c !== "," && c !== "=").join("");
    expect(inspect(`a= ${printable}`).entries[0]?.value).toBe(" " + printable);
  });
  it("enforces value, slot and raw UTF-8 byte bounds without trimming first", () => {
    expect(TRACE_CONTEXT_LIMITS).toEqual({ parentBytes: 128, stateBytes: 512, members: 32 });
    expect(inspect("a=" + "x".repeat(256)).entries[0]?.value).toHaveLength(256);
    expect(() => inspect("a=" + "x".repeat(257))).toThrow("TRACE_STATE_SYNTAX");
    const list = Array.from({ length: 32 }, (_, i) => `v${i}=x`).join(",");
    expect(inspect(list).entries).toHaveLength(32);
    expect(() => inspect(list + ",")).toThrow("TRACE_STATE_MEMBERS");
    expect(() => inspect(",".repeat(32))).toThrow("TRACE_STATE_MEMBERS");
    expect(inspectTraceContext(parent + " ".repeat(73)).traceparent).toBe(parent);
    expect(() => inspectTraceContext(parent + " ".repeat(74))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(inspect("a=x" + " ".repeat(509)).entries).toHaveLength(1);
    expect(() => inspect("a=x" + " ".repeat(510))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => inspect("é".repeat(257))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
  });
});
