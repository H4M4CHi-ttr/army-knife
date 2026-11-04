import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { traceContextMessages } from "../i18n/trace-context.ts";
import { TRACE_CONTEXT_SAMPLE } from "./tools/trace-context-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = traceContextMessages[locale];
  return {
    introduction: m["tool.trace-context.description"],
    steps: [m["tool.trace-context.hint"], m["trace.exportHelp"]],
    exampleInput: `traceparent: ${TRACE_CONTEXT_SAMPLE.parent}\ntracestate: ${TRACE_CONTEXT_SAMPLE.state}`,
    exampleResult: m["trace.exampleResult"],
    limitations: [m["trace.scope"], m["trace.syntax"].replaceAll("{'@'}", "@"), m["trace.limits"], m["trace.privacy"]],
  };
}
export const traceContextGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
