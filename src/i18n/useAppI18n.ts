import { i18n } from "./index";

/**
 * Share this application's global Composer with both VDOM and Vapor views.
 * vue-i18n 11's useI18n() requires a VDOM component instance; Vapor deliberately
 * has none. The Composer's t() tracks its reactive locale when a view renders.
 * Component-local messages/scopes and injected global properties are not used.
 */
export function useAppI18n() {
  return { t: i18n.global.t, locale: i18n.global.locale };
}
