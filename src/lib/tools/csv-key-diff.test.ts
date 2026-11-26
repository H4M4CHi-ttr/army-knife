import { describe, expect, it } from "vite-plus/test";
import { compareCsvKeys, CSV_DIFF_LIMITS, type CsvDiffInput } from "./csv-key-diff";
import { CSV_KEY_DIFF_SAMPLE } from "./csv-key-diff-sample";
import { scanDelimited } from "./delimited";

function input(before: string, after: string, keys = ["id"]): CsvDiffInput {
  return { before: { text: before, format: "csv" }, after: { text: after, format: "csv" }, keys };
}

describe("CSV/TSV exact key diff", () => {
  it("separates schema from rows and emits deterministic complete CSV", () => {
    const diff = compareCsvKeys(CSV_KEY_DIFF_SAMPLE);
    expect(diff.counts).toEqual({ added: 1, removed: 1, updated: 1, unchanged: 0 });
    expect(diff.columns).toEqual({ added: ["region"], removed: ["legacy"] });
    expect(diff.preview).toEqual([
      { change: "updated", key: ["001"], cells: [
        { column: "name", before: "Ada", after: "Ada Lovelace" },
        { column: "legacy", before: "x" },
        { column: "region", after: "UK" },
      ] },
      { change: "removed", key: ["002"], cells: [{ column: "name", before: "Lin" }, { column: "legacy", before: "y" }] },
      { change: "added", key: ["003"], cells: [{ column: "name", after: "Jo" }, { column: "region", after: "EU" }] },
    ]);
    expect(diff.exportText).toBe([
      "kind,change,row,column,before,after",
      'column,removed,,"legacy",,',
      'column,added,,"region",,',
      'key,updated,1,"id","001","001"',
      'cell,updated,1,"name","Ada","Ada Lovelace"',
      'cell,removed,1,"legacy","x",',
      'cell,added,1,"region",,"UK"',
      'key,removed,2,"id","002",',
      'cell,removed,2,"name","Lin",',
      'cell,removed,2,"legacy","y",',
      'key,added,3,"id",,"003"',
      'cell,added,3,"name",,"Jo"',
      'cell,added,3,"region",,"EU"',
      "",
    ].join("\r\n"));
  });

  it("compares all values as strings, preserving large IDs, case, spacing and Unicode distinctions", () => {
    const ids = ["001", "1", "9007199254740992", "9007199254740993", "A", "a", " x", "x ", "é", "e\u0301", "NULL"];
    const before = "id,value\n" + ids.map(id => `${id},same`).join("\n");
    const after = "value,id\r\n" + [...ids].reverse().map(id => `same,${id}`).join("\r\n");
    expect(compareCsvKeys(input(before, after)).counts).toEqual({
      added: 0, removed: 0, updated: 0, unchanged: ids.length,
    });
  });

  it("uses collision-free tuples, mixes CSV with quoted TSV, and preserves embedded CR/LF and quotes", () => {
    const before = '\uFEFFid,code,value\r\n"a,b",c,"a\rb\nc\r\n""d"""\r\na,"b,c",old\r\n';
    const after = 'code\tid\tvalue\rc\ta,b\t"a\rb\nc\r\n""d"""\rb,c\ta\t"new\tcell"';
    const source = input(before, after, ["id", "code"]);
    source.after.format = "tsv";
    const result = compareCsvKeys(source);
    expect(result.counts).toEqual({ updated: 1, unchanged: 1, removed: 0, added: 0 });
    expect(result.preview[0]).toEqual({
      change: "updated", key: ["a", "b,c"], cells: [{ column: "value", before: "old", after: "new\tcell" }],
    });
    expect(() => compareCsvKeys(input(before, "id,code,value", ["id", "id"]))).toThrow("CSV_DIFF_MISSING_KEY");
  });

  it("treats a schema-only difference independently, including header-only input", () => {
    const result = compareCsvKeys(input("id,x\n1,old", "id,y\n1,new"));
    expect(result.counts.updated).toBe(1);
    expect(result.preview[0].cells).toEqual([{ column: "x", before: "old" }, { column: "y", after: "new" }]);
    expect(result.exportText.match(/column,/g)).toHaveLength(3);
    expect(compareCsvKeys(input("id,value", "id,value\r\n")).counts.unchanged).toBe(0);
  });

  it.each([
    ["id,id\n1,2", "id,v\n1,2", "CSV_DIFF_HEADER"],
    ['id,""\n1,2', "id,v\n1,2", "CSV_DIFF_HEADER"],
    ['id," \u00a0"\n1,2', "id,v\n1,2", "CSV_DIFF_HEADER"],
    ["id,\u202efoo\n1,2", "id,v\n1,2", "CSV_DIFF_HEADER"],
    ["id,v\n1,2", "key,v\n1,2", "CSV_DIFF_MISSING_KEY"],
    ["id,v\n,2", "id,v", "CSV_DIFF_EMPTY_KEY"],
    ['id,v\n" \t ",2', "id,v", "CSV_DIFF_EMPTY_KEY"],
    ['id,v\n1,x\n"1",y', "id,v", "CSV_DIFF_DUPLICATE_KEY"],
    ["id,v\n1", "id,v", "CSV_DIFF_WIDTH"],
    ["id,v\n1,2,3", "id,v", "CSV_DIFF_WIDTH"],
    ['id,v\n1,"bad"x', "id,v", "CSV_DIFF_MALFORMED"],
    ['id,v\n1,"bad', "id,v", "CSV_DIFF_MALFORMED"],
    ["id,v\n1,\u0000", "id,v", "CSV_DIFF_TEXT"],
    ["id,v\n1,\ud800", "id,v", "CSV_DIFF_TEXT"],
  ])("fails atomically for invalid table %#", (before, after, code) => {
    expect(() => compareCsvKeys(input(before, after))).toThrow(code);
  });

  it("neutralizes formula starters and keeps quotes, multiline fields and present empty cells parseable", () => {
    const diff = compareCsvKeys(input(
      'id,=label\n-001,"a,""b""\r\nc"\n+002,""',
      'id,=label\n-001,"\t  =1+1"\n+002,"    ＠sample"',
    ));
    const literal = compareCsvKeys(input("id,v\n1,=1+1", "id,v\n1,'=1+1"));
    expect([...scanDelimited(literal.exportText, ",")][2].slice(4)).toEqual(["'=1+1", "''=1+1"]);
    const records = [...scanDelimited(diff.exportText, ",")];
    expect(records).toEqual([
      ["kind", "change", "row", "column", "before", "after"],
      ["key", "updated", "1", "id", "'-001", "'-001"],
      ["cell", "updated", "1", "'=label", 'a,"b"\r\nc', "'\t  =1+1"],
      ["key", "updated", "2", "id", "'+002", "'+002"],
      ["cell", "updated", "2", "'=label", "", "'    ＠sample"],
    ]);
  });

  it("enforces exact file, record, column, cell and heading caps", () => {
    const exactBytes = "id,v\n1," + "x".repeat(CSV_DIFF_LIMITS.bytes - 7);
    expect(compareCsvKeys(input(exactBytes, "id,v")).counts.removed).toBe(1);
    expect(() => compareCsvKeys(input(exactBytes + "x", "id,v"))).toThrow(expect.objectContaining({ code: "INPUT_TOO_LARGE" }));
    const heading = "é".repeat(64);
    expect(compareCsvKeys(input(`id,${heading}`, "id")).columns.removed).toEqual([heading]);
    expect(() => compareCsvKeys(input(`id,${heading}a`, "id"))).toThrow("CSV_DIFF_HEADER");
    const fiveThousand = "id\n" + Array.from({ length: 5000 }, (_, i) => i).join("\n");
    expect(compareCsvKeys(input(fiveThousand, "id")).counts.removed).toBe(5000);
    expect(() => compareCsvKeys(input(fiveThousand + "\nmore", "id"))).toThrow("CSV_DIFF_LIMIT");
    const headers = ["id", ...Array.from({ length: 31 }, (_, i) => `field${i}`)];
    const width = headers.join(",");
    const table = width + "\n" + Array.from({ length: 625 }, (_, i) => i + ",".repeat(31)).join("\n");
    expect(compareCsvKeys(input(table, "id")).counts.removed).toBe(625);
    expect(() => compareCsvKeys(input(table + "\nmore" + ",".repeat(31), "id"))).toThrow("CSV_DIFF_LIMIT");
    expect(() => compareCsvKeys(input(width + ",extra", "id"))).toThrow("CSV_DIFF_LIMIT");
  });

  it("reports truncated preview but preserves the full export", () => {
    const value = "a".repeat(159) + "😀" + "z";
    const before = "id,v\n" + Array.from({ length: 21 }, (_, i) => `key-${i},${value}`).join("\n");
    const result = compareCsvKeys(input(before, "id,v"));
    expect(result.preview).toHaveLength(20);
    expect(result.preview[0].cells[0].before).toBe("a".repeat(159) + "…");
    expect(result.previewLimited).toBe(true);
    expect(result.exportText).toContain('key,removed,21,"id","key-20",');
    expect(result.exportText).toContain(value);
  });
});
