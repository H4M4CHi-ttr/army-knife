export async function readTextFile(file: File, maxBytes: number): Promise<string> {
  if (file.size > maxBytes) throw new Error("INPUT_TOO_LARGE");
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("INVALID_UTF8");
  }
}

export async function copyText(value: string): Promise<void> {
  if (!navigator.clipboard?.writeText) throw new Error("CLIPBOARD_UNAVAILABLE");
  await navigator.clipboard.writeText(value);
}

export function downloadText(
  value: string,
  filename: string,
  type = "text/plain;charset=utf-8",
): void {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


/** Once text reaches this size, the UI shows only a bounded read-only preview. */
export const LARGE_TEXT_THRESHOLD = 128 * 1024;
export const LARGE_TEXT_PREVIEW = 2_048;

/** File decode and large clipboard UTF-8 validation run in a same-origin Web Worker. */
export function prepareLargeText(
  source: File | string,
  maxBytes: number,
  signal?: AbortSignal,
): Promise<string> {
  if (signal?.aborted) return Promise.reject(new Error("CANCELLED"));
  if (typeof source === "string" && source.length > maxBytes)
    return Promise.reject(new Error("INPUT_TOO_LARGE"));
  if (typeof source !== "string" && source.size > maxBytes)
    return Promise.reject(new Error("INPUT_TOO_LARGE"));

  return new Promise<string>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("../workers/text-input.worker.ts", import.meta.url), {
        type: "module",
        name: "army-knife-text-loader",
      });
    } catch {
      reject(new Error("INTERNAL_ERROR"));
      return;
    }
    let finished = false;
    const finish = (error?: string, text?: string) => {
      if (finished) return;
      finished = true;
      signal?.removeEventListener("abort", onAbort);
      clearTimeout(timeout);
      worker.terminate();
      if (error) reject(new Error(error));
      else resolve(text ?? "");
    };
    const onAbort = () => finish("CANCELLED");
    const timeout = setTimeout(() => finish("INTERNAL_ERROR"), 30_000);
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) {
      onAbort();
      return;
    }
    worker.onmessage = (event: MessageEvent<
      { id: number; ok: true; text: string } | { id: number; ok: false; code: string }
    >) => {
      const response = event.data;
      if (response.id !== 1) return;
      if (response.ok) finish(undefined, response.text);
      else finish(response.code);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish("INTERNAL_ERROR");
    };
    worker.onmessageerror = () => finish("INTERNAL_ERROR");
    try {
      worker.postMessage({
        id: 1,
        maxBytes,
        source:
          typeof source === "string"
            ? { kind: "text", value: source }
            : { kind: "file", file: source },
      });
    } catch {
      finish("INTERNAL_ERROR");
    }
  });
}
