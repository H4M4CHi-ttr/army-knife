import type { Locale } from "./locales";
import type { ToolGuide } from "./tool-guides";
import { inspectorMessages } from "../i18n/inspectors.ts";

type InspectorId = "sri" | "encoding" | "magic" | "user-agent" | "set-cookie";
const examples: Record<InspectorId, string> = {
  sri: "Hex: 63 6F 6E 73 6F 6C 65 2E 6C 6F 67 28 31 29 3B 0A",
  encoding: "sample.txt: EF BB BF 41 0D 0A 42 0A 43 0D",
  magic: "sample.png: 89 50 4E 47 0D 0A 1A 0A",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0 Safari/537.36 Edg/129.0",
  "set-cookie": "Set-Cookie: __Host-session=sample; Secure; HttpOnly; Path=/; SameSite=Lax",
};
const content: Record<Locale, Record<InspectorId, { steps: string[]; result: string }>> = {
  en: {
    sri: { steps: ["Select a local file (including empty files), or enter raw hexadecimal bytes.", "Choose SHA-256/384/512, inspect the digest, and replace the example HTML resource path."], result: "The exact bytes yield an integrity=sha256-… string. A line ending change also changes the digest." },
    encoding: { steps: ["Load a local text file as bytes; see the strict encoding and BOM interpretation.", "Inspect the CRLF/LF/CR counts. Only valid Unicode can be converted to BOM-free UTF-8."], result: "The sample is UTF-8 with BOM and contains one CRLF, one LF and one CR." },
    magic: { steps: ["Select a local binary file.", "Inspect prefix and tail bytes, known signatures and extension mismatches."], result: "The eight signature bytes indicate a PNG candidate. This alone does not prove the file is valid or safe." },
    "user-agent": { steps: ["Paste a single User-Agent string or load a synthetic example.", "Inspect detected tokens and remember these are untrusted, potentially frozen or spoofed hints."], result: "The sample looks like Edge on Windows using Blink, but the actual OS and browser are not authenticated." },
    "set-cookie": { steps: ["Paste one Set-Cookie header per line. Do not join headers using commas.", "Inspect per-cookie flags, SameSite, prefixes, warnings and omitted values."], result: "__Host-session has Secure, HttpOnly, Path=/ and SameSite=Lax; its value is never shown in the report." },
  },
  ja: {
    sri: { steps: ["空ファイルを含むローカルファイルか、生の16進バイト列を指定します。", "SHA-256/384/512を選び、digestを確認。HTML例のパスを実際の配信先に置き換えます。"], result: "厳密なバイト列からintegrity=sha256-…を生成します。改行の違いも別ハッシュになります。" },
    encoding: { steps: ["テキストファイルをバイト列として読み込み、文字コードとBOMを確認します。", "CRLF/LF/CRの件数を見て、Unicodeが正常な場合のみBOMなしUTF-8に変換できます。"], result: "この例はBOM付きUTF-8で、CRLF・LF・CRが各1回あります。" },
    magic: { steps: ["ローカルのバイナリファイルを選びます。", "先頭・末尾のバイトと既知署名・拡張子の不一致を確認します。"], result: "先頭8バイトからPNG候補と判定します。ファイルの完全性や安全性の証明にはなりません。" },
    "user-agent": { steps: ["User-Agent文字列を貼り付けるかサンプルを読み込みます。", "検出トークンを確認。UAは凍結・偽装でき、確実な端末判定ではありません。"], result: "Windows上のBlink版Edgeらしいという推定です。OS・ブラウザの真正性は確認していません。" },
    "set-cookie": { steps: ["Set-Cookieヘッダーを1行ずつ貼り付けます。カンマでヘッダーを連結しないでください。", "Cookieごとの属性・SameSite・接頭辞・警告を調べます。値は表示しません。"], result: "__Host-sessionにSecure、HttpOnly、Path=/、SameSite=Laxがあります。値は結果に含まれません。" },
  },
  "zh-CN": {
    sri: { steps: ["选择本地文件（可为空）或输入原始十六进制字节。", "选择SHA-256/384/512，检查摘要，将HTML示例路径替换为实际路径。"], result: "根据精确字节生成integrity=sha256-…；换行差异也会改变摘要。" },
    encoding: { steps: ["以字节读取本地文本文件，检查编码和BOM。", "查看CRLF/LF/CR计数，仅在有效Unicode时转换为无BOM的UTF-8。"], result: "示例为带BOM的UTF-8，CRLF、LF和CR各一次。" },
    magic: { steps: ["选择本地二进制文件。", "检查头尾字节、已知特征和扩展名的不一致。"], result: "前8字节提示PNG格式，但不能证明完整性或安全性。" },
    "user-agent": { steps: ["粘贴User-Agent或载入示例。", "检查匹配标记；UA可能冻结或伪造，不是身份验证。"], result: "大致为Windows上的Blink版Edge，无法认证真实系统。" },
    "set-cookie": { steps: ["每行粘贴一个Set-Cookie，请勿用逗号合并。", "检查标志、SameSite、前缀和警告；不显示Cookie值。"], result: "__Host-session包含Secure、HttpOnly、Path=/、SameSite=Lax，值不会输出。" },
  },
  "zh-TW": {
    sri: { steps: ["選取本機檔案（可為空）或輸入原始十六進位位元組。", "選擇SHA-256/384/512，檢查摘要並替換HTML範例路徑。"], result: "以精確位元組產生integrity=sha256-…；換行不同也會影響摘要。" },
    encoding: { steps: ["以位元組讀取本機文字檔，檢查編碼與BOM。", "查看CRLF/LF/CR數量，有效Unicode才可轉為無BOM的UTF-8。"], result: "範例為帶BOM的UTF-8，CRLF、LF與CR各一次。" },
    magic: { steps: ["選擇本機二進位檔案。", "查看檔頭檔尾、已知特徵及副檔名不符。"], result: "前8位元組提示PNG格式，但不能證明完整性或安全性。" },
    "user-agent": { steps: ["貼上User-Agent或載入範例。", "查看比對標記；UA可能遭凍結或偽造，無法驗證身分。"], result: "大致為Windows上的Blink版Edge，無法認證真實系統。" },
    "set-cookie": { steps: ["每行貼上一個Set-Cookie，請勿以逗號合併。", "查看旗標、SameSite、前綴與警告；不顯示Cookie值。"], result: "__Host-session包含Secure、HttpOnly、Path=/、SameSite=Lax，不會輸出值。" },
  },
  ko: {
    sri: { steps: ["빈 파일을 포함한 로컬 파일 또는 원본 16진수 바이트를 입력합니다.", "SHA-256/384/512를 선택하고 다이제스트를 확인한 뒤 예시 HTML 경로를 교체합니다."], result: "정확한 바이트로 integrity=sha256-…를 만듭니다. 줄바꿈도 해시를 바꿉니다." },
    encoding: { steps: ["로컬 텍스트 파일을 바이트로 읽어 인코딩과 BOM을 확인합니다.", "CRLF/LF/CR 개수를 보고 유효한 Unicode만 BOM 없는 UTF-8로 변환합니다."], result: "예시는 BOM이 있는 UTF-8이고 CRLF, LF, CR이 각각 한 번 있습니다." },
    magic: { steps: ["로컬 바이너리 파일을 선택합니다.", "파일 앞뒤 바이트, 알려진 시그니처 및 확장자 불일치를 확인합니다."], result: "처음 8바이트는 PNG 후보를 나타내지만 파일 무결성·안전성을 보증하지 않습니다." },
    "user-agent": { steps: ["User-Agent 문자열을 입력하거나 예시를 불러옵니다.", "일치한 토큰을 확인합니다. UA는 고정되거나 위조될 수 있습니다."], result: "Windows의 Blink 기반 Edge로 추정되며 실제 기기 정보는 인증되지 않습니다." },
    "set-cookie": { steps: ["한 줄마다 하나의 Set-Cookie를 붙여 넣습니다. 쉼표로 합치지 마세요.", "플래그, SameSite, 접두사, 경고를 검사합니다. 값은 표시하지 않습니다."], result: "__Host-session에 Secure, HttpOnly, Path=/, SameSite=Lax가 있지만 값은 출력하지 않습니다." },
  },
};

function forLocale(id: InspectorId, locale: Locale): ToolGuide {
  const name = ("tool." + id + ".description") as keyof typeof inspectorMessages.en;
  const hint = ("tool." + id + ".hint") as keyof typeof inspectorMessages.en;
  return {
    introduction: inspectorMessages[locale][name],
    steps: content[locale][id].steps,
    exampleInput: examples[id],
    exampleResult: content[locale][id].result,
    limitations: [inspectorMessages[locale][hint]],
  };
}
function createGuide(id: InspectorId): Record<Locale, ToolGuide> {
  return {
    en: forLocale(id, "en"),
    ja: forLocale(id, "ja"),
    "zh-CN": forLocale(id, "zh-CN"),
    "zh-TW": forLocale(id, "zh-TW"),
    ko: forLocale(id, "ko"),
  };
}

export const inspectorGuides = {
  sri: createGuide("sri"),
  encoding: createGuide("encoding"),
  magic: createGuide("magic"),
  "user-agent": createGuide("user-agent"),
  "set-cookie": createGuide("set-cookie"),
} satisfies Record<InspectorId, Record<Locale, ToolGuide>>;
