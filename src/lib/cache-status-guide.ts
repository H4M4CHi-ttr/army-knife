import { cacheStatusMessages } from "../i18n/cache-status.ts";
import type { Locale } from "./preferences";
import type { ToolGuide } from "./tool-guides";
import { CACHE_STATUS_EXAMPLE } from "./tools/cache-status-sample.ts";

function guide(locale: Locale): ToolGuide {
  const messages = cacheStatusMessages[locale];
  return {
    introduction: messages["tool.cache-status.description"],
    steps: [messages["tool.cache-status.hint"], messages["cacheStatus.scope"]],
    exampleInput: CACHE_STATUS_EXAMPLE,
    exampleResult: messages["cacheStatus.example"],
    limitations: [messages["cacheStatus.limits"], messages["cacheStatus.privacy"]],
  };
}

export const cacheStatusGuide = {
  en: guide("en"),
  ja: guide("ja"),
  "zh-CN": guide("zh-CN"),
  "zh-TW": guide("zh-TW"),
  ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
