import { isToolId, tools, type ToolId } from "../catalog";

/** Fixed 12-tool label set of the 411,410-byte snapshot. New tools use lexical search. */
export const CLASSIFIER_TOOL_IDS = [
  "har", "env", "url", "explain", "csv", "logs",
  "sets", "cidr", "unicode", "json-diff", "json-format", "contrast",
] as const satisfies readonly ToolId[];
const classifierLabelSet = new Set<string>(CLASSIFIER_TOOL_IDS);

export interface BrowserClassifier {
  readonly featureCount: number;
  readonly weightBytes: number;
  rank(query: string): ToolId[];
}
interface PortableClassifier {
  format: string;
  vocabulary: string[];
  idf: number[];
  classes: ToolId[];
  weights: number[][];
  intercept: number[];
}

/** Reproduce scikit-learn's char 2–4gram, sublinear TF-IDF and LinearSVC. */
export function createBrowserClassifier(value: unknown): BrowserClassifier {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid classifier data.");
  }
  const model = value as Partial<PortableClassifier>;
  if (
    model.format !== "sklearn-tfidf-char-2-4-linear-svc-v1" ||
    !Array.isArray(model.vocabulary) || !Array.isArray(model.idf) ||
    !Array.isArray(model.classes) || !Array.isArray(model.weights) ||
    !Array.isArray(model.intercept)
  ) throw new Error("Unsupported classifier format.");

  const { vocabulary, idf, classes, weights, intercept } = model;
  if (
    vocabulary.length < 100 || vocabulary.length > 40_000 ||
    idf.length !== vocabulary.length ||
    classes.length !== CLASSIFIER_TOOL_IDS.length ||
    new Set(classes).size !== classes.length ||
    !classes.every(isToolId) || !CLASSIFIER_TOOL_IDS.every((id) => classes.includes(id)) ||
    weights.length !== classes.length || intercept.length !== classes.length ||
    !vocabulary.every((word) => typeof word === "string" && word.length >= 2 && word.length <= 16) ||
    !idf.every((n) => typeof n === "number" && Number.isFinite(n) && n > 0) ||
    !intercept.every((n) => typeof n === "number" && Number.isFinite(n)) ||
    !weights.every((row) => Array.isArray(row) && row.length === vocabulary.length &&
      row.every((n) => typeof n === "number" && Number.isFinite(n)))
  ) throw new Error("Malformed classifier weights or outdated tool catalog.");

  const lookup = new Map(vocabulary.map((word, index) => [word, index]));
  if (lookup.size !== vocabulary.length) throw new Error("Duplicate classifier features.");
  const idfs = Float32Array.from(idf);
  const matrix = weights.map((values) => Float32Array.from(values));
  const biases = Float32Array.from(intercept);

  return {
    featureCount: lookup.size,
    weightBytes: idfs.byteLength + biases.byteLength +
      matrix.reduce((size, row) => size + row.byteLength, 0),
    rank(query: string): ToolId[] {
      if (!query.trim()) return [...classes];
      // Matches Python's code-point slicing and sklearn whitespace collapsing.
      const chars = Array.from(query.slice(0, 150).toLowerCase().replace(/\s\s+/g, " "));
      const counts = new Map<number, number>();
      for (let length = 2; length <= 4; length++) {
        for (let i = 0; i <= chars.length - length; i++) {
          const index = lookup.get(chars.slice(i, i + length).join(""));
          if (index !== undefined) counts.set(index, (counts.get(index) ?? 0) + 1);
        }
      }
      const vector: [number, number][] = [];
      let squared = 0;
      for (const [index, count] of counts) {
        const weight = (1 + Math.log(count)) * idfs[index]!;
        vector.push([index, weight]);
        squared += weight * weight;
      }
      const norm = Math.sqrt(squared) || 1;
      const scores = Array.from(biases);
      for (const [index, value] of vector) {
        const scaled = value / norm;
        for (let i = 0; i < matrix.length; i++) scores[i]! += matrix[i]![index]! * scaled;
      }
      return classes.map((id, index) => ({ id, score: scores[index]!, index }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map(({ id }) => id);
    },
  };
}

/** Untuned reciprocal-rank fusion, exactly as in the 120-question study. */
export function mergeRankings(lexical: readonly ToolId[], ranked: readonly ToolId[]): ToolId[] {
  const left = new Map(lexical.map((id, index) => [id, index]));
  const right = new Map(ranked.map((id, index) => [id, index]));
  return tools.map(({ id }, index) => ({
    id, index,
    score: (right.has(id) ? 1 / (15 + right.get(id)!) : 0) +
      (left.has(id) ? 1 / (15 + left.get(id)!) : 0),
  })).sort((a, b) => b.score - a.score || a.index - b.index).map(({ id }) => id);
}

/** Rank new catalog tools using lexical search while classifying the original 12. */
export function combineClassifierRankings(
  lexical: readonly ToolId[],
  classified: readonly ToolId[],
  mode: "classifier" | "hybrid",
): ToolId[] {
  // If the best lexical result is outside the training set, protect it from
  // a classifier that has no way to predict that label.
  const untrainedWinner =
    lexical[0] && !classifierLabelSet.has(lexical[0]) ? [lexical[0]] : [];
  const initial = mode === "classifier" ? [...classified] : mergeRankings(lexical, classified);
  const seen = new Set<ToolId>();
  return [...untrainedWinner, ...initial, ...lexical].filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
