import type { ToolGuide } from "./tool-guides";
import type { Locale } from "./preferences";
import { pkceMessages } from "../i18n/pkce.ts";

const exampleInput = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const exampleResult = "code_challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM; code_challenge_method: S256";
export const pkceGuide = {
  en: {
    introduction: pkceMessages.en["tool.pkce.description"],
    steps: [
      "Choose Generate, set a verifier length and optionally a state length, then generate a new pair. Copy each field separately when needed.",
      "To check an existing verifier, select that operation and paste it, or load the public RFC test example. The S256 challenge updates immediately.",
    ],
    exampleInput, exampleResult,
    limitations: [
      "S256 only. Verifier: 43–128 ASCII unreserved characters; generated strings use the base64url alphabet. State: omitted or 16–128 characters (this tool's policy). One pair per action; hashing at most 128 bytes, five-second timeout.",
      "Generation uses Web Crypto in a secure context. Cancel discards the result; the underlying native digest cannot be interrupted. Edits, clear, navigation and reload discard values. No OAuth requests or automatic exports; no input in URLs, storage or requests.",
      pkceMessages.en["pkce.security"], pkceMessages.en["pkce.sampleNote"],
    ],
  },
  ja: {
    introduction: pkceMessages.ja["tool.pkce.description"],
    steps: [
      "生成を選び、verifierと任意のstateの文字数を指定して新しいペアを生成します。必要な項目だけを個別にコピーできます。",
      "既存verifierの確認では値を貼り付けるか、公開されたRFCのテスト例を読み込みます。S256のchallengeは即時に更新されます。",
    ],
    exampleInput, exampleResult,
    limitations: [
      "S256のみ。verifierはASCII非予約文字43〜128文字、生成時はbase64url文字を使います。stateは省略または16〜128文字（このツールの方針）。1回1ペア、ハッシュ対象最大128バイト、5秒でタイムアウトします。",
      "安全なコンテキストのWeb Cryptoを使用します。中止すると結果を破棄しますが、ブラウザー内部のdigest自体は中断できません。編集・クリア・画面移動・再読み込みで値を破棄。認可リクエストや自動出力は行わず、入力をURL・ストレージ・通信に含めません。",
      pkceMessages.ja["pkce.security"], pkceMessages.ja["pkce.sampleNote"],
    ],
  },
  "zh-CN": {
    introduction: pkceMessages["zh-CN"]["tool.pkce.description"],
    steps: [
      "选择生成，设置 verifier 长度及可选 state 长度，再生成新配对。按需分别复制各字段。",
      "要检查现有 verifier，请切换操作并粘贴值，或载入公开的 RFC 测试示例。S256 challenge 会即时更新。",
    ],
    exampleInput, exampleResult,
    limitations: [
      "仅 S256。verifier 为 43–128 个 ASCII 非保留字符，生成时使用 base64url 字符集。state 可省略或为 16–128 字符（本工具的策略）。每次一个配对，最多哈希 128 字节，五秒超时。",
      "在安全上下文中使用 Web Crypto。取消会丢弃结果，但无法中断浏览器内部的 digest。编辑、清除、离开页面或刷新会丢弃数据。不发送 OAuth 请求、不自动导出，也不将输入写入 URL、存储或请求。",
      pkceMessages["zh-CN"]["pkce.security"], pkceMessages["zh-CN"]["pkce.sampleNote"],
    ],
  },
  "zh-TW": {
    introduction: pkceMessages["zh-TW"]["tool.pkce.description"],
    steps: [
      "選擇產生，設定 verifier 長度及選用的 state 長度，再產生新配對。依需要分別複製各欄位。",
      "要檢查現有 verifier，請切換操作並貼上值，或載入公開的 RFC 測試範例。S256 challenge 會即時更新。",
    ],
    exampleInput, exampleResult,
    limitations: [
      "僅 S256。verifier 為 43–128 個 ASCII 非保留字元，產生時使用 base64url 字元集。state 可省略或為 16–128 字元（本工具的策略）。每次一個配對，最多雜湊 128 位元組，五秒逾時。",
      "在安全環境中使用 Web Crypto。取消會捨棄結果，但無法中斷瀏覽器內部的 digest。編輯、清除、離開頁面或重新載入會捨棄資料。不傳送 OAuth 請求、不自動匯出，也不將輸入寫入 URL、儲存空間或請求。",
      pkceMessages["zh-TW"]["pkce.security"], pkceMessages["zh-TW"]["pkce.sampleNote"],
    ],
  },
  ko: {
    introduction: pkceMessages.ko["tool.pkce.description"],
    steps: [
      "생성을 선택하고 verifier 길이와 선택적인 state 길이를 설정한 뒤 새 쌍을 생성하세요. 필요한 필드를 각각 복사할 수 있습니다.",
      "기존 verifier 확인을 선택하고 값을 붙여넣거나 공개 RFC 테스트 예제를 불러오세요. S256 challenge가 즉시 갱신됩니다.",
    ],
    exampleInput, exampleResult,
    limitations: [
      "S256만 지원합니다. verifier는 ASCII 비예약 문자 43–128자이며 생성 시 base64url 문자 집합을 사용합니다. state는 생략하거나 16–128자입니다(이 도구의 정책). 한 번에 한 쌍, 해시 입력 최대 128바이트, 시간제한 5초입니다.",
      "보안 컨텍스트의 Web Crypto를 사용합니다. 취소하면 결과를 버리지만 브라우저의 digest 자체는 중단할 수 없습니다. 편집, 지우기, 페이지 이동 및 새로고침 시 값을 버립니다. OAuth 요청이나 자동 내보내기는 없으며 입력을 URL·저장소·요청에 포함하지 않습니다.",
      pkceMessages.ko["pkce.security"], pkceMessages.ko["pkce.sampleNote"],
    ],
  },
} satisfies Record<Locale, ToolGuide>;
