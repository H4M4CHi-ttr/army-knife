import type { Locale } from "../lib/preferences";

export const searchMessages = {
  en: { "app.search": "Describe a task or find a tool…", "app.searchLabel": "Find tools by name or intent" },
  ja: { "app.search": "やりたいこと・ツール名で検索…", "app.searchLabel": "やりたいことやツール名を検索" },
  "zh-CN": { "app.search": "描述想完成的任务或搜索工具…", "app.searchLabel": "按任务或工具名称搜索" },
  "zh-TW": { "app.search": "描述想完成的工作或搜尋工具…", "app.searchLabel": "依需求或工具名稱搜尋" },
  ko: { "app.search": "하고 싶은 작업이나 도구 이름으로 검색…", "app.searchLabel": "작업 목적 또는 도구 이름으로 검색" },
} satisfies Record<Locale, Record<"app.search" | "app.searchLabel", string>>;
