export type ToolId =
  | "idn"
  | "http-range"
  | "git-patch"
  | "content-disposition"
  | "server-timing"
  | "cache-control"
  | "pkce"
  | "cors"
  | "chmod"
  | "csv"
  | "logs"
  | "sets"
  | "cidr"
  | "unicode"
  | "json-diff"
  | "json-format"
  | "contrast"
  | "har"
  | "env"
  | "url"
  | "shortcuts"
  | "explain"
  | "base64"
  | "html-entities"
  | "url-encode"
  | "dummy-text"
  | "css-specificity"
  | "html-accessibility"
  | "fluid-type"
  | "cubic-bezier"
  | "css-gradient"
  | "svg-placeholder"
  | "path-batch"
  | "color-palette"
  | "data-units"
  | "css-units"
  | "radix"
  | "unicode-normalize"
  | "slug"
  | "unicode-escape"
  | "text-stats"
  | "string-literals"
  | "http-reference"
  | "git-conflicts"
  | "color-converter"
  | "timestamp"
  | "jwt"
  | "ids"
  | "password"
  | "og-tags"
  | "sri"
  | "encoding"
  | "magic"
  | "user-agent"
  | "set-cookie";
export type Category = "data" | "text" | "network" | "design";
export interface ToolDefinition {
  id: ToolId;
  category: Category;
  wasm: boolean;
  devtoys: boolean;
  keywords: string;
  color: "green" | "orange" | "blue" | "purple" | "rose";
}

export const tools: readonly ToolDefinition[] = [
  { id: "idn", category: "network", wasm: false, devtoys: false, keywords: "idn punycode domain hostname unicode ascii xn-- internationalized homoglyph ドメイン 国際化 域名 網域 도메인", color: "purple" },
  { id: "http-range", category: "network", wasm: false, devtoys: false,
    keywords: "http range bytes content-range partial download resume suffix overlap バイト 範囲 再開 下载 位元組 범위 다운로드", color: "blue" },
  { id: "git-patch", category: "text", wasm: false, devtoys: false,
    keywords: "git patch unified diff hunk rename added deleted inspect 差分 パッチ 変更 追加 削除 补丁 修補 패치 변경", color: "orange" },
  {
    id: "content-disposition", category: "network", wasm: false, devtoys: false,
    keywords: "http content-disposition attachment inline filename filename* download utf8 header ファイル名 ダウンロード 保存名 文件名 檔名 파일명 다운로드",
    color: "purple",
  },
  {
    id: "server-timing", category: "network", wasm: false, devtoys: false,
    keywords: "http server-timing duration performance metrics header response latency 計測 応答 時間 性能 服务器 伺服器 시간 성능",
    color: "blue",
  },
  {
    id: "cache-control", category: "network", wasm: false, devtoys: false,
    keywords: "http response cache-control max-age s-maxage no-cache no-store private public immutable stale cache header キャッシュ 応答 鲜度 缓存 快取 캐시 응답",
    color: "orange",
  },
  {
    id: "pkce", category: "network", wasm: false, devtoys: false,
    keywords: "oauth pkce s256 sha256 verifier challenge state authorization 認可 検証子 授权 授權 인가 검증자",
    color: "rose",
  },
  {
    id: "cors", category: "network", wasm: false, devtoys: false,
    keywords: "cors origin preflight access-control allow credentials options http response クロスオリジン プリフライト 跨源 跨來源 사전 요청",
    color: "blue",
  },
  {
    id: "sri", category: "network", wasm: false, devtoys: true,
    keywords: "sri subresource integrity sha256 sha384 sha512 cryptographic hash checksum script link リソース 改ざん 完全性 哈希 完整性 무결성",
    color: "rose",
  },
  {
    id: "encoding", category: "data", wasm: false, devtoys: true,
    keywords: "file bom utf8 utf16le utf16be crlf lf cr newline line endings encoding 文字コード 改行 编码 字符集 인코딩",
    color: "blue",
  },
  {
    id: "magic", category: "data", wasm: false, devtoys: false,
    keywords: "magic bytes signature file binary mime filetype png pdf gif jpg zip hex signature マジック バイト 署名 格式 시그니처",
    color: "orange",
  },
  {
    id: "user-agent", category: "network", wasm: false, devtoys: false,
    keywords: "user agent browser os device client hints chrome firefox safari bot crawler ユーザーエージェント ブラウザ 浏览器 사용자인증",
    color: "purple",
  },
  {
    id: "set-cookie", category: "network", wasm: false, devtoys: false,
    keywords: "set-cookie cookie samesite httponly secure partitioned prefix expires web http クッキー セキュリティ 属性 安全 쿠키",
    color: "green",
  },
  {
    id: "html-entities", category: "text", wasm: false, devtoys: true,
    keywords: "html entities escape unescape unicode markup エンティティ エスケープ デコード 转义 實體 이스케이프",
    color: "rose",
  },
  {
    id: "url-encode", category: "network", wasm: false, devtoys: true,
    keywords: "url percent encode decode uri component form path percent-encoding URL 文字列 エンコード 转码 編碼 퍼센트",
    color: "blue",
  },
  {
    id: "dummy-text", category: "text", wasm: false, devtoys: true,
    keywords: "lorem ipsum dummy placeholder text generate seed paragraphs words ダミーテキスト 文章 生成 占位文本 더미 텍스트",
    color: "purple",
  },
  {
    id: "css-specificity", category: "design", wasm: false, devtoys: true,
    keywords: "css specificity selectors pseudo :is :has :not :where セレクター 詳細度 选择器 特異性 특이성",
    color: "orange",
  },
  {
    id: "html-accessibility", category: "design", wasm: false, devtoys: false,
    keywords: "html accessibility a11y audit alt label aria-labelledby heading duplicate id iframe title accessible name アクセシビリティ 検査 无障碍 無障礙 접근성",
    color: "green",
  },
  {
    id: "fluid-type", category: "design", wasm: false, devtoys: true,
    keywords: "css clamp fluid typography responsive vw rem font size フォント レスポンシブ 流体字体 유동 글꼴",
    color: "green",
  },
  {
    id: "base64",
    category: "text",
    wasm: false,
    devtoys: true,
    keywords: "base64 base64url rfc4648 encode decode utf-8 text encoding バイナリ 変換 エンコード デコード 编码 解码 編碼 解碼 인코딩 디코딩",
    color: "purple",
  },
  {
    id: "chmod",
    category: "data",
    wasm: false,
    devtoys: false,
    keywords:
      "chmod linux unix permissions octal rwx setuid setgid sticky umask file directory 権限 パーミッション 八進 权限 權限 권한",
    color: "orange",
  },
  {
    id: "shortcuts",
    category: "text",
    wasm: false,
    devtoys: false,
    keywords:
      "shortcut keyboard hotkey keybinding key chord sequence desktop web browser ショートカット キー キーボード 調査 快捷键 快捷鍵 단축키",
    color: "blue",
  },
  {
    id: "har",
    category: "network",
    wasm: true,
    devtoys: false,
    keywords:
      "har http request response network waterfall performance latency devtools 通信 応答 遅延 性能 リクエスト",
    color: "orange",
  },
  {
    id: "env",
    category: "data",
    wasm: false,
    devtoys: false,
    keywords: "env dotenv environment config compare duplicate missing 環境変数 設定 比較 重複",
    color: "green",
  },
  {
    id: "url",
    category: "network",
    wasm: false,
    devtoys: false,
    keywords: "url uri query parameter search params fragment hostname URL クエリ パラメータ 構造",
    color: "blue",
  },
  {
    id: "explain",
    category: "data",
    wasm: false,
    devtoys: false,
    keywords:
      "postgres postgresql explain analyze json sql plan query database scan execution 実行計画 データベース クエリ",
    color: "purple",
  },
  {
    id: "csv",
    category: "data",
    wasm: true,
    devtoys: false,
    keywords: "csv tsv column null unique table profile データ 列 表 空欄",
    color: "green",
  },
  {
    id: "logs",
    category: "data",
    wasm: true,
    devtoys: false,
    keywords: "log regex filter count error warning ログ 正規表現 集計",
    color: "orange",
  },
  {
    id: "sets",
    category: "text",
    wasm: true,
    devtoys: true,
    keywords: "set intersection union difference list merge lines 集合 共通 差分 リスト",
    color: "purple",
  },
  {
    id: "cidr",
    category: "network",
    wasm: false,
    devtoys: false,
    keywords: "ip ipv4 ipv6 cidr subnet mask network address サブネット ネットワーク",
    color: "blue",
  },
  {
    id: "unicode",
    category: "text",
    wasm: false,
    devtoys: false,
    keywords: "unicode utf16 invisible bidi zero width code point 不可視 文字 ゼロ幅",
    color: "rose",
  },
  {
    id: "json-diff",
    category: "data",
    wasm: false,
    devtoys: false,
    keywords: "json diff compare semantic pointer structure 比較 構造 差分",
    color: "purple",
  },
  {
    id: "json-format",
    category: "data",
    wasm: false,
    devtoys: true,
    keywords: "json format pretty minify validate 整形 検証",
    color: "green",
  },
  {
    id: "contrast",
    category: "design",
    wasm: false,
    devtoys: true,
    keywords: "color contrast wcag accessibility aa aaa 色 配色 コントラスト",
    color: "orange",
  },
  { id: "cubic-bezier", category: "design", wasm: false, devtoys: true,
    keywords: "css cubic bezier easing timing animation curve イージング 缓动 緩動 이징", color: "orange" },
  { id: "css-gradient", category: "design", wasm: false, devtoys: true,
    keywords: "css gradient linear radial color stops グラデーション 渐变 漸層 그라디언트", color: "rose" },
  { id: "svg-placeholder", category: "design", wasm: false, devtoys: true,
    keywords: "svg placeholder image png illustration svg プレースホルダー 占位图 佔位圖 자리표시자", color: "green" },
  { id: "path-batch", category: "data", wasm: false, devtoys: true,
    keywords: "batch filename path rename strings prefix suffix basename extension ファイル名 パス 批量路径 批次路徑 경로 이름", color: "blue" },
  { id: "color-palette", category: "design", wasm: false, devtoys: true,
    keywords: "palette color harmony analogous complementary triadic 色彩 配色 调和 色調 팔레트", color: "purple" },
  {
    id: "data-units",
    category: "data",
    wasm: false,
    devtoys: false,
    keywords: "bits bytes kibibytes mebibytes GB GiB SI IEC precision size transfer rate データ容量 単位 换算 單位換算 비트 바이트",
    color: "green",
  },
  {
    id: "radix",
    category: "data",
    wasm: false,
    devtoys: true,
    keywords: "radix base integer binary octal decimal hexadecimal base36 BigInt 任意基数 进制 進位 진수 정수",
    color: "purple",
  },
  {
    id: "css-units",
    category: "design",
    wasm: false,
    devtoys: false,
    keywords: "css px rem em vw vh viewport root font size convert CSS 单位 單位 단위 ピクセル",
    color: "blue",
  },
  {
    id: "unicode-normalize",
    category: "text",
    wasm: false,
    devtoys: false,
    keywords: "unicode nfc nfd nfkc nfkd normalization canonical compatibility 正規化 规范化 正規化 정규화",
    color: "rose",
  },
  {
    id: "slug",
    category: "text",
    wasm: false,
    devtoys: false,
    keywords: "slug URL identifier permalink ascii unicode kebab snake naming 識別子 スラッグ 别名 識別碼 슬러그",
    color: "orange",
  },
  {
    id: "unicode-escape",
    category: "text",
    wasm: false,
    devtoys: true,
    keywords: "unicode escape codepoint U+ js UTF-16 conversion エスケープ 字符转义 字元跳脫 유니코드 이스케이프",
    color: "purple",
  },
  { id: "text-stats", category: "text", wasm: false, devtoys: true, keywords: "text statistics case upper lower title camel snake word grapheme bytes Unicode 文字 統計 大文字 小文字 字素 통계", color: "rose" },
  { id: "string-literals", category: "text", wasm: false, devtoys: true, keywords: "escape unescape string literal JSON JS C XML CSV SQL quotes backslash エスケープ 文字列 引用符 转义 跳脫 이스케이프", color: "purple" },
  { id: "http-reference", category: "network", wasm: false, devtoys: false, keywords: "http status code mime content type media type 200 404 500 response extension status ステータス MIME 状态 狀態 상태", color: "blue" },
  { id: "git-conflicts", category: "text", wasm: false, devtoys: false, keywords: "git merge diff3 conflict marker ours theirs ancestor inspect マージ コンフリクト 競合 冲突 衝突 충돌", color: "orange" },
  { id: "color-converter", category: "design", wasm: false, devtoys: true, keywords: "color colour hex rgb hsl hsv alpha sRGB picker convert CSS 色 変換 配色 颜色 顏色 색상", color: "green" },
  {
    id: "timestamp",
    category: "data",
    wasm: false,
    devtoys: true,
    keywords: "date datetime ISO8601 RFC3339 unix timestamp epoch timezone UTC millis 秒 時間 日時 时区 時區 타임스탬프 시간",
    color: "blue",
  },
  {
    id: "jwt",
    category: "network",
    wasm: false,
    devtoys: true,
    keywords: "jwt json web token header payload claims exp nbf iat authentication 認証 解码 解碼 인증 토큰",
    color: "rose",
  },
  {
    id: "ids",
    category: "data",
    wasm: false,
    devtoys: true,
    keywords: "uuid v4 v7 ulid random identifier id generator UUID 生成 产生 產生 생성",
    color: "purple",
  },
  {
    id: "password",
    category: "text",
    wasm: false,
    devtoys: true,
    keywords: "password random token secure hex secret generate crypto パスワード 秘密 随机 密码 密碼 비밀번호",
    color: "green",
  },
  {
    id: "og-tags",
    category: "network",
    wasm: false,
    devtoys: false,
    keywords: "open graph twitter card metadata html meta og tags seo social share preview SNS OGP 分享 공유 メタタグ",
    color: "blue",
  },
] as const;

export function isToolId(value: unknown): value is ToolId {
  return typeof value === "string" && tools.some((tool) => tool.id === value);
}

export function getTool(id: ToolId): ToolDefinition {
  return tools.find((tool) => tool.id === id)!;
}
