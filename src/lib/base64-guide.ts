import type { Locale } from "./locales";
import type { ToolGuide } from "./tool-guides";

export const base64Guide = {
  ja: {
    introduction: "UTF-8 テキストを Base64 に変換、または Base64 を UTF-8 に戻すツールです。処理はブラウザー内で完結します。",
    steps: [
      "操作（エンコード／デコード）と文字種（標準／URL-safe）を選び、文字列を入力します。",
      "短い入力はすぐ結果に反映されます。長い入力は待機後に Worker で処理します。設定から手動適用にも切り替えられます。",
      "結果をコピー・保存、または「入れ替え」で逆変換できます。",
    ],
    exampleInput: "こんにちは 👋",
    exampleResult: "標準形式でエンコードすると 44GT44KT44Gr44Gh44GvIPCfkYs= となり、20 バイトの UTF-8 を 28 文字の Base64 に変換します。",
    limitations: [
      "入力上限は 256 KiB。標準出力は = でパディングし、URL-safe 出力は - と _ を使用してパディングを省略します。",
      "デコードは正規のパディングあり・なしを受け付けますが、空白、不正な文字、非正規の未使用ビット、不正な UTF-8 はエラーです。バイナリファイル変換は対象外です。",
      "孤立した UTF-16 サロゲートはデータを失うため拒否します。長い入力は専用 Worker で最大 5 秒処理し、中断できます。入力は保存・送信しません。",
    ],
  },
  en: {
    introduction: "Encode UTF-8 text to Base64 or decode Base64 back to UTF-8. Conversion happens entirely in your browser.",
    steps: [
      "Choose encode or decode and the standard or URL-safe alphabet, then enter text.",
      "Short input updates immediately. Longer text runs in a Worker after a short delay; manual apply is available.",
      "Copy or download the result, or swap it back for a reverse conversion.",
    ],
    exampleInput: "こんにちは 👋",
    exampleResult: "Standard encoding produces 44GT44KT44Gr44Gh44GvIPCfkYs=, converting 20 UTF-8 bytes to 28 Base64 characters.",
    limitations: [
      "Input is limited to 256 KiB. Standard output uses = padding; URL-safe output replaces + and / and omits padding.",
      "Decoding accepts canonical padded or unpadded text, not whitespace, invalid characters, nonzero unused bits, or invalid UTF-8. Arbitrary binary files are not supported.",
      "Unpaired UTF-16 surrogates are rejected rather than replaced. Large inputs use a cancellable Worker with a 5-second timeout. Input is neither stored nor transmitted.",
    ],
  },
  "zh-CN": {
    introduction: "在浏览器中将 UTF-8 文本编码为 Base64，或将 Base64 解码回 UTF-8，无需外部服务。",
    steps: [
      "选择编码或解码及标准或 URL-safe 字符集，然后输入文本。",
      "短文本立即处理，长文本延迟后交给 Worker；也可以选择手动应用。",
      "复制或下载结果，或者交换输入输出进行反向转换。",
    ],
    exampleInput: "こんにちは 👋",
    exampleResult: "标准编码得到 44GT44KT44Gr44Gh44GvIPCfkYs=，将 20 字节 UTF-8 变为 28 个 Base64 字符。",
    limitations: [
      "输入上限 256 KiB。标准形式带 = 填充；URL-safe 形式使用 -、_，省略填充。",
      "解码接受规范的带填充或无填充文本，拒绝空白、非法字符、非零闲置位和无效 UTF-8。不支持任意二进制文件。",
      "拒绝未配对的 UTF-16 代理项。长文本由可取消的 Worker 处理，限时 5 秒。不保存或传输输入。",
    ],
  },
  "zh-TW": {
    introduction: "在瀏覽器中將 UTF-8 文字編碼為 Base64，或將 Base64 解碼回 UTF-8，無須外部服務。",
    steps: [
      "選擇編碼或解碼，以及標準或 URL-safe 字元集，再輸入文字。",
      "短文字立即處理；長文字稍後交由 Worker 處理，也可以選擇手動套用。",
      "複製或下載結果，或交換輸入與輸出進行反向轉換。",
    ],
    exampleInput: "こんにちは 👋",
    exampleResult: "標準編碼為 44GT44KT44Gr44Gh44GvIPCfkYs=，將 20 位元組 UTF-8 轉為 28 個 Base64 字元。",
    limitations: [
      "輸入上限 256 KiB。標準形式使用 = 填補；URL-safe 使用 -、_ 並省略填補。",
      "解碼接受正規的填補或無填補內容，但拒絕空白、非法字元、非零閒置位和無效 UTF-8。不支援任意二進位檔案。",
      "拒絕未成對的 UTF-16 代理字元。長文字由可取消的 Worker 處理，限時 5 秒。輸入不會儲存或傳送。",
    ],
  },
  ko: {
    introduction: "브라우저 안에서 UTF-8 텍스트를 Base64로 인코딩하거나 Base64를 UTF-8로 디코딩합니다.",
    steps: [
      "인코딩 또는 디코딩과 표준 또는 URL-safe 문자 집합을 선택하고 텍스트를 입력합니다.",
      "짧은 입력은 즉시 변환하며 긴 입력은 대기 후 Worker로 처리합니다. 수동 적용도 선택할 수 있습니다.",
      "결과를 복사하거나 내려받고, 입력과 출력을 교환해 역변환할 수 있습니다.",
    ],
    exampleInput: "こんにちは 👋",
    exampleResult: "표준 인코딩 결과는 44GT44KT44Gr44Gh44GvIPCfkYs= 이며, UTF-8 20바이트를 Base64 28자로 변환합니다.",
    limitations: [
      "입력은 최대 256 KiB입니다. 표준 형식은 = 패딩을 사용하고 URL-safe 형식은 -와 _를 사용하며 패딩을 생략합니다.",
      "디코딩은 올바른 패딩 유무를 허용하지만 공백, 잘못된 문자, 비정규 미사용 비트, 유효하지 않은 UTF-8은 거부합니다. 임의의 이진 파일은 지원하지 않습니다.",
      "짝이 없는 UTF-16 서로게이트는 거부합니다. 긴 입력은 취소 가능한 Worker에서 최대 5초 처리합니다. 입력을 저장하거나 전송하지 않습니다.",
    ],
  },
} satisfies Record<Locale, ToolGuide>;
