import { csvKeyDiffMessages } from "../i18n/csv-key-diff.ts";
import type { Locale } from "./preferences";
import type { ToolGuide } from "./tool-guides";
import { CSV_KEY_DIFF_SAMPLE } from "./tools/csv-key-diff-sample.ts";

function guide(locale: Locale): ToolGuide {
  const m = csvKeyDiffMessages[locale];
  const { before, after } = CSV_KEY_DIFF_SAMPLE;
  return {
    introduction: m["csvDiff.guide"],
    steps: [m["tool.csv-key-diff.hint"], m["csvDiff.exportHint"]],
    exampleInput: [m["csvDiff.before"], before.text, "", m["csvDiff.after"], after.text].join("\n"),
    exampleResult: m["csvDiff.example"],
    limitations: [m["csvDiff.scope"], m["csvDiff.limits"], m["csvDiff.privacy"]],
  };
}

export const csvKeyDiffGuide = {
  en: guide("en"), ja: guide("ja"), "zh-CN": guide("zh-CN"), "zh-TW": guide("zh-TW"), ko: guide("ko"),
} satisfies Record<Locale, ToolGuide>;
