import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { httpLinkMessages } from "../i18n/http-link.ts";
import { HTTP_LINK_SAMPLE } from "./tools/http-link-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = httpLinkMessages[locale];
  return {
    introduction: m["tool.http-link.description"],
    steps: [m["tool.http-link.hint"], m["link.exportHelp"]],
    exampleInput: HTTP_LINK_SAMPLE,
    exampleResult: m["link.exampleResult"],
    limitations: [m["link.scope"], m["link.limits"], m["link.privacy"]],
  };
}
export const httpLinkGuide = { en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko") } satisfies Record<Locale, ToolGuide>;
