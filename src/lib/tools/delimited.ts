import { ToolError } from "./errors";

/** RFC 4180-style quoting, with an optional tab separator and LF or CR record breaks. */
export function* scanDelimited(
  input: string,
  separator: "," | "\t",
  { columns = Infinity, firstRecord = Infinity, malformed = "INVALID_REQUEST" } = {},
): Generator<string[], void> {
  let record: string[] = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;
  let first = true;
  for (let i = 0; i < input.length; i++) {
    if (first && i >= firstRecord) throw new ToolError("CSV_DIFF_HEADER");
    const c = input[i];
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; afterQuote = true; }
      } else field += c;
      continue;
    }

    const newline = c === "\r" || c === "\n";
    if (afterQuote && c !== separator && !newline) throw new ToolError(malformed);
    if (c === '"' && !field && !afterQuote) { quoted = true; continue; }
    if (c === '"') throw new ToolError(malformed);
    if (c === separator) {
      if (record.length + 1 >= columns) throw new ToolError("CSV_DIFF_LIMIT");
      record.push(field);
    } else if (newline) {
      if (c === "\r" && input[i + 1] === "\n") i++;
      record.push(field);
      yield record;
      record = [];
      first = false;
    } else {
      field += c;
      continue;
    }
    field = "";
    afterQuote = false;
  }

  if (quoted) throw new ToolError(malformed);
  if (field || afterQuote || record.length || !/[\r\n]$/.test(input)) {
    record.push(field);
    yield record;
  }
}
