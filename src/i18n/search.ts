import type { Locale } from "../lib/preferences";

type Key =
  | "app.search" | "app.searchLabel"
  | "settings.searchMode" | "search.mode.lexical"
  | "search.mode.classifier" | "search.mode.hybrid"
  | "search.mode.note" | "search.status.loading"
  | "search.status.ready" | "search.status.error";

export const searchMessages = {
  en: {
    "app.search": "Describe a task or find a tool…",
    "app.searchLabel": "Find tools by name or intent",
    "settings.searchMode": "Search engine",
    "search.mode.lexical": "Lightweight (default)",
    "search.mode.classifier": "Trained classifier (experimental)",
    "search.mode.hybrid": "Combined ranking (experimental)",
    "search.mode.note": "Enabling a trained mode downloads ~0.41 MB once, on demand. Searches stay on this device. Unknown tasks can produce guesses.",
    "search.status.loading": "Loading local model… lightweight search is still available.",
    "search.status.ready": "Experimental local classifier active",
    "search.status.error": "Model unavailable. Using lightweight search instead. Select the default mode and retry.",
  },
  ja: {
    "app.search": "やりたいこと・ツール名で検索…",
    "app.searchLabel": "やりたいことやツール名を検索",
    "settings.searchMode": "検索エンジン",
    "search.mode.lexical": "軽量検索（標準）",
    "search.mode.classifier": "専用分類器（実験）",
    "search.mode.hybrid": "順位の併用（実験）",
    "search.mode.note": "分類器を選ぶと約0.41MBを必要時に読み込みます。検索文は外部送信しません。未知の用途には誤推測の可能性があります。",
    "search.status.loading": "分類器を読み込み中…軽量検索は利用できます。",
    "search.status.ready": "実験用のローカル分類器を使用中",
    "search.status.error": "モデルを読み込めません。軽量検索を使用しています。標準モードに戻してから再試行できます。",
  },
  "zh-CN": {
    "app.search": "描述想完成的任务或搜索工具…",
    "app.searchLabel": "按任务或工具名称搜索",
    "settings.searchMode": "搜索引擎",
    "search.mode.lexical": "轻量搜索（默认）",
    "search.mode.classifier": "训练好的分类器（实验）",
    "search.mode.hybrid": "混合排序（实验）",
    "search.mode.note": "启用分类器时按需下载约 0.41MB。搜索内容不会离开设备。对于未知任务可能误判。",
    "search.status.loading": "正在加载本地模型…仍可使用轻量搜索。",
    "search.status.ready": "正在使用实验性本地分类器",
    "search.status.error": "模型不可用，已退回轻量搜索。切回默认模式后可重试。",
  },
  "zh-TW": {
    "app.search": "描述想完成的工作或搜尋工具…",
    "app.searchLabel": "依需求或工具名稱搜尋",
    "settings.searchMode": "搜尋引擎",
    "search.mode.lexical": "輕量搜尋（預設）",
    "search.mode.classifier": "訓練完成的分類器（實驗）",
    "search.mode.hybrid": "混合排序（實驗）",
    "search.mode.note": "啟用分類器才會按需下載約 0.41MB。搜尋內容不會離開裝置。未知工作可能被誤判。",
    "search.status.loading": "正在載入本機模型…仍可使用輕量搜尋。",
    "search.status.ready": "正在使用實驗性本機分類器",
    "search.status.error": "無法載入模型，已改用輕量搜尋。切回預設模式後可重試。",
  },
  ko: {
    "app.search": "하고 싶은 작업이나 도구 이름으로 검색…",
    "app.searchLabel": "작업 목적 또는 도구 이름으로 검색",
    "settings.searchMode": "검색 엔진",
    "search.mode.lexical": "가벼운 검색 (기본값)",
    "search.mode.classifier": "학습된 분류기 (실험)",
    "search.mode.hybrid": "혼합 순위 (실험)",
    "search.mode.note": "분류기를 선택한 경우에만 약 0.41MB를 내려받습니다. 검색어는 기기를 떠나지 않습니다. 모르는 작업은 잘못 추천할 수 있습니다.",
    "search.status.loading": "로컬 모델을 불러오는 중… 기존 검색도 사용할 수 있습니다.",
    "search.status.ready": "실험용 로컬 분류기 사용 중",
    "search.status.error": "모델을 사용할 수 없어 기본 검색을 사용합니다. 기본 모드로 돌아간 뒤 다시 시도할 수 있습니다.",
  },
} satisfies Record<Locale, Record<Key, string>>;
