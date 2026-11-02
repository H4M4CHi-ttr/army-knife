import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { retryAfterMessages } from "../i18n/retry-after.ts";
import { RETRY_AFTER_SAMPLE } from "./tools/retry-after-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = retryAfterMessages[locale];
  return {
    introduction: m["tool.retry-after.description"],
    steps: [m["tool.retry-after.hint"], m["retry.exportHelp"]],
    exampleInput: `${RETRY_AFTER_SAMPLE.input}\n${m["retry.reference"]}: ${RETRY_AFTER_SAMPLE.reference}`,
    exampleResult: m["retry.exampleResult"],
    limitations: [m["retry.scope"], m["retry.syntax"], m["retry.limits"], m["retry.privacy"]],
  };
}
export const retryAfterGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
