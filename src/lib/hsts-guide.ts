import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { hstsMessages } from "../i18n/hsts.ts";
import { HSTS_SAMPLE } from "./tools/hsts-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = hstsMessages[locale];
  return {
    introduction: m["tool.hsts.description"],
    steps: [m["tool.hsts.hint"], m["hsts.exportHelp"]],
    exampleInput: HSTS_SAMPLE,
    exampleResult: m["hsts.exampleResult"],
    limitations: [m["hsts.scope"], m["hsts.zero"], m["hsts.preloadHelp"], m["hsts.limits"], m["hsts.privacy"]],
  };
}
export const hstsGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
