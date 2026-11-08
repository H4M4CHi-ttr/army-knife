import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { acceptMessages } from "../i18n/http-accept.ts";
import { ACCEPT_SAMPLE, ACCEPT_OFFERS_SAMPLE } from "./tools/http-accept-sample.ts";
function guide(locale: Locale): ToolGuide {
  const m = acceptMessages[locale];
  return { introduction: m["tool.http-accept.description"],
    steps: [m["tool.http-accept.hint"], m["accept.rules"], m["accept.exportHelp"]],
    exampleInput: `${ACCEPT_SAMPLE}\n\n${ACCEPT_OFFERS_SAMPLE}`,
    exampleResult: m["accept.exampleResult"],
    limitations: [m["accept.scope"], m["accept.tie"], m["accept.no406"], m["accept.limits"], m["accept.privacy"]] };
}
export const acceptGuide = { en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko") } satisfies Record<Locale, ToolGuide>;
