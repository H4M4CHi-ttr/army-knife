import type { CoreLocale as Locale } from "./locales";
import type { ToolGuide } from "./tool-guides";
import type { QuickToolId } from "./tools/quick-converters";
import { quickMessages } from "../i18n/quick.ts";

const examples: Record<QuickToolId, { input: string; result: string }> = {
  "data-units": {
    input: "1 (MiB → B)",
    result: "1 MiB = 1,048,576 B; 1 MiB = 8,388,608 b. SI MB is not the same as IEC MiB.",
  },
  "css-units": {
    input: "16 px; root font 16 px, element font 16 px, viewport 1440 × 900 px",
    result: "16 px = 1 rem = 1 em; 16 px ≈ 1.111111 vw, at this viewport size.",
  },
  "unicode-normalize": {
    input: "e\u0301 (e plus U+0301 COMBINING ACUTE ACCENT)",
    result: "NFC produces é (U+00E9); NFD keeps U+0065 U+0301. Compatibility forms may change other characters.",
  },
  slug: {
    input: "Hello World\nHello World",
    result: "hello-world and hello-world-2. Collisions are resolved across the supplied non-empty lines.",
  },
  "unicode-escape": {
    input: "A😀",
    result: "In U+ mode, encoding gives U+0041 U+1F600; strict decoding restores A😀.",
  },
};

const generic = {
  en: {
    steps: [
      "Enter a value or use the sample button. Choose the conversion format and relevant context, if any.",
      "Inspect the output and detail table; use Copy or Download to export the generated result.",
    ],
    restriction: "Runs only in the browser. Data is never sent to an API or stored in settings, history or URLs.",
  },
  ja: {
    steps: [
      "値を入力するかサンプルを読み込み、必要に応じて形式・換算条件を選びます。",
      "結果と詳細表を確認し、コピーまたはダウンロードで出力を取り出します。",
    ],
    restriction: "ブラウザー内だけで処理します。入力をAPI・設定・履歴・URLに保存、送信しません。",
  },
  "zh-CN": {
    steps: [
      "输入数值或加载示例，根据需要选择转换格式和计算条件。",
      "检查输出与详细表格，使用复制或下载获取结果。",
    ],
    restriction: "仅在浏览器内运行。不会将输入发送至API或写入设置、历史记录及URL。",
  },
  "zh-TW": {
    steps: [
      "輸入數值或載入範例，需要時選擇轉換格式與運算條件。",
      "檢查輸出與詳細表格，使用複製或下載取得結果。",
    ],
    restriction: "僅在瀏覽器內執行。輸入不會傳送至API或寫入設定、歷史記錄與URL。",
  },
  ko: {
    steps: [
      "값을 입력하거나 예제를 불러오고 필요하면 변환 형식과 기준을 선택하세요.",
      "출력과 상세 표를 확인한 뒤 복사 또는 다운로드로 결과를 가져오세요.",
    ],
    restriction: "브라우저 안에서만 처리합니다. 입력은 API로 전송하거나 설정·기록·URL에 저장하지 않습니다.",
  },
} satisfies Record<Locale, { steps: string[]; restriction: string }>;

const localeResults: Record<Locale, Record<QuickToolId, string>> = {
  en: {
    "data-units": examples["data-units"].result,
    "css-units": examples["css-units"].result,
    "unicode-normalize": examples["unicode-normalize"].result,
    slug: examples.slug.result,
    "unicode-escape": examples["unicode-escape"].result,
  },
  ja: {
    "data-units": "1 MiB = 1,048,576 B = 8,388,608 b。SIのMBとIECのMiBは異なる単位です。",
    "css-units": "rootと要素のフォントが16 pxなら16 px = 1 rem = 1 em。幅1440 pxでは約1.111111 vwです。",
    "unicode-normalize": "NFCはé（U+00E9）、NFDはU+0065 U+0301になります。互換正規化は別の文字も変える場合があります。",
    slug: "hello-worldとhello-world-2を生成します。同じ入力行があっても結果が重複しません。",
    "unicode-escape": "U+形式のエンコードはU+0041 U+1F600。厳密にデコードするとA😀に戻ります。",
  },
  "zh-CN": {
    "data-units": "1 MiB = 1,048,576 B = 8,388,608 b。SI的MB与IEC的MiB不同。",
    "css-units": "根字体及元素字体都是16 px时，16 px = 1 rem = 1 em；视口宽1440 px时约等于1.111111 vw。",
    "unicode-normalize": "NFC生成é（U+00E9），NFD生成U+0065 U+0301。兼容规范化可能还会改变其他字符。",
    slug: "生成hello-world和hello-world-2，重复的行不会产生相同slug。",
    "unicode-escape": "U+编码为U+0041 U+1F600，严格解码后恢复A😀。",
  },
  "zh-TW": {
    "data-units": "1 MiB = 1,048,576 B = 8,388,608 b。SI的MB與IEC的MiB是不同單位。",
    "css-units": "根字型及元素字型皆為16 px時，16 px = 1 rem = 1 em；視窗寬1440 px時約為1.111111 vw。",
    "unicode-normalize": "NFC產生é（U+00E9），NFD產生U+0065 U+0301。相容正規化可能另行改變其他字元。",
    slug: "產生hello-world與hello-world-2，重複的輸入行不會產生相同slug。",
    "unicode-escape": "U+編碼為U+0041 U+1F600，嚴格解碼後還原A😀。",
  },
  ko: {
    "data-units": "1 MiB = 1,048,576 B = 8,388,608 b입니다. SI MB와 IEC MiB는 다른 단위입니다.",
    "css-units": "루트와 요소 글꼴이 16 px면 16 px = 1 rem = 1 em입니다. 뷰포트 너비가 1440 px면 약 1.111111 vw입니다.",
    "unicode-normalize": "NFC는 é(U+00E9), NFD는 U+0065 U+0301입니다. 호환 정규화는 다른 문자를 바꿀 수도 있습니다.",
    slug: "hello-world와 hello-world-2가 생성됩니다. 중복 입력 행도 서로 다른 slug가 됩니다.",
    "unicode-escape": "U+ 형식 인코딩 결과는 U+0041 U+1F600이며 엄격하게 디코딩하면 A😀로 복원됩니다.",
  },
};

function guide(id: QuickToolId, locale: Locale): ToolGuide {
  const translations: Record<string, string> = quickMessages[locale];
  return {
    introduction: translations["tool." + id + ".description"]!,
    steps: generic[locale].steps,
    exampleInput: examples[id].input,
    exampleResult: localeResults[locale][id],
    limitations: [translations["tool." + id + ".hint"]!, generic[locale].restriction],
  };
}

function localized(id: QuickToolId): Record<Locale, ToolGuide> {
  return {
    ja: guide(id, "ja"),
    en: guide(id, "en"),
    "zh-CN": guide(id, "zh-CN"),
    "zh-TW": guide(id, "zh-TW"),
    ko: guide(id, "ko"),
  };
}

/** Every converter gets a typed and localized, no-JavaScript static guide. */
export const quickGuides = {
  "data-units": localized("data-units"),
  "css-units": localized("css-units"),
  "unicode-normalize": localized("unicode-normalize"),
  slug: localized("slug"),
  "unicode-escape": localized("unicode-escape"),
} satisfies Record<QuickToolId, Record<Locale, ToolGuide>>;
