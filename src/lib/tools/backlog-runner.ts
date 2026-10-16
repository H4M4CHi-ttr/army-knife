import { ToolError } from "./errors";
import {
  aggregateJsonlLogs, convertJsonPointer, csvToInsert, inspectNdjson, inspectSqlitePlan,
  type BacklogKind, type BacklogOptions, type BacklogReport,
} from "./backlog-core";
import { groupStackTraces, inspectDuration, inspectPgDsn, inspectRobots, inspectSitemap } from "./backlog-web";

export type BacklogRequest = { kind: BacklogKind; input: string; options: BacklogOptions };
export function inspectBacklog(request: BacklogRequest): BacklogReport {
  const { kind, input, options } = request;
  switch (kind) {
    case "ndjson": return inspectNdjson(input);
    case "json-pointer": return convertJsonPointer(input, options.mode);
    case "csv-insert": return csvToInsert(input, options);
    case "sqlite-plan": return inspectSqlitePlan(input);
    case "jsonl-logs": return aggregateJsonlLogs(input, options);
    case "stack-trace": return groupStackTraces(input, options);
    case "robots": return inspectRobots(input, options);
    case "sitemap": return inspectSitemap(input);
    case "iso-duration": return inspectDuration(input, options);
    case "pg-dsn": return inspectPgDsn(input);
    default: return assertNever(kind);
  }
}
function assertNever(_value: never): never { throw new ToolError("INVALID_REQUEST"); }
/** No worker fallback: heavy jobs fail explicitly, so the main thread never silently blocks. */
export function inspectBacklogWorker(request: BacklogRequest, signal: AbortSignal): Promise<BacklogReport> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new ToolError("CANCELLED")); return; }
    let worker: Worker | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let done = false;
    const cleanup = () => {
      if (timer !== undefined) clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      if (worker) {
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
        worker.terminate();
      }
    };
    const rejectWith = (code: string) => {
      if (done) return;
      done = true;
      cleanup();
      reject(new ToolError(code));
    };
    const abort = () => rejectWith("CANCELLED");
    signal.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => rejectWith("TIMEOUT"), 5000);
    try {
      worker = new Worker(new URL("../../workers/backlog.worker.ts", import.meta.url), {
        type: "module", name: "army-knife-backlog",
      });
      worker.onmessage = (event: MessageEvent<{ ok: boolean; result?: BacklogReport; code?: string }>) => {
        if (!event.data?.ok || !event.data.result) { rejectWith(event.data?.code || "INTERNAL_ERROR"); return; }
        if (done) return;
        done = true;
        cleanup();
        resolve(event.data.result);
      };
      worker.onerror = event => { event.preventDefault(); rejectWith("INTERNAL_ERROR"); };
      worker.onmessageerror = () => rejectWith("INTERNAL_ERROR");
      worker.postMessage(request);
    } catch { rejectWith("INTERNAL_ERROR"); }
  });
}