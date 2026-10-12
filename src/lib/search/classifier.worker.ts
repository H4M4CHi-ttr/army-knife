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
  // Some static hosts (including Vite preview) serve .json.gz with
  // Content-Encoding: gzip. Fetch then transparently decompresses the body.
  // Other hosts return the gzip file as-is. Never decompress twice.
  const payload = await response.arrayBuffer();
  const isGzip = payload.byteLength >= 2 &&
    new Uint8Array(payload, 0, 2)[0] === 0x1f &&
    new Uint8Array(payload, 0, 2)[1] === 0x8b;
  if (isGzip && payload.byteLength > MAX_GZIP_BYTES) {
    throw new Error("Classifier compressed data too large.");
  }
  if (!isGzip && payload.byteLength > MAX_JSON_CHARS * 2) {
    throw new Error("Classifier decoded data too large.");
  }
  const started = performance.now();
  let json: string;
  if (isGzip) {
    if (typeof DecompressionStream !== "function") {
      throw new Error("This browser cannot decompress gzip data.");
    }
    const body = new Response(payload).body;
    if (!body) throw new Error("Missing classifier data.");
    json = await new Response(body.pipeThrough(new DecompressionStream("gzip"))).text();
  } else {
    json = new TextDecoder("utf-8", { fatal: true }).decode(payload);
  }
  if (json.length > MAX_JSON_CHARS) throw new Error("Classifier JSON exceeds limit.");
  classifier = createBrowserClassifier(JSON.parse(json) as unknown);
  scope.postMessage({
    type: "ready",
    bytes: declared || (isGzip ? payload.byteLength : 0),
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
