import { inspectBacklog, type BacklogRequest } from "../lib/tools/backlog-runner";
import { ToolError } from "../lib/tools/errors";
/** Structured-clone only, with no storage, fetch, or user input in logs. */
self.onmessage = (event: MessageEvent<BacklogRequest>) => {
  try {
    if (event.data.kind === "sitemap") throw new ToolError("INVALID_REQUEST");
    const result = inspectBacklog(event.data);
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({ ok: false, code: error instanceof ToolError ? error.code : "INTERNAL_ERROR" });
  }
};