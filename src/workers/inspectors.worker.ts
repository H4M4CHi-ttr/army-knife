import { analyzeText, transformLiteral } from "../lib/tools/text-advanced";
import { inspectICalendar } from "../lib/tools/icalendar";
import { inspectConflicts } from "../lib/tools/inspectors";
import { ToolError } from "../lib/tools/errors";
import type { InspectorWorkerRequest, InspectorWorkerResult } from "../lib/tools/inspector-worker";

/** Input and exception details never enter logs, persistence, or cross-origin requests. */
self.onmessage = async (event: MessageEvent<InspectorWorkerRequest>) => {
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
      case "csv-key-diff": {
        const { compareCsvKeys } = await import("../lib/tools/csv-key-diff");
        result = { kind: request.kind, data: compareCsvKeys(request.input) };
        break;
      }
      case "hreflang": {
        const { inspectHreflangPair } = await import("../lib/tools/hreflang");
        result = { kind: request.kind, data: inspectHreflangPair(request.input) };
        break;
      }
      case "icalendar":
        result = { kind: request.kind, data: inspectICalendar(request.input) };
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
