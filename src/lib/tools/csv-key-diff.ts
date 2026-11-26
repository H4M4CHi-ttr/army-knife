import { scanDelimited } from "./delimited";
import { assertInputSize, ToolError } from "./errors";

export const CSV_DIFF_LIMITS = {
  bytes: 256 * 1024, rows: 5000, columns: 32, cells: 20_000,
  outputBytes: 16 * 1024 * 1024, headingBytes: 128, headingRecord: 8192, instantCharacters: 4096,
  previewRows: 20, previewCells: 12, previewCharacters: 160,
} as const;

export const CSV_DIFF_SIDES = ["before", "after"] as const;
export type CsvDiffSide = typeof CSV_DIFF_SIDES[number];
export type CsvDiffTable = { text: string; format: "csv" | "tsv" };
export type CsvDiffInput = Record<CsvDiffSide, CsvDiffTable> & { keys: readonly string[] };
export type CsvDiffChange = "added" | "removed" | "updated";
type CellChange = { column: string; before?: string; after?: string };
type RowChange = { change: CsvDiffChange; key: string[]; cells: CellChange[] };
export type CsvDiffReport = {
  columns: { added: string[]; removed: string[] };
  keys: readonly string[];
  counts: Record<CsvDiffChange | "unchanged", number>;
  preview: RowChange[];
  previewLimited: boolean;
  exportText: string;
};

const encoder = new TextEncoder();

function tableRecords({ text, format }: CsvDiffTable) {
  if (format !== "csv" && format !== "tsv") throw new ToolError("CSV_DIFF_FORMAT");
  return scanDelimited(text.replace(/^\uFEFF/u, ""), format === "csv" ? "," : "\t", {
    columns: CSV_DIFF_LIMITS.columns,
    firstRecord: CSV_DIFF_LIMITS.headingRecord,
    malformed: "CSV_DIFF_MALFORMED",
  });
}

function readHeader(records: Generator<string[], void>): string[] {
  const header = records.next().value;
  if (!header || new Set(header).size !== header.length || header.some(name =>
    !name.trim() || /[\p{Cc}\p{Bidi_Control}\uFEFF]/u.test(name) ||
    encoder.encode(name).length > CSV_DIFF_LIMITS.headingBytes,
  )) throw new ToolError("CSV_DIFF_HEADER");
  return header;
}

/** Synchronous UI options scan stops at the end of the bounded header record. */
export function csvDiffHeadings(table: CsvDiffTable): string[] {
  return readHeader(tableRecords(table));
}

function indexRows(records: Generator<string[], void>, headers: string[], keys: readonly string[]) {
  const positions = keys.map(key => headers.indexOf(key));
  if (positions.includes(-1)) throw new ToolError("CSV_DIFF_MISSING_KEY");
  const rows = new Map<string, { key: string[]; values: string[] }>();
  for (const values of records) {
    if (values.length !== headers.length) throw new ToolError("CSV_DIFF_WIDTH");
    if (rows.size >= CSV_DIFF_LIMITS.rows || (rows.size + 1) * headers.length > CSV_DIFF_LIMITS.cells)
      throw new ToolError("CSV_DIFF_LIMIT");
    const key = positions.map(position => values[position]);
    if (key.some(value => !value.trim())) throw new ToolError("CSV_DIFF_EMPTY_KEY");
    const identity = JSON.stringify(key);
    if (rows.has(identity)) throw new ToolError("CSV_DIFF_DUPLICATE_KEY");
    rows.set(identity, { key, values });
  }
  return rows;
}

function spreadsheetText(value: string): string {
  // Quote each value and neutralize formula starters even after whitespace or controls.
  const protect = /^[\s\p{Cc}\p{Cf}]*[=+\-@＝＋－＠]|^['\t\r\n]/u.test(value);
  return '"' + (protect ? "'" : "") + value.replaceAll('"', '""') + '"';
}

function previewText(value: string): string {
  const limit = CSV_DIFF_LIMITS.previewCharacters;
  if (value.length <= limit) return value;
  const last = value.charCodeAt(limit - 1);
  return value.slice(0, last >= 0xd800 && last <= 0xdbff ? limit - 1 : limit) + "…";
}

export function compareCsvKeys(input: CsvDiffInput): CsvDiffReport {
  const { keys } = input;
  if (!keys.length || keys.length > CSV_DIFF_LIMITS.columns || new Set(keys).size !== keys.length)
    throw new ToolError("CSV_DIFF_MISSING_KEY");

  const tables = CSV_DIFF_SIDES.map(side => {
    const table = input[side];
    assertInputSize(table.text, CSV_DIFF_LIMITS.bytes);
    if (table.text.includes("\u0000") || /\p{Surrogate}/u.test(table.text)) throw new ToolError("CSV_DIFF_TEXT");
    const records = tableRecords(table);
    return { records, headers: readHeader(records) };
  });
  const [before, after] = tables.map(({ records, headers }) => ({
    headers,
    rows: indexRows(records, headers, keys),
  }));
  const columns = {
    added: after.headers.filter(name => !before.headers.includes(name)),
    removed: before.headers.filter(name => !after.headers.includes(name)),
  };
  const selected = new Set(keys);
  const beforePositions = new Map(before.headers.map((name, i) => [name, i]));
  const afterPositions = new Map(after.headers.map((name, i) => [name, i]));
  const compared = [...before.headers, ...columns.added].filter(name => !selected.has(name)).map(column => ({
    column, left: beforePositions.get(column), right: afterPositions.get(column),
  }));
  const counts = { added: 0, removed: 0, updated: 0, unchanged: 0 };
  const preview: RowChange[] = [];
  let previewLimited = false;
  let rowNumber = 0;
  const output = ["kind,change,row,column,before,after"];
  for (const change of ["removed", "added"] as const)
    for (const column of columns[change]) output.push(`column,${change},,${spreadsheetText(column)},,`);

  function addRow(change: CsvDiffChange, key: string[], cells: CellChange[]) {
    counts[change]++;
    rowNumber++;
    keys.forEach((column, index) => {
      const value = spreadsheetText(key[index]);
      output.push(`key,${change},${rowNumber},${spreadsheetText(column)},${change === "added" ? "" : value},${change === "removed" ? "" : value}`);
    });
    for (const { column, before, after } of cells) {
      const cellChange = before === undefined ? "added" : after === undefined ? "removed" : "updated";
      output.push(`cell,${cellChange},${rowNumber},${spreadsheetText(column)},${before === undefined ? "" : spreadsheetText(before)},${after === undefined ? "" : spreadsheetText(after)}`);
    }

    if (preview.length >= CSV_DIFF_LIMITS.previewRows) { previewLimited = true; return; }
    previewLimited ||= cells.length > CSV_DIFF_LIMITS.previewCells ||
      key.some(value => value.length > CSV_DIFF_LIMITS.previewCharacters) ||
      cells.some(({ before, after }) => Math.max(before?.length ?? 0, after?.length ?? 0) > CSV_DIFF_LIMITS.previewCharacters);
    preview.push({
      change, key: key.map(previewText),
      cells: cells.slice(0, CSV_DIFF_LIMITS.previewCells).map(({ column, before, after }) => ({
        column,
        before: before === undefined ? undefined : previewText(before),
        after: after === undefined ? undefined : previewText(after),
      })),
    });
  }

  for (const [identity, { key, values }] of before.rows) {
    const match = after.rows.get(identity);
    if (!match) {
      addRow("removed", key, before.headers.flatMap((column, i) =>
        selected.has(column) ? [] : [{ column, before: values[i] }]));
      continue;
    }
    const cells = compared.flatMap(({ column, left, right }) => {
      const before = left === undefined ? undefined : values[left];
      const after = right === undefined ? undefined : match.values[right];
      return before === after ? [] : [{ column, before, after }];
    });
    if (cells.length) addRow("updated", key, cells);
    else counts.unchanged++;
  }
  for (const [identity, { key, values }] of after.rows) {
    if (before.rows.has(identity)) continue;
    addRow("added", key, after.headers.flatMap((column, i) =>
      selected.has(column) ? [] : [{ column, after: values[i] }]));
  }

  const exportText = output.join("\r\n") + "\r\n";
  if (encoder.encode(exportText).length > CSV_DIFF_LIMITS.outputBytes) throw new ToolError("CSV_DIFF_LIMIT");
  return { columns, keys, counts, preview, previewLimited, exportText };
}
