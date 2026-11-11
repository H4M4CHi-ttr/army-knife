import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { dnsTxtMessages } from "../i18n/dns-txt.ts";
import { DNS_TXT_SAMPLE_TEXT } from "./tools/dns-txt-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = dnsTxtMessages[locale];
  return {
    introduction: m["tool.dns-txt.description"],
    steps: [m["tool.dns-txt.hint"], m["dnsTxt.exportHelp"]],
    exampleInput: DNS_TXT_SAMPLE_TEXT,
    exampleResult: m["dnsTxt.exampleResult"],
    limitations: [m["dnsTxt.scope"], m["dnsTxt.grammar"], m["dnsTxt.limits"], m["dnsTxt.privacy"]],
  };
}
export const dnsTxtGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
