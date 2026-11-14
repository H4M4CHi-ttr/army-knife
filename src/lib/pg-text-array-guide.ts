import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { pgTextArrayMessages } from "../i18n/pg-text-array.ts";
import { PG_TEXT_ARRAY_SAMPLE } from "./tools/pg-text-array-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = pgTextArrayMessages[locale];
  return {
    introduction: m["tool.pg-text-array.description"],
    steps: [m["tool.pg-text-array.hint"], m["pgArray.exportHelp"]],
    exampleInput: PG_TEXT_ARRAY_SAMPLE,
    exampleResult: m["pgArray.exampleResult"],
    limitations: [m["pgArray.scope"], m["pgArray.grammar"], m["pgArray.zeroDimensions"], m["pgArray.limits"], m["pgArray.privacy"]],
  };
}
export const pgTextArrayGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
