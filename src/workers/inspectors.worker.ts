import { analyzeText, transformLiteral } from "../lib/tools/text-advanced";
import { inspectConflicts } from "../lib/tools/inspectors";
import { ToolError } from "../lib/tools/errors";
import type { InspectorWorkerRequest, InspectorWorkerResult } from "../lib/tools/inspector-worker";

/** Input and exception details never enter logs, persistence, or cross-origin requests. */
self.onmessage = (event: MessageEvent<InspectorWorkerRequest>) => {
  const request = event.data;
  try {
    let result: InspectorWorkerResult;
    switch (request.kind) {
      case "text-stats":
        result = { kind: request.kind, data: analyzeText(request.input, request.locale, request.style) };
        break;
      case "string-literals":
        result = { kind: request.kind, data: transformLiteral(request.input, request.format, request.direction) };
        break;
      case "git-conflicts":
        result = { kind: request.kind, data: inspectConflicts(request.input) };
        break;
    }
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({ ok: false, code: error instanceof ToolError ? error.code : "INTERNAL_ERROR" });
  }
};
