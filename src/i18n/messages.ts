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

export const messages = {
  en: {
    ...en,
    ...executionMessages.en,
    ...harMessages.en,
    ...expansionMessages.en,
    ...shortcutMessages.en,
    ...chmodMessages.en,
    ...base64Messages.en,
    ...fiveToolMessages.en,
    ...utilityMessages.en,
    ...toolMessagesEn,
    "contrast.largeHint":
      "Large text means at least 18 pt (24 CSS px), or 14 pt (about 18.7 CSS px) when bold. Pass/fail uses the unrounded ratio.",
  },
  ja: {
    ...ja,
    ...executionMessages.ja,
    ...harMessages.ja,
    ...expansionMessages.ja,
    ...shortcutMessages.ja,
    ...chmodMessages.ja,
    ...base64Messages.ja,
    ...fiveToolMessages.ja,
    ...utilityMessages.ja,
    ...toolMessagesJa,
    "contrast.largeHint":
      "大きな文字は18 pt（24 CSS px）以上、太字では14 pt（約18.7 CSS px）以上です。達成判定には丸める前の比率を使います。",
  },
  "zh-CN": {
    ...zhCN,
    ...executionMessages["zh-CN"],
    ...harMessages["zh-CN"],
    ...expansionMessages["zh-CN"],
    ...shortcutMessages["zh-CN"],
    ...chmodMessages["zh-CN"],
    ...base64Messages["zh-CN"],
    ...fiveToolMessages["zh-CN"],
    ...utilityMessages["zh-CN"],
    ...toolZhCN,
    "contrast.largeHint":
      "大号文字指至少 18 pt（24 CSS px），粗体至少 14 pt（约 18.7 CSS px）。判定使用未经四舍五入的比值。",
  },
  "zh-TW": {
    ...zhTW,
    ...executionMessages["zh-TW"],
    ...harMessages["zh-TW"],
    ...expansionMessages["zh-TW"],
    ...shortcutMessages["zh-TW"],
    ...chmodMessages["zh-TW"],
    ...base64Messages["zh-TW"],
    ...fiveToolMessages["zh-TW"],
    ...utilityMessages["zh-TW"],
    ...toolZhTW,
    "contrast.largeHint":
      "大字指至少 18 pt（24 CSS px），粗體至少 14 pt（約 18.7 CSS px）。判定使用未經四捨五入的比值。",
  },
  ko: {
    ...ko,
    ...executionMessages.ko,
    ...harMessages.ko,
    ...expansionMessages.ko,
    ...shortcutMessages.ko,
    ...chmodMessages.ko,
    ...base64Messages.ko,
    ...fiveToolMessages.ko,
    ...utilityMessages.ko,
    ...toolKo,
    "contrast.largeHint":
      "큰 텍스트는 18pt(24 CSS px) 이상, 굵은 글씨는 14pt(약 18.7 CSS px) 이상입니다. 판정에는 반올림 전 비율을 사용합니다.",
  },
};
