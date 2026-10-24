import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { httpRangeMessages } from "../i18n/http-range.ts";
import { HTTP_RANGE_SAMPLE } from "./tools/http-range.ts";

function guide(locale: Locale): ToolGuide {
  const m = httpRangeMessages[locale];
  return {
    introduction: m["tool.http-range.description"],
    steps: [m["tool.http-range.hint"], m["range.exportHelp"]],
    exampleInput: `${HTTP_RANGE_SAMPLE.input}\n${m["range.length"]}: ${HTTP_RANGE_SAMPLE.length}`,
    exampleResult: m["range.exampleResult"],
    limitations: [m["range.scope"], m["range.syntax"], m["range.reference"], m["range.limits"], m["range.privacy"]],
  };
}
export const httpRangeGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
