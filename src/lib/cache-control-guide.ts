import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { cacheControlMessages as messages } from "../i18n/cache-control.ts";

const exampleInput = 'Cache-Control: public, max-age=60\nCache-Control: max-age=120, x-cache="edge, local"';
export const cacheControlGuide = {
  en: {
    introduction: messages.en["tool.cache-control.description"],
    steps: [
      "Paste a single response field value, or multiple Cache-Control: lines. The example uses synthetic headers. Small edits update immediately; longer input supports automatic delay, manual apply and cancel.",
      "Review each directive, exact declared seconds and warnings. Repeated directives remain separate; no effective value is chosen. Copy or download the JSON report only when needed.",
    ],
    exampleInput,
    exampleResult: "Four directives. Both max-age entries are marked duplicate; the quoted comma in x-cache stays inside its single argument. x-cache is an uninterpreted extension.",
    limitations: [messages.en["cache.scope"], messages.en["cache.limits"],
      "RFC 9111 response directives plus immutable, stale-while-revalidate and stale-if-error. Tokens and HTTP quoted strings only; strict equals syntax, no obsolete line folding, status line, other headers or request-directive evaluation. Huge seconds stay exact strings; caches may cap their numeric range.",
      "Unknown extensions and invalid known arguments are disclosed. Syntax or size errors return no partial report. Inputs/results remain in memory, never URLs, storage, logs or requests; navigation/reload clears them. No new dependency or external resource is loaded.",
    ],
  },
  ja: {
    introduction: messages.ja["tool.cache-control.description"],
    steps: [
      "応答フィールドの値を1行、またはCache-Control:行を複数貼り付けます。入力例は架空のヘッダーです。短い編集は即時、長い入力は自動待機・手動反映・中止に対応します。",
      "各項目・正確な指定秒数・警告を確認します。重複は別々に保持し、有効値は選びません。必要なときだけJSON結果をコピー・保存してください。",
    ],
    exampleInput,
    exampleResult: "4項目です。両方のmax-ageに重複警告が付き、x-cache内の引用されたカンマは1つの引数として保持されます。x-cacheの動作は解釈しません。",
    limitations: [messages.ja["cache.scope"], messages.ja["cache.limits"],
      "RFC 9111の応答項目とimmutable・stale-while-revalidate・stale-if-errorに対応。HTTPのトークン・引用文字列を扱い、等号前後の空白・古い折り返し・ステータス行・他のヘッダー・要求項目の評価には対応しません。巨大な秒数は正確な文字列のまま表示しますが、キャッシュ実装には数値上限があります。",
      "未知の拡張と不正な引数を明示します。構文エラー・上限超過では部分結果を返しません。入力と結果はメモリー内のみで、URL・保存領域・ログ・通信には含めず、画面移動・再読み込みで消去します。依存や外部リソースは追加しません。",
    ],
  },
  "zh-CN": {
    introduction: messages["zh-CN"]["tool.cache-control.description"],
    steps: [
      "粘贴一行响应字段值或多行 Cache-Control: 字段。示例使用虚构头部。短输入即时更新，长输入支持自动延迟、手动应用和取消。",
      "查看每条指令、精确的声明秒数及警告。重复项分别保留，不选择有效值。仅在需要时复制或下载 JSON 报告。",
    ],
    exampleInput,
    exampleResult: "共四条指令。两个 max-age 均标记为重复，x-cache 引号内的逗号仍属于同一个参数。x-cache 为未解释的扩展。",
    limitations: [messages["zh-CN"]["cache.scope"], messages["zh-CN"]["cache.limits"],
      "支持 RFC 9111 响应指令及 immutable、stale-while-revalidate、stale-if-error。仅支持 HTTP 标记及引用字符串，等号语法严格。不支持旧式折行、状态行、其他字段或请求指令求值。大秒数保持为精确字符串，但缓存实现可能限制数值范围。",
      "明确标注未知扩展和无效参数。语法或大小错误不返回部分报告。输入与结果仅在内存中，不写入 URL、存储、日志或请求，离开页面或刷新即清除。不新增依赖或外部资源。",
    ],
  },
  "zh-TW": {
    introduction: messages["zh-TW"]["tool.cache-control.description"],
    steps: [
      "貼上一行回應欄位值或多行 Cache-Control: 欄位。範例使用虛構標頭。短輸入即時更新，長輸入支援自動延遲、手動套用和取消。",
      "查看每條指令、精確的宣告秒數及警告。重複項目分別保留，不選擇有效值。僅在需要時複製或下載 JSON 報告。",
    ],
    exampleInput,
    exampleResult: "共四條指令。兩個 max-age 均標記為重複，x-cache 引號內的逗號仍屬於同一個參數。x-cache 為未解釋的擴充。",
    limitations: [messages["zh-TW"]["cache.scope"], messages["zh-TW"]["cache.limits"],
      "支援 RFC 9111 回應指令及 immutable、stale-while-revalidate、stale-if-error。僅支援 HTTP 標記及引用字串，等號語法嚴格。不支援舊式折行、狀態行、其他欄位或請求指令求值。大秒數保持為精確字串，但快取實作可能限制數值範圍。",
      "明確標註未知擴充和無效參數。語法或大小錯誤不回傳部分報告。輸入與結果僅在記憶體中，不寫入 URL、儲存空間、日誌或請求，離開頁面或重新整理即清除。不新增依賴或外部資源。",
    ],
  },
  ko: {
    introduction: messages.ko["tool.cache-control.description"],
    steps: [
      "한 줄의 응답 필드 값 또는 여러 Cache-Control: 줄을 붙여넣으세요. 예제는 가상 헤더입니다. 짧은 입력은 즉시 갱신되며 긴 입력은 자동 지연, 수동 적용 및 취소를 지원합니다.",
      "각 지시어, 정확한 초 단위 선언 값과 경고를 확인하세요. 중복 항목은 따로 보존하고 유효한 값을 고르지 않습니다. 필요할 때만 JSON 보고서를 복사하거나 다운로드하세요.",
    ],
    exampleInput,
    exampleResult: "지시어 4개입니다. 두 max-age는 중복으로 표시되며 x-cache 따옴표 안의 쉼표는 한 인수로 유지됩니다. x-cache는 해석하지 않는 확장입니다.",
    limitations: [messages.ko["cache.scope"], messages.ko["cache.limits"],
      "RFC 9111 응답 지시어와 immutable, stale-while-revalidate, stale-if-error를 지원합니다. HTTP 토큰·따옴표 문자열만 허용하고 등호 구문은 엄격합니다. 예전 줄 접기, 상태 줄, 다른 헤더, 요청 지시어 평가는 지원하지 않습니다. 큰 초 값은 정확한 문자열로 유지하나 캐시 구현에 수치 한도가 있을 수 있습니다.",
      "알 수 없는 확장과 잘못된 인수를 명시합니다. 구문·크기 오류 시 부분 보고서를 반환하지 않습니다. 입력과 결과는 메모리에만 있으며 URL·저장소·로그·요청에 넣지 않고 페이지 이동·새로고침 시 지웁니다. 의존성이나 외부 리소스를 추가하지 않습니다.",
    ],
  },
} satisfies Record<Locale, ToolGuide>;
