import { idnMessages } from "./idn.ts";
import { httpRangeMessages } from "./http-range.ts";
import { patchMessages } from "./git-patch.ts";
import { en } from "./en.ts";
import { ja } from "./ja.ts";
import { zhCN } from "./zh-CN.ts";
import { zhTW } from "./zh-TW.ts";
import { ko } from "./ko.ts";
import { toolMessagesEn, toolMessagesJa } from "../lib/tools/ui-messages.ts";
import { toolZhCN } from "./tool-zh-CN.ts";
import { toolZhTW } from "./tool-zh-TW.ts";
import { toolKo } from "./tool-ko.ts";
import { executionMessages } from "./execution.ts";
import { harMessages } from "./har.ts";
import { expansionMessages } from "./expansion.ts";
import { shortcutMessages } from "./shortcuts.ts";
import { chmodMessages } from "./chmod.ts";
import { base64Messages } from "./base64.ts";
import { fiveToolMessages } from "./five-tools.ts";
import { utilityMessages } from "./utility.ts";
import { inspectorMessages } from "./inspectors.ts";
import { fileHttpInspectorMessages } from "./file-http-inspectors.ts";
import { designToolMessages } from "./design-tool-messages.ts";
import { designLabels } from "./design-labels.ts";
import { quickMessages } from "./quick.ts";
import { htmlAccessibilityMessages } from "./html-accessibility.ts";
import { backlogMessages } from "./backlog.ts";

import { pkceMessages } from "./pkce.ts";
import { serverTimingMessages } from "./server-timing.ts";
import { dispositionMessages } from "./content-disposition.ts";
import { cacheControlMessages } from "./cache-control.ts";
import { corsMessages } from "./cors.ts";
import { searchMessages } from "./search.ts";

export const messages = {
  en: {
    ...idnMessages["en"],
    ...httpRangeMessages["en"],
    ...patchMessages["en"],
    ...dispositionMessages.en,
    ...serverTimingMessages.en,
    ...cacheControlMessages.en,
    ...pkceMessages["en"],
    ...corsMessages["en"],
    ...en,
    ...executionMessages.en,
    ...harMessages.en,
    ...expansionMessages.en,
    ...shortcutMessages.en,
    ...chmodMessages.en,
    ...base64Messages.en,
    ...fiveToolMessages.en,
    ...utilityMessages.en,
    ...inspectorMessages.en,
    ...fileHttpInspectorMessages.en,
    ...designToolMessages.en,
    ...designLabels.en,
    ...quickMessages["en"],
    ...htmlAccessibilityMessages.en,
    ...backlogMessages["en"],
    ...searchMessages.en,
    ...toolMessagesEn,
    "contrast.largeHint":
      "Large text means at least 18 pt (24 CSS px), or 14 pt (about 18.7 CSS px) when bold. Pass/fail uses the unrounded ratio.",
  },
  ja: {
    ...idnMessages["ja"],
    ...httpRangeMessages["ja"],
    ...patchMessages["ja"],
    ...dispositionMessages.ja,
    ...serverTimingMessages.ja,
    ...cacheControlMessages.ja,
    ...pkceMessages["ja"],
    ...corsMessages["ja"],
    ...ja,
    ...executionMessages.ja,
    ...harMessages.ja,
    ...expansionMessages.ja,
    ...shortcutMessages.ja,
    ...chmodMessages.ja,
    ...base64Messages.ja,
    ...fiveToolMessages.ja,
    ...utilityMessages.ja,
    ...inspectorMessages.ja,
    ...fileHttpInspectorMessages.ja,
    ...designToolMessages.ja,
    ...designLabels.ja,
    ...quickMessages["ja"],
    ...htmlAccessibilityMessages.ja,
    ...backlogMessages["ja"],
    ...searchMessages.ja,
    ...toolMessagesJa,
    "contrast.largeHint":
      "大きな文字は18 pt（24 CSS px）以上、太字では14 pt（約18.7 CSS px）以上です。達成判定には丸める前の比率を使います。",
  },
  "zh-CN": {
    ...idnMessages["zh-CN"],
    ...httpRangeMessages["zh-CN"],
    ...patchMessages["zh-CN"],
    ...dispositionMessages["zh-CN"],
    ...serverTimingMessages["zh-CN"],
    ...cacheControlMessages["zh-CN"],
    ...pkceMessages["zh-CN"],
    ...corsMessages["zh-CN"],
    ...zhCN,
    ...executionMessages["zh-CN"],
    ...harMessages["zh-CN"],
    ...expansionMessages["zh-CN"],
    ...shortcutMessages["zh-CN"],
    ...chmodMessages["zh-CN"],
    ...base64Messages["zh-CN"],
    ...fiveToolMessages["zh-CN"],
    ...utilityMessages["zh-CN"],
    ...inspectorMessages["zh-CN"],
    ...fileHttpInspectorMessages["zh-CN"],
    ...designToolMessages["zh-CN"],
    ...designLabels["zh-CN"],
    ...quickMessages["zh-CN"],
    ...htmlAccessibilityMessages["zh-CN"],
    ...backlogMessages["zh-CN"],
    ...searchMessages["zh-CN"],
    ...toolZhCN,
    "contrast.largeHint":
      "大号文字指至少 18 pt（24 CSS px），粗体至少 14 pt（约 18.7 CSS px）。判定使用未经四舍五入的比值。",
  },
  "zh-TW": {
    ...idnMessages["zh-TW"],
    ...httpRangeMessages["zh-TW"],
    ...patchMessages["zh-TW"],
    ...dispositionMessages["zh-TW"],
    ...serverTimingMessages["zh-TW"],
    ...cacheControlMessages["zh-TW"],
    ...pkceMessages["zh-TW"],
    ...corsMessages["zh-TW"],
    ...zhTW,
    ...executionMessages["zh-TW"],
    ...harMessages["zh-TW"],
    ...expansionMessages["zh-TW"],
    ...shortcutMessages["zh-TW"],
    ...chmodMessages["zh-TW"],
    ...base64Messages["zh-TW"],
    ...fiveToolMessages["zh-TW"],
    ...utilityMessages["zh-TW"],
    ...inspectorMessages["zh-TW"],
    ...fileHttpInspectorMessages["zh-TW"],
    ...designToolMessages["zh-TW"],
    ...designLabels["zh-TW"],
    ...quickMessages["zh-TW"],
    ...htmlAccessibilityMessages["zh-TW"],
    ...backlogMessages["zh-TW"],
    ...searchMessages["zh-TW"],
    ...toolZhTW,
    "contrast.largeHint":
      "大字指至少 18 pt（24 CSS px），粗體至少 14 pt（約 18.7 CSS px）。判定使用未經四捨五入的比值。",
  },
  ko: {
    ...idnMessages["ko"],
    ...httpRangeMessages["ko"],
    ...patchMessages["ko"],
    ...dispositionMessages.ko,
    ...serverTimingMessages.ko,
    ...cacheControlMessages.ko,
    ...pkceMessages["ko"],
    ...corsMessages["ko"],
    ...ko,
    ...executionMessages.ko,
    ...harMessages.ko,
    ...expansionMessages.ko,
    ...shortcutMessages.ko,
    ...chmodMessages.ko,
    ...base64Messages.ko,
    ...fiveToolMessages.ko,
    ...utilityMessages.ko,
    ...inspectorMessages.ko,
    ...fileHttpInspectorMessages.ko,
    ...designToolMessages.ko,
    ...designLabels.ko,
    ...quickMessages["ko"],
    ...htmlAccessibilityMessages.ko,
    ...backlogMessages["ko"],
    ...searchMessages.ko,
    ...toolKo,
    "contrast.largeHint":
      "큰 텍스트는 18pt(24 CSS px) 이상, 굵은 글씨는 14pt(약 18.7 CSS px) 이상입니다. 판정에는 반올림 전 비율을 사용합니다.",
  },
};
