import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vite-plus/test";
import { tools } from "../catalog";
import { searchLabel, searchTools } from "./index";
import { searchIntents } from "./intents";
import { messages } from "../../i18n";

interface Example {
  language: keyof typeof searchIntents;
  query: string;
  expected: string;
}

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/search-compare/heldout.json"), "utf8"),
) as { items: Example[] };

function originalSubstringSearch(query: string, language: Example["language"]): string[] {
  const dict = messages[language] as Readonly<Record<string, unknown>>;
  const parts = query.toLowerCase().trim().split(/\s+/);
  return tools.filter((tool) => {
    const text = [
      searchLabel(dict, "tool." + tool.id + ".name") ?? "",
      searchLabel(dict, "tool." + tool.id + ".description") ?? "",
      tool.keywords,
    ].join(" ").toLowerCase();
    return parts.every((word) => text.includes(word));
  }).map((tool) => tool.id);
}

function percentiles(times: number[]): { p50_ms: number; p95_ms: number } {
  const sorted = [...times].sort((a, b) => a - b);
  const p = (at: number) => Number(sorted[Math.floor((sorted.length - 1) * at)]!.toFixed(5));
  return { p50_ms: p(0.5), p95_ms: p(0.95) };
}

describe("frozen multilingual search comparison fixture", () => {
  it("contains two held-out phrasings per tool per locale without training-set duplicates", () => {
    expect(fixture.items).toHaveLength(120);
    const trainPhrases = Object.values(searchIntents)
      .flatMap((pack) => Object.values(pack))
      .flat();
    const trainSet = new Set(trainPhrases.map((text) => text.normalize("NFKC").toLowerCase().trim()));
    for (const lang of Object.keys(searchIntents)) {
      for (const tool of tools) {
        const cases = fixture.items.filter((x) => x.language === lang && x.expected === tool.id);
        expect(cases, lang + "/" + tool.id).toHaveLength(2);
        for (const item of cases) {
          expect(item.query.trim().length).toBeGreaterThan(8);
          expect(trainSet.has(item.query.normalize("NFKC").toLowerCase().trim())).toBe(false);
        }
      }
    }
  });

  it("exports exactly the app's lexical predictions and a shared training corpus", () => {
    const output = process.env.SEARCH_COMPARE_OUTPUT;
    if (!output) return;

    const corpus: { label: string; language: string; kind: string; text: string }[] = [];
    for (const tool of tools) {
      corpus.push({ label: tool.id, language: "und", kind: "keywords", text: tool.keywords });
      for (const [language, intents] of Object.entries(searchIntents)) {
        const dict = messages[language as keyof typeof messages] as Readonly<Record<string, unknown>>;
        for (const kind of ["name", "description"] as const) {
          const text = searchLabel(dict, "tool." + tool.id + "." + kind);
          expect(text, language + "/" + tool.id + "/" + kind).toBeTruthy();
          corpus.push({ label: tool.id, language, kind, text: text! });
        }
        for (const text of intents[tool.id]) {
          corpus.push({ label: tool.id, language, kind: "intent", text });
        }
      }
    }

    for (let k = 0; k < 40; k++) {
      searchTools(fixture.items[k % fixture.items.length]!.query);
    }

    const times: number[] = [];
    const predictions = fixture.items.map(({ language, query, expected }) => {
      const old = originalSubstringSearch(query, language);
      const ranks = searchTools(query).map((tool) => tool.id);
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        searchTools(query);
        times.push(performance.now() - start);
      }
      return { language, query, expected, original: old, lexical: ranks };
    });

    mkdirSync(resolve(output), { recursive: true });
    writeFileSync(resolve(output, "corpus.json"), JSON.stringify({ rows: corpus }, null, 2));
    writeFileSync(resolve(output, "lexical.json"), JSON.stringify({
      data_sha_note: "Results derived from frozen heldout.json; this is the actual production searchTools() engine.",
      examples: predictions,
      latency: percentiles(times),
    }, null, 2));
    console.info("Exported " + corpus.length + " training phrases and " + predictions.length + " held-out ranked predictions");
  });
});
