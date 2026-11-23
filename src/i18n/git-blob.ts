export const gitBlobMessages = {
  "en": {
    "tool.git-blob.name": "Git blob ID calculator",
    "tool.git-blob.description": "Calculate both Git object IDs from a local file’s exact bytes.",
    "tool.git-blob.hint": "Choose a file up to 8 MiB. SHA-1 and SHA-256 IDs are calculated locally.",
    "gitBlob.format": "Use the ID that matches your repository’s object format.",
    "gitBlob.scope": "Uses raw file bytes, without Git filters or line-ending conversion. SHA-1 is provided for Git compatibility.",
  },
  "ja": {
    "tool.git-blob.name": "Git blob ID計算",
    "tool.git-blob.description": "ローカルファイルの生バイト列から2種類のGitオブジェクトIDを計算します。",
    "tool.git-blob.hint": "8 MiB以下のファイルを選ぶと、SHA-1とSHA-256のIDを端末内で計算します。",
    "gitBlob.format": "リポジトリのオブジェクト形式に対応するIDを使います。",
    "gitBlob.scope": "Gitフィルターや改行変換は適用しません。SHA-1はGitとの互換性のために表示します。",
  },
  "zh-CN": {
    "tool.git-blob.name": "Git blob ID 计算器",
    "tool.git-blob.description": "根据本地文件的原始字节计算两种 Git 对象 ID。",
    "tool.git-blob.hint": "选择不超过 8 MiB 的文件，在本地计算 SHA-1 和 SHA-256 ID。",
    "gitBlob.format": "使用与仓库对象格式一致的 ID。",
    "gitBlob.scope": "直接使用原始字节，不应用 Git 过滤器或转换换行符。SHA-1 用于 Git 兼容。",
  },
  "zh-TW": {
    "tool.git-blob.name": "Git blob ID 計算器",
    "tool.git-blob.description": "根據本機檔案的原始位元組計算兩種 Git 物件 ID。",
    "tool.git-blob.hint": "選取不超過 8 MiB 的檔案，在本機計算 SHA-1 和 SHA-256 ID。",
    "gitBlob.format": "使用符合儲存庫物件格式的 ID。",
    "gitBlob.scope": "直接使用原始位元組，不套用 Git 過濾器或轉換換行符號。SHA-1 用於 Git 相容性。",
  },
  "ko": {
    "tool.git-blob.name": "Git blob ID 계산기",
    "tool.git-blob.description": "로컬 파일의 원본 바이트로 두 가지 Git 객체 ID를 계산합니다.",
    "tool.git-blob.hint": "8 MiB 이하의 파일을 선택하면 SHA-1과 SHA-256 ID를 기기에서 계산합니다.",
    "gitBlob.format": "저장소의 객체 형식과 일치하는 ID를 사용하세요.",
    "gitBlob.scope": "Git 필터나 줄바꿈 변환 없이 원본 바이트를 사용합니다. SHA-1은 Git 호환성을 위해 표시합니다.",
  },
} as const;
