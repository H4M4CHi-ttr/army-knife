import { describe, expect, it } from "vite-plus/test";
import { analyzeExplain, EXPLAIN_LIMITS } from "./explain";

const scan = {
  "Node Type": "Seq Scan",
  "Relation Name": "orders",
  Alias: "o",
  "Startup Cost": 0,
  "Total Cost": 100,
  "Plan Rows": 100,
  "Actual Rows": 50,
  "Actual Loops": 1,
  "Actual Total Time": 2,
};

describe("PostgreSQL EXPLAIN JSON inspection", () => {
  it("reads statement timing and node estimates from standard FORMAT JSON output", () => {
    const result = analyzeExplain(
      JSON.stringify([{ Plan: scan, "Planning Time": 0.125, "Execution Time": 2.4 }]),
    );
    expect(result.statements).toEqual([
      {
        index: 0,
        rootId: "/0/Plan",
        planningTimeMs: 0.125,
        executionTimeMs: 2.4,
        nodeCount: 1,
        analyzed: true,
      },
    ]);
    expect(result.nodes[0]).toMatchObject({
      id: "/0/Plan",
      parentId: null,
      nodeType: "Seq Scan",
      relation: "orders",
      estimatedRows: 100,
      actualRows: 50,
      actualLoops: 1,
      rowRatio: 0.5,
      rowEstimateStatus: "overestimated",
      totalCost: 100,
      actualTotalTimeMs: 2,
    });
  });

  it("retains deterministic depth-first order and inclusive per-loop timings", () => {
    const result = analyzeExplain(
      JSON.stringify({
        Plan: {
          "Node Type": "Nested Loop",
          "Plan Rows": 5,
          "Actual Rows": 15,
          "Actual Loops": 1,
          "Actual Total Time": 10,
          Plans: [
            scan,
            {
              "Node Type": "Sort",
              "Plan Rows": 2,
              "Actual Rows": 2.5,
              "Actual Loops": 50,
              "Actual Total Time": 0.1,
              Plans: [{ "Node Type": "Index Scan", "Index Name": "orders_pkey" }],
            },
          ],
        },
        "Execution Time": 10.5,
      }),
    );
    expect(result.nodes.map((node) => [node.id, node.depth, node.parentId])).toEqual([
      ["/Plan", 0, null],
      ["/Plan/Plans/0", 1, "/Plan"],
      ["/Plan/Plans/1", 1, "/Plan"],
      ["/Plan/Plans/1/Plans/0", 2, "/Plan/Plans/1"],
    ]);
    expect(result.nodes[0]?.rowEstimateStatus).toBe("underestimated");
    expect(result.nodes[2]).toMatchObject({
      actualRows: 2.5,
      actualLoops: 50,
      rowRatio: 1.25,
      actualTotalTimeMs: 0.1,
    });
    expect(result.statements[0]?.executionTimeMs).toBe(10.5);
    expect(result.nodeTypes).toEqual([
      { type: "Nested Loop", count: 1 },
      { type: "Seq Scan", count: 1 },
      { type: "Sort", count: 1 },
      { type: "Index Scan", count: 1 },
    ]);
  });

  it("supports COSTS FALSE and TIMING FALSE without inventing missing measurements", () => {
    const result = analyzeExplain(
      JSON.stringify([
        { Plan: { "Node Type": "Result" } },
        { Plan: { "Node Type": "Result", "Plan Rows": 1, "Actual Rows": 1, "Actual Loops": 1 } },
      ]),
    );
    expect(result.statements.map((statement) => statement.analyzed)).toEqual([false, true]);
    expect(result.nodes[0]).toMatchObject({
      estimatedRows: null,
      actualRows: null,
      actualTotalTimeMs: null,
      rowRatio: null,
      rowEstimateStatus: "not-analyzed",
    });
    expect(result.nodes[1]).toMatchObject({
      actualTotalTimeMs: null,
      rowRatio: 1,
      rowEstimateStatus: "matched",
    });
  });

  it("distinguishes unexecuted nodes and zero estimates without emitting Infinity", () => {
    const result = analyzeExplain(
      JSON.stringify({
        Plan: {
          "Node Type": "Append",
          Plans: [
            { "Node Type": "Result", "Plan Rows": 10, "Actual Rows": 0, "Actual Loops": 0 },
            { "Node Type": "Result", "Plan Rows": 0, "Actual Rows": 2, "Actual Loops": 1 },
            { "Node Type": "Result", "Plan Rows": 0, "Actual Rows": 0, "Actual Loops": 1 },
          ],
        },
      }),
    );
    expect(result.nodes.slice(1).map((node) => [node.rowRatio, node.rowEstimateStatus])).toEqual([
      [null, "not-executed"],
      [null, "zero-estimate"],
      [null, "matched"],
    ]);
    expect(JSON.stringify(result)).not.toContain("Infinity");
  });

  it("keeps ignored 64-bit identifiers lossless and excludes unrecognized data from output", () => {
    const result = analyzeExplain(
      '[{"Plan":{"Node Type":"Result","Plan Rows":1},"Query Identifier":18446744073709551615,"Unknown Huge Number":1e400}]',
    );
    expect(result.nodes[0]?.estimatedRows).toBe(1);
    expect(JSON.stringify(result)).not.toContain("Query Identifier");
    expect(JSON.stringify(result)).not.toContain("184467440");
  });

  it("treats prototype keys and HTML-like relation names as inert data", () => {
    const result = analyzeExplain(
      '{"__proto__":{"polluted":true},"Plan":{"Node Type":"Seq Scan","Relation Name":"<img src=x>","constructor":"ignored"}}',
    );
    expect(result.nodes[0]?.relation).toBe("<img src=x>");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it.each(["", "null", "[]", "{}", '{"Node Type":"Result"}', "[1]"])(
    "rejects missing statement wrappers: %s",
    (input) => {
      expect(() => analyzeExplain(input)).toThrow();
    },
  );

  it.each([
    '{"Plan":null}',
    '{"Plan":{"Node Type":""}}',
    '{"Plan":{"Node Type":"Result","Plans":{}}}',
    '{"Plan":{"Node Type":"Result","Plans":[null]}}',
  ])("rejects malformed plan nodes: %s", (input) => {
    expect(() => analyzeExplain(input)).toThrow(
      expect.objectContaining({ code: "EXPLAIN_INVALID_NODE" }),
    );
  });

  it.each(["-1", '"10"', "null", "1.1", "9007199254740992", "9007199254740991.1", "1e400"])(
    "rejects non-integer, negative or imprecise estimated rows: %s",
    (token) => {
      expect(() => analyzeExplain(`{"Plan":{"Node Type":"Result","Plan Rows":${token}}}`)).toThrow(
        expect.objectContaining({ code: "EXPLAIN_INVALID_METRIC" }),
      );
    },
  );

  it("rejects silently rounded or underflowed decimal timing metrics", () => {
    for (const token of ["1e-400", "0.10000000000000001", "-0.001"]) {
      expect(() =>
        analyzeExplain(`{"Plan":{"Node Type":"Result"},"Execution Time":${token}}`),
      ).toThrow(expect.objectContaining({ code: "EXPLAIN_INVALID_METRIC" }));
    }
  });

  it.each([
    '{"Plan":{"Node Type":"Result"},}',
    '{"Plan":{"Node Type":"Result","Plan Rows":01}}',
    '{"Plan":{"Node Type":"Result"}} trailing',
    '{"Plan":{"Node Type":"Result"},"x":"\n"}',
  ])("rejects invalid JSON syntax: %s", (input) => {
    expect(() => analyzeExplain(input)).toThrow(
      expect.objectContaining({ code: "EXPLAIN_INVALID_JSON" }),
    );
  });

  it("rejects duplicate decoded keys", () => {
    expect(() =>
      analyzeExplain('{"Plan":{"Node Type":"Result","Plan Rows":1,"Plan\\u0020Rows":2}}'),
    ).toThrow(expect.objectContaining({ code: "EXPLAIN_DUPLICATE_KEY" }));
  });

  it("bounds UTF-8 input size, JSON depth/values and statement count", () => {
    expect(() => analyzeExplain("あ".repeat(180_000))).toThrow(
      expect.objectContaining({ code: "INPUT_TOO_LARGE" }),
    );
    expect(() =>
      analyzeExplain(
        `${"[".repeat(EXPLAIN_LIMITS.depth + 1)}0${"]".repeat(EXPLAIN_LIMITS.depth + 1)}`,
      ),
    ).toThrow(expect.objectContaining({ code: "EXPLAIN_DEPTH_LIMIT" }));
    expect(() =>
      analyzeExplain(
        JSON.stringify({
          Plan: { "Node Type": "Result" },
          Unused: Array(EXPLAIN_LIMITS.jsonValues).fill(0),
        }),
      ),
    ).toThrow(expect.objectContaining({ code: "EXPLAIN_VALUE_LIMIT" }));
    expect(() =>
      analyzeExplain(
        JSON.stringify(
          Array(EXPLAIN_LIMITS.statements + 1).fill({ Plan: { "Node Type": "Result" } }),
        ),
      ),
    ).toThrow(expect.objectContaining({ code: "EXPLAIN_TOO_MANY_STATEMENTS" }));
  });

  it("accepts exactly the global node budget and rejects one extra node", () => {
    const make = (children: number) =>
      JSON.stringify({
        Plan: { "Node Type": "Append", Plans: Array(children).fill({ "Node Type": "Result" }) },
      });
    const full = make(EXPLAIN_LIMITS.nodes - 1);
    expect(analyzeExplain(full).nodes).toHaveLength(EXPLAIN_LIMITS.nodes);
    expect(() => analyzeExplain(make(EXPLAIN_LIMITS.nodes))).toThrow(
      expect.objectContaining({ code: "EXPLAIN_TOO_MANY_NODES" }),
    );
    expect(analyzeExplain(full)).toEqual(analyzeExplain(full));
  });
});
