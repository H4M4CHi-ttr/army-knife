import { CORE_LOCALES as LOCALES, type CoreLocale as Locale } from "./locales.ts";
import type { ToolGuide } from "./tool-guides.ts";
import { designToolMessages } from "../i18n/design-tool-messages.ts";
const help:Record<Locale,readonly [string,string]> = {
  ja:["設定や入力値を編集します。計算はブラウザー内だけで行います。","結果を確認し、必要なときだけコピーまたは保存します。"],
  en:["Edit the controls or paste your input. Processing stays inside this browser.","Review the result, then explicitly copy or download it if needed."],
  "zh-CN":["编辑设置或粘贴输入。处理仅在浏览器内进行。","检查结果，需要时主动复制或下载。"],
  "zh-TW":["編輯設定或貼上輸入。處理只在瀏覽器內進行。","檢查結果，需要時主動複製或下載。"],
  ko:["설정 또는 입력을 편집하세요. 처리는 브라우저 내부에서만 수행합니다.","결과를 확인한 뒤 필요한 경우 직접 복사하거나 저장하세요."],
};
const examples = {
  "cubic-bezier": { input:"x1=.25, y1=.1, x2=.25, y2=1; duration=600 ms", result:"cubic-bezier(0.25, 0.1, 0.25, 1)" },
  "css-gradient": { input:"linear 90deg; #3366FF 0%, #FF8C00CC 100%", result:"linear-gradient(90deg, #3366FF 0%, #FF8C00CC 100%)" },
  "svg-placeholder": { input:"640×360, #2D5B8A, label='640 × 360'", result:'<svg xmlns="http://www.w3.org/2000/svg" ...>…</svg> (SVG and PNG export)' },
  "path-batch": { input:"src/Report.txt\nsrc/report.txt; suffix=-new", result:"src/Report-new.txt / src/report-new.txt; potential case-insensitive collision" },
  "color-palette": { input:"base=#3366FF, count=5, analogous", result:"Five deterministic HSL hues and copyable CSS variables" },
} as const;
type Id=keyof typeof examples;
export const designGuides=Object.fromEntries(Object.entries(examples).map(([id,example])=>[
  id,
  Object.fromEntries(LOCALES.map(locale=>[
    locale,
    {
      introduction:designToolMessages[locale]["tool."+id+".description" as keyof typeof designToolMessages[typeof locale]],
      steps:help[locale],
      exampleInput:example.input,
      exampleResult:example.result,
      limitations:[designToolMessages[locale]["tool."+id+".hint" as keyof typeof designToolMessages[typeof locale]]],
    },
  ])) as unknown as Record<Locale,ToolGuide>,
])) as Record<Id,Record<Locale,ToolGuide>>;
