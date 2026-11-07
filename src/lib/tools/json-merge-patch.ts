import { assertInputSize, ToolError } from "./errors";
import { parseJsonSafely, type JsonValue } from "./json";

export const MERGE_PATCH_LIMITS = {
  inputBytes: 16 * 1024, depth: 32, inputNodes: 2000,
  resultNodes: 4000, outputBytes: 128 * 1024, deferredCharacters: 2048,
} as const;

export interface MergePatchPreview {
  document: JsonValue;
  json: string;
  mode: "merge" | "replace";
}

function isObject(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function checkStructure(value: JsonValue, maximumNodes: number): void {
  let nodes = 0;
  function visit(current: JsonValue, depth: number): void {
    if (depth > MERGE_PATCH_LIMITS.depth) throw new ToolError("MERGE_PATCH_DEPTH");
    if (++nodes > maximumNodes) throw new ToolError("MERGE_PATCH_NODES");
    if (current !== null && typeof current === "object") {
      for (const child of Object.values(current)) visit(child, depth + 1);
    }
  }
  visit(value, 0);
}

/** RFC 7396 value transformation; inputs and JSON property names are data only. */
export function previewJsonMergePatch(targetInput: string, patchInput: string): MergePatchPreview {
  assertInputSize(targetInput, MERGE_PATCH_LIMITS.inputBytes);
  assertInputSize(patchInput, MERGE_PATCH_LIMITS.inputBytes);
  const target = parseJsonSafely(targetInput), patch = parseJsonSafely(patchInput);
  checkStructure(target, MERGE_PATCH_LIMITS.inputNodes);
  checkStructure(patch, MERGE_PATCH_LIMITS.inputNodes);

  function merge(before: JsonValue | undefined, changes: JsonValue): JsonValue {
    if (!isObject(changes)) return changes;
    const output = Object.create(null) as Record<string, JsonValue>;
    if (isObject(before)) for (const key of Object.keys(before)) output[key] = before[key]!;
    for (const key of Object.keys(changes)) {
      const value = changes[key]!;
      if (value === null) delete output[key];
      else output[key] = merge(Object.hasOwn(output, key) ? output[key] : undefined, value);
    }
    return output;
  }

  const document = merge(target, patch);
  checkStructure(document, MERGE_PATCH_LIMITS.resultNodes);
  const json = JSON.stringify(document, null, 2);
  if (new TextEncoder().encode(json).byteLength > MERGE_PATCH_LIMITS.outputBytes) {
    throw new ToolError("MERGE_PATCH_OUTPUT");
  }
  return { document, json, mode: isObject(patch) ? "merge" : "replace" };
}
