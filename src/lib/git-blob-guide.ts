import { gitBlobMessages } from "../i18n/git-blob.ts";
import type { Locale } from "./preferences";
import type { ToolGuide } from "./tool-guides";

function guide(locale: Locale): ToolGuide {
  const text = gitBlobMessages[locale];
  return {
    introduction: text["tool.git-blob.description"],
    steps: [text["tool.git-blob.hint"], text["gitBlob.format"]],
    exampleInput: "empty.bin (0 B)",
    exampleResult: "SHA-1 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391\nSHA-256 473a0f4c3be8a93681a267e3b1e9a7dcda1185436fe141f7749120a303721813",
    limitations: [text["gitBlob.scope"]],
  };
}

export const gitBlobGuide = {
  en: guide("en"),
  ja: guide("ja"),
  "zh-CN": guide("zh-CN"),
  "zh-TW": guide("zh-TW"),
  ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
