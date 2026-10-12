import { coreMessages } from "./core-messages.ts";
import { es } from "./locales/es.ts";
import { fr } from "./locales/fr.ts";
import { de } from "./locales/de.ts";
import { ptBR } from "./locales/pt-BR.ts";
import { id } from "./locales/id.ts";
import { vi } from "./locales/vi.ts";
import type { Locale } from "../lib/locales.ts";
import type { LocaleMessages } from "./message-schema.ts";

export const messages = {
  ...coreMessages,
  es,
  fr,
  de,
  "pt-BR": ptBR,
  id,
  vi,
} satisfies Record<Locale, LocaleMessages>;
