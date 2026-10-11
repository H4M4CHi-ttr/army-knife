import { createApp, nextTick, vaporInteropPlugin, version } from "vue";
import { i18n } from "@/i18n";
import type { Locale } from "@/lib/preferences";
import InteropHarness from "./InteropHarness.vue";

let resolveReady!: () => void;
const ready = new Promise<void>((resolve) => {
  resolveReady = resolve;
});
const errors: string[] = [];
i18n.global.locale.value = "en";

const app = createApp(InteropHarness, { onReady: () => resolveReady() })
  .use(vaporInteropPlugin)
  .use(i18n);
app.config.errorHandler = (error) => errors.push(String(error));
app.mount("#fixture");

const probe = {
  version,
  ready,
  errors,
  tick: () => nextTick(),
  setLocale: (locale: Locale) => {
    i18n.global.locale.value = locale;
  },
  unmount: () => app.unmount(),
};

declare global {
  interface Window {
    __armyKnifeVaporProbe: typeof probe;
  }
}

window.__armyKnifeVaporProbe = probe;
