import { describe, expect, it } from "vite-plus/test";
import { dispositionDisplay, inspectContentDisposition } from "./content-disposition";

describe("HTTP response Content-Disposition", () => {
  it("prefers the decoded extended filename over a quoted fallback regardless of order", () => {
    expect(inspectContentDisposition("Content-Disposition: Attachment; filename*=UTF-8'en'%E2%82%AC%20rates.csv; filename=\"EURO; rates.csv\"\r\n"))
      .toMatchObject({ disposition: "attachment", preferredFilename: "€ rates.csv", preferredSource: "filename*" });
  });
  it("keeps fallback names literal and unescapes only quoted pairs", () => {
    const r = inspectContentDisposition(' INLINE ; FILENAME = "a\\\"b\\\\c%20+;,=é.txt" ; x-note="a;b,c"');
    expect(r).toMatchObject({ disposition: "inline", filename: 'a"b\\c%20+;,=é.txt', preferredSource: "filename" });
    expect(r.parameters[1]).toMatchObject({ name: "x-note", value: "a;b,c" });
    expect(r.notes).toContain("extension");
    expect(r.filenameNotes).toContain("path");
    expect(r.filenameNotes).toContain("percent-literal");
  });
  it("decodes UTF-8 strictly, preserves a BOM and never converts plus into space", () => {
    expect(inspectContentDisposition("attachment;filename*=utf-8''%EF%BB%BF%E6%97%A5%E6%9C%AC+%2520.txt").preferredFilename).toBe("\ufeff日本+%20.txt");
    expect(inspectContentDisposition("attachment;filename*=UTF-8''").preferredFilename).toBe("");
    expect(inspectContentDisposition("attachment;filename*=UTF-8''").filenameNotes).toContain("empty");
  });
  it("maps ISO-8859-1 bytes without the browser's Windows-1252 alias", () => {
    const r = inspectContentDisposition("attachment;filename*=ISO-8859-1'fr'caf%E9%80.txt");
    expect(r.preferredFilename).toBe("café\u0080.txt");
    expect(r.filenameNotes).toContain("controls");
    expect(r.notes).toContain("legacy-charset");
  });
  it("preserves unsupported charsets without guessing a preferred filename", () => {
    const r = inspectContentDisposition("custom; filename=old.txt; filename*=shift_jis'ja'%83e.txt; x*=UTF-8''ok");
    expect(r).toMatchObject({ disposition: "custom", filename: "old.txt", preferredFilename: null, preferredSource: null });
    expect(r.parameters[1]).toMatchObject({ charset: "shift_jis", language: "ja", decoded: null });
    expect(r.notes).toEqual(expect.arrayContaining(["unknown-disposition", "unsupported-charset", "extension"]));
  });
  it("handles prototype-like names and a response without a filename", () => {
    const r = inspectContentDisposition("inline;__proto__=ok;constructor=ok");
    expect(r.preferredFilename).toBeNull();
    expect(r.parameters).toHaveLength(2);
  });
  it.each([
    ["../report.txt", "path"], ["report. ", "edge-whitespace"], ["report.", "trailing-dot"],
    ["CON.txt", "reserved"], ["..", "reserved"], ["a:b.txt", "platform-characters"],
    ["safe\u202eexe.txt", "controls"], ["a\u0000b", "controls"], ["a\u061cb", "controls"], ["a\u2028b", "controls"],
  ])("flags declared filename %s as %s without sanitizing it", (name, note) => {
    const r = inspectContentDisposition("attachment;filename*=UTF-8''" + encodeURIComponent(name));
    expect(r.preferredFilename).toBe(name);
    expect(r.filenameNotes).toContain(note);
  });
  it("also warns about an unsafe fallback even when filename* is preferred", () => {
    expect(inspectContentDisposition("attachment;filename=\"../bad\";filename*=UTF-8''ok").filenameNotes).toContain("path");
  });
  it("makes controls and direction characters visible for display", () => {
    expect(dispositionDisplay("a\n\u0000\u0080\u202eb\ufeff")).toBe('"a\\n\\u0000\\u0080\\u202eb\\ufeff"');
  });
  it.each(["", " \t", "\n"])("rejects empty input %j", (value) => {
    expect(() => inspectContentDisposition(value)).toThrow("DISPOSITION_EMPTY");
  });
  it.each([
    "attachment;filename=a;FILENAME=b", "attachment;x=a;X=b",
  ])("rejects duplicate parameters case-insensitively: %s", (value) => {
    expect(() => inspectContentDisposition(value)).toThrow("DISPOSITION_DUPLICATE");
  });
  it.each([
    "attachment, inline", "attachment;", "attachment; filename", "attachment;filename=", 'attachment;filename="broken',
    'attachment;filename="a"b', "attachment;filename=a b", "attachment\u0000", "attachment;filename=日本.txt",
    "Content-Type: text/plain", "attachment\nContent-Disposition: inline", "attachment\r\n filename=x",
  ])("rejects malformed fields and multiple/folded fields: %s", (value) => {
    expect(() => inspectContentDisposition(value)).toThrow("DISPOSITION_SYNTAX");
  });
  it.each([
    "UTF-8''%", "UTF-8''%2", "UTF-8''%GG", "UTF-8''%C0%AF", "UTF-8''%ED%A0%80", "UTF-8''%E2%82",
    '"UTF-8\'\'ok"', "UTF-8'bad_tag'ok", "UTF-8''raw*", "UTF-8''a'b", "''abc", "UTF-8'only-one-quote",
  ])("rejects invalid extended notation: %s", (value) => {
    expect(() => inspectContentDisposition("attachment;filename*=" + value)).toThrow("DISPOSITION_ENCODING");
  });
  it.each(["filename*0*=UTF-8''one", "filename*1=two"])("rejects MIME continuations: %s", (value) => {
    expect(() => inspectContentDisposition("attachment;" + value)).toThrow("DISPOSITION_CONTINUATION");
  });
  it("accepts every documented structural boundary", () => {
    expect(inspectContentDisposition("x".repeat(64)).disposition).toHaveLength(64);
    expect(inspectContentDisposition("attachment;" + "x".repeat(64) + "=x").parameters).toHaveLength(1);
    expect(inspectContentDisposition('attachment;filename="' + "a".repeat(1024) + '"').filename).toHaveLength(1024);
    expect(inspectContentDisposition("attachment" + Array.from({ length: 32 }, (_, i) => `;x${i}=a`).join("")).parameters).toHaveLength(32);
    expect(inspectContentDisposition("inline" + " ".repeat(8186)).disposition).toBe("inline");
  });
  it.each([
    "x".repeat(65), "attachment;" + "x".repeat(65) + "=a",
    'attachment;filename="' + "a".repeat(1025) + '"',
    "attachment" + Array.from({ length: 33 }, (_, i) => `;x${i}=a`).join(""),
  ])("rejects structural overflow without a partial result", (value) => {
    expect(() => inspectContentDisposition(value)).toThrow("DISPOSITION_LIMIT");
  });
  it("counts UTF-8 bytes before parsing", () => {
    expect(() => inspectContentDisposition("inline" + " ".repeat(8187))).toThrowError(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    expect(() => inspectContentDisposition('attachment;filename="' + "é".repeat(4096) + '"')).toThrowError(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
  });
});
