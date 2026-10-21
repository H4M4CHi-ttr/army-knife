import { serverTimingGuide } from "./server-timing-guide.ts";
import { pkceGuide } from "./pkce-guide.ts";
import { cacheControlGuide } from "./cache-control-guide.ts";
import { corsGuide } from "./cors-guide.ts";
import type { ToolId } from "./catalog";
import type { Locale } from "./preferences";
import { chmodGuide } from "./chmod-guide.ts";
import { base64Guide } from "./base64-guide.ts";
import { fiveToolGuides } from "./five-tool-guides.ts";
import { utilityGuides } from "./utility-guides.ts";
import { inspectorGuides } from "./inspector-guides.ts";
import { fileHttpInspectorGuides } from "./file-http-inspector-guides.ts";
import { designGuides } from "./design-guides.ts";
import { quickGuides } from "./quick-guides.ts";
import { htmlAccessibilityGuide } from "./html-accessibility-guide.ts";

/** Public documentation only. User input never becomes part of this data. */
export interface ToolGuide {
  introduction: string;
  steps: readonly string[];
  exampleInput: string;
  exampleResult: string;
  limitations: readonly string[];
}

export interface GuideLabels {
  usage: string;
  example: string;
  exampleInput: string;
  exampleResult: string;
  limitations: string;
  languages: string;
  allTools: string;
  useTool: string;
  javascript: string;
  availability: string;
  disabledTitle: string;
  disabled: string;
  privacy: string;
}

export const languageNames = {
  ja: "日本語",
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ko: "한국어",
} satisfies Record<Locale, string>;

export const guideLabels = {
  ja: {
    usage: "使い方",
    example: "入力例と読み取り方",
    exampleInput: "入力例",
    exampleResult: "結果の読み取り方",
    limitations: "対応範囲と制限",
    languages: "このページの言語",
    allTools: "すべてのツール",
    useTool: "このページでツールを使う",
    javascript:
      "説明と入力例は JavaScript なしでも読めます。ツールの操作には JavaScript を有効にしてください。",
    availability:
      "この説明ページは、ツールの有効・無効にかかわらず閲覧できます。操作画面は、このブラウザーに保存された設定に従います。",
    disabledTitle: "このツールは無効になっています",
    disabled:
      "このブラウザーではこのツールが無効になっています。使うには設定で有効にしてください。説明ページを開いても設定は変更されません。",
    privacy:
      "入力はブラウザー内のメモリーで処理し、外部送信・保存・URLへの埋め込みはしません。アプリが保存するのは設定だけです。サイトの閲覧状況は Google Analytics 4 で計測し、計測用 Cookie 等が使用される場合があります。",
  },
  en: {
    usage: "How to use",
    example: "Example and interpretation",
    exampleInput: "Example input",
    exampleResult: "What the result means",
    limitations: "Supported inputs and limits",
    languages: "Page language",
    allTools: "All tools",
    useTool: "Use the tool on this page",
    javascript:
      "You can read the guide and examples without JavaScript. Enable JavaScript to operate the tool.",
    availability:
      "This guide is available whether the tool is enabled or disabled. The interactive workspace respects preferences saved in this browser.",
    disabledTitle: "This tool is disabled",
    disabled:
      "This tool is disabled in this browser. Enable it in Settings to use it. Opening its guide does not change your preferences.",
    privacy:
      "Tool inputs stay in browser memory; they are never transmitted, saved or added to the page URL. The app only stores preferences. Google Analytics 4 measures site usage and may use analytics cookies.",
  },
  "zh-CN": {
    usage: "使用方法",
    example: "示例与结果解读",
    exampleInput: "示例输入",
    exampleResult: "如何解读结果",
    limitations: "支持范围与限制",
    languages: "页面语言",
    allTools: "所有工具",
    useTool: "在本页使用工具",
    javascript: "无需 JavaScript 即可阅读说明和示例。要操作工具，请启用 JavaScript。",
    availability: "无论工具是否启用，都可以阅读此说明页。交互界面遵循保存在此浏览器中的设置。",
    disabledTitle: "此工具已停用",
    disabled: "此浏览器中的此工具已停用。请在设置中启用后使用。打开说明页不会更改您的设置。",
    privacy: "工具输入仅在浏览器内存中处理，不会对外传输、保存或写入 URL。应用仅保存偏好设置。网站使用 Google Analytics 4 统计访问情况，可能使用统计 Cookie。",
  },
  "zh-TW": {
    usage: "使用方式",
    example: "範例與結果解讀",
    exampleInput: "範例輸入",
    exampleResult: "如何解讀結果",
    limitations: "支援範圍與限制",
    languages: "頁面語言",
    allTools: "所有工具",
    useTool: "在本頁使用工具",
    javascript: "不需 JavaScript 也能閱讀說明與範例。若要操作工具，請啟用 JavaScript。",
    availability: "無論工具是否啟用，都能閱讀此說明頁。互動介面會遵循儲存在此瀏覽器中的設定。",
    disabledTitle: "此工具已停用",
    disabled: "此瀏覽器中的此工具已停用。請在設定中啟用後使用。開啟說明頁不會變更您的設定。",
    privacy: "工具輸入僅在瀏覽器記憶體中處理，不會對外傳送、儲存或寫入 URL。應用程式僅儲存偏好設定。網站使用 Google Analytics 4 統計造訪情況，可能使用分析 Cookie。",
  },
  ko: {
    usage: "사용 방법",
    example: "예제와 결과 해석",
    exampleInput: "예제 입력",
    exampleResult: "결과 읽는 방법",
    limitations: "지원 범위와 제한",
    languages: "페이지 언어",
    allTools: "모든 도구",
    useTool: "이 페이지에서 도구 사용",
    javascript:
      "JavaScript 없이도 설명과 예제를 읽을 수 있습니다. 도구를 사용하려면 JavaScript를 활성화하세요.",
    availability:
      "도구 활성화 여부와 관계없이 이 설명을 읽을 수 있습니다. 도구 화면은 이 브라우저에 저장된 설정을 따릅니다.",
    disabledTitle: "이 도구는 비활성화되어 있습니다",
    disabled:
      "이 브라우저에서 이 도구가 비활성화되어 있습니다. 사용하려면 설정에서 활성화하세요. 설명 페이지를 열어도 설정은 바뀌지 않습니다.",
    privacy:
      "도구 입력은 브라우저 메모리에서만 처리되며 외부 전송, 저장 또는 URL 삽입을 하지 않습니다. 앱은 환경 설정만 저장합니다. 사이트 사용 현황은 Google Analytics 4로 측정하며 분석용 쿠키를 사용할 수 있습니다.",
  },
} satisfies Record<Locale, GuideLabels>;

function localized(
  exampleInput: string,
  content: Record<Locale, Omit<ToolGuide, "exampleInput">>,
): Record<Locale, ToolGuide> {
  return Object.fromEntries(
    Object.entries(content).map(([locale, guide]) => [locale, { ...guide, exampleInput }]),
  ) as Record<Locale, ToolGuide>;
}

// The catalog owns tool identity; both tool and locale coverage are checked by TypeScript.
// Examples are synthetic and shared across translations, never taken from user input.
export const toolGuides = {
  "server-timing": serverTimingGuide,
  "cache-control": cacheControlGuide,
  cors: corsGuide,
  ...utilityGuides,
  ...inspectorGuides,
  ...fileHttpInspectorGuides,
  ...designGuides,
  chmod: chmodGuide,
  base64: base64Guide,
  ...fiveToolGuides,
  ...quickGuides,
  csv: localized("name,score\nAda,98\nLinus,\nGrace,99", {
    ja: {
      introduction:
        "表データを取り込む前に、列ごとの空欄、異なる型の混在、重複した見出しを確認できます。値を書き換えず、列の特徴と先頭行を一覧にします。",
      steps: [
        "CSV または TSV のテキストを貼り付けるか、UTF-8 ファイルを開きます。区切り文字と、先頭行を見出しとして扱うかを選びます。",
        "結果の行数、列数、空欄数、値の種類を確認します。自動適用を無効にしている場合は実行ボタンを押します。",
      ],
      exampleResult:
        "カンマ区切り・見出しありで、データは 3 行 2 列です。score 列には空欄が 1 個あり、残りの値は整数として推定されます。",
      limitations: [
        "最大 16 MiB、100,000 レコード、256 列です。型は推定であり、セルの値は文字列のままです。プレビューと種類の追跡には上限があります。",
      ],
    },
    en: {
      introduction:
        "Check a table before importing it: inspect missing values, mixed types, and repeated headers without rewriting cells. Column profiles and a row preview help locate data quality issues.",
      steps: [
        "Paste CSV or TSV text, or open a UTF-8 file. Select the delimiter and whether the first row contains headers.",
        "Review row and column counts, empty cells, and inferred types. Press Run if automatic application is disabled.",
      ],
      exampleResult:
        "With comma separation and headers enabled, this has 3 data rows and 2 columns. The score column has 1 empty cell; its other values are inferred as integers.",
      limitations: [
        "Up to 16 MiB, 100,000 records, and 256 columns. Types are inferred; cell values remain text. Row previews and distinct-value tracking have display or tracking caps.",
      ],
    },
    "zh-CN": {
      introduction:
        "导入表格前检查各列的缺失值、混合类型和重复表头。工具不会改写单元格，而是展示列概况和前几行，帮助定位数据问题。",
      steps: [
        "粘贴 CSV 或 TSV 文本，或打开 UTF-8 文件。选择分隔符，并指定首行是否为表头。",
        "查看行列数、空单元格和推断类型。若已关闭自动应用，请点击运行。",
      ],
      exampleResult:
        "选择逗号分隔并启用表头后，共有 3 行数据、2 列。score 列有 1 个空单元格，其他值被推断为整数。",
      limitations: [
        "最多支持 16 MiB、100,000 条记录、256 列。类型仅为推断，单元格值仍是文本。行预览和不同值统计设有显示或跟踪上限。",
      ],
    },
    "zh-TW": {
      introduction:
        "匯入表格前檢查各欄的缺漏值、混合型別與重複標題。工具不會改寫儲存格，而是顯示欄位概況與前幾列，協助找出資料問題。",
      steps: [
        "貼上 CSV 或 TSV 文字，或開啟 UTF-8 檔案。選擇分隔符號，並指定首列是否為標題。",
        "查看列數、欄數、空白儲存格與推斷型別。若已關閉自動套用，請按執行。",
      ],
      exampleResult:
        "選擇逗號分隔並啟用標題後，共有 3 列資料、2 欄。score 欄有 1 個空白儲存格，其他值被推斷為整數。",
      limitations: [
        "最多支援 16 MiB、100,000 筆記錄、256 欄。型別僅為推斷，儲存格值仍是文字。列預覽與相異值統計設有顯示或追蹤上限。",
      ],
    },
    ko: {
      introduction:
        "표를 가져오기 전에 열별 누락 값, 혼합된 형식, 중복 헤더를 확인하세요. 셀 값을 바꾸지 않고 열별 요약과 앞부분 미리 보기를 제공합니다.",
      steps: [
        "CSV 또는 TSV 텍스트를 붙여 넣거나 UTF-8 파일을 엽니다. 구분자와 첫 행을 헤더로 사용할지 선택합니다.",
        "행과 열 수, 빈 셀, 추정 형식을 확인합니다. 자동 적용이 꺼져 있으면 실행을 누릅니다.",
      ],
      exampleResult:
        "쉼표 구분과 헤더를 선택하면 데이터는 3행, 2열입니다. score 열에는 빈 셀이 1개 있으며 나머지 값은 정수로 추정됩니다.",
      limitations: [
        "최대 16 MiB, 100,000개 레코드와 256개 열을 지원합니다. 형식은 추정값이며 셀 값은 텍스트로 유지됩니다. 행 미리 보기와 고유 값 추적에는 제한이 있습니다.",
      ],
    },
  }),
  logs: localized(
    "INFO server ready\nERROR database timeout\nWARN retrying\nERROR database timeout",
    {
      ja: {
        introduction:
          "大量のログから必要な行を絞り込み、レベル別の件数と同じ行の繰り返しを確認できます。障害調査時に、どのメッセージが多いかを把握するためのツールです。",
        steps: [
          "ログを貼り付けるか UTF-8 ファイルを開きます。必要に応じて ERROR|WARN などの正規表現を指定します。",
          "一致件数、レベル別件数、繰り返された行とプレビューを確認します。大文字・小文字を無視する設定も選べます。",
        ],
        exampleResult:
          "フィルターを ERROR|WARN にすると 3 行が一致します。ERROR database timeout は同じ内容で 2 回現れ、WARN は 1 行です。",
        limitations: [
          "ログとフィルターを合わせて最大 16 MiB、ログは 100,000 行です。Rust の正規表現を使用し、先読み・後読みと後方参照には対応しません。レベル判定はヒューリスティックで、表示プレビューにも上限があります。",
        ],
      },
      en: {
        introduction:
          "Narrow a large log to relevant lines, inspect level counts, and find repeated messages. This helps identify frequent signals while investigating an incident.",
        steps: [
          "Paste logs or open a UTF-8 file. Optionally enter a regular expression such as ERROR|WARN.",
          "Inspect matching counts, levels, repeated lines, and the preview. Enable case-insensitive matching if needed.",
        ],
        exampleResult:
          "The ERROR|WARN filter matches 3 lines. ERROR database timeout appears twice with identical text, and there is 1 WARN line.",
        limitations: [
          "Logs and filter together support up to 16 MiB, with at most 100,000 log lines. Filters use Rust regex syntax without lookaround or backreferences. Level detection is heuristic, and the displayed preview is capped.",
        ],
      },
      "zh-CN": {
        introduction:
          "从大量日志中筛选相关行，查看各级别计数和重复消息。排查问题时，可快速发现频繁出现的信号。",
        steps: [
          "粘贴日志或打开 UTF-8 文件。可输入 ERROR|WARN 等正则表达式进行筛选。",
          "查看匹配数量、日志级别、重复行和预览。需要时启用忽略大小写。",
        ],
        exampleResult:
          "使用 ERROR|WARN 筛选后有 3 行匹配。ERROR database timeout 完全相同地出现了 2 次，WARN 有 1 行。",
        limitations: [
          "日志和筛选条件合计最多 16 MiB，日志最多 100,000 行。使用 Rust 正则语法，不支持前后向断言和反向引用。日志级别为启发式判断，显示预览也有上限。",
        ],
      },
      "zh-TW": {
        introduction:
          "從大量日誌中篩選相關列，查看各等級計數與重複訊息。排查問題時，可快速找出經常出現的訊號。",
        steps: [
          "貼上日誌或開啟 UTF-8 檔案。可輸入 ERROR|WARN 等正規表示式進行篩選。",
          "查看符合數量、日誌等級、重複列與預覽。需要時啟用忽略大小寫。",
        ],
        exampleResult:
          "使用 ERROR|WARN 篩選後有 3 列符合。ERROR database timeout 以相同內容出現 2 次，WARN 有 1 列。",
        limitations: [
          "日誌與篩選條件合計最多 16 MiB，日誌最多 100,000 列。使用 Rust 正規表示式語法，不支援前後向斷言與反向參照。日誌等級採啟發式判斷，顯示預覽也有上限。",
        ],
      },
      ko: {
        introduction:
          "많은 로그에서 필요한 줄을 추리고 수준별 개수와 반복 메시지를 확인하세요. 문제를 조사할 때 자주 나타나는 신호를 찾는 데 도움이 됩니다.",
        steps: [
          "로그를 붙여 넣거나 UTF-8 파일을 엽니다. 필요하면 ERROR|WARN 같은 정규식을 입력합니다.",
          "일치 개수, 수준, 반복된 줄과 미리 보기를 확인합니다. 필요에 따라 대소문자 무시를 선택합니다.",
        ],
        exampleResult:
          "ERROR|WARN 필터에 3줄이 일치합니다. ERROR database timeout은 같은 내용으로 2번 나오며 WARN은 1줄입니다.",
        limitations: [
          "로그와 필터의 합계는 최대 16 MiB이며 로그는 최대 100,000줄입니다. Rust 정규식 문법을 사용하며 전후방 탐색과 역참조는 지원하지 않습니다. 로그 수준은 휴리스틱으로 판단하며 표시되는 미리 보기에도 제한이 있습니다.",
        ],
      },
    },
  ),
  sets: localized("A:\nVue\nRust\nVue\n\nB:\nRust\nGo", {
    ja: {
      introduction:
        "行ごとのリストを集合として比較し、共通項目、片方だけの項目、両方を合わせた項目を取り出せます。重複を除いた項目は入力順に並びます。",
      steps: [
        "リスト A と B に、1 行につき 1 項目を入力します。例の A: と B: は区切りの説明なので入力しません。",
        "共通、和集合、差集合などの操作を選びます。空行の除外、前後の空白の除去、大文字・小文字の扱いを確認します。",
      ],
      exampleResult:
        "共通項目は Rust です。和集合は Vue、Rust、Go の順になり、A に重複する Vue は 1 回だけ出力されます。",
      limitations: [
        "2 つのリストを合わせて最大 16 MiB、100,000 行です。比較単位は行全体です。大文字・小文字の無視は Unicode の小文字化であり、完全なケースフォールディングではありません。プレビューは先頭 1,000 項目ですが、コピーとダウンロードには全結果が含まれます。",
      ],
    },
    en: {
      introduction:
        "Compare line-based lists as sets to extract shared items, items in only one list, or their combined contents. Deduplicated results retain input order.",
      steps: [
        "Enter one item per line in lists A and B. The A: and B: markers in this example only separate the inputs; do not paste the markers.",
        "Choose intersection, union, or a difference operation. Review options for empty lines, surrounding whitespace, and case sensitivity.",
      ],
      exampleResult:
        "The intersection is Rust. The union is Vue, Rust, Go in that order; Vue appears once even though it is repeated in A.",
      limitations: [
        "Both lists combined support up to 16 MiB and 100,000 lines. Each complete line is one item. Ignore-case mode uses Unicode lowercase rather than full case folding. The preview shows the first 1,000 items; copy and download include all results.",
      ],
    },
    "zh-CN": {
      introduction:
        "将逐行列表作为集合比较，提取共有项、单侧项或合并后的项目。去重后的结果保留输入顺序。",
      steps: [
        "在列表 A 和 B 中每行输入一个项目。示例中的 A: 和 B: 仅用来分隔输入，不要粘贴这些标记。",
        "选择交集、并集或差集操作。确认空行、首尾空白和大小写的处理选项。",
      ],
      exampleResult:
        "交集为 Rust。并集依次为 Vue、Rust、Go；虽然 A 中 Vue 重复出现，结果中只出现一次。",
      limitations: [
        "两个列表合计最多 16 MiB、100,000 行。每个完整行视为一个项目。忽略大小写使用 Unicode 小写转换，并非完整的大小写折叠。预览仅显示前 1,000 项，复制和下载包含完整结果。",
      ],
    },
    "zh-TW": {
      introduction:
        "將逐列清單當作集合比較，擷取共有項目、單側項目或合併後的內容。去除重複項目後，結果保留輸入順序。",
      steps: [
        "在清單 A 與 B 中，每列輸入一個項目。範例中的 A: 與 B: 僅用來分隔輸入，請勿貼上這些標記。",
        "選擇交集、聯集或差集操作。確認空白列、前後空白與大小寫的處理選項。",
      ],
      exampleResult:
        "交集為 Rust。聯集依序為 Vue、Rust、Go；雖然 A 中 Vue 重複出現，結果中只出現一次。",
      limitations: [
        "兩個清單合計最多 16 MiB、100,000 列。每個完整列視為一個項目。忽略大小寫使用 Unicode 小寫轉換，並非完整的大小寫折疊。預覽僅顯示前 1,000 項，複製與下載包含完整結果。",
      ],
    },
    ko: {
      introduction:
        "줄 단위 목록을 집합으로 비교해 공통 항목, 한쪽에만 있는 항목, 합친 항목을 구할 수 있습니다. 중복을 제거한 결과는 입력 순서를 유지합니다.",
      steps: [
        "목록 A와 B에 한 줄에 한 항목씩 입력합니다. 예제의 A:와 B:는 입력을 구분하는 표시이므로 붙여 넣지 않습니다.",
        "교집합, 합집합 또는 차집합을 선택합니다. 빈 줄, 앞뒤 공백, 대소문자 처리 옵션을 확인합니다.",
      ],
      exampleResult:
        "교집합은 Rust입니다. 합집합은 Vue, Rust, Go 순서이며 A에서 반복되는 Vue는 결과에 한 번만 나옵니다.",
      limitations: [
        "두 목록의 합계는 최대 16 MiB, 100,000줄입니다. 줄 전체를 하나의 항목으로 비교합니다. 대소문자 무시는 Unicode 소문자 변환이며 완전한 case folding은 아닙니다. 미리 보기는 처음 1,000개 항목이고 복사와 다운로드에는 전체 결과가 포함됩니다.",
      ],
    },
  }),
  cidr: localized("192.0.2.130/26", {
    ja: {
      introduction:
        "IPv4・IPv6 の CIDR 表記から、ネットワーク範囲、マスク、正確なアドレス数を計算できます。入力アドレスのホスト部にビットが立っている場合も確認できます。",
      steps: [
        "IP アドレスとプレフィックス長を、192.0.2.130/26 のように入力します。",
        "ネットワークアドレス、範囲の末尾、マスクとアドレス数を確認します。IPv4 では対応するホスト範囲も表示します。",
      ],
      exampleResult:
        "ネットワークは 192.0.2.128/26、最後のアドレスは 192.0.2.191、マスクは 255.255.255.192 です。64 個のアドレスを含み、通常の IPv4 ホスト範囲は .129 から .190 です。",
      limitations: [
        "範囲の算術計算のみを行います。DNS 問い合わせ、通信、ネットワークのスキャンは行いません。IPv6 には IPv4 のブロードキャストや利用可能ホスト数を適用しません。",
      ],
    },
    en: {
      introduction:
        "Calculate IPv4 and IPv6 network ranges, masks, and exact address counts from CIDR notation. You can also see whether the supplied address has host bits set.",
      steps: [
        "Enter an IP address and prefix length, such as 192.0.2.130/26.",
        "Inspect the network address, last address, mask, and address count. Applicable IPv4 host ranges are also shown.",
      ],
      exampleResult:
        "The network is 192.0.2.128/26, the last address is 192.0.2.191, and the mask is 255.255.255.192. It contains 64 addresses; the ordinary IPv4 host range is .129 through .190.",
      limitations: [
        "This is range arithmetic only: no DNS queries, network requests, or scanning. IPv4 broadcast and usable-host counts are not applied to IPv6.",
      ],
    },
    "zh-CN": {
      introduction:
        "根据 CIDR 表示法计算 IPv4 和 IPv6 的网络范围、掩码及精确地址数量，还可查看输入地址是否设置了主机位。",
      steps: [
        "输入 IP 地址和前缀长度，例如 192.0.2.130/26。",
        "查看网络地址、最后地址、掩码和地址数量。适用时还会显示 IPv4 主机范围。",
      ],
      exampleResult:
        "网络为 192.0.2.128/26，最后地址为 192.0.2.191，掩码为 255.255.255.192。共有 64 个地址，普通 IPv4 主机范围为 .129 至 .190。",
      limitations: [
        "仅进行地址范围计算，不执行 DNS 查询、网络请求或扫描。IPv4 广播地址和可用主机数的规则不用于 IPv6。",
      ],
    },
    "zh-TW": {
      introduction:
        "依 CIDR 表示法計算 IPv4 與 IPv6 的網路範圍、遮罩及精確位址數量，也能查看輸入位址是否設定了主機位元。",
      steps: [
        "輸入 IP 位址與前綴長度，例如 192.0.2.130/26。",
        "查看網路位址、最後位址、遮罩與位址數量。適用時還會顯示 IPv4 主機範圍。",
      ],
      exampleResult:
        "網路為 192.0.2.128/26，最後位址為 192.0.2.191，遮罩為 255.255.255.192。共有 64 個位址，一般 IPv4 主機範圍為 .129 至 .190。",
      limitations: [
        "僅進行位址範圍計算，不執行 DNS 查詢、網路請求或掃描。IPv4 廣播位址與可用主機數的規則不套用於 IPv6。",
      ],
    },
    ko: {
      introduction:
        "CIDR 표기로 IPv4와 IPv6의 네트워크 범위, 마스크, 정확한 주소 수를 계산합니다. 입력 주소의 호스트 비트가 설정되어 있는지도 확인할 수 있습니다.",
      steps: [
        "192.0.2.130/26처럼 IP 주소와 접두사 길이를 입력합니다.",
        "네트워크 주소, 마지막 주소, 마스크, 주소 수를 확인합니다. 해당되는 IPv4 호스트 범위도 표시됩니다.",
      ],
      exampleResult:
        "네트워크는 192.0.2.128/26, 마지막 주소는 192.0.2.191, 마스크는 255.255.255.192입니다. 주소는 64개이며 일반 IPv4 호스트 범위는 .129부터 .190까지입니다.",
      limitations: [
        "주소 범위만 계산합니다. DNS 조회, 네트워크 요청이나 스캔은 하지 않습니다. IPv4 브로드캐스트와 사용 가능한 호스트 수 규칙은 IPv6에 적용하지 않습니다.",
      ],
    },
  }),
  unicode: localized("user\u200bName", {
    ja: {
      introduction:
        "見た目が同じなのに一致しない文字列や、貼り付けたコードの不可視文字を調べられます。コードポイントと位置を示し、隠れた文字をラベル付きで可視化します。",
      steps: [
        "調べたい文字列をそのまま貼り付けます。必要なら通常の空白や改行も検出する設定にします。",
        "検出された文字のコードポイント、行、列、種類と可視化結果を確認します。文字を削除する前に用途を判断します。",
      ],
      exampleResult:
        "user と Name の間に U+200B ZERO WIDTH SPACE が 1 個あります。見た目は userName に似ていますが、元の文字列には別の文字が含まれています。",
      limitations: [
        "最大 512 KiB、検出結果は最大 1,000 件です。診断のみで自動修正はしません。結合子や方向制御文字は、言語や絵文字で意図的に使われる場合があります。",
      ],
    },
    en: {
      introduction:
        "Inspect strings that look identical but do not match, or find invisible characters in pasted code. Findings identify code points and positions, with a labeled visualization of hidden characters.",
      steps: [
        "Paste the original text. Optionally include ordinary whitespace and line breaks in the inspection.",
        "Review code points, lines, columns, categories, and the visualization. Decide whether each character is intentional before removing it.",
      ],
      exampleResult:
        "There is 1 U+200B ZERO WIDTH SPACE between user and Name. The string resembles userName, but the original contains an additional character.",
      limitations: [
        "Up to 512 KiB and 1,000 displayed findings. This diagnoses text without automatically fixing it. Joiners and direction marks may be intentional in languages or emoji.",
      ],
    },
    "zh-CN": {
      introduction:
        "检查外观相同却无法匹配的字符串，或查找粘贴代码中的不可见字符。结果标明码点和位置，并使用标签将隐藏字符可视化。",
      steps: [
        "原样粘贴待检查的文本。需要时将普通空白和换行也纳入检测。",
        "查看码点、行列位置、类别和可视化结果。删除字符前，先判断其用途。",
      ],
      exampleResult:
        "user 与 Name 之间有 1 个 U+200B ZERO WIDTH SPACE。它看起来像 userName，但原始字符串包含一个额外字符。",
      limitations: [
        "最多支持 512 KiB，显示最多 1,000 项检测结果。仅提供诊断，不自动修复。连接符和方向标记可能是语言或表情符号的有意组成部分。",
      ],
    },
    "zh-TW": {
      introduction:
        "檢查外觀相同卻無法比對的字串，或找出貼上程式碼中的不可見字元。結果標明碼位與位置，並以標籤將隱藏字元視覺化。",
      steps: [
        "原樣貼上待檢查的文字。需要時將一般空白與換行也納入偵測。",
        "查看碼位、列欄位置、類別與視覺化結果。刪除字元前，先判斷其用途。",
      ],
      exampleResult:
        "user 與 Name 之間有 1 個 U+200B ZERO WIDTH SPACE。它看起來像 userName，但原始字串含有一個額外字元。",
      limitations: [
        "最多支援 512 KiB，顯示最多 1,000 項偵測結果。僅提供診斷，不自動修復。連接符與方向標記可能是語言或表情符號中刻意使用的部分。",
      ],
    },
    ko: {
      introduction:
        "겉보기는 같지만 일치하지 않는 문자열이나 붙여 넣은 코드의 보이지 않는 문자를 검사합니다. 코드 포인트와 위치를 보여 주고 숨은 문자를 이름표로 표시합니다.",
      steps: [
        "검사할 원문을 붙여 넣습니다. 필요하면 일반 공백과 줄바꿈도 검사에 포함합니다.",
        "코드 포인트, 줄과 열, 분류, 시각화 결과를 확인합니다. 문자를 지우기 전에 의도적으로 사용되었는지 판단합니다.",
      ],
      exampleResult:
        "user와 Name 사이에 U+200B ZERO WIDTH SPACE가 1개 있습니다. userName처럼 보이지만 원래 문자열에는 문자가 하나 더 있습니다.",
      limitations: [
        "최대 512 KiB를 검사하고 1,000개 결과를 표시합니다. 자동 수정 없이 진단만 제공합니다. 결합자와 방향 표시는 언어나 이모지에서 의도적으로 쓰일 수 있습니다.",
      ],
    },
  }),
  "json-diff": localized(
    'A:\n{"count":1,"active":true}\n\nB:\n{"active":true,"count":2,"tag":"new"}',
    {
      ja: {
        introduction:
          "JSON の空白やオブジェクトのキー順序を除外し、構造と値の変更を比較できます。追加、削除、変更を JSON Pointer のパスで確認します。",
        steps: [
          "変更前と変更後の JSON をそれぞれ入力します。例の A: と B: は入力欄の区切りで、JSON には含めません。",
          "差分の種類とパスを確認します。同じ構造と値なら、書式が異なっていても一致と表示されます。",
        ],
        exampleResult:
          "/count は 1 から 2 に変更され、/tag に new が追加されます。active のキー位置が変わっても、値が同じなので差分にはなりません。",
        limitations: [
          "各入力は最大 512 KiB、深さは 64 です。配列の順序は比較に含まれます。重複キーと精度を失う数値は拒否し、差分上限に達した場合は部分結果と表示します。",
        ],
      },
      en: {
        introduction:
          "Compare JSON structure and values while ignoring whitespace and object key order. Added, removed, and changed values are identified by JSON Pointer paths.",
        steps: [
          "Enter before and after JSON in the two inputs. The A: and B: markers in the example separate the inputs and are not part of the JSON.",
          "Review each change type and path. Identical structures and values are reported as equal even when formatting differs.",
        ],
        exampleResult:
          "/count changes from 1 to 2, and /tag is added with the value new. Moving the active key does not create a difference because its value is unchanged.",
        limitations: [
          "Each input is limited to 512 KiB and depth 64. Array order matters. Duplicate keys and numbers that lose precision are rejected; reaching the change limit produces a marked partial result.",
        ],
      },
      "zh-CN": {
        introduction:
          "忽略空白和对象键顺序，比较 JSON 的结构与值。新增、删除和修改的值会通过 JSON Pointer 路径标识。",
        steps: [
          "分别输入修改前后的 JSON。示例中的 A: 和 B: 仅用于分隔输入，不属于 JSON 内容。",
          "查看每项变更的类型和路径。结构与值相同时，即使格式不同，也会显示为一致。",
        ],
        exampleResult:
          "/count 从 1 改为 2，并新增值为 new 的 /tag。active 键的位置改变，但值未变，因此不会产生差异。",
        limitations: [
          "每份输入最多 512 KiB，深度最多 64。数组顺序参与比较。重复键和会丢失精度的数值会被拒绝；达到差异数量上限时，会明确标记为部分结果。",
        ],
      },
      "zh-TW": {
        introduction:
          "忽略空白與物件鍵順序，比較 JSON 的結構與值。新增、刪除與修改的值會透過 JSON Pointer 路徑標示。",
        steps: [
          "分別輸入修改前後的 JSON。範例中的 A: 與 B: 僅用來分隔輸入，不屬於 JSON 內容。",
          "查看每項變更的類型與路徑。結構與值相同時，即使格式不同，也會顯示為一致。",
        ],
        exampleResult:
          "/count 從 1 改為 2，並新增值為 new 的 /tag。active 鍵的位置改變，但值未變，因此不會產生差異。",
        limitations: [
          "每份輸入最多 512 KiB，深度最多 64。陣列順序會參與比較。重複鍵與會失去精度的數值會被拒絕；達到差異數量上限時，會明確標示為部分結果。",
        ],
      },
      ko: {
        introduction:
          "공백과 객체 키 순서를 무시하고 JSON 구조와 값을 비교합니다. 추가, 삭제, 변경된 값은 JSON Pointer 경로로 표시됩니다.",
        steps: [
          "변경 전과 변경 후 JSON을 각각 입력합니다. 예제의 A:와 B:는 입력 구분이며 JSON에 포함하지 않습니다.",
          "변경 종류와 경로를 확인합니다. 구조와 값이 같으면 서식이 달라도 동일하다고 표시합니다.",
        ],
        exampleResult:
          "/count는 1에서 2로 바뀌고 /tag에 new가 추가됩니다. active 키의 위치가 바뀌어도 값이 같으므로 차이가 발생하지 않습니다.",
        limitations: [
          "각 입력은 최대 512 KiB, 깊이는 64입니다. 배열 순서는 비교에 포함됩니다. 중복 키와 정밀도를 잃는 숫자는 거부하며 변경 수 제한에 도달하면 부분 결과로 표시합니다.",
        ],
      },
    },
  ),
  "json-format": localized('{"name":"Ada","scores":[98,99],"active":true}', {
    ja: {
      introduction:
        "JSON の構文を確認し、読みやすいインデント付き表示や空白を減らした形式に変換できます。キーや値を編集せず、書式だけを整えます。",
      steps: [
        "JSON を貼り付けるか UTF-8 ファイルを開きます。",
        "インデントを 2、4、8 から選ぶか、圧縮を選びます。整形結果を確認し、コピーまたはダウンロードします。",
      ],
      exampleResult:
        "インデント 2 を選ぶと、name、scores、active が改行と字下げ付きで表示されます。圧縮では不要な空白を省き、配列の順序と値は保ちます。",
      limitations: [
        "最大 512 KiB、深さ 64 の JSON に対応します。重複キーと精度を失う数値は拒否します。コメントや末尾カンマを含む JSONC には対応しません。",
      ],
    },
    en: {
      introduction:
        "Validate JSON syntax and produce readable indentation or compact output. The tool changes formatting while preserving keys and values.",
      steps: [
        "Paste JSON or open a UTF-8 file.",
        "Choose 2, 4, or 8 spaces of indentation, or select Minify. Review the formatted output, then copy or download it.",
      ],
      exampleResult:
        "With 2-space indentation, name, scores, and active are displayed with line breaks and indentation. Minify removes unnecessary whitespace while preserving array order and values.",
      limitations: [
        "Up to 512 KiB and depth 64. Duplicate keys and numbers that lose precision are rejected. JSONC comments and trailing commas are not supported.",
      ],
    },
    "zh-CN": {
      introduction: "验证 JSON 语法，生成易读的缩进格式或紧凑输出。工具仅调整格式，保留键和值。",
      steps: [
        "粘贴 JSON 或打开 UTF-8 文件。",
        "选择 2、4、8 个空格缩进，或选择压缩。检查输出后复制或下载。",
      ],
      exampleResult:
        "选择 2 空格缩进后，name、scores 和 active 会以换行和缩进展示。压缩会删除不必要的空白，同时保留数组顺序和值。",
      limitations: [
        "最多支持 512 KiB，深度最多 64。重复键和会丢失精度的数值会被拒绝。不支持 JSONC 注释或末尾逗号。",
      ],
    },
    "zh-TW": {
      introduction: "驗證 JSON 語法，產生易讀的縮排格式或緊湊輸出。工具只調整格式，保留鍵與值。",
      steps: [
        "貼上 JSON 或開啟 UTF-8 檔案。",
        "選擇 2、4、8 個空格縮排，或選擇壓縮。檢查輸出後複製或下載。",
      ],
      exampleResult:
        "選擇 2 空格縮排後，name、scores 與 active 會以換行和縮排顯示。壓縮會移除不必要的空白，同時保留陣列順序與值。",
      limitations: [
        "最多支援 512 KiB，深度最多 64。重複鍵與會失去精度的數值會被拒絕。不支援 JSONC 註解或結尾逗號。",
      ],
    },
    ko: {
      introduction:
        "JSON 문법을 검증하고 읽기 쉬운 들여쓰기 또는 압축된 출력을 만듭니다. 키와 값을 유지하면서 서식만 변경합니다.",
      steps: [
        "JSON을 붙여 넣거나 UTF-8 파일을 엽니다.",
        "들여쓰기를 2, 4, 8칸으로 선택하거나 압축을 선택합니다. 결과를 확인한 뒤 복사하거나 다운로드합니다.",
      ],
      exampleResult:
        "2칸 들여쓰기를 선택하면 name, scores, active가 줄바꿈과 들여쓰기로 표시됩니다. 압축은 배열 순서와 값을 유지하면서 불필요한 공백을 제거합니다.",
      limitations: [
        "최대 512 KiB, 깊이 64를 지원합니다. 중복 키와 정밀도를 잃는 숫자는 거부합니다. JSONC 주석과 마지막 쉼표는 지원하지 않습니다.",
      ],
    },
  }),
  contrast: localized("#000000\n#FFFFFF", {
    ja: {
      introduction:
        "文字色と背景色の組み合わせから、WCAG 2.x のコントラスト比と各しきい値への適合を計算します。画面のプレビューで配色も確認できます。",
      steps: [
        "文字色と背景色を #000000 のような 3 桁または 6 桁の 16 進カラーで入力します。例では文字が黒、背景が白です。",
        "コントラスト比と通常の文字、大きい文字、UI 部品の判定を確認します。色を変えるか入れ替えて再計算します。",
      ],
      exampleResult:
        "黒と白のコントラスト比は 21:1 です。通常の文字と大きい文字で AA・AAA のしきい値を満たし、UI 部品のしきい値も満たします。",
      limitations: [
        "不透明な sRGB の 16 進カラーに対応します。透明度、画像背景、グラデーションは計算しません。この判定だけでアクセシビリティ全体への適合は確認できません。",
      ],
    },
    en: {
      introduction:
        "Calculate a foreground/background contrast ratio and compare it with WCAG 2.x thresholds. The preview helps you inspect the selected color pairing.",
      steps: [
        "Enter text and background colors as 3- or 6-digit hex values such as #000000. The example uses black text on white.",
        "Review the ratio and results for normal text, large text, and UI components. Change or swap colors to recalculate.",
      ],
      exampleResult:
        "Black and white have a 21:1 contrast ratio. This meets AA and AAA thresholds for normal and large text, and the threshold for UI components.",
      limitations: [
        "Opaque sRGB hex colors only. Transparency, image backgrounds, and gradients are not modeled. This check alone cannot establish overall accessibility conformance.",
      ],
    },
    "zh-CN": {
      introduction: "计算前景色与背景色的对比度，并与 WCAG 2.x 阈值比较。预览可帮助检查所选配色。",
      steps: [
        "用 #000000 等 3 位或 6 位十六进制值输入文字色和背景色。示例为白底黑字。",
        "查看对比度和普通文字、大号文字、UI 组件的判定。更改或交换颜色后重新计算。",
      ],
      exampleResult:
        "黑白对比度为 21:1，满足普通文字和大号文字的 AA、AAA 阈值，也满足 UI 组件的阈值。",
      limitations: [
        "仅支持不透明的 sRGB 十六进制颜色，不计算透明度、图片背景或渐变。仅凭此检查无法确认整体无障碍合规性。",
      ],
    },
    "zh-TW": {
      introduction: "計算前景色與背景色的對比值，並與 WCAG 2.x 門檻比較。預覽可協助檢查所選配色。",
      steps: [
        "以 #000000 等 3 位或 6 位十六進位值輸入文字色與背景色。範例為白底黑字。",
        "查看對比值，以及一般文字、大型文字、UI 元件的判定。變更或交換顏色後重新計算。",
      ],
      exampleResult:
        "黑白對比值為 21:1，符合一般文字與大型文字的 AA、AAA 門檻，也符合 UI 元件的門檻。",
      limitations: [
        "僅支援不透明的 sRGB 十六進位顏色，不計算透明度、圖片背景或漸層。僅憑此檢查無法確認整體無障礙符合性。",
      ],
    },
    ko: {
      introduction:
        "글자색과 배경색의 명암비를 계산하고 WCAG 2.x 기준값과 비교합니다. 미리 보기로 선택한 색 조합도 확인할 수 있습니다.",
      steps: [
        "#000000처럼 3자리 또는 6자리 16진수로 글자색과 배경색을 입력합니다. 예제는 흰 배경의 검은 글자입니다.",
        "명암비와 일반 글자, 큰 글자, UI 구성 요소의 판정을 확인합니다. 색을 바꾸거나 서로 교환해 다시 계산합니다.",
      ],
      exampleResult:
        "검은색과 흰색의 명암비는 21:1입니다. 일반 글자와 큰 글자의 AA 및 AAA 기준과 UI 구성 요소의 기준을 충족합니다.",
      limitations: [
        "불투명한 sRGB 16진수 색상만 지원합니다. 투명도, 이미지 배경, 그라데이션은 계산하지 않습니다. 이 검사만으로 전체 접근성 준수를 판단할 수는 없습니다.",
      ],
    },
  }),
  har: localized(
    '{"log":{"version":"1.2","entries":[{"request":{"method":"GET","url":"https://example.test/api"},"response":{"status":503,"headersSize":100,"bodySize":20,"content":{"mimeType":"application/json"}},"time":250}]}}',
    {
      ja: {
        introduction:
          "ブラウザーの DevTools から書き出した HAR を読み、HTTP ステータス、ホスト・メディアタイプ別の集計、時間のかかったリクエストを確認します。記録済みの通信をローカルで分析します。",
        steps: [
          "HAR JSON を貼り付けるか、UTF-8 の HAR ファイルを開きます。入力例は 1 件だけの合成データです。",
          "リクエスト数、HTTP エラー、既知の応答バイト数と所要時間を確認します。ホスト別・メディアタイプ別の集計を切り替えられます。",
        ],
        exampleResult:
          "1 件のリクエストが HTTP 503 として集計されます。所要時間は 250 ms、既知の応答サイズは headersSize と bodySize を足した 120 バイトです。",
        limitations: [
          "最大 16 MiB、100,000 件です。記録された URL にはアクセスしません。不明のサイズや時間は不明として扱います。並行通信の時間の合計はページの読み込み時間ではありません。",
        ],
      },
      en: {
        introduction:
          "Read a HAR exported from browser DevTools to inspect HTTP statuses, host and media-type groups, and slow requests. The tool analyzes recorded traffic locally.",
        steps: [
          "Paste HAR JSON or open a UTF-8 HAR file. This example is synthetic data with one request.",
          "Review request counts, HTTP errors, known response bytes, and durations. Switch between grouping by host and media type.",
        ],
        exampleResult:
          "The single request is counted as an HTTP 503 error. Its recorded duration is 250 ms, and its known response size is 120 bytes: headersSize plus bodySize.",
        limitations: [
          "Up to 16 MiB and 100,000 entries. Recorded URLs are never requested. Unknown sizes and timings remain unknown. Summed durations of concurrent requests are not page-load time.",
        ],
      },
      "zh-CN": {
        introduction:
          "读取浏览器 DevTools 导出的 HAR，检查 HTTP 状态、按主机或媒体类型分组的统计及慢请求。工具在本地分析已记录的通信。",
        steps: [
          "粘贴 HAR JSON 或打开 UTF-8 HAR 文件。此示例是只有一个请求的合成数据。",
          "查看请求数量、HTTP 错误、已知响应字节数和耗时。可切换主机与媒体类型分组。",
        ],
        exampleResult:
          "这个请求被统计为 HTTP 503 错误。记录耗时为 250 ms，已知响应大小为 120 字节，即 headersSize 与 bodySize 之和。",
        limitations: [
          "最多支持 16 MiB、100,000 条记录。不会请求记录中的 URL。未知大小和耗时仍标记为未知。并行请求耗时之和不等于页面加载时间。",
        ],
      },
      "zh-TW": {
        introduction:
          "讀取瀏覽器 DevTools 匯出的 HAR，檢查 HTTP 狀態、依主機或媒體類型分組的統計及緩慢請求。工具在本機分析已記錄的通訊。",
        steps: [
          "貼上 HAR JSON 或開啟 UTF-8 HAR 檔案。此範例是只有一個請求的合成資料。",
          "查看請求數量、HTTP 錯誤、已知回應位元組數與耗時。可切換主機與媒體類型分組。",
        ],
        exampleResult:
          "這個請求被統計為 HTTP 503 錯誤。記錄耗時為 250 ms，已知回應大小為 120 位元組，即 headersSize 與 bodySize 的總和。",
        limitations: [
          "最多支援 16 MiB、100,000 筆記錄。不會請求記錄中的 URL。未知大小與耗時仍標示為未知。並行請求耗時總和不等於頁面載入時間。",
        ],
      },
      ko: {
        introduction:
          "브라우저 DevTools에서 내보낸 HAR로 HTTP 상태, 호스트와 미디어 형식별 집계, 느린 요청을 확인합니다. 기록된 통신을 로컬에서 분석합니다.",
        steps: [
          "HAR JSON을 붙여 넣거나 UTF-8 HAR 파일을 엽니다. 이 예제는 요청 하나로 구성된 합성 데이터입니다.",
          "요청 수, HTTP 오류, 알려진 응답 바이트 수, 소요 시간을 확인합니다. 호스트 또는 미디어 형식별로 그룹을 바꿀 수 있습니다.",
        ],
        exampleResult:
          "요청 하나가 HTTP 503 오류로 집계됩니다. 기록된 소요 시간은 250 ms이고 알려진 응답 크기는 headersSize와 bodySize를 합한 120바이트입니다.",
        limitations: [
          "최대 16 MiB와 100,000개 항목을 지원합니다. 기록된 URL로 요청하지 않습니다. 알 수 없는 크기와 시간은 그대로 표시합니다. 병렬 요청의 시간 합계는 페이지 로드 시간이 아닙니다.",
        ],
      },
    },
  ),
  env: localized(
    "A:\nAPP_NAME=demo\nLOG_LEVEL=debug\nOLD_FLAG=true\n\nB:\nAPP_NAME=demo\nLOG_LEVEL=info\nCACHE=true",
    {
      ja: {
        introduction:
          "2 つの .env 設定をキー単位で比較し、値の変更、片方にしかないキー、重複定義や不正な行を確認します。値は初期状態では隠して表示します。",
        steps: [
          ".env A と .env B を入力します。例の A: と B: は入力欄の区切りなので含めません。",
          "変更・不足キーと診断を確認します。必要なら値の表示や変更のないキーの表示を有効にします。",
        ],
        exampleResult:
          "LOG_LEVEL は debug から info に変わり、OLD_FLAG は A にのみ、CACHE は B にのみ存在します。APP_NAME は同じなので初期設定では変更一覧に表示されません。",
        limitations: [
          "各入力は最大 256 KiB、10,000 行、2,000 定義です。変数やコマンドの展開は行わず、最後の有効な定義を採用します。dotenv 実装ごとに解釈が異なる場合があります。コピー・ダウンロードには非表示の値も含まれます。",
        ],
      },
      en: {
        introduction:
          "Compare two .env configurations by key to find changed values, missing keys, duplicate definitions, and malformed lines. Values are hidden in the table by default.",
        steps: [
          "Enter .env A and .env B. The A: and B: markers in the example separate the inputs and should be omitted.",
          "Review differing keys and diagnostics. Optionally reveal values or include unchanged keys.",
        ],
        exampleResult:
          "LOG_LEVEL changes from debug to info. OLD_FLAG is only in A, and CACHE is only in B. APP_NAME is unchanged and is omitted from the default changes view.",
        limitations: [
          "Each input supports up to 256 KiB, 10,000 lines, and 2,000 definitions. No variable or command expansion runs; the last valid definition wins. Other dotenv implementations may differ. Copy and download include hidden values.",
        ],
      },
      "zh-CN": {
        introduction:
          "按键比较两份 .env 配置，查找值变更、缺失键、重复定义和格式错误行。表格默认隐藏值。",
        steps: [
          "分别输入 .env A 和 .env B。示例中的 A: 和 B: 仅用于分隔输入，请省略。",
          "查看差异键和诊断。需要时显示值或包含未变更的键。",
        ],
        exampleResult:
          "LOG_LEVEL 从 debug 改为 info。OLD_FLAG 仅在 A 中，CACHE 仅在 B 中。APP_NAME 未变，默认不显示在变更列表中。",
        limitations: [
          "每份输入最多 256 KiB、10,000 行和 2,000 个定义。不执行变量或命令展开，最后一个有效定义生效。其他 dotenv 实现的解释可能不同。复制和下载会包含隐藏的值。",
        ],
      },
      "zh-TW": {
        introduction:
          "依鍵比較兩份 .env 設定，找出值變更、缺少的鍵、重複定義與格式錯誤列。表格預設隱藏值。",
        steps: [
          "分別輸入 .env A 與 .env B。範例中的 A: 與 B: 僅用來分隔輸入，請省略。",
          "查看差異鍵與診斷。需要時顯示值或納入未變更的鍵。",
        ],
        exampleResult:
          "LOG_LEVEL 從 debug 改為 info。OLD_FLAG 僅在 A 中，CACHE 僅在 B 中。APP_NAME 未變，預設不顯示在變更清單中。",
        limitations: [
          "每份輸入最多 256 KiB、10,000 列與 2,000 個定義。不執行變數或命令展開，最後一個有效定義生效。其他 dotenv 實作的解讀可能不同。複製與下載會包含隱藏的值。",
        ],
      },
      ko: {
        introduction:
          "두 .env 설정을 키별로 비교해 바뀐 값, 누락된 키, 중복 정의와 잘못된 줄을 찾습니다. 표의 값은 기본적으로 숨겨져 있습니다.",
        steps: [
          ".env A와 .env B를 입력합니다. 예제의 A:와 B:는 입력 구분 표시이므로 제외합니다.",
          "다른 키와 진단 결과를 확인합니다. 필요하면 값을 표시하거나 변경되지 않은 키를 포함합니다.",
        ],
        exampleResult:
          "LOG_LEVEL은 debug에서 info로 바뀝니다. OLD_FLAG는 A에만, CACHE는 B에만 있습니다. APP_NAME은 같아서 기본 변경 목록에 나오지 않습니다.",
        limitations: [
          "각 입력은 최대 256 KiB, 10,000줄, 2,000개 정의입니다. 변수나 명령을 확장하지 않으며 마지막 유효한 정의를 사용합니다. 다른 dotenv 구현의 해석과 다를 수 있습니다. 복사와 다운로드에는 숨겨진 값도 포함됩니다.",
        ],
      },
    },
  ),
  url: localized("https://example.test/search?tag=vue&tag=rust&q=hello+world#results", {
    ja: {
      introduction:
        "URL のスキーム、ホスト、パス、フラグメントを分解し、クエリ項目を個別に編集できます。重複するキーと項目の順序を保ちながら、編集後の URL を確認します。",
      steps: [
        "スキームとホストを含む絶対 URL を入力します。入力先のサイトを開く操作は行いません。",
        "構成要素を確認し、クエリのキー・値を編集、追加、削除します。編集後の URL をコピーできます。",
      ],
      exampleResult:
        "ホストは example.test、パスは /search、フラグメントは results です。tag は vue と rust の 2 項目で、q の値は + が空白として解釈され hello world になります。",
      limitations: [
        "最大 16 KiB、クエリ 200 項目です。標準 URL パーサーによる正規化が行われます。クエリ編集では空白を +、文字の + を %2B とし、空の & 区間は省きます。URL への通信は行いません。",
      ],
    },
    en: {
      introduction:
        "Inspect a URL's scheme, host, path, and fragment, then edit query entries individually. The editor retains duplicate keys and entry order while showing the resulting URL.",
      steps: [
        "Enter an absolute URL with a scheme and host. The tool does not open the destination site.",
        "Review components, then edit, add, or remove query keys and values. Copy the resulting URL when ready.",
      ],
      exampleResult:
        "The host is example.test, the path is /search, and the fragment is results. tag has two entries, vue and rust; q becomes hello world because + decodes as a space.",
      limitations: [
        "Up to 16 KiB and 200 query entries. The standard URL parser may normalize the address. Query editing encodes spaces as + and literal plus signs as %2B, and omits empty & segments. No requests are made to the URL.",
      ],
    },
    "zh-CN": {
      introduction:
        "检查 URL 的协议、主机、路径和片段，并逐项编辑查询参数。编辑器保留重复键和项目顺序，同时展示最终 URL。",
      steps: [
        "输入包含协议和主机的绝对 URL。工具不会打开目标网站。",
        "查看各组成部分，然后编辑、添加或删除查询键和值。完成后可复制生成的 URL。",
      ],
      exampleResult:
        "主机为 example.test，路径为 /search，片段为 results。tag 有 vue 和 rust 两项；q 中的 + 被解码为空格，值为 hello world。",
      limitations: [
        "最多支持 16 KiB 和 200 个查询项。标准 URL 解析器可能规范化地址。查询编辑将空格编码为 +，将字面加号编码为 %2B，并省略空的 & 分段。不会向 URL 发送请求。",
      ],
    },
    "zh-TW": {
      introduction:
        "檢查 URL 的通訊協定、主機、路徑與片段，並逐項編輯查詢參數。編輯器保留重複鍵與項目順序，同時顯示最終 URL。",
      steps: [
        "輸入包含通訊協定與主機的絕對 URL。工具不會開啟目標網站。",
        "查看各組成部分，再編輯、新增或移除查詢鍵與值。完成後可複製產生的 URL。",
      ],
      exampleResult:
        "主機為 example.test，路徑為 /search，片段為 results。tag 有 vue 與 rust 兩項；q 中的 + 被解碼為空格，值為 hello world。",
      limitations: [
        "最多支援 16 KiB 與 200 個查詢項目。標準 URL 解析器可能正規化位址。查詢編輯將空格編碼為 +，將字面加號編碼為 %2B，並省略空的 & 區段。不會向 URL 發送請求。",
      ],
    },
    ko: {
      introduction:
        "URL의 스킴, 호스트, 경로, 프래그먼트를 확인하고 쿼리 항목을 개별적으로 편집합니다. 중복 키와 항목 순서를 유지하면서 결과 URL을 보여 줍니다.",
      steps: [
        "스킴과 호스트가 있는 절대 URL을 입력합니다. 도구는 대상 사이트를 열지 않습니다.",
        "구성 요소를 확인하고 쿼리 키와 값을 편집, 추가, 삭제합니다. 완성된 URL을 복사할 수 있습니다.",
      ],
      exampleResult:
        "호스트는 example.test, 경로는 /search, 프래그먼트는 results입니다. tag에는 vue와 rust 두 항목이 있으며 q의 +는 공백으로 해석되어 hello world가 됩니다.",
      limitations: [
        "최대 16 KiB와 쿼리 항목 200개를 지원합니다. 표준 URL 파서가 주소를 정규화할 수 있습니다. 쿼리 편집은 공백을 +로, 문자 +를 %2B로 인코딩하고 빈 & 구간을 생략합니다. URL로 요청하지 않습니다.",
      ],
    },
  }),
  shortcuts: localized("Ctrl+K then Ctrl+C", {
    ja: {
      introduction:
        "キーの組み合わせや連続操作から、資料に記載されたアプリの既定ショートカットをローカル辞書で調べます。OS、アプリ、用途の条件で絞り込み、割り当ての文脈と出典を確認できます。",
      steps: [
        "手動入力欄にショートカットを入力するか、専用のキー取得欄を選んでキーを押します。連続操作は then で区切り、最大 4 操作まで指定できます。",
        "OS とアプリを選び、完全一致か連続操作の部分一致を指定します。結果の用途、フォーカス条件、資料の対象バージョンと出典を確認します。",
      ],
      exampleResult:
        "Windows・Visual Studio Code・完全一致を選ぶと、エディターで行コメントを追加する 2 操作の割り当てが見つかります。Ctrl+K を押した後に Ctrl+C を押す操作で、K と C の同時押しではありません。",
      limitations: [
        "実行中のアプリやキーを使用中のプロセスは検出しません。辞書にない結果は、未使用や競合なしを意味しません。カスタム設定、バージョン、フォーカス、キーボード配列で挙動が変わります。",
        "キーを取得するのは専用欄にフォーカスがある間だけです。Tab で移動し、Escape で取得を終了します。OS やブラウザーに予約されたキーは手動入力を使います。Ctrl と Command は別の修飾キーです。",
      ],
    },
    en: {
      introduction:
        "Look up documented default app shortcuts in a local dictionary using a key combination or sequence. Filter by OS, app, and action, then inspect each binding's context and sources.",
      steps: [
        "Type a shortcut in the manual input, or focus the capture field and press it. Separate sequential strokes with then; up to 4 strokes are supported.",
        "Choose an OS and app, then exact matching or a contained sequence. Review the action, focus conditions, documentation scope, and source for each result.",
      ],
      exampleResult:
        "With Windows, Visual Studio Code, and exact matching selected, this finds the two-stroke binding for adding line comments in the editor. Press Ctrl+K followed by Ctrl+C; K and C are not pressed together.",
      limitations: [
        "This does not detect running apps or processes using a key. Missing dictionary results do not establish that a shortcut is unused or conflict-free. Custom settings, versions, focus, and keyboard layouts can change behavior.",
        "Keys are captured only while the dedicated field has focus. Tab moves focus and Escape leaves capture. Enter OS- or browser-reserved keys manually. Ctrl and Command are distinct modifiers.",
      ],
    },
    "zh-CN": {
      introduction:
        "通过按键组合或连续操作，在本地字典中查找文档记录的应用默认快捷键。可按 OS、应用和用途筛选，并查看每项绑定的适用条件与来源。",
      steps: [
        "在手动输入框中输入快捷键，或聚焦专用捕获框后按键。连续操作用 then 分隔，最多支持 4 次操作。",
        "选择 OS 和应用，再选择完全匹配或包含该序列。查看结果的用途、焦点条件、文档版本范围与来源。",
      ],
      exampleResult:
        "选择 Windows、Visual Studio Code 和完全匹配后，可找到在编辑器中添加行注释的两步快捷键。先按 Ctrl+K，再按 Ctrl+C，而不是同时按 K 和 C。",
      limitations: [
        "不会检测运行中的应用或占用按键的进程。字典没有匹配项，不代表快捷键未使用或没有冲突。自定义设置、版本、焦点和键盘布局都可能改变行为。",
        "仅在专用框有焦点时捕获按键。Tab 移动焦点，Escape 退出捕获。OS 或浏览器保留的按键请手动输入。Ctrl 与 Command 是不同的修饰键。",
      ],
    },
    "zh-TW": {
      introduction:
        "透過按鍵組合或連續操作，在本機字典中查找文件記錄的應用程式預設快捷鍵。可依 OS、應用程式與用途篩選，並查看各項綁定的適用條件與來源。",
      steps: [
        "在手動輸入欄輸入快捷鍵，或聚焦專用擷取欄後按鍵。連續操作以 then 分隔，最多支援 4 次操作。",
        "選擇 OS 與應用程式，再選擇完全符合或包含此序列。查看結果的用途、焦點條件、文件版本範圍與來源。",
      ],
      exampleResult:
        "選擇 Windows、Visual Studio Code 與完全符合後，可找到在編輯器中加入行註解的兩步快捷鍵。先按 Ctrl+K，再按 Ctrl+C，而非同時按 K 與 C。",
      limitations: [
        "不會偵測執行中的應用程式或占用按鍵的處理程序。字典沒有符合項目，不代表快捷鍵未使用或沒有衝突。自訂設定、版本、焦點與鍵盤配置都可能改變行為。",
        "只在專用欄有焦點時擷取按鍵。Tab 移動焦點，Escape 離開擷取。OS 或瀏覽器保留的按鍵請手動輸入。Ctrl 與 Command 是不同的修飾鍵。",
      ],
    },
    ko: {
      introduction:
        "키 조합이나 순서로 로컬 사전에서 문서에 기록된 앱의 기본 단축키를 찾습니다. OS, 앱, 용도로 필터링하고 각 할당의 사용 조건과 출처를 확인할 수 있습니다.",
      steps: [
        "수동 입력란에 단축키를 입력하거나 전용 캡처 필드에 포커스를 둔 뒤 키를 누릅니다. 연속 동작은 then으로 구분하며 최대 4개 동작을 지원합니다.",
        "OS와 앱을 선택하고 정확한 일치 또는 포함된 순서를 선택합니다. 결과의 기능, 포커스 조건, 문서 버전 범위와 출처를 확인합니다.",
      ],
      exampleResult:
        "Windows, Visual Studio Code, 정확한 일치를 선택하면 편집기에 줄 주석을 추가하는 두 단계 단축키를 찾을 수 있습니다. Ctrl+K 다음에 Ctrl+C를 누르는 동작이며 K와 C를 동시에 누르지 않습니다.",
      limitations: [
        "실행 중인 앱이나 키를 사용하는 프로세스를 감지하지 않습니다. 사전에 결과가 없다고 단축키가 사용되지 않거나 충돌이 없다는 뜻은 아닙니다. 사용자 설정, 버전, 포커스와 키보드 배열에 따라 동작이 달라집니다.",
        "전용 필드에 포커스가 있을 때만 키를 캡처합니다. Tab은 포커스를 옮기고 Escape는 캡처를 종료합니다. OS나 브라우저가 예약한 키는 수동으로 입력하세요. Ctrl과 Command는 서로 다른 보조 키입니다.",
      ],
    },
  }),
  explain: localized(
    '[{"Plan":{"Node Type":"Seq Scan","Relation Name":"users","Plan Rows":1000,"Actual Rows":10,"Actual Loops":1,"Actual Total Time":0.2},"Execution Time":0.3}]',
    {
      ja: {
        introduction:
          "PostgreSQL の EXPLAIN FORMAT JSON 出力を読み、計画ノード、推定行数と実行時の行数、記録された時間を確認できます。SQL の実行やデータベース接続は行いません。",
        steps: [
          "取得済みの EXPLAIN JSON を貼り付けます。実行時の行数と時間は、元の出力に ANALYZE の情報がある場合に表示できます。",
          "ノード一覧を読み、必要ならノード種別やリレーション名で絞り込みます。推定行数と実際の行数の差を確認します。",
        ],
        exampleResult:
          "users に対する Seq Scan が 1 ノードあります。推定 1,000 行に対し、実際は 1 ループあたり 10 行で、実際／推定の比は 0.01 です。記録された実行時間は 0.3 ms です。",
        limitations: [
          "最大 512 KiB、深さ 64、20 ステートメント、1,000 ノードです。Actual Rows とノード時間はループあたりの平均です。親ノードの時間には子の処理を含むため、ノード時間を合計しません。",
        ],
      },
      en: {
        introduction:
          "Read PostgreSQL EXPLAIN FORMAT JSON output to inspect plan nodes, estimated versus actual rows, and recorded timings. No SQL is executed and no database connection is made.",
        steps: [
          "Paste existing EXPLAIN JSON. Actual rows and timings are available when the original output includes ANALYZE data.",
          "Inspect the node list, optionally filtering by node type or relation name. Compare estimates with actual rows.",
        ],
        exampleResult:
          "There is one Seq Scan node for users. It estimates 1,000 rows and records 10 actual rows per loop, an actual/estimated ratio of 0.01. The recorded execution time is 0.3 ms.",
        limitations: [
          "Up to 512 KiB, depth 64, 20 statements, and 1,000 nodes. Actual Rows and node times are averages per loop. Parent node times include children, so node timings are never summed.",
        ],
      },
      "zh-CN": {
        introduction:
          "读取 PostgreSQL 的 EXPLAIN FORMAT JSON 输出，检查计划节点、估计与实际行数及记录耗时。工具不执行 SQL，也不连接数据库。",
        steps: [
          "粘贴已获取的 EXPLAIN JSON。只有原始输出包含 ANALYZE 数据时，才能显示实际行数和耗时。",
          "查看节点列表，必要时按节点类型或关系名筛选。比较估计行数与实际行数。",
        ],
        exampleResult:
          "users 有一个 Seq Scan 节点。估计 1,000 行，每次循环实际 10 行，实际／估计比为 0.01。记录的执行时间为 0.3 ms。",
        limitations: [
          "最多支持 512 KiB、深度 64、20 条语句和 1,000 个节点。Actual Rows 和节点耗时是每次循环的平均值。父节点耗时包含子节点，因此不会累加节点耗时。",
        ],
      },
      "zh-TW": {
        introduction:
          "讀取 PostgreSQL 的 EXPLAIN FORMAT JSON 輸出，檢查計畫節點、估計與實際列數及記錄耗時。工具不執行 SQL，也不連線資料庫。",
        steps: [
          "貼上已取得的 EXPLAIN JSON。原始輸出包含 ANALYZE 資料時，才能顯示實際列數與耗時。",
          "查看節點清單，需要時依節點類型或關聯名稱篩選。比較估計列數與實際列數。",
        ],
        exampleResult:
          "users 有一個 Seq Scan 節點。估計 1,000 列，每次迴圈實際 10 列，實際／估計比為 0.01。記錄的執行時間為 0.3 ms。",
        limitations: [
          "最多支援 512 KiB、深度 64、20 個陳述式與 1,000 個節點。Actual Rows 與節點耗時是每次迴圈的平均值。父節點耗時包含子節點，因此不會加總節點耗時。",
        ],
      },
      ko: {
        introduction:
          "PostgreSQL EXPLAIN FORMAT JSON 출력에서 계획 노드, 예상 행과 실제 행, 기록된 시간을 확인합니다. SQL을 실행하거나 데이터베이스에 연결하지 않습니다.",
        steps: [
          "이미 얻은 EXPLAIN JSON을 붙여 넣습니다. 원래 출력에 ANALYZE 데이터가 있을 때 실제 행과 시간을 표시할 수 있습니다.",
          "노드 목록을 보고 필요하면 노드 종류나 관계 이름으로 필터링합니다. 예상 행과 실제 행을 비교합니다.",
        ],
        exampleResult:
          "users에 대한 Seq Scan 노드가 하나 있습니다. 예상은 1,000행이고 실제는 루프당 10행이므로 실제/예상 비율은 0.01입니다. 기록된 실행 시간은 0.3 ms입니다.",
        limitations: [
          "최대 512 KiB, 깊이 64, 문장 20개, 노드 1,000개를 지원합니다. Actual Rows와 노드 시간은 루프당 평균입니다. 부모 노드 시간에 자식 작업이 포함되므로 노드 시간을 합하지 않습니다.",
        ],
      },
    },
  ),
  "html-accessibility": htmlAccessibilityGuide,
  pkce: pkceGuide,
} satisfies Record<ToolId, Record<Locale, ToolGuide>>;
