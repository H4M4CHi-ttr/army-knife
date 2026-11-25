import { hreflangMessages } from "../i18n/hreflang.ts";
import type { Locale } from "./preferences";
import type { ToolGuide } from "./tool-guides";
import { HREFLANG_SAMPLE } from "./tools/hreflang-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = hreflangMessages[locale];
  const { a, b } = HREFLANG_SAMPLE;
  return {
    introduction: m["hreflang.guide"],
    steps: [m["tool.hreflang.hint"], m["hreflang.unchecked"]],
    exampleInput: [m["hreflang.page.a"], a.url, a.head, "", m["hreflang.page.b"], b.url, b.head].join("\n"),
    exampleResult: m["hreflang.example"],
    limitations: [m["hreflang.scope"], m["hreflang.limits"], m["hreflang.privacy"]],
  };
}

export const hreflangGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
