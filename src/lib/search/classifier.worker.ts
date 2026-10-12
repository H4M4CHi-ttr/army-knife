/// <reference lib="webworker" />
import { createBrowserClassifier, type BrowserClassifier } from "./classifier-runtime";

type Request =
  | { type: "init" }
  | { type: "rank"; id: number; query: string };

const scope = self as unknown as DedicatedWorkerGlobalScope;
const MAX_GZIP_BYTES = 1_000_000;
const MAX_JSON_CHARS = 6_000_000;
let classifier: BrowserClassifier | null = null;

async function load(): Promise<void> {
  // Same-origin static asset only; no remote model hosting or search requests.
  const url = import.meta.env.BASE_URL + "models/classifier-v1.json.gz";
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error("Local classifier asset unavailable.");
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > MAX_GZIP_BYTES) throw new Error("Classifier exceeds compressed size limit.");
  const compressed = await response.arrayBuffer();
  if (compressed.byteLength > MAX_GZIP_BYTES) throw new Error("Classifier too large.");
  if (typeof DecompressionStream !== "function") {
    throw new Error("This browser does not support gzip decompression.");
  }
  const body = new Response(compressed).body;
  if (!body) throw new Error("Missing classifier data.");
  const started = performance.now();
  const json = await new Response(body.pipeThrough(new DecompressionStream("gzip"))).text();
  if (json.length > MAX_JSON_CHARS) throw new Error("Classifier JSON exceeds limit.");
  classifier = createBrowserClassifier(JSON.parse(json) as unknown);
  scope.postMessage({
    type: "ready",
    bytes: compressed.byteLength,
    features: classifier.featureCount,
    weightBytes: classifier.weightBytes,
    loadingMs: performance.now() - started,
  });
}

scope.onmessage = (event: MessageEvent<Request>) => {
  const message = event.data;
  if (message.type === "init") {
    void load().catch((error: unknown) => {
      scope.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load classifier.",
      });
    });
  } else if (message.type === "rank" && classifier) {
    try {
      const started = performance.now();
      const ranks = classifier.rank(message.query);
      scope.postMessage({
        type: "ranked", id: message.id, ranks,
        inferenceMs: performance.now() - started,
      });
    } catch (error) {
      scope.postMessage({ type: "error", id: message.id, message: String(error) });
    }
  }
};
