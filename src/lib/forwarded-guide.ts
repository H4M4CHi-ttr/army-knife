import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { forwardedMessages } from "../i18n/forwarded.ts";
import { FORWARDED_SAMPLE } from "./tools/forwarded-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = forwardedMessages[locale];
  return {
    introduction: m["tool.forwarded.description"],
    steps: [m["tool.forwarded.hint"], m["forwarded.exportHelp"]],
    exampleInput: FORWARDED_SAMPLE,
    exampleResult: m["forwarded.exampleResult"],
    limitations: [m["forwarded.scope"], m["forwarded.order"], m["forwarded.limits"], m["forwarded.privacy"]],
  };
}
export const forwardedGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
