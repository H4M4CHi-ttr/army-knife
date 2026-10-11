import { tools, type ToolDefinition, type ToolId } from "../catalog";
import { messages } from "../../i18n";
import { searchIntents, type SearchIntentMap } from "./intents";

/**
 * Local, language-agnostic intent search. No model, worker, API, or persistent storage.
 * Each language is only a data pack: adding a language never changes the scorer.
 */
export interface SearchLanguagePack {
  language: string;
  labels: Readonly<Record<string, string>>;
  intents: Partial<SearchIntentMap>;
}

interface SearchField {
  text: string;
  terms: ReadonlySet<string>;
  weight: number;
}

interface SearchRecord {
  tool: ToolDefinition;
  fields: SearchField[];
  terms: Set<string>;
}

const COMMON_ENGLISH = new Set([
  "a", "an", "and", "are", "be", "can", "do", "does", "for", "from",
  "help", "how", "i", "in", "is", "it", "me", "my", "need", "of",
  "on", "or", "please", "show", "the", "to", "tool", "tools", "want",
  "what", "which", "with", "would",
]);
// Latin words stay whole; scripts that commonly join text without spaces use
// short character n-grams. The Unicode fallback keeps future scripts searchable.
const WORDS = /[\p{Script=Latin}\p{N}]+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+|[\p{L}\p{M}\p{N}]+/gu;
const NON_LATIN = /[^\p{Script=Latin}\p{N}]/u;

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();
}

function terms(text: string): Set<string> {
  const result = new Set<string>();
  for (const match of normalize(text).matchAll(WORDS)) {
    const word = match[0];
    if (!NON_LATIN.test(word)) {
      if (!COMMON_ENGLISH.has(word)) result.add(word);
      continue;
    }
    // Unicode n-grams also work without Intl.Segmenter language dictionaries.
    // Keep single-character words only when the entire word has length one.
    const chars = [...word];
    if (chars.length === 1) result.add(word);
    for (const size of [2, 3]) {
      for (let i = 0; i <= chars.length - size; i++) {
        result.add(chars.slice(i, i + size).join(""));
      }
    }
  }
  return result;
}

function field(text: string, weight: number): SearchField | null {
  const normalized = normalize(text);
  if (!normalized) return null;
  return { text: normalized, terms: terms(text), weight };
}

export function createToolSearch(
  catalog: readonly ToolDefinition[],
  packs: readonly SearchLanguagePack[],
) {
  const records: SearchRecord[] = catalog.map((tool) => ({
    tool,
    fields: [],
    terms: new Set<string>(),
  }));

  for (const record of records) {
    const { tool } = record;
    const fields = [
      field(tool.id.replaceAll("-", " "), 3),
      field(tool.keywords, 0.85),
    ];
    for (const pack of packs) {
      const title = pack.labels["tool." + tool.id + ".name"];
      const description = pack.labels["tool." + tool.id + ".description"];
      if (title) fields.push(field(title, 3.1));
      if (description) fields.push(field(description, 0.9));
      for (const example of pack.intents[tool.id] ?? []) {
        fields.push(field(example, 1.6));
      }
    }
    record.fields = fields.filter((item): item is SearchField => item !== null);
    for (const item of record.fields) {
      for (const term of item.terms) record.terms.add(term);
    }
  }

  // Document frequency is calculated across *tools*, not 5 language packs.
  // Generic words and common CJK n-grams therefore contribute less to ranking.
  const frequency = new Map<string, number>();
  for (const record of records) {
    for (const term of record.terms) frequency.set(term, (frequency.get(term) ?? 0) + 1);
  }
  function idf(term: string): number {
    const count = frequency.get(term) ?? 0;
    return Math.log(1 + (records.length - count + 0.5) / (count + 0.5));
  }

  return function search(query: string, candidates: readonly ToolDefinition[] = catalog) {
    const input = normalize(query.slice(0, 150));
    if (!input) return [...candidates];

    const queryTerms = terms(input);
    if (!queryTerms.size) return [];
    const queryWeight = [...queryTerms].reduce((total, term) => total + idf(term), 0);
    const allowed = new Set(candidates.map((tool) => tool.id));
    const ranked: { tool: ToolDefinition; score: number; order: number }[] = [];

    records.forEach(({ tool, fields }, order) => {
      if (!allowed.has(tool.id)) return;
      let best = 0;
      for (const candidate of fields) {
        let overlap = 0;
        for (const token of queryTerms) {
          if (candidate.terms.has(token)) overlap += idf(token);
        }
        const containsPhrase =
          input.length >= 3 && candidate.text.includes(input);
        if (overlap === 0 && !containsPhrase) continue;

        const coverage = queryWeight ? overlap / queryWeight : 0;
        let score = (coverage * 65 + Math.min(overlap * 6, 24)) * candidate.weight;
        if (containsPhrase) score += 130 * candidate.weight;
        if (candidate.text.length >= 4 && input.includes(candidate.text)) {
          score += 45 * candidate.weight;
        }
        best = Math.max(best, score);
      }
      // Require a real lexical match. Common sentence fragments alone should
      // not make an unrelated tool appear as a high-confidence result.
      if (best >= 18) ranked.push({ tool, score: best, order });
    });

    ranked.sort((a, b) => b.score - a.score || a.order - b.order);
    return ranked.map(({ tool }) => tool);
  };
}

export const searchTools = createToolSearch(
  tools,
  Object.entries(searchIntents).map(([language, intents]) => ({
    language,
    intents,
    labels: messages[language as keyof typeof messages] as Readonly<Record<string, string>>,
  })),
);
