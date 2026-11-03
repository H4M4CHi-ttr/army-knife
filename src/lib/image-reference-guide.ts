import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { imageReferenceMessages } from "../i18n/image-reference.ts";
import { IMAGE_REFERENCE_SAMPLE } from "./tools/image-reference-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = imageReferenceMessages[locale];
  return {
    introduction: m["tool.image-reference.description"],
    steps: [m["tool.image-reference.hint"], m["image.exportHelp"]],
    exampleInput: IMAGE_REFERENCE_SAMPLE,
    exampleResult: m["image.exampleResult"],
    limitations: [m["image.scope"], m["image.syntax"], m["image.limits"], m["image.privacy"]],
  };
}
export const imageReferenceGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
