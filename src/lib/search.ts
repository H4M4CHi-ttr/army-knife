import { ADDED_LOCALES, type Locale } from "./locales.ts";

function fold(value: string, locale: Locale): string {
  const lowered = value.normalize("NFC").toLocaleLowerCase(locale);
  if (!(ADDED_LOCALES as readonly string[]).includes(locale)) return lowered;
  // Let Latin-script users omit accents when searching translated names.
  // Vietnamese đ and German ß do not decompose into their common search spellings.
  return lowered.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/ß/g, "ss");
}

/** Keep the existing all-words substring search and tool-enable filtering semantics. */
export function matchesSearch(query: string, text: string, locale: Locale): boolean {
  const haystack = fold(text, locale);
  return fold(query, locale).trim().split(/\s+/).every((word) => haystack.includes(word));
}
