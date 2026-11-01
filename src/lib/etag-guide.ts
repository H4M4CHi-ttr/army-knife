import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { etagMessages } from "../i18n/etag.ts";
import { ETAG_SAMPLE } from "./tools/etag-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = etagMessages[locale];
  return {
    introduction: m["tool.etag.description"],
    steps: [m["tool.etag.hint"], m["etag.presence"], m["etag.exportHelp"]],
    exampleInput: JSON.stringify(ETAG_SAMPLE, null, 2),
    exampleResult: m["etag.exampleResult"],
    limitations: [m["etag.scope"], m["etag.limits"], m["etag.privacy"], m["etag.escaped"]],
  };
}
export const etagGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
