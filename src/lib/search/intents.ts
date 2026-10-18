import type { ToolId } from "../catalog";

export type SearchIntentMap = Readonly<Partial<Record<ToolId, readonly string[]>>>;

/**
 * Example user goals, not executable instructions. Keys are stable tool IDs.
 * Add a language pack here and the engine indexes it alongside existing packs.
 * Do not put real user queries or user files in this repository.
 */
export const searchIntents = {
  ja: {
    har: [
      "ブラウザの通信が遅い原因を調べたい",
      "APIの応答速度や遅いリクエストを調査する",
      "HARファイルからHTTPエラーを見つける",
    ],
    env: [
      "本番環境と開発環境の設定を比較したい",
      "環境変数やenvファイルに不足がないか調べる",
      "設定ファイルの差分と重複キーを探す",
    ],
    url: [
      "URLのクエリパラメータを編集したい",
      "リンクからホスト名やフラグを取り出したい",
      "URLのパラメーターを追加削除する",
    ],
    explain: [
      "SQLが遅い原因を実行計画から調べたい",
      "PostgreSQLのクエリのボトルネックを分析する",
      "テーブルスキャンや推定行数を確認したい",
    ],
    csv: [
      "CSVデータの空欄や欠損値を調べたい",
      "表の列の型や重複した名前を検査する",
      "TSVファイルを診断したい",
    ],
    logs: [
      "エラーログを絞り込んで集計したい",
      "大量のログから警告を見つけたい",
      "ログ内の同じ行の出現回数を数える",
    ],
    sets: [
      "2つのリストの共通項を見つけたい",
      "重複を除いて一覧をまとめたい",
      "集合の差分や和集合を求める",
    ],
    cidr: [
      "IPアドレスの範囲を計算したい",
      "サブネットのホスト数やマスクを知りたい",
      "IPv6のCIDRネットワークを調べたい",
    ],
    unicode: [
      "コピペした文章に見えない変な文字が混じる",
      "ゼロ幅文字や不可視文字を検出したい",
      "テキストの方向を変える制御文字を見つける",
    ],
    "json-diff": [
      "2つのJSONの変更点を比較したい",
      "JSONの構造と値の差分を知りたい",
      "JSONオブジェクトのキーの違いを調べる",
    ],
    "json-format": [
      "JSONをきれいに整形したい",
      "JSONの文字列を圧縮して小さくする",
      "JSONの構文が正しいか検証する",
    ],
    contrast: [
      "文字と背景色の見やすさを調べたい",
      "WCAGのコントラスト比を計算する",
      "アクセシビリティの配色を確認したい",
    ],
  },
  en: {
    har: [
      "find slow browser network requests and API latency",
      "analyze a HAR file for failed HTTP calls",
      "diagnose website network performance and response times",
    ],
    env: [
      "compare staging and production environment configuration",
      "find missing environment variables in dotenv files",
      "check duplicate keys and differences between settings files",
    ],
    url: [
      "edit URL query string parameters",
      "add or remove search parameters in a link",
      "inspect hostname and fragment in a URL",
    ],
    explain: [
      "find the bottleneck in a slow SQL query",
      "analyze PostgreSQL execution plans and table scans",
      "compare estimated and actual database rows",
    ],
    csv: [
      "find missing values and empty cells in CSV data",
      "profile tabular columns and their data types",
      "inspect a TSV spreadsheet for duplicate column names",
    ],
    logs: [
      "filter application logs for errors and warnings",
      "count repeated lines in a log file",
      "summarize log levels across many events",
    ],
    sets: [
      "find items shared by two lists",
      "merge unique lines without duplicates",
      "calculate intersection union and difference of sets",
    ],
    cidr: [
      "calculate IP address range and subnet mask",
      "find host count in an IPv4 network",
      "inspect an IPv6 CIDR prefix",
    ],
    unicode: [
      "find hidden characters in pasted text",
      "detect invisible zero width Unicode marks",
      "identify suspicious bidirectional control characters",
    ],
    "json-diff": [
      "compare differences between two JSON objects",
      "find changed JSON keys and values",
      "inspect structural changes in JSON documents",
    ],
    "json-format": [
      "pretty print and format JSON",
      "minify a JSON string",
      "validate JSON syntax without changing values",
    ],
    contrast: [
      "check readability of foreground text against background",
      "calculate WCAG color contrast accessibility",
      "test accessible color combinations",
    ],
  },
  "zh-CN": {
    har: [
      "查找浏览器网络请求缓慢的原因",
      "分析API响应时间和HTTP错误",
      "查看HAR文件中的慢请求",
    ],
    env: [
      "比较生产环境和开发环境的配置",
      "查找缺失的环境变量",
      "检查env配置文件的重复键和差异",
    ],
    url: [
      "修改网址的查询参数",
      "添加或删除URL参数",
      "检查链接的主机名与片段",
    ],
    explain: [
      "分析SQL查询慢的原因",
      "查看PostgreSQL执行计划",
      "检查数据库扫描和估计行数",
    ],
    csv: [
      "检查CSV数据中的空值和缺失数据",
      "分析表格列的数据类型",
      "查找TSV表头的重复列名",
    ],
    logs: [
      "筛选应用日志里的错误",
      "统计日志中重复的行",
      "汇总警告和日志级别",
    ],
    sets: [
      "找出两个列表的共同项目",
      "合并列表并删除重复值",
      "求集合的交集并集和差集",
    ],
    cidr: [
      "计算IP地址范围",
      "查看子网掩码和主机数量",
      "分析IPv6网络前缀",
    ],
    unicode: [
      "找出复制文本中的隐藏字符",
      "检测零宽字符和不可见空格",
      "检查Unicode文本方向控制符",
    ],
    "json-diff": [
      "比较两个JSON的结构变化",
      "查找JSON字段和数值的差异",
      "对比JSON文档",
    ],
    "json-format": [
      "美化和格式化JSON",
      "压缩JSON字符串",
      "验证JSON语法",
    ],
    contrast: [
      "检测文字与背景色的可读性",
      "计算WCAG颜色对比度",
      "检查无障碍配色",
    ],
  },
  "zh-TW": {
    har: [
      "找出瀏覽器網路請求緩慢的原因",
      "分析API回應時間與HTTP錯誤",
      "檢查HAR檔案中的慢速請求",
    ],
    env: [
      "比較正式環境與開發環境的設定",
      "找出遺漏的環境變數",
      "檢查env設定檔的重複鍵與差異",
    ],
    url: [
      "修改網址的查詢參數",
      "新增或移除URL參數",
      "檢查連結的主機名稱與片段",
    ],
    explain: [
      "分析SQL查詢緩慢的原因",
      "查看PostgreSQL執行計畫",
      "檢查資料庫掃描與預估資料列",
    ],
    csv: [
      "檢查CSV資料中的空值及遺漏值",
      "分析表格欄位的資料類型",
      "找出TSV標題重複的欄位",
    ],
    logs: [
      "篩選應用程式記錄中的錯誤",
      "統計日誌中的重複資料列",
      "彙整警告與記錄層級",
    ],
    sets: [
      "找出兩份清單的共同項目",
      "合併清單並移除重複項目",
      "計算集合的交集聯集與差集",
    ],
    cidr: [
      "計算IP位址範圍",
      "查看子網路遮罩和主機數量",
      "分析IPv6網路前綴",
    ],
    unicode: [
      "找出貼上文字中的隱藏字元",
      "偵測零寬字元與不可見空白",
      "檢查Unicode文字方向控制符號",
    ],
    "json-diff": [
      "比較兩份JSON的結構變化",
      "找出JSON欄位與數值的差異",
      "比對JSON文件",
    ],
    "json-format": [
      "美化與格式化JSON",
      "壓縮JSON字串",
      "驗證JSON語法",
    ],
    contrast: [
      "檢查文字與背景顏色的可讀性",
      "計算WCAG色彩對比度",
      "檢查無障礙配色",
    ],
  },
  ko: {
    har: [
      "브라우저 네트워크 요청이 느린 원인을 찾고 싶다",
      "API 응답 시간과 HTTP 오류를 분석한다",
      "HAR 파일에서 느린 요청을 확인한다",
    ],
    env: [
      "개발 환경과 운영 환경의 설정을 비교하고 싶다",
      "누락된 환경 변수를 찾는다",
      "env 설정 파일의 중복 키와 차이를 확인한다",
    ],
    url: [
      "URL 쿼리 매개변수를 수정한다",
      "링크의 검색 파라미터를 추가하거나 삭제한다",
      "URL의 호스트 이름과 해시를 확인한다",
    ],
    explain: [
      "느린 SQL 쿼리의 원인을 분석한다",
      "PostgreSQL 실행 계획을 확인한다",
      "데이터베이스 테이블 스캔과 예상 행 수를 비교한다",
    ],
    csv: [
      "CSV 데이터에서 누락된 값과 빈 칸을 찾는다",
      "표의 열 데이터 유형을 분석한다",
      "TSV 파일의 중복 열 이름을 검사한다",
    ],
    logs: [
      "애플리케이션 오류 로그를 필터링한다",
      "로그에서 반복되는 줄 수를 센다",
      "경고와 로그 수준을 집계한다",
    ],
    sets: [
      "두 목록의 공통 항목을 찾는다",
      "리스트를 병합하고 중복을 제거한다",
      "집합의 교집합 합집합 차집합을 계산한다",
    ],
    cidr: [
      "IP 주소 범위를 계산한다",
      "서브넷 마스크와 호스트 수를 확인한다",
      "IPv6 네트워크 접두사를 분석한다",
    ],
    unicode: [
      "붙여넣은 텍스트에 숨겨진 문자를 찾는다",
      "보이지 않는 제로폭 문자를 감지한다",
      "유니코드 방향 제어 문자를 검사한다",
    ],
    "json-diff": [
      "두 JSON 객체의 구조적 차이를 비교한다",
      "JSON 키와 값의 변경점을 찾는다",
      "JSON 문서의 차이를 확인한다",
    ],
    "json-format": [
      "JSON 문자열을 보기 좋게 정렬한다",
      "JSON 데이터를 압축한다",
      "JSON 문법 오류를 검사한다",
    ],
    contrast: [
      "글자와 배경색의 가독성을 확인한다",
      "WCAG 색상 대비를 계산한다",
      "접근성 색상 조합을 검사한다",
    ],
  },
} satisfies Record<string, SearchIntentMap>;
