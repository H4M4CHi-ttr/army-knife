import type { CoreLocale as Locale } from "./locales.ts";
import type { ToolGuide } from "./tool-guides.ts";

/** Static, localized public guides. Examples never contain user data. */
export const utilityGuides = {
  "html-entities": {
    "ja": {
      "introduction": "HTMLとして実行せず、特殊文字をHTML実体へ変換したり、有効な名前付き・数値実体を文字へ復元したりします。",
      "steps": [
        "変換方向と最小または完全エスケープを選び、文字列を入力します。",
        "結果を確認してコピーできます。デコードは一度だけ行います。"
      ],
      "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
      "exampleResult": "&lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt; と出力します。完全モードでは絵文字なども数値実体になります。",
      "limitations": [
        "入力は最大64KiB。名前付き実体はamp/lt/gt/quot/apos/nbsp/copy/reg/trade/euro/hellip/mdash/ndash/times/divideのみ。未知・不正実体は原文維持、実行はしません。"
      ]
    },
    "en": {
      "introduction": "Encode text safely as HTML character references and decode a documented set of named or valid numeric references without interpreting markup.",
      "steps": [
        "Select direction and minimal or full escaping, then enter your text.",
        "Inspect and copy the result. Decoding runs for one pass only."
      ],
      "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
      "exampleResult": "Minimal encoding yields &lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt;. Full mode converts non-ASCII characters to numeric references.",
      "limitations": [
        "Max 64 KiB input. Named decoding supports amp/lt/gt/quot/apos/nbsp/copy/reg/trade/euro/hellip/mdash/ndash/times/divide only. Invalid and unknown references remain literal. Markup is never executed."
      ]
    },
    "zh-CN": {
      "introduction": "将文本转为 HTML 字符实体，或还原指定的命名和有效数字实体，不解析标记。",
      "steps": [
        "选择编码或解码以及最小或完整模式，输入字符串。",
        "检查并复制结果；只执行一次解码。"
      ],
      "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
      "exampleResult": "最小编码结果为 &lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt;。完整模式会将非 ASCII 字符转成数字实体。",
      "limitations": [
        "输入最多 64 KiB；命名实体仅支持列出的 15 种。未知或无效实体保留原文；不执行 HTML。"
      ]
    },
    "zh-TW": {
      "introduction": "將文字轉為 HTML 字元實體，或還原指定的命名與有效數值實體，不解析標記。",
      "steps": [
        "選擇編碼或解碼、最小或完整模式，輸入字串。",
        "檢查並複製結果；只解碼一次。"
      ],
      "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
      "exampleResult": "最小編碼結果是 &lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt;。完整模式會將非 ASCII 字元轉成數值實體。",
      "limitations": [
        "輸入上限 64 KiB；命名實體僅支援列出的 15 種。未知或無效實體保留原文；不執行 HTML。"
      ]
    },
    "ko": {
      "introduction": "HTML 마크업을 실행하지 않고 문자 참조를 인코딩하거나 알려진 이름과 올바른 숫자 참조를 디코딩합니다.",
      "steps": [
        "인코딩·디코딩 방향과 최소·전체 모드를 선택한 뒤 텍스트를 입력하세요.",
        "출력을 확인하고 복사하세요. 디코딩은 한 번만 수행합니다."
      ],
      "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
      "exampleResult": "최소 인코딩 결과는 &lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt;입니다. 전체 모드는 비ASCII 문자도 숫자로 변환합니다.",
      "limitations": [
        "입력 최대 64 KiB. 이름 참조는 문서에 나열된 15종만 지원하며 알 수 없는 참조는 그대로 유지합니다. HTML은 실행하지 않습니다."
      ]
    }
  },
  "url-encode": {
    "ja": {
      "introduction": "URL全体の解析とは別に、文字列単位でパーセントエンコード・デコードします。",
      "steps": [
        "component、フォーム、パスを選択し、方向を指定して文字を入力します。",
        "出力を確認し、必要に応じてコピーします。"
      ],
      "exampleInput": "A B/日+?",
      "exampleResult": "componentはA%20B%2F%E6%97%A5%2B%3F、パスでは区切り/をそのまま保持します。",
      "limitations": [
        "入力最大64KiB。フォームのみ+を空白と扱います。不正な%やUTF-8はエラー。相対URLの組立や通信はしません。"
      ]
    },
    "en": {
      "introduction": "Convert strings using component, form, or slash-preserving path percent-encoding; no URL is visited.",
      "steps": [
        "Choose the transformation direction and encoding mode, then enter a string.",
        "Inspect and copy the result."
      ],
      "exampleInput": "A B/日+?",
      "exampleResult": "Component mode encodes A B/日+? as A%20B%2F%E6%97%A5%2B%3F; path mode keeps the slash.",
      "limitations": [
        "Max 64 KiB input. Only form mode treats + as space on decode. Bad escapes and malformed UTF-8 fail. This does not parse or fetch URLs."
      ]
    },
    "zh-CN": {
      "introduction": "按 URL 组件、表单或路径规则转换百分号编码，不访问网址。",
      "steps": [
        "选择方向和规则后输入字符串。",
        "检查并复制输出。"
      ],
      "exampleInput": "A B/日+?",
      "exampleResult": "组件模式将 A B/日+? 转换为 A%20B%2F%E6%97%A5%2B%3F；路径模式保留 /。",
      "limitations": [
        "输入最多 64 KiB。只有表单模式将 + 解为空格；无效百分号和 UTF-8 会报错，不进行联网。"
      ]
    },
    "zh-TW": {
      "introduction": "依 URL 元件、表單或路徑規則進行百分比編碼，不會存取網址。",
      "steps": [
        "選擇方向及規則後輸入字串。",
        "檢查並複製輸出。"
      ],
      "exampleInput": "A B/日+?",
      "exampleResult": "元件模式將 A B/日+? 轉成 A%20B%2F%E6%97%A5%2B%3F；路徑模式保留 /。",
      "limitations": [
        "輸入上限 64 KiB。只有表單模式將 + 解為空格；無效百分號與 UTF-8 會報錯，不會連網。"
      ]
    },
    "ko": {
      "introduction": "URL에 접속하지 않고 컴포넌트, 폼, 경로 규칙에 맞춰 문자열을 퍼센트 인코딩합니다.",
      "steps": [
        "방향과 모드를 선택하고 문자열을 입력하세요.",
        "출력 내용을 확인하고 복사하세요."
      ],
      "exampleInput": "A B/日+?",
      "exampleResult": "컴포넌트 모드에서 A B/日+?는 A%20B%2F%E6%97%A5%2B%3F가 되며 경로 모드는 /를 유지합니다.",
      "limitations": [
        "입력 최대 64 KiB. 폼 모드만 +를 공백으로 해석합니다. 잘못된 퍼센트 표기나 UTF-8은 오류이며 네트워크 요청이 없습니다."
      ]
    }
  },
  "dummy-text": {
    "ja": {
      "introduction": "UIレイアウト検証用の架空の文章を、日本語など6種類の言語スタイルで生成します。",
      "steps": [
        "言語、段落・文・文字数、生成数、seedを指定します。",
        "結果をコピーまたはテキストファイルにダウンロードします。"
      ],
      "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
      "exampleResult": "日本語3段落を生成し、同じseed=42と条件で再び同じ結果になります。",
      "limitations": [
        "最大30段落・120文・Unicodeスカラー1万文字、出力64KiB。文は固定した架空のコーパスから選び、実在人物情報を作りません。"
      ]
    },
    "en": {
      "introduction": "Generate reproducible filler text from fixed synthetic phrases in six language styles.",
      "steps": [
        "Choose language, paragraphs/sentences/characters, count, and seed.",
        "Copy or download the output."
      ],
      "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
      "exampleResult": "Japanese / 3 paragraphs / seed 42 always produces the same three paragraphs.",
      "limitations": [
        "Maximum 30 paragraphs, 120 sentences or 10,000 Unicode scalars; maximum 64 KiB output. Phrases are synthetic, not real personal data."
      ]
    },
    "zh-CN": {
      "introduction": "使用固定的合成语句，在六种语言风格中生成可复现的占位文字。",
      "steps": [
        "选择语言、段落/句子/字符、数量和种子。",
        "复制或下载结果。"
      ],
      "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
      "exampleResult": "日语、3 段、种子 42 每次生成相同的三段文字。",
      "limitations": [
        "最多 30 段、120 句或 10,000 个 Unicode 字符，输出不超过 64 KiB。不生成真实个人资料。"
      ]
    },
    "zh-TW": {
      "introduction": "使用固定的合成句子，產生六種語言風格、可重現的佔位文字。",
      "steps": [
        "選擇語言、段落/句子/字元、數量與種子。",
        "複製或下載結果。"
      ],
      "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
      "exampleResult": "日語、3 段、種子 42 每次產生相同的三段文字。",
      "limitations": [
        "最多 30 段、120 句或 10,000 個 Unicode 字元，輸出不超過 64 KiB。不產生真實個人資料。"
      ]
    },
    "ko": {
      "introduction": "고정된 가상 문장으로 여섯 언어 스타일의 반복 가능한 더미 텍스트를 생성합니다.",
      "steps": [
        "언어, 문단·문장·문자 단위, 개수, 시드를 선택하세요.",
        "출력을 복사하거나 다운로드하세요."
      ],
      "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
      "exampleResult": "일본어·3문단·시드 42는 항상 동일한 문단을 생성합니다.",
      "limitations": [
        "최대 30문단, 120문장, Unicode 문자 10,000개 및 출력 64 KiB입니다. 실제 개인정보는 생성하지 않습니다."
      ]
    }
  },
  "css-specificity": {
    "ja": {
      "introduction": "CSSセレクターごとの詳細度(a,b,c)を比較し、トークンごとの寄与を確認できます。",
      "steps": [
        "セレクターをカンマ区切りで入力します。",
        "表でa,b,cと構成要素の内訳を確認し、結果をコピーします。"
      ],
      "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
      "exampleResult": "1番目は(1,2,2)、2番目は(0,0,2)です。:whereの内部は0として数えます。",
      "limitations": [
        "最大4096文字・32式・ネスト8階層。Selectors 4の限定的構文に対応し、&ネストや未対応の複雑な関数は計算せずエラーにします。"
      ]
    },
    "en": {
      "introduction": "Compare (a,b,c) CSS selector specificity, with per-token attribution.",
      "steps": [
        "Enter one or more comma-separated selectors.",
        "Review the component scores and copy the report."
      ],
      "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
      "exampleResult": "The first selector scores (1,2,2), the second (0,0,2). :where contributes zero.",
      "limitations": [
        "Maximum 4,096 characters, 32 selectors, 8 nesting levels. Supports a strict Selectors 4 subset; nested & and unsupported pseudo-functions fail instead of guessing."
      ]
    },
    "zh-CN": {
      "introduction": "比较 CSS 选择器的 (a,b,c) 权重，并检查各标记的贡献。",
      "steps": [
        "以逗号分隔输入选择器。",
        "查看各项得分并复制结果。"
      ],
      "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
      "exampleResult": "第一个得分 (1,2,2)，第二个 (0,0,2)；:where 内的权重为零。",
      "limitations": [
        "最多 4096 字符、32 个表达式、8 层嵌套。只支持特定 Selectors 4 语法；不支持的语法报错。"
      ]
    },
    "zh-TW": {
      "introduction": "比較 CSS 選擇器的 (a,b,c) 權重，查看各標記的貢獻。",
      "steps": [
        "以逗號分隔輸入選擇器。",
        "查看各項分數並複製結果。"
      ],
      "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
      "exampleResult": "第一個分數為 (1,2,2)，第二個為 (0,0,2)；:where 的權重為零。",
      "limitations": [
        "最多 4096 字元、32 個運算式、8 層巢狀。只支援特定 Selectors 4 語法；不支援的語法會報錯。"
      ]
    },
    "ko": {
      "introduction": "CSS 선택자별 (a,b,c) 명시도를 비교하고 요소별 점수를 확인합니다.",
      "steps": [
        "선택자를 쉼표로 구분해 입력하세요.",
        "점수와 구성 요소를 확인하고 복사하세요."
      ],
      "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
      "exampleResult": "첫 선택자는 (1,2,2), 둘째는 (0,0,2)입니다. :where의 기여는 0입니다.",
      "limitations": [
        "최대 4,096자, 선택자 32개, 중첩 8단계입니다. 엄격한 Selectors 4 하위 문법만 지원하며 미지원 구문은 오류로 처리합니다."
      ]
    }
  },
  "fluid-type": {
    "ja": {
      "introduction": "2点の画面幅と文字サイズを結ぶ線形関数からCSSのclamp式を組み立てます。",
      "steps": [
        "最小・最大のフォントサイズとビューポート幅、remの基準サイズを指定します。",
        "スライダーで幅を動かしてサイズを試し、CSSをコピーします。"
      ],
      "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
      "exampleResult": "font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem); と生成します。",
      "limitations": [
        "文字サイズ0.5〜256px、画面幅240〜10000px、基準8〜32px。2つの画面幅は昇順で指定します。小数6桁丸めとブラウザ側remの違いに注意。"
      ]
    },
    "en": {
      "introduction": "Build a linearly interpolated CSS clamp from two viewport and font-size endpoints.",
      "steps": [
        "Enter lower and upper font sizes and viewports, plus the base px-per-rem.",
        "Move the preview slider, then copy the generated CSS."
      ],
      "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
      "exampleResult": "The sample produces font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem);",
      "limitations": [
        "Font sizes 0.5–256 px, widths 240–10,000 px, base 8–32 px. Viewports must increase. CSS coefficients are rounded to six decimals; real rem depends on the browser root font size."
      ]
    },
    "zh-CN": {
      "introduction": "根据两个视口宽度及字号端点，构造线性插值的 CSS clamp。",
      "steps": [
        "填写最小、最大字号和视口宽度，以及 rem 的基准大小。",
        "移动滑块预览后复制 CSS。"
      ],
      "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
      "exampleResult": "示例生成 font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem);",
      "limitations": [
        "字号 0.5–256px、视口 240–10000px、根字号 8–32px。视口宽度必须递增。CSS 四舍五入至 6 位小数。"
      ]
    },
    "zh-TW": {
      "introduction": "依兩個視窗寬度與字級端點，建立線性內插的 CSS clamp。",
      "steps": [
        "輸入最小、最大字級與視窗寬度，以及 rem 的基準大小。",
        "拖動滑桿預覽後複製 CSS。"
      ],
      "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
      "exampleResult": "範例產生 font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem);",
      "limitations": [
        "字級 0.5–256px、視窗 240–10000px、根字級 8–32px。視窗寬度必須遞增。CSS 四捨五入至 6 位小數。"
      ]
    },
    "ko": {
      "introduction": "두 화면 너비와 글꼴 크기의 끝값으로 선형 보간된 CSS clamp를 만듭니다.",
      "steps": [
        "최소·최대 크기, 뷰포트 너비, rem 기준 크기를 입력하세요.",
        "슬라이더로 미리 본 다음 CSS를 복사하세요."
      ],
      "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
      "exampleResult": "예시 결과는 font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem); 입니다.",
      "limitations": [
        "글꼴 0.5–256px, 뷰포트 240–10000px, 기준 8–32px입니다. 너비는 오름차순이어야 합니다. CSS 소수점 6자리 반올림을 유의하세요."
      ]
    }
  }
} satisfies Record<"html-entities" | "url-encode" | "dummy-text" | "css-specificity" | "fluid-type", Record<Locale,ToolGuide>>;
