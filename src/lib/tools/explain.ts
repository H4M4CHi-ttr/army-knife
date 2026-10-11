import { assertInputSize, ToolError } from "./errors";
import { parseJsonSafely } from "./json";

export const EXPLAIN_LIMITS = {
  inputBytes: 512 * 1024,
  depth: 64,
  jsonValues: 50_000,
  nodes: 1_000,
  statements: 20,
} as const;

export type RowEstimateStatus =
  | "not-analyzed"
  | "not-executed"
  | "matched"
  | "underestimated"
  | "overestimated"
  | "zero-estimate";
export interface ExplainNode {
  id: string;
  parentId: string | null;
  statementIndex: number;
  depth: number;
  nodeType: string;
  relation: string | null;
  schema: string | null;
  alias: string | null;
  indexName: string | null;
  joinType: string | null;
  estimatedRows: number | null;
  /** Actual Rows and Actual Total Time are averages per loop in PostgreSQL. */
  actualRows: number | null;
  actualLoops: number | null;
  /** Null also covers zero estimates, avoiding non-finite JSON values. */
  rowRatio: number | null;
  rowEstimateStatus: RowEstimateStatus;
  startupCost: number | null;
  totalCost: number | null;
  actualStartupTimeMs: number | null;
  /** Includes work done by child nodes. Never summed across the plan. */
  actualTotalTimeMs: number | null;
}
export interface ExplainStatement {
  index: number;
  rootId: string;
  planningTimeMs: number | null;
  executionTimeMs: number | null;
  nodeCount: number;
  analyzed: boolean;
}
export interface ExplainReport {
  statements: ExplainStatement[];
  nodes: ExplainNode[];
  nodeTypes: { type: string; count: number }[];
}

// Keep every numeric token losslessly until an explicitly supported metric is
// read. PostgreSQL's optional 64-bit Query Identifier is deliberately ignored.
class PlanNumber {
  constructor(readonly token: string) {}
}
type PlanValue = null | boolean | string | PlanNumber | PlanValue[] | { [key: string]: PlanValue };

function parsePlanJson(input: string): PlanValue {
  assertInputSize(input, EXPLAIN_LIMITS.inputBytes);
  let offset = 0;
  let values = 0;
  const number = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
  const fail = (): never => {
    throw new ToolError("EXPLAIN_INVALID_JSON");
  };
  const whitespace = (): void => {
    while (offset < input.length && " \t\r\n".includes(input[offset]!)) offset++;
  };
  const readString = (): string => {
    if (input[offset] !== '"') return fail();
    const start = offset++;
    while (offset < input.length) {
      const character = input[offset++];
      if (character === "\\") offset++;
      else if (character === '"') {
        try {
          return JSON.parse(input.slice(start, offset)) as string;
        } catch {
          return fail();
        }
      }
    }
    return fail();
  };
  const readValue = (depth: number): PlanValue => {
    if (depth > EXPLAIN_LIMITS.depth) throw new ToolError("EXPLAIN_DEPTH_LIMIT");
    if (++values > EXPLAIN_LIMITS.jsonValues) throw new ToolError("EXPLAIN_VALUE_LIMIT");
    whitespace();
    const character = input[offset];
    if (character === '"') return readString();
    if (character === "{") {
      const object = Object.create(null) as Record<string, PlanValue>;
      offset++;
      whitespace();
      if (input[offset] === "}") {
        offset++;
        return object;
      }
      while (offset < input.length) {
        whitespace();
        const key = readString();
        if (Object.hasOwn(object, key)) throw new ToolError("EXPLAIN_DUPLICATE_KEY");
        whitespace();
        if (input[offset++] !== ":") return fail();
        object[key] = readValue(depth + 1);
        whitespace();
        if (input[offset] === "}") {
          offset++;
          return object;
        }
        if (input[offset++] !== ",") return fail();
      }
      return fail();
    }
    if (character === "[") {
      const array: PlanValue[] = [];
      offset++;
      whitespace();
      if (input[offset] === "]") {
        offset++;
        return array;
      }
      while (offset < input.length) {
        array.push(readValue(depth + 1));
        whitespace();
        if (input[offset] === "]") {
          offset++;
          return array;
        }
        if (input[offset++] !== ",") return fail();
      }
      return fail();
    }
    for (const [token, value] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ] as const) {
      if (input.startsWith(token, offset)) {
        offset += token.length;
        return value;
      }
    }
    number.lastIndex = offset;
    const match = number.exec(input);
    if (!match) return fail();
    offset = number.lastIndex;
    return new PlanNumber(match[0]);
  };
  const result = readValue(0);
  whitespace();
  if (offset !== input.length) fail();
  return result;
}

function isObject(value: PlanValue | undefined): value is Record<string, PlanValue> {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof PlanNumber)
  );
}

function metric(object: Record<string, PlanValue>, key: string, integer = false): number | null {
  if (!Object.hasOwn(object, key)) return null;
  const value = object[key];
  if (!(value instanceof PlanNumber)) throw new ToolError("EXPLAIN_INVALID_METRIC");
  let parsed: number;
  try {
    parsed = parseJsonSafely(value.token) as number;
  } catch {
    throw new ToolError("EXPLAIN_INVALID_METRIC");
  }
  if (parsed < 0 || (integer && !Number.isSafeInteger(parsed)))
    throw new ToolError("EXPLAIN_INVALID_METRIC");
  return parsed;
}

function field(object: Record<string, PlanValue>, key: string, required = false): string | null {
  const value = object[key];
  if (value === undefined && !required) return null;
  if (typeof value !== "string" || (required && !value.trim()))
    throw new ToolError("EXPLAIN_INVALID_NODE");
  return value;
}

function estimate(
  estimated: number | null,
  actual: number | null,
  loops: number | null,
): { rowRatio: number | null; rowEstimateStatus: RowEstimateStatus } {
  if (loops === 0) return { rowRatio: null, rowEstimateStatus: "not-executed" };
  if (estimated === null || actual === null)
    return { rowRatio: null, rowEstimateStatus: "not-analyzed" };
  if (estimated === 0)
    return actual === 0
      ? { rowRatio: null, rowEstimateStatus: "matched" }
      : { rowRatio: null, rowEstimateStatus: "zero-estimate" };
  const ratio = actual / estimated;
  return {
    rowRatio: ratio,
    rowEstimateStatus:
      actual === estimated ? "matched" : actual > estimated ? "underestimated" : "overestimated",
  };
}

/** Analyze pasted PostgreSQL FORMAT JSON output. This function never executes SQL. */
export function analyzeExplain(input: string): ExplainReport {
  const parsed = parsePlanJson(input);
  const roots = Array.isArray(parsed) ? parsed : [parsed];
  if (!roots.length) throw new ToolError("EXPLAIN_INVALID_SHAPE");
  if (roots.length > EXPLAIN_LIMITS.statements) throw new ToolError("EXPLAIN_TOO_MANY_STATEMENTS");
  const statements: ExplainStatement[] = [];
  const nodes: ExplainNode[] = [];
  const types = new Map<string, number>();

  const visit = (
    value: PlanValue,
    id: string,
    parentId: string | null,
    depth: number,
    statementIndex: number,
  ): void => {
    if (nodes.length >= EXPLAIN_LIMITS.nodes) throw new ToolError("EXPLAIN_TOO_MANY_NODES");
    if (!isObject(value)) throw new ToolError("EXPLAIN_INVALID_NODE");
    const nodeType = field(value, "Node Type", true)!;
    const estimatedRows = metric(value, "Plan Rows", true);
    const actualRows = metric(value, "Actual Rows");
    const actualLoops = metric(value, "Actual Loops", true);
    nodes.push({
      id,
      parentId,
      statementIndex,
      depth,
      nodeType,
      relation: field(value, "Relation Name"),
      schema: field(value, "Schema"),
      alias: field(value, "Alias"),
      indexName: field(value, "Index Name"),
      joinType: field(value, "Join Type"),
      estimatedRows,
      actualRows,
      actualLoops,
      ...estimate(estimatedRows, actualRows, actualLoops),
      startupCost: metric(value, "Startup Cost"),
      totalCost: metric(value, "Total Cost"),
      actualStartupTimeMs: metric(value, "Actual Startup Time"),
      actualTotalTimeMs: metric(value, "Actual Total Time"),
    });
    types.set(nodeType, (types.get(nodeType) ?? 0) + 1);
    if (Object.hasOwn(value, "Plans")) {
      if (!Array.isArray(value.Plans)) throw new ToolError("EXPLAIN_INVALID_NODE");
      value.Plans.forEach((child, index) =>
        visit(child, `${id}/Plans/${index}`, id, depth + 1, statementIndex),
      );
    }
  };

  roots.forEach((root, index) => {
    if (!isObject(root) || !Object.hasOwn(root, "Plan"))
      throw new ToolError("EXPLAIN_INVALID_SHAPE");
    const start = nodes.length;
    const rootId = Array.isArray(parsed) ? `/${index}/Plan` : "/Plan";
    visit(root.Plan!, rootId, null, 0, index);
    statements.push({
      index,
      rootId,
      planningTimeMs: metric(root, "Planning Time"),
      executionTimeMs: metric(root, "Execution Time"),
      nodeCount: nodes.length - start,
      analyzed: nodes
        .slice(start)
        .some((node) => node.actualRows !== null || node.actualTotalTimeMs !== null),
    });
  });
  return { statements, nodes, nodeTypes: [...types].map(([type, count]) => ({ type, count })) };
}
