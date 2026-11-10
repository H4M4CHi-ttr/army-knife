import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { pgLsnMessages } from "../i18n/pg-lsn.ts";
import { PG_LSN_SAMPLE } from "./tools/pg-lsn-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = pgLsnMessages[locale];
  return {
    introduction: m["tool.pg-lsn.description"],
    steps: [m["tool.pg-lsn.hint"], m["lsn.exportHelp"]],
    exampleInput: `A: ${PG_LSN_SAMPLE.first}\nB: ${PG_LSN_SAMPLE.second}\n16 MiB`,
    exampleResult: m["lsn.exampleResult"],
    limitations: [m["lsn.scope"], m["lsn.boundary"], m["lsn.zero"], m["lsn.limits"], m["lsn.privacy"]],
  };
}
export const pgLsnGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
