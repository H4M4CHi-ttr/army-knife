import type { Locale } from "./locales";
import type { ToolGuide } from "./tool-guides";

type FiveToolId = "timestamp" | "jwt" | "ids" | "password" | "og-tags";
type GuideCopy = { introduction: string; steps: [string, string]; exampleResult: string; limits: string };
const examples: Record<FiveToolId, string> = {
  timestamp: "2026-10-12T12:30:00+09:00",
  jwt: "eyJhbGciOiJub25lIn0.eyJzdWIiOiJkZW1vIiwiZXhwIjoyMDAwMDAwMDAwfQ.",
  ids: "Format: UUID v7 / Count: 5",
  password: "Length: 24 / Count: 5 / a-z + A-Z + 0-9",
  "og-tags": "Title: Example & Demo\nURL: https://example.com/\nDescription: A local preview",
};
const copy: Record<Locale, Record<FiveToolId, GuideCopy>> = {
  en: {
    timestamp: {
      introduction: "Convert RFC 3339 instants, signed Unix epoch seconds and Unix milliseconds without making network requests.",
      steps: ["Select the input format and enter a value. RFC 3339 requires an explicit timezone offset.", "Select an IANA display zone. Compare UTC, exact epoch units, and the displayed local time."],
      exampleResult: "2026-10-12T03:30:00.000Z in UTC. Switching the display zone does not change the epoch.",
      limits: "Up to 256 input bytes, 80 zone characters, four-digit years and up to 3 decimal places for seconds. Invalid calendar dates, unknown zones and values outside JavaScript Date range are rejected. A local wall time without an offset cannot be converted.",
    },
    jwt: {
      introduction: "Decode JWT header and claims without trusting either segment or checking any signature.",
      steps: ["Paste a three-part compact JWT. The header and payload must contain canonical base64url-encoded UTF-8 JSON objects.", "Inspect the untrusted algorithm, claims and converted iat/nbf/exp dates; never treat this tool as an authentication check."],
      exampleResult: "The sample declares alg=none, subject demo, and has no signature. Its claims are still unverified.",
      limits: "Maximum 64 KiB. No issuer, audience, signature, key, expiry-policy or clock-skew validation; no network lookup. Secrets pasted here exist in browser memory until leaving the tool.",
    },
    ids: {
      introduction: "Create UUID v4, RFC 9562 UUID v7, or ULID identifiers using browser cryptographic randomness. Inspect time-bearing IDs.",
      steps: ["Select a format and generate 1–100 identifiers at once.", "Paste a UUID v4/v7 or ULID into the inspector to check its structure and view any embedded UTC timestamp."],
      exampleResult: "UUID v7 starts with a 48-bit Unix millisecond timestamp and has version 7 and RFC variant bits.",
      limits: "Maximum 100 IDs per batch. Generation does not guarantee monotonically increasing results within the same millisecond. IDs are generated in memory and not persisted.",
    },
    password: {
      introduction: "Generate passwords or hexadecimal random tokens with the browser's secure random number generator and unbiased rejection sampling.",
      steps: ["Choose password character groups or hex tokens, length 8–128, and count 1–20.", "Generate and copy results explicitly. Passwords contain at least one character from each selected group."],
      exampleResult: "With three enabled groups, each generated password contains at least one lowercase, uppercase and digit character.",
      limits: "At most 20 results, 128 characters each; excluded characters up to 128. Empty selected groups and odd hex lengths are rejected. Entropy shown is only a loose ceiling, not a security guarantee. Results are never stored.",
    },
    "og-tags": {
      introduction: "Generate escaped Open Graph and Twitter Card meta tags for a local HTML snippet.",
      steps: ["Enter a title and HTTP(S) canonical URL; optionally add description, image URL, language and article type.", "Inspect the text-only mockup and copy or download the HTML tags. No remote images are loaded."],
      exampleResult: "The title Example & Demo is written as Example &amp; Demo within the HTML content attribute.",
      limits: "Title ≤200 characters, description ≤1,000, each URL ≤2,048 and total input ≤8 KiB. URL credentials and non-HTTP(S) schemes are rejected. No live crawler preview or external fetch.",
    },
  },
  ja: {
    timestamp: {
      introduction: "RFC 3339日時と符号付きUnix秒・ミリ秒を端末内で相互変換します。",
      steps: ["入力形式を選んで入力します。RFC 3339では明示的なUTCオフセットが必要です。", "IANAタイムゾーンを指定し、UTC・秒・ミリ秒・現地表示を比較します。"],
      exampleResult: "UTCは2026-10-12T03:30:00.000Z。表示タイムゾーンを変えても絶対時刻は変わりません。",
      limits: "入力256バイト、タイムゾーン80文字、4桁年、小数秒3桁まで。実在しない日付・不明な地域名・JavaScript Date範囲外は拒否。オフセットなしの現地日時は解釈しません。",
    },
    jwt: {
      introduction: "JWTのヘッダーとクレームを復号して表示します。署名の正当性は確認しません。",
      steps: ["3区間のJWTを貼り付けます。ヘッダーとペイロードは正規のbase64url UTF-8 JSONオブジェクトに限定します。", "未信頼のアルゴリズムとexp/nbf/iatを読み取ります。認証・認可の判定には使わないでください。"],
      exampleResult: "例のalgはnone、subjectはdemo、署名はありません。クレームはすべて未検証です。",
      limits: "最大64 KiB。発行者・対象者・署名・鍵・期限ポリシー・時計ずれを検証せず、ネットワーク照会もしません。貼り付けた秘密はツールを離れるまでメモリ内にあります。",
    },
    ids: {
      introduction: "暗号学的乱数でUUID v4・RFC 9562 v7・ULIDを生成し、既存IDを調べます。",
      steps: ["形式と件数（1～100）を選び、生成ボタンを押します。", "UUID v4/v7またはULIDを入力し、構造と埋め込みUTC日時を確認します。"],
      exampleResult: "UUID v7では先頭48ビットがUnixミリ秒、バージョンは7、variantはRFC準拠です。",
      limits: "1回100件まで。同一ミリ秒内の単調増加を保証しません。結果はメモリ内だけで扱い保存しません。",
    },
    password: {
      introduction: "ブラウザの暗号学的乱数と偏りを避ける拒否サンプリングでパスワード・16進トークンを生成します。",
      steps: ["文字集合または16進トークンを選び、8～128文字、1～20件を設定します。", "明示的に生成・コピーします。選択した各文字集合から最低1文字を含みます。"],
      exampleResult: "英小文字・大文字・数字を選択すると、それぞれ最低1文字が入ります。",
      limits: "最大20件、各128文字。除外文字は128文字まで。空の集合や奇数長の16進トークンはエラーです。強度表示は概算上限で安全性の保証ではありません。結果は保存しません。",
    },
    "og-tags": {
      introduction: "Open Graph・Twitter Cardの安全にエスケープしたHTMLメタタグを端末内で生成します。",
      steps: ["タイトルとHTTP(S) URLを入力し、必要なら説明・画像URL・言語・記事種別を追加します。", "文字だけの模擬プレビューを見てタグをコピー・保存します。外部画像は読み込みません。"],
      exampleResult: "「Example & Demo」の&はHTML属性内で&amp;に変換されます。",
      limits: "タイトル200文字、説明1000文字、URL各2048文字、合計8 KiBまで。認証情報付きURL・HTTP(S)以外は禁止。外部通信・SNS実プレビューはしません。",
    },
  },
  "zh-CN": {
    timestamp: {
      introduction: "在浏览器本地转换 RFC 3339 时间与带符号的 Unix 秒、毫秒。",
      steps: ["选择格式并输入。RFC 3339 必须带时区偏移。", "选择 IANA 时区，对比 UTC、Unix 秒、毫秒与当地显示时间。"],
      exampleResult: "UTC 为 2026-10-12T03:30:00.000Z。修改显示时区不改变绝对时间。",
      limits: "输入最多256字节、时区80字符、四位年份和三位小数秒。拒绝无效日期、未知时区或超出 Date 范围的值。不解析无偏移的当地日期。",
    },
    jwt: {
      introduction: "只解码 JWT 头部和声明，不检查或信任签名。",
      steps: ["粘贴三段 JWT。前两段必须是规范的 base64url UTF-8 JSON 对象。", "查看不可信的算法与 exp/nbf/iat，绝不可用于认证授权。"],
      exampleResult: "样例声明 alg=none，主体为 demo，没有签名；声明仍未验证。",
      limits: "最多64 KiB。不验证签名、发行者、受众、密钥或时钟偏差，也不联网。输入仅暂存于浏览器内存。",
    },
    ids: {
      introduction: "使用浏览器加密随机数生成 UUID v4、RFC 9562 v7 或 ULID 并检查时间。",
      steps: ["选择类型并生成1–100个标识符。", "输入现有 UUID v4/v7 或 ULID 检查格式和 UTC 时间戳。"],
      exampleResult: "UUID v7 的前48位存储 Unix 毫秒时间戳，并包含版本7与 RFC variant 位。",
      limits: "每批最多100个，不保证同一毫秒内单调递增。结果不持久化。",
    },
    password: {
      introduction: "采用浏览器安全随机数和无偏拒绝抽样生成密码与十六进制令牌。",
      steps: ["选择字符组或十六进制令牌、8–128字符长度及1–20份数量。", "点击生成并复制，每个选中的字符组至少包含一个字符。"],
      exampleResult: "选择大小写字母与数字时，每份密码都包含各组字符。",
      limits: "最多20份，每份128字符，排除字符最多128个。空组和奇数位十六进制长度会报错。熵显示仅为上界估算，结果不保存。",
    },
    "og-tags": {
      introduction: "在本地生成经过 HTML 属性转义的 Open Graph 与 Twitter Card 标签。",
      steps: ["输入标题和 HTTP(S) URL，可添加描述、图片、区域语言及文章类型。", "查看纯文字预览并复制或下载标签，不请求外部图片。"],
      exampleResult: "标题 Example & Demo 在 HTML 属性中写为 Example &amp; Demo。",
      limits: "标题200字符、描述1000字符、每个URL2048字符、总计8 KiB。拒绝带认证信息的URL和非HTTP(S)协议，不联网。",
    },
  },
  "zh-TW": {
    timestamp: {
      introduction: "於瀏覽器本機轉換 RFC 3339 時間與帶正負號的 Unix 秒、毫秒。",
      steps: ["選擇格式後輸入，RFC 3339 必須含時區偏移。", "指定 IANA 時區，比對 UTC、Unix 秒、毫秒與當地顯示時間。"],
      exampleResult: "UTC 為 2026-10-12T03:30:00.000Z。修改顯示時區不影響絕對時間。",
      limits: "輸入最多256位元組、時區80字元、四位年份與三位小數秒。拒絕無效日期、未知時區及超出 Date 範圍的值。不解讀未附偏移的當地時間。",
    },
    jwt: {
      introduction: "只解碼 JWT 標頭與聲明，不檢查或信任簽章。",
      steps: ["貼上三段 JWT，前兩段必須是標準 base64url UTF-8 JSON 物件。", "查看未受信任的演算法及 exp/nbf/iat，切勿用於認證授權。"],
      exampleResult: "範例宣告 alg=none、主體為 demo，且沒有簽章；聲明仍未驗證。",
      limits: "最多64 KiB。不驗證簽章、發行者、受眾、金鑰或時鐘偏差，也不連網。輸入僅暫存於瀏覽器記憶體。",
    },
    ids: {
      introduction: "用瀏覽器加密亂數產生 UUID v4、RFC 9562 v7 或 ULID 並檢查時間。",
      steps: ["選擇種類並產生1–100個識別碼。", "輸入現有 UUID v4/v7 或 ULID 以檢查格式與 UTC 時間戳記。"],
      exampleResult: "UUID v7 前48位儲存 Unix 毫秒時間戳記，並含版本7與 RFC variant 位元。",
      limits: "每批最多100個，不保證同一毫秒內單調遞增。結果不儲存。",
    },
    password: {
      introduction: "以瀏覽器安全亂數與無偏拒絕取樣產生密碼與十六進位權杖。",
      steps: ["選擇字元群組或十六進位權杖、8–128字元長度與1–20個。", "點選產生並複製，每個選取的字元群組至少包含一個字元。"],
      exampleResult: "選擇大小寫字母與數字時，每個密碼都包含各群組的字元。",
      limits: "最多20個、每個128字元，排除字元最多128個。空群組與奇數位十六進位長度會報錯。熵僅為估算上限，結果不儲存。",
    },
    "og-tags": {
      introduction: "在本機產生經過 HTML 屬性跳脫的 Open Graph 與 Twitter Card 標籤。",
      steps: ["輸入標題與 HTTP(S) URL，可加上描述、圖片、語系及文章類型。", "檢視純文字預覽並複製或下載標籤，不會要求外部圖片。"],
      exampleResult: "標題 Example & Demo 在 HTML 屬性中寫成 Example &amp; Demo。",
      limits: "標題200字元、描述1000字元、每個URL2048字元、總計8 KiB。拒絕含認證資訊的URL與非HTTP(S)協定，不連網。",
    },
  },
  ko: {
    timestamp: {
      introduction: "브라우저에서 RFC 3339 시각과 부호 있는 Unix 초·밀리초를 변환합니다.",
      steps: ["입력 형식을 고르고 값을 입력합니다. RFC 3339에는 시간대 오프셋이 필요합니다.", "IANA 시간대를 선택하고 UTC·Unix 초·밀리초·현지 표시를 비교합니다."],
      exampleResult: "UTC는 2026-10-12T03:30:00.000Z이며 표시 시간대를 바꿔도 절대 시각은 같습니다.",
      limits: "입력 256바이트, 시간대 80자, 4자리 연도, 소수 초 최대3자리. 잘못된 날짜·시간대 및 Date 범위 초과값은 거부합니다. 오프셋 없는 현지 시각은 해석하지 않습니다.",
    },
    jwt: {
      introduction: "JWT 헤더와 클레임을 디코딩만 하며 서명을 검증하거나 신뢰하지 않습니다.",
      steps: ["3개 구간의 JWT를 붙여 넣습니다. 앞의 두 구간은 정규 base64url UTF-8 JSON 객체여야 합니다.", "미검증 알고리즘과 exp/nbf/iat를 확인하되 인증·인가에 사용하지 않습니다."],
      exampleResult: "예시의 alg는 none, subject는 demo이며 서명이 없습니다. 클레임은 여전히 미검증입니다.",
      limits: "최대64 KiB. 서명·발급자·대상·키·시계 차이를 검증하지 않고 네트워크 요청도 하지 않습니다. 입력은 메모리에만 보관됩니다.",
    },
    ids: {
      introduction: "브라우저 암호학적 난수로 UUID v4, RFC 9562 v7, ULID를 생성하고 시각을 검사합니다.",
      steps: ["형식과 개수(1–100)를 정하고 생성합니다.", "기존 UUID v4/v7 또는 ULID를 입력해 형식과 UTC 타임스탬프를 확인합니다."],
      exampleResult: "UUID v7의 첫 48비트에는 Unix 밀리초 시각이 있고 버전7 및 RFC variant 비트가 포함됩니다.",
      limits: "한 번에 최대100개, 같은 밀리초 내 단조 증가는 보장하지 않습니다. 결과는 저장하지 않습니다.",
    },
    password: {
      introduction: "브라우저 보안 난수와 편향 없는 거부 샘플링으로 비밀번호 및 16진 토큰을 생성합니다.",
      steps: ["문자 그룹 또는 16진 토큰, 길이8–128자와 개수1–20개를 지정합니다.", "명시적으로 생성 후 복사합니다. 선택한 각 그룹의 문자가 최소 한 개 포함됩니다."],
      exampleResult: "소문자·대문자·숫자를 선택하면 각각 최소 한 글자가 포함됩니다.",
      limits: "최대20개, 각128자, 제외 문자는128자까지. 빈 문자 그룹과 홀수 길이 16진 토큰은 오류입니다. 엔트로피 수치는 상한 추정이며 저장하지 않습니다.",
    },
    "og-tags": {
      introduction: "로컬에서 HTML 속성을 안전하게 이스케이프한 Open Graph·Twitter Card 태그를 생성합니다.",
      steps: ["제목과 HTTP(S) URL을 넣고 필요하면 설명·이미지·언어·기사 유형을 설정합니다.", "텍스트 전용 예시를 확인하고 태그를 복사하거나 저장합니다. 외부 이미지는 로드하지 않습니다."],
      exampleResult: "제목 Example & Demo의 &는 HTML 속성에서 &amp;로 출력됩니다.",
      limits: "제목200자, 설명1000자, URL 각각2048자, 총8 KiB까지. 인증 정보 포함 URL 및 HTTP(S) 외 프로토콜은 거부합니다. 외부 요청은 없습니다.",
    },
  },
};

export const fiveToolGuides = Object.fromEntries(
  (Object.keys(examples) as FiveToolId[]).map((id) => [
    id,
    Object.fromEntries(
      (Object.keys(copy) as Locale[]).map((locale) => {
        const details = copy[locale][id];
        const guide: ToolGuide = {
          introduction: details.introduction,
          steps: details.steps,
          exampleInput: examples[id],
          exampleResult: details.exampleResult,
          limitations: [details.limits],
        };
        return [locale, guide];
      }),
    ) as Record<Locale, ToolGuide>,
  ]),
) as Record<FiveToolId, Record<Locale, ToolGuide>>;
