import { reactive, watch } from "vue";
import { isToolId, tools, type ToolId } from "./catalog";

export const LOCALES = ["ja", "en", "zh-CN", "zh-TW", "ko"] as const;
export type Locale = (typeof LOCALES)[number];
export type Theme = "system" | "light" | "dark";
export const STORAGE_KEY = "army-knife:preferences:v1";
export interface Preferences {
  version: 1;
  locale: Locale;
  theme: Theme;
  enabledTools: ToolId[];
  favorites: ToolId[];
}

export function detectLocale(languages: readonly string[] = []): Locale {
  for (const language of languages) {
    const tag = language.toLowerCase();
    if (tag.startsWith("ja")) return "ja";
    if (tag.startsWith("ko")) return "ko";
    if (/^zh-(tw|hk|mo|hant)/.test(tag)) return "zh-TW";
    if (tag.startsWith("zh")) return "zh-CN";
    if (tag.startsWith("en")) return "en";
  }
  return "en";
}

export function defaultPreferences(locale: Locale = "en"): Preferences {
  return {
    version: 1,
    locale,
    theme: "system",
    enabledTools: tools.filter((tool) => !tool.devtoys).map((tool) => tool.id),
    favorites: [],
  };
}

export function parsePreferences(raw: string | null, locale: Locale): Preferences {
  const defaults = defaultPreferences(locale);
  if (!raw) return defaults;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
    const record = value as Record<string, unknown>;
    if (record.version !== 1) return defaults;
    const ids = (input: unknown, fallback: ToolId[]): ToolId[] =>
      Array.isArray(input) ? [...new Set(input.filter(isToolId))] : fallback;
    return {
      version: 1,
      locale: LOCALES.includes(record.locale as Locale)
        ? (record.locale as Locale)
        : defaults.locale,
      theme: ["system", "light", "dark"].includes(record.theme as string)
        ? (record.theme as Theme)
        : "system",
      enabledTools: ids(record.enabledTools, defaults.enabledTools),
      favorites: ids(record.favorites, []),
    };
  } catch {
    return defaults;
  }
}

export function createPreferences(
  storage?: Pick<Storage, "getItem" | "setItem">,
  languages: readonly string[] = [],
) {
  const locale = detectLocale(languages);
  let raw: string | null = null;
  const status = reactive({ available: Boolean(storage) });
  try {
    raw = storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    status.available = false;
  }
  const preferences = reactive(parsePreferences(raw, locale));
  const stop = watch(
    preferences,
    () => {
      // Construct an allowlist rather than serializing arbitrary reactive state.
      const safe: Preferences = {
        version: 1,
        locale: preferences.locale,
        theme: preferences.theme,
        enabledTools: preferences.enabledTools.filter(isToolId),
        favorites: preferences.favorites.filter(isToolId),
      };
      try {
        if (storage) {
          storage.setItem(STORAGE_KEY, JSON.stringify(safe));
          status.available = true;
        }
      } catch {
        status.available = false;
      }
    },
    { deep: true, flush: "sync" },
  );
  return {
    preferences,
    status,
    stop,
    reset: () => Object.assign(preferences, defaultPreferences(locale)),
  };
}

let storage: Storage | undefined;
try {
  storage = globalThis.localStorage;
} catch {
  /* Storage can be disabled by browser policy. */
}
export const settings = createPreferences(storage, globalThis.navigator?.languages ?? []);
