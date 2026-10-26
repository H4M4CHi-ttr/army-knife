import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { idnMessages } from "../i18n/idn.ts";
import { IDN_SAMPLE } from "./tools/idn.ts";

function guide(locale: Locale): ToolGuide {
  const m = idnMessages[locale];
  return {
    introduction: m["tool.idn.description"],
    steps: [m["tool.idn.hint"], m["idn.exportHelp"]],
    exampleInput: IDN_SAMPLE,
    exampleResult: m["idn.exampleResult"],
    limitations: [m["idn.scope"], m["idn.syntax"], m["idn.heuristic"], m["idn.limits"], m["idn.privacy"]],
  };
}
export const idnGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
