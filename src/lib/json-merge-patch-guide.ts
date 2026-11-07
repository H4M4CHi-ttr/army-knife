import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { mergePatchMessages } from "../i18n/json-merge-patch";
import { MERGE_PATCH_TARGET_SAMPLE, MERGE_PATCH_SAMPLE } from "./tools/json-merge-patch-sample";

function guide(locale: Locale): ToolGuide {
  const m = mergePatchMessages[locale];
  return {
    introduction: m["tool.json-merge-patch.description"],
    steps: [m["tool.json-merge-patch.hint"], m["mergePatch.exportHelp"]],
    exampleInput: `${m["mergePatch.target"]}:\n${MERGE_PATCH_TARGET_SAMPLE}\n\n${m["mergePatch.patch"]}:\n${MERGE_PATCH_SAMPLE}`,
    exampleResult: m["mergePatch.exampleResult"],
    limitations: [m["mergePatch.rules"], m["mergePatch.scope"], m["mergePatch.precision"], m["mergePatch.limits"], m["mergePatch.privacy"]],
  };
}
export const mergePatchGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
