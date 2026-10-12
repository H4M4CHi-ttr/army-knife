/** Decode/validate large user-supplied text off the UI thread. Never fetches URLs. */
type Job = {
  id: number;
  maxBytes: number;
  source: { kind: "file"; file: File } | { kind: "text"; value: string };
};
type Reply =
  | { id: number; ok: true; text: string }
  | { id: number; ok: false; code: "INPUT_TOO_LARGE" | "INVALID_UTF8" | "INTERNAL_ERROR" };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Job>) => void) | null;
  postMessage: (response: Reply) => void;
};

scope.onmessage = async ({ data }) => {
  const { id, maxBytes, source } = data;
  try {
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new Error("INTERNAL_ERROR");
    if (source.kind === "file") {
      if (source.file.size > maxBytes) throw new Error("INPUT_TOO_LARGE");
      const bytes = await source.file.arrayBuffer();
      if (bytes.byteLength > maxBytes) throw new Error("INPUT_TOO_LARGE");
      try {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        scope.postMessage({ id, ok: true, text });
      } catch {
        throw new Error("INVALID_UTF8");
      }
    } else {
      if (source.value.length > maxBytes) throw new Error("INPUT_TOO_LARGE");
      if (new TextEncoder().encode(source.value).byteLength > maxBytes)
        throw new Error("INPUT_TOO_LARGE");
      scope.postMessage({ id, ok: true, text: source.value });
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    scope.postMessage({
      id,
      ok: false,
      code:
        code === "INPUT_TOO_LARGE" || code === "INVALID_UTF8" ? code : "INTERNAL_ERROR",
    });
  }
};
