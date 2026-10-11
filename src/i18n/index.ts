import { createI18n } from "vue-i18n";
import { settings } from "@/lib/preferences";
import { messages } from "./messages";
export { messages } from "./messages";

export const i18n = createI18n({
  legacy: false,
  locale: settings.preferences.locale,
  fallbackLocale: "en",
  flatJson: true,
  messages,
});
