import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { gitBranchMessages } from "../i18n/git-branch.ts";
import { GIT_BRANCH_SAMPLE } from "./tools/git-branch-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = gitBranchMessages[locale];
  return {
    introduction: m["tool.git-branch.description"],
    steps: [m["tool.git-branch.hint"], m["gitBranch.grammar"], m["gitBranch.exportHelp"]],
    exampleInput: GIT_BRANCH_SAMPLE,
    exampleResult: m["gitBranch.exampleResult"],
    limitations: [m["gitBranch.scope"], m["gitBranch.limits"], m["gitBranch.privacy"]],
  };
}
export const gitBranchGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
