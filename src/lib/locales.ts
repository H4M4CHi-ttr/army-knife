/** Public language tags also form stable, case-sensitive URL segments. */
export const LOCALES = ["ja", "en", "zh-CN", "zh-TW", "ko"] as const;
export type Locale = (typeof LOCALES)[number];
