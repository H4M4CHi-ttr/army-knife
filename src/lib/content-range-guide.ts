import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { contentRangeMessages } from "../i18n/content-range.ts";
import { CONTENT_RANGE_SAMPLE } from "./tools/content-range-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = contentRangeMessages[locale];
  return {
    introduction: m["tool.content-range.description"],
    steps: [m["tool.content-range.hint"], m["contentRange.exportHelp"]],
    exampleInput: CONTENT_RANGE_SAMPLE,
    exampleResult: m["contentRange.exampleResult"],
    limitations: [m["contentRange.scope"], m["contentRange.unsatisfiedHelp"], m["contentRange.limits"], m["contentRange.privacy"]],
  };
}
export const contentRangeGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
