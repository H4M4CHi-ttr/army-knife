import { createApp, vaporInteropPlugin } from "vue";
import App from "./App.vue";
import { i18n } from "./i18n";
import { parsePreferences, settings, STORAGE_KEY } from "./lib/preferences";
import type { Locale } from "./lib/locales";
import { indexDocumentRedirect, legacyToolRedirect, rootLocaleRedirect } from "./lib/routes";
import "./style.css";
import "./styles/fonts.css";

const legacyDestination = legacyToolRedirect(
  window.location.hash,
  settings.preferences.locale,
  import.meta.env.BASE_URL,
);
let rootLocale: Locale = "ja";
try {
  // A first visit keeps the root's Japanese language. A saved language choice
  // receives its own complete document instead of being overwritten at root.
  rootLocale = parsePreferences(window.localStorage.getItem(STORAGE_KEY), "ja").locale;
} catch {
  // The root remains usable when storage is unavailable.
}
const destination =
  legacyDestination ??
  rootLocaleRedirect(window.location.pathname, rootLocale, import.meta.env.BASE_URL);
if (destination) {
  // Load the real document so its description, canonical and language links
  // agree with the selected tool, including when JavaScript is later disabled.
  window.location.replace(destination);
} else {
  const directoryPath = indexDocumentRedirect(window.location.pathname, import.meta.env.BASE_URL);
  if (directoryPath) {
    // This is the same generated document, so normalize the filename alias
    // without a request or changing its metadata and ordinary page anchors.
    window.history.replaceState(
      null,
      "",
      `${directoryPath}${window.location.search}${window.location.hash}`,
    );
  }
  let application: ReturnType<typeof createApp> | undefined;
  function mountApplication() {
    application = createApp(App).use(vaporInteropPlugin).use(i18n);
    application.mount("#app");
  }
  mountApplication();
  window.addEventListener("pagehide", () => {
    // Leaving a tool clears its in-memory inputs and disposes pending workers
    // even when the browser retains this document in its back-forward cache.
    application?.unmount();
    application = undefined;
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && !application) mountApplication();
  });
}
