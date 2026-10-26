import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { dispositionMessages } from "../i18n/content-disposition.ts";

function guide(locale: Locale): ToolGuide {
  const m = dispositionMessages[locale];
  return {
    introduction: m["tool.content-disposition.description"],
    steps: [m["tool.content-disposition.hint"], m["disposition.exportHelp"]],
    exampleInput: 'Content-Disposition: attachment; filename="EURO rates.csv"; filename*=UTF-8\'en\'%E2%82%AC%20rates.csv',
    exampleResult: m["disposition.exampleResult"],
    limitations: [m["disposition.scope"], m["disposition.syntax"], m["disposition.limits"], m["disposition.privacy"]],
  };
}
export const dispositionGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
