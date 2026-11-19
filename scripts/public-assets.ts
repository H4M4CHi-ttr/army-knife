import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "/army-knife/";
export const PUBLIC_ASSETS_FILE = "public-assets.json";

/** Build-time file inventory; never includes tool input or runtime state. */
export function distributionFiles(root: string, prefix = BASE): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) throw new Error("Public asset manifest cannot contain symlinks.");
    return entry.isDirectory() ? distributionFiles(join(root, entry.name), prefix + entry.name + "/") : [prefix + entry.name];
  }).sort();
}

export function writePublicAssets(root: string, revision: string): void {
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("Invalid public asset revision.");
  const paths = [...new Set([...distributionFiles(root), BASE + PUBLIC_ASSETS_FILE])].sort();
  writeFileSync(join(root, PUBLIC_ASSETS_FILE), JSON.stringify({ schema: 1, revision, paths }, null, 2) + "\n");
}

/** Shared by local and actual-Pages browser audits, including the clean CI runner. */
export function parsePublicAssets(text: string, expectedRevision?: string): Set<string> {
  const invalid = () => new Error("Invalid public asset manifest.");
  if (text.length > 1024 * 1024) throw invalid();
  let data;
  try { data = JSON.parse(text); } catch { throw invalid(); }
  if (!data || data.schema !== 1 || typeof data.revision !== "string" || !/^[0-9a-f]{40}$/.test(data.revision) ||
      !Array.isArray(data.paths) || data.paths.length === 0 || data.paths.length > 10000) throw invalid();
  if (expectedRevision !== undefined && data.revision !== expectedRevision) throw new Error("Public asset revision does not match the deployed revision.");
  const paths = data.paths as unknown[];
  if (paths.some(path => typeof path !== "string" || !path.startsWith(BASE) || path.endsWith("/") || /[?#%\\\s]/u.test(path) ||
      Array.from(path).some(c => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f) ||
      path.slice(1).split("/").some(part => part === "." || part === ".." || part === ""))) throw invalid();
  const files = paths as string[];
  if (new Set(files).size !== files.length || files.some((path, i) => i > 0 && files[i - 1]! >= path) ||
      !files.includes(BASE + PUBLIC_ASSETS_FILE) || !files.includes(BASE + "index.html")) throw invalid();
  return new Set(files.flatMap(path => path.endsWith("/index.html") ? [path, path.slice(0, -10)] : [path]));
}
