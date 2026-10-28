import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { jwkMessages } from "../i18n/jwk.ts";
import { JWK_SAMPLE } from "./tools/jwk-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = jwkMessages[locale];
  return {
    introduction: m["tool.jwk.description"],
    steps: [m["tool.jwk.hint"], m["jwk.exportHelp"]],
    exampleInput: JWK_SAMPLE,
    exampleResult: m["jwk.exampleResult"],
    limitations: [m["jwk.scope"], m["jwk.limits"], m["jwk.privacy"]],
  };
}
export const jwkGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
