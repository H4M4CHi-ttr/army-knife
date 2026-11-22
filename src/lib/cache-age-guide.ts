import { cacheAgeMessages } from "../i18n/cache-age.ts";
import type { Locale } from "./preferences";
import type { ToolGuide } from "./tool-guides";
import { CACHE_AGE_SAMPLE, CACHE_AGE_TIMES } from "./tools/cache-age-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = cacheAgeMessages[locale];
  const times = CACHE_AGE_TIMES.map((field) => `${m[`cacheAge.${field}`]}: ${CACHE_AGE_SAMPLE[field]}`);
  return {
    introduction: m["tool.cache-age.description"],
    steps: [m["tool.cache-age.hint"], m["cacheAge.maximum"]],
    exampleInput: [CACHE_AGE_SAMPLE.headers, ...times].join("\n"),
    exampleResult: m["cacheAge.example"],
    limitations: [m["cacheAge.scope"], m["cacheAge.limits"], m["cacheAge.privacy"]],
  };
}

export const cacheAgeGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
