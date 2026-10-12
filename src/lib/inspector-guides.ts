import type { Locale } from "./locales.ts";
import type { ToolGuide } from "./tool-guides.ts";
import { inspectorMessages } from "../i18n/inspectors.ts";

type InspectorId = "text-stats" | "string-literals" | "http-reference" | "git-conflicts" | "color-converter";
const LOCALES = ["ja","en","zh-CN","zh-TW","ko"] as const satisfies readonly Locale[];

const common = {
  ja: ["入力欄に値を入れるかサンプルを読み込みます。該当する変換方式・分類を選択します。", "結果・診断・制限を確認し、必要な場合だけコピーします。入力は保存・送信されません。"],
  en: ["Enter text or load the provided sample; choose a mode or category when available.", "Inspect the result, diagnostics and limitations. Copy only when needed. Input is neither stored nor transmitted."],
  "zh-CN": ["输入内容或加载示例，并按需选择变换方式或类别。", "查看结果、诊断和限制；仅在需要时复制。输入不会被存储或发送。"],
  "zh-TW": ["輸入內容或載入範例，再依需要選擇轉換方式或類別。", "查看結果、診斷及限制；僅在需要時複製。輸入不會儲存或傳送。"],
  ko: ["입력하거나 예제를 불러온 뒤 변환 방식 또는 범주를 선택하세요.", "결과, 진단, 제한 사항을 확인하고 필요한 경우에만 복사하세요. 입력은 저장하거나 전송하지 않습니다."],
} satisfies Record<Locale, readonly [string,string]>;

const examples: Record<InspectorId, { input: string; result: Record<Locale,string> }> = {
  "text-stats": {
    input: "Hello 👩‍💻\n日本語",
    result: {
      ja: "書記素は絵文字の連結を1つとして扱いますが、UTF-16コード単位とバイト数は異なります。",
      en: "The joined emoji is one grapheme cluster, but several UTF-16 code units and UTF-8 bytes.",
      "zh-CN": "连接的表情符号算一个字素簇，但对应多个 UTF-16 码元和 UTF-8 字节。",
      "zh-TW": "連接的表情符號算一個字素叢集，卻包含多個 UTF-16 單元與 UTF-8 位元組。",
      ko: "연결된 이모지는 한 글자소지만 여러 UTF-16 코드 단위와 UTF-8 바이트를 사용합니다.",
    },
  },
  "string-literals": {
    input: "Hello \"world\"\n日本語",
    result: {
      ja: "JSONモードでは前後の二重引用符を付け、内部の引用符と改行をエスケープします。",
      en: "JSON mode adds surrounding double quotes and escapes the embedded quotes and newline.",
      "zh-CN": "JSON 模式会加上外层双引号，并转义内部引号与换行。",
      "zh-TW": "JSON 模式會加上外層雙引號，並跳脫內部引號與換行。",
      ko: "JSON 모드에서는 전체를 큰따옴표로 감싸고 내부 따옴표와 줄바꿈을 이스케이프합니다.",
    },
  },
  "http-reference": {
    input: "404",
    result: {
      ja: "404 Not Found は4xxクラス。サーバーの方針によってはキャッシュされるためヘッダーを確認します。",
      en: "404 Not Found belongs to the 4xx class; cache behavior depends on response policy.",
      "zh-CN": "404 Not Found 属于 4xx，缓存行为由响应策略决定。",
      "zh-TW": "404 Not Found 屬於 4xx，快取行為取決於回應策略。",
      ko: "404 Not Found는 4xx 범주이며 캐시 동작은 응답 정책에 따라 다릅니다.",
    },
  },
  "git-conflicts": {
    input: "<<<<<<< HEAD\nours\n||||||| base\noriginal\n=======\ntheirs\n>>>>>>> topic",
    result: {
      ja: "oursとtheirsを分離し、diff3の祖先内容も表示します。どちらを採用するかは判断しません。",
      en: "Shows ours and theirs separately, with the diff3 ancestor. Neither side is selected for you.",
      "zh-CN": "分别显示 ours、theirs 和 diff3 共同祖先；不自动选择任何一方。",
      "zh-TW": "分別顯示 ours、theirs 與 diff3 共同祖先；不會自動選擇任何一方。",
      ko: "ours와 theirs, diff3 공통 조상을 분리하여 보여 주며 어느 쪽도 자동 선택하지 않습니다.",
    },
  },
  "color-converter": {
    input: "#33669980",
    result: {
      ja: "sRGBのRGB=(51,102,153)、α=128/255。HEXの末尾2桁は透明度で、HSL/HSVは丸めを含みます。",
      en: "sRGB channels are (51,102,153), alpha is 128/255; the last two HEX digits encode alpha.",
      "zh-CN": "sRGB 通道为 (51,102,153)，透明度为 128/255；HEX 末两位表示透明度。",
      "zh-TW": "sRGB 通道為 (51,102,153)，透明度為 128/255；HEX 最後兩位代表透明度。",
      ko: "sRGB 채널은 (51,102,153), 알파는 128/255이며 HEX 마지막 두 자리가 알파입니다.",
    },
  },
};

function buildGuide(id: InspectorId, locale: Locale): ToolGuide {
  const translated: Record<string,string> = inspectorMessages[locale];
  const key = "tool." + id;
  return {
    introduction: translated[key + ".description"]!,
    steps: common[locale],
    exampleInput: examples[id].input,
    exampleResult: examples[id].result[locale],
    limitations: [
      translated[key + ".hint"]!,
      locale === "ja" ? "大きな入力は800ms遅延・手動適用に切り替わり、小さな入力は即時反映します。表示する結果はHTMLやコードとして実行しません。"
        : locale === "en" ? "Larger inputs use the 800ms deferred/manual apply control; smaller inputs update immediately. Outputs are not executed as code or HTML."
        : locale === "zh-CN" ? "大输入使用800毫秒延迟或手动应用；小输入立即处理。结果不会作为代码或 HTML 执行。"
        : locale === "zh-TW" ? "較大輸入採800毫秒延後或手動套用；較小輸入即時處理。結果不會作為程式碼或 HTML 執行。"
        : "큰 입력은 800ms 지연 또는 수동 적용하고 작은 입력은 즉시 반영합니다. 결과를 코드나 HTML로 실행하지 않습니다.",
    ],
  };
}
export const inspectorGuides = Object.fromEntries(
  (Object.keys(examples) as InspectorId[]).map((id) => [
    id, Object.fromEntries(LOCALES.map((locale) => [locale, buildGuide(id, locale)])),
  ]),
) as Record<InspectorId, Record<Locale, ToolGuide>>;
