import { gitignoreMessages } from "../i18n/gitignore.ts";
import type { Locale } from "./preferences";
import type { ToolGuide } from "./tool-guides";
import { GITIGNORE_SAMPLE } from "./tools/gitignore-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = gitignoreMessages[locale];
  return {
    introduction: m["gitignore.guide"],
    steps: [m["tool.gitignore.hint"], m["gitignore.windows"], m["gitignore.download"]],
    exampleInput: [m["gitignore.rules"], GITIGNORE_SAMPLE.rules, "", m["gitignore.paths"], GITIGNORE_SAMPLE.paths].join("\n"),
    exampleResult: m["gitignore.example"],
    limitations: [m["gitignore.scope"], m["gitignore.pathScope"], m["gitignore.limits"], m["gitignore.privacy"]],
  };
}

export const gitignoreGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
