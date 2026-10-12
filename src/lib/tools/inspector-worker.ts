import { ToolError } from "./errors";
import type { CaseStyle, LiteralFormat, LiteralDirection, TextAnalysis } from "./text-advanced";
import type { ConflictEntry, ConflictDiagnostic } from "./inspectors";

export type InspectorWorkerRequest =
  | { kind: "text-stats"; input: string; locale: string; style: CaseStyle }
  | { kind: "string-literals"; input: string; format: LiteralFormat; direction: LiteralDirection }
  | { kind: "git-conflicts"; input: string };
export type InspectorWorkerResult =
  | { kind: "text-stats"; data: TextAnalysis }
  | { kind: "string-literals"; data: string }
  | { kind: "git-conflicts"; data: { conflicts: ConflictEntry[]; diagnostics: ConflictDiagnostic[]; lines: number } };

interface WorkerReply { ok: boolean; result?: InspectorWorkerResult; code?: string }

/** Heavy inputs never silently fall back to the UI thread. */
export function runInspectorWorker(
  request: InspectorWorkerRequest, signal: AbortSignal,
): Promise<InspectorWorkerResult> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new ToolError("CANCELLED")); return; }
    let settled = false;
    let worker: Worker | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (timeout !== undefined) clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      if (worker) {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
        worker.terminate();
      }
    };
    const fail = (code: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new ToolError(code));
    };
    const onAbort = () => fail("CANCELLED");
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) { onAbort(); return; }
    timeout = setTimeout(() => fail("TIMEOUT"), 5000);
    try {
      worker = new Worker(new URL("../../workers/inspectors.worker.ts", import.meta.url), {
        type: "module", name: "army-knife-inspectors",
      });
      worker.onmessage = (event: MessageEvent<WorkerReply>) => {
        const reply = event.data;
        if (!reply?.ok || !reply.result) { fail(reply?.code ?? "INTERNAL_ERROR"); return; }
        if (reply.result.kind !== request.kind) { fail("INTERNAL_ERROR"); return; }
        if (settled) return;
        settled = true;
        cleanup();
        resolve(reply.result);
      };
      worker.onerror = (event) => { event.preventDefault(); fail("INTERNAL_ERROR"); };
      worker.onmessageerror = () => fail("INTERNAL_ERROR");
      worker.postMessage(request);
    } catch { fail("INTERNAL_ERROR"); }
  });
}
