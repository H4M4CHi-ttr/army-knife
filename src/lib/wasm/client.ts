import { ENGINE_LIMITS } from "./types";
import type { EngineErrorCode, EngineRequest, ResultFor, WorkerResponse } from "./types";

export class EngineError extends Error {
  override readonly name = "EngineError";
  readonly code: EngineErrorCode;

  constructor(code: EngineErrorCode, message: string = code) {
    super(message);
    this.code = code;
  }
}

export interface RunEngineOptions {
  signal?: AbortSignal;
  /** Maximum 30 seconds, including module loading. */
  timeoutMs?: number;
}

function validateInputSize(request: EngineRequest): void {
  const values =
    request.operation === "sets"
      ? [request.left, request.right]
      : request.operation === "logs"
        ? [request.text, request.pattern]
        : [request.text];
  if (values.reduce((sum, value) => sum + value.length, 0) > ENGINE_LIMITS.inputBytes) {
    throw new EngineError("INPUT_TOO_LARGE");
  }
  // Only a constant-time UTF-16 lower bound is checked here. Encoding a
  // 16 MiB Unicode string was a long main-thread task on slow devices.
  // The worker checks exact UTF-8 byte counts before loading WASM.
  if (request.operation === "logs" && request.pattern.length > ENGINE_LIMITS.regexBytes) {
    throw new EngineError("REGEX_TOO_LARGE");
  }
}

/**
 * A fresh worker owns every request. Success, error, abort, and timeout all terminate
 * it, releasing its WASM memory and input. No data is persisted and there is no JS
 * fallback that could quietly run a heavy job on the UI thread.
 */
export function runEngine<T extends EngineRequest>(
  request: T,
  options: RunEngineOptions = {},
): Promise<ResultFor<T>> {
  if (options.signal?.aborted) {
    return Promise.reject(new EngineError("CANCELLED"));
  }
  try {
    validateInputSize(request);
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    let worker: Worker | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const signal = options.signal;
    const requestedTimeout = options.timeoutMs ?? ENGINE_LIMITS.timeoutMs;
    const timeoutMs = Number.isFinite(requestedTimeout)
      ? Math.max(1, Math.min(requestedTimeout, ENGINE_LIMITS.timeoutMs))
      : ENGINE_LIMITS.timeoutMs;

    const cleanup = () => {
      if (timer !== undefined) clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      if (worker) {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
        worker.terminate();
      }
    };
    const fail = (error: EngineError) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const onAbort = () => fail(new EngineError("CANCELLED"));

    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) {
      onAbort();
      return;
    }
    timer = setTimeout(() => fail(new EngineError("TIMEOUT")), timeoutMs);

    try {
      worker = new Worker(new URL("../../workers/engine.worker.ts", import.meta.url), {
        type: "module",
        name: "army-knife-local-engine",
      });
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (settled || event.data.id !== 1) return;
        const response = event.data.response;
        if (!response.ok) {
          fail(new EngineError(response.error.code, response.error.message));
          return;
        }
        if (response.result.operation !== request.operation) {
          fail(new EngineError("INTERNAL_ERROR", "Unexpected engine response."));
          return;
        }
        settled = true;
        cleanup();
        resolve(response.result as ResultFor<T>);
      };
      worker.onerror = (event) => {
        event.preventDefault();
        fail(
          new EngineError("WASM_UNAVAILABLE", "The local WASM worker could not start or finish."),
        );
      };
      worker.onmessageerror = () => {
        fail(new EngineError("INTERNAL_ERROR", "The local worker response could not be read."));
      };
      worker.postMessage({ id: 1, request });
    } catch {
      fail(new EngineError("WASM_UNAVAILABLE", "Web Workers or WebAssembly are unavailable."));
    }
  });
}
