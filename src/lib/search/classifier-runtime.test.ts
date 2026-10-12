import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vite-plus/test";
import { tools } from "../catalog";
import { searchTools } from "./index";
import { createBrowserClassifier, mergeRankings } from "./classifier-runtime";

const modelPath = resolve(process.cwd(), "public/models/classifier-v1.json.gz");
const benchmarkPath = resolve(process.cwd(), "scripts/search-compare/heldout.json");
const compressed = readFileSync(modelPath);
const trained = createBrowserClassifier(
  JSON.parse(gunzipSync(compressed).toString("utf8")) as unknown,
);
const queries = JSON.parse(readFileSync(benchmarkPath, "utf8")) as {
  items: { language: string; query: string; expected: string }[];
};

describe("browser LinearSVC classifier parity", () => {
  it("loads the exact compressed model with bounded, known dimensions", () => {
    expect(compressed.length).toBeGreaterThan(400_000);
    expect(compressed.length).toBeLessThan(430_000);
    expect(trained.featureCount).toBe(10_265);
    expect(trained.weightBytes).toBe(533_828);
    expect(trained.rank("")).toHaveLength(tools.length);
  });

  it("reproduces the Python model's measured 120-case recall on all five languages", () => {
    const examples = queries.items;
    expect(examples).toHaveLength(120);
    let top1 = 0;
    let top3 = 0;
    const locales = new Map<string, number>();
    for (const sample of examples) {
      const ranked = trained.rank(sample.query);
      if (ranked[0] === sample.expected) top1++;
      if (ranked.slice(0, 3).includes(sample.expected as typeof ranked[number])) top3++;
      locales.set(sample.language, (locales.get(sample.language) ?? 0) + 1);
    }
    expect(top1).toBe(87);
    expect(top3).toBe(107);
    expect([...locales.values()]).toEqual([24, 24, 24, 24, 24]);
  });

  it("reproduces the offline hybrid's top-3 recall without backend calls", () => {
    let top1 = 0;
    let top3 = 0;
    for (const sample of queries.items) {
      const ids = mergeRankings(
        searchTools(sample.query).map((tool) => tool.id),
        trained.rank(sample.query),
      );
      if (ids[0] === sample.expected) top1++;
      if (ids.slice(0, 3).includes(sample.expected as typeof ids[number])) top3++;
    }
    expect(top1).toBe(85);
    expect(top3).toBe(113);
  });

  it("never trusts malformed or out-of-catalog model data", () => {
    expect(() => createBrowserClassifier(null)).toThrow();
    expect(() => createBrowserClassifier({ format: "unsupported" })).toThrow();
    const source = JSON.parse(gunzipSync(compressed).toString("utf8"));
    source.classes.push("fake-tool");
    expect(() => createBrowserClassifier(source)).toThrow();
  });
});
