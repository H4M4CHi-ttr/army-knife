/** All input and results live only in memory. Values remain strings, including large IDs. */
export const ENGINE_LIMITS = {
  inputBytes: 16 * 1024 * 1024,
  rows: 100_000,
  csvColumns: 256,
  uniquePerColumn: 10_000,
  uniqueTotal: 100_000,
  regexBytes: 4_096,
  previewLines: 200,
  timeoutMs: 30_000,
} as const;

export interface CsvRequest {
  operation: "csv";
  text: string;
  delimiter: "," | "\t" | ";" | "|";
  header: boolean;
  trim: boolean;
}

export interface LogsRequest {
  operation: "logs";
  text: string;
  /** Rust regex syntax. Lookaround and backreferences are intentionally unsupported. */
  pattern: string;
  caseInsensitive: boolean;
}

export type SetOperation =
  | "intersection"
  | "union"
  | "leftOnly"
  | "rightOnly"
  | "symmetricDifference";

export interface SetsRequest {
  operation: "sets";
  left: string;
  right: string;
  mode: SetOperation;
  trim: boolean;
  /** Locale independent Unicode lowercase, not full Unicode case folding. */
  caseInsensitive: boolean;
  ignoreEmpty: boolean;
}

export type EngineRequest = CsvRequest | LogsRequest | SetsRequest;
export type CsvValueType = "boolean" | "integer" | "decimal" | "date" | "text";

export interface CsvColumnProfile {
  index: number;
  /** Display name, shortened to 120 Unicode scalar values; blank names use #1, #2, etc. */
  name: string;
  empty: number;
  /** Excludes empty cells. When capped this is a lower bound, never an exact count. */
  unique: number;
  uniqueCapped: boolean;
  inferredType: CsvValueType | "empty" | "mixed";
  types: Record<CsvValueType, number>;
  /** Up to 3 distinct nonempty values, shortened to 120 Unicode scalar values. */
  samples: string[];
}

export interface CsvResult {
  operation: "csv";
  rows: number;
  columns: number;
  raggedRows: number;
  /** Duplicate detection uses full names; display names are shortened to 120 characters. */
  duplicateHeaders: string[];
  profiles: CsvColumnProfile[];
  /** First 12 data rows. Cells are shortened to 120 Unicode scalar values. */
  preview: string[][];
  truncatedPreview: boolean;
}

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "other";

export interface LogFrequency {
  text: string;
  count: number;
  /** Display text is shortened; counting always uses each complete original line. */
  shortened: boolean;
}

export interface LogsResult {
  operation: "logs";
  totalLines: number;
  matchedLines: number;
  emptyLines: number;
  levels: Record<LogLevel, number>;
  uniqueLines: number;
  /** 20 most frequent matching, nonempty lines; ties follow first appearance. */
  topLines: LogFrequency[];
  /** Up to 200 matching lines, each shortened to 500 Unicode scalar values. */
  preview: string[];
  truncatedPreview: boolean;
}

export interface SetsResult {
  operation: "sets";
  mode: SetOperation;
  leftLines: number;
  rightLines: number;
  leftUnique: number;
  rightUnique: number;
  leftDuplicates: number;
  rightDuplicates: number;
  /** Count after options and deduplication, in original input order. */
  count: number;
  /** Complete result, using the first spelling from the relevant input. */
  items: string[];
}

export type EngineResult = CsvResult | LogsResult | SetsResult;
export type ResultFor<T extends EngineRequest> = Extract<
  EngineResult,
  { operation: T["operation"] }
>;

export type EngineErrorCode =
  | "INPUT_TOO_LARGE"
  | "TOO_MANY_ROWS"
  | "TOO_MANY_COLUMNS"
  | "INVALID_REQUEST"
  | "INVALID_CSV"
  | "INVALID_REGEX"
  | "REGEX_TOO_LARGE"
  | "INTERNAL_ERROR"
  | "WASM_UNAVAILABLE"
  | "TIMEOUT"
  | "CANCELLED";

export interface EngineFailure {
  code: EngineErrorCode;
  /** Technical detail for debugging; UI should translate the stable code. */
  message: string;
}

export type EngineEnvelope =
  | { ok: true; result: EngineResult }
  | { ok: false; error: EngineFailure };

export interface WorkerRequest {
  id: number;
  request: EngineRequest;
}

export interface WorkerResponse {
  id: number;
  response: EngineEnvelope;
}
