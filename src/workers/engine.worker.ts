import init, { run } from "../lib/wasm/pkg/army_knife_core.js";
import wasmUrl from "../lib/wasm/pkg/army_knife_core_bg.wasm?url";
import type { EngineEnvelope, WorkerRequest, WorkerResponse } from "../lib/wasm/types";

// Avoid adding WebWorker globals to the entire application's DOM TypeScript scope.
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (response: WorkerResponse) => void;
  close: () => void;
};
let accepted = false;

scope.onmessage = async (event) => {
  if (accepted) return;
  accepted = true;
  const { id, request } = event.data;
  const finish = (response: EngineEnvelope) => {
    scope.postMessage({ id, response });
    scope.close();
  };

  try {
    // Vite resolves this asset under the deployment base, so the module is loaded
    // from GitHub Pages itself. No CDN or external compute service is involved.
    await init({ module_or_path: wasmUrl });
  } catch {
    finish({
      ok: false,
      error: { code: "WASM_UNAVAILABLE", message: "The local WebAssembly module could not load." },
    });
    return;
  }

  try {
    finish(JSON.parse(run(JSON.stringify(request))) as EngineEnvelope);
  } catch {
    finish({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "The local engine could not complete this request.",
      },
    });
  }
};
