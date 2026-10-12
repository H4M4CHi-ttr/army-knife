export type ToolId =
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
  | "fluid-type"
  | "cubic-bezier"
  | "css-gradient"
  | "svg-placeholder"
  | "path-batch"
  | "color-palette"
  | "timestamp"
  | "jwt"
  | "ids"
  | "password"
  | "og-tags";
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
