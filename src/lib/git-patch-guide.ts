import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { patchMessages } from "../i18n/git-patch.ts";
import { PATCH_SAMPLE } from "./tools/git-patch.ts";
function guide(locale: Locale): ToolGuide {
  const m = patchMessages[locale];
  return {
    introduction: m["tool.git-patch.description"],
    steps: [m["tool.git-patch.hint"], m["patch.exportHelp"]],
    exampleInput: PATCH_SAMPLE, exampleResult: m["patch.exampleResult"],
    limitations: [m["patch.scope"], m["patch.syntax"], m["patch.limits"], m["patch.privacy"]],
  };
}
export const patchGuide = { en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko") } satisfies Record<Locale, ToolGuide>;
