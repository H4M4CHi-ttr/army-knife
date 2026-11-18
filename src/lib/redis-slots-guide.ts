import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { redisSlotsMessages } from "../i18n/redis-slots.ts";
import { REDIS_SLOTS_SAMPLE } from "./tools/redis-slots-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = redisSlotsMessages[locale];
  return {
    introduction: m["tool.redis-slots.description"],
    steps: [m["tool.redis-slots.hint"], m["redis.grammar"], m["redis.exportHelp"]],
    exampleInput: REDIS_SLOTS_SAMPLE,
    exampleResult: m["redis.exampleResult"],
    limitations: [m["redis.scope"], m["redis.limits"], m["redis.privacy"]],
  };
}
export const redisSlotsGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
