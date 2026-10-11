import { createI18n } from "vue-i18n";
import { en } from "./en";
import { ja } from "./ja";
import { zhCN } from "./zh-CN";
import { zhTW } from "./zh-TW";
import { ko } from "./ko";
import { toolMessagesEn, toolMessagesJa } from "@/lib/tools/ui-messages";
import { toolZhCN } from "./tool-zh-CN";
import { toolZhTW } from "./tool-zh-TW";
import { toolKo } from "./tool-ko";
import { settings } from "@/lib/preferences";
import { executionMessages } from "./execution";
import { harMessages } from "./har";
import { expansionMessages } from "./expansion";

export const messages = {
  en: {
    ...en,
    ...executionMessages.en,
    ...harMessages.en,
    ...expansionMessages.en,
    ...toolMessagesEn,
    "contrast.largeHint":
      "Large text means at least 18 pt (24 CSS px), or 14 pt (about 18.7 CSS px) when bold. Pass/fail uses the unrounded ratio.",
  },
  ja: {
    ...ja,
    ...executionMessages.ja,
    ...harMessages.ja,
    ...expansionMessages.ja,
    ...toolMessagesJa,
    "contrast.largeHint":
      "大きな文字は18 pt（24 CSS px）以上、太字では14 pt（約18.7 CSS px）以上です。達成判定には丸める前の比率を使います。",
  },
  "zh-CN": {
    ...zhCN,
    ...executionMessages["zh-CN"],
    ...harMessages["zh-CN"],
    ...expansionMessages["zh-CN"],
    ...toolZhCN,
    "contrast.largeHint":
      "大号文字指至少 18 pt（24 CSS px），粗体至少 14 pt（约 18.7 CSS px）。判定使用未经四舍五入的比值。",
  },
  "zh-TW": {
    ...zhTW,
    ...executionMessages["zh-TW"],
    ...harMessages["zh-TW"],
    ...expansionMessages["zh-TW"],
    ...toolZhTW,
    "contrast.largeHint":
      "大字指至少 18 pt（24 CSS px），粗體至少 14 pt（約 18.7 CSS px）。判定使用未經四捨五入的比值。",
  },
  ko: {
    ...ko,
    ...executionMessages.ko,
    ...harMessages.ko,
    ...expansionMessages.ko,
    ...toolKo,
    "contrast.largeHint":
      "큰 텍스트는 18pt(24 CSS px) 이상, 굵은 글씨는 14pt(약 18.7 CSS px) 이상입니다. 판정에는 반올림 전 비율을 사용합니다.",
  },
};

export const i18n = createI18n({
  legacy: false,
  locale: settings.preferences.locale,
  fallbackLocale: "en",
  flatJson: true,
  messages,
});
