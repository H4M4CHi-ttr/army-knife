import "../styles/fonts.css";

export const fontLocales = ["ja", "en", "zh-CN", "zh-TW", "ko"] as const;
export type FontLocale = (typeof fontLocales)[number];

const pendingStylesheets = new Map<FontLocale, Promise<HTMLLinkElement>>();
let requestSequence = 0;
let activeStylesheet: HTMLLinkElement | undefined;

/** A fixed same-origin asset URL; neither input text nor locale is sent to a CDN. */
export function fontStylesheetHref(locale: FontLocale): string {
  if (!fontLocales.includes(locale)) {
    throw new Error(`Unsupported font locale: ${String(locale)}`);
  }

  return `${import.meta.env.BASE_URL}fonts/${locale}.css`;
}

function loadStylesheet(locale: FontLocale): Promise<HTMLLinkElement> {
  const existing = pendingStylesheets.get(locale);
  if (existing) return existing;

  const pending = new Promise<HTMLLinkElement>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.media = "not all";
    link.dataset.fontLocale = locale;
    link.href = fontStylesheetHref(locale);

    if (new URL(link.href).origin !== window.location.origin) {
      reject(new Error("Fonts must be served from the application origin"));
      return;
    }

    link.addEventListener("load", () => resolve(link), { once: true });
    link.addEventListener(
      "error",
      () => {
        link.remove();
        pendingStylesheets.delete(locale);
        reject(new Error(`Could not load the local ${locale} font stylesheet`));
      },
      { once: true },
    );
    document.head.append(link);
  });

  pendingStylesheets.set(locale, pending);
  return pending;
}

/**
 * Choose regional Noto Sans / Sarasa Mono-derived faces, preserving system
 * fallbacks while the stylesheet loads. Only the latest requested locale is
 * activated; rapidly switching languages cannot restore an older stylesheet.
 * Resolves after CSS loads, not after every possible Unicode shard downloads.
 */
export async function setFontLocale(locale: FontLocale): Promise<void> {
  fontStylesheetHref(locale);
  document.documentElement.lang = locale;
  const sequence = ++requestSequence;
  const stylesheet = await loadStylesheet(locale);

  if (sequence !== requestSequence) return;
  if (activeStylesheet && activeStylesheet !== stylesheet) {
    activeStylesheet.media = "not all";
  }
  stylesheet.media = "all";
  activeStylesheet = stylesheet;
}
