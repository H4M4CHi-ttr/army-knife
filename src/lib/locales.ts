/** Original translations are grouped by feature; additions live in per-language files. */
export const CORE_LOCALES = ["ja", "en", "zh-CN", "zh-TW", "ko"] as const;
export type CoreLocale = (typeof CORE_LOCALES)[number];

export const ADDED_LOCALES = ["es", "fr", "de", "pt-BR", "id", "vi"] as const;

/** Public language tags also form stable, case-sensitive URL segments. */
export const LOCALES = [...CORE_LOCALES, ...ADDED_LOCALES] as const;
export type Locale = (typeof LOCALES)[number];

/** Native names are shared by Settings, the app header, and static language links. */
export const languageNames = {
  ja: "日本語",
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português (Brasil)",
  id: "Bahasa Indonesia",
  vi: "Tiếng Việt",
} satisfies Record<Locale, string>;

/** Latin locales share the existing complete Noto Sans / Sarasa J assets. */
export const localeFontPacks = {
  ja: "ja",
  en: "en",
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  ko: "ko",
  es: "en",
  fr: "en",
  de: "en",
  "pt-BR": "en",
  id: "en",
  vi: "en",
} satisfies Record<Locale, CoreLocale>;
