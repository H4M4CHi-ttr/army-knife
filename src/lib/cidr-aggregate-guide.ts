import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { cidrAggregateMessages } from "../i18n/cidr-aggregate.ts";
import { CIDR_AGGREGATE_SAMPLE } from "./tools/cidr-aggregate-sample.ts";
function guide(locale: Locale): ToolGuide {
  const m = cidrAggregateMessages[locale];
  return { introduction: m["tool.cidr-aggregate.description"],
    steps: [m["tool.cidr-aggregate.hint"], m["cidrAgg.grammar"], m["cidrAgg.exportHelp"]],
    exampleInput: CIDR_AGGREGATE_SAMPLE, exampleResult: m["cidrAgg.exampleResult"],
    limitations: [m["cidrAgg.scope"], m["cidrAgg.limits"], m["cidrAgg.privacy"]] };
}
export const cidrAggregateGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
