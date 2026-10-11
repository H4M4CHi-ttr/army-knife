export type ToolId =
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
  | "explain";
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
] as const;

export function isToolId(value: unknown): value is ToolId {
  return typeof value === "string" && tools.some((tool) => tool.id === value);
}

export function getTool(id: ToolId): ToolDefinition {
  return tools.find((tool) => tool.id === id)!;
}
