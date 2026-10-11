import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import App from "../../App.vue";
import { i18n } from "../../i18n";
import { defaultPreferences, settings, STORAGE_KEY } from "../../lib/preferences";

vi.mock("../../lib/fonts", () => ({
  setFontLocale: vi.fn(async (locale: string) => {
    document.documentElement.lang = locale;
  }),
}));

let app: VueWrapper | undefined;

beforeEach(() => {
  document.body.replaceChildren();
  document.documentElement.classList.remove("dark");
  settings.reset();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(async () => {
  app?.unmount();
  app = undefined;
  await flushPromises();
  document.body.replaceChildren();
});

async function mountTool(): Promise<VueWrapper> {
  window.history.replaceState(null, "", "/army-knife/#/tool/shortcuts");
  const host = document.createElement("div");
  document.body.append(host);
  app = mount(App, { attachTo: host, global: { plugins: [vaporInteropPlugin, i18n] } });
  await vi.waitFor(() => expect(app!.find("#shortcut-capture").exists()).toBe(true));
  await flushPromises();
  return app;
}

async function press(
  target: Element,
  key: string,
  init: KeyboardEventInit = {},
): Promise<KeyboardEvent> {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  await nextTick();
  await flushPromises();
  return event;
}

function capture(wrapper: VueWrapper): HTMLInputElement {
  return wrapper.get("#shortcut-capture").element as HTMLInputElement;
}

const results = (wrapper: VueWrapper) => wrapper.findAll('[data-testid="shortcut-result"]');

describe("shortcut investigation through the real app", () => {
  it("captures Ctrl+K only while focused without the app search stealing focus", async () => {
    const wrapper = await mountTool();
    const input = capture(wrapper);
    input.focus();
    const event = await press(input, "k", { code: "KeyK", ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("Ctrl+K");
    expect(wrapper.get(".global-search").element).not.toBe(document.activeElement);

    await press(input, "k", { code: "KeyK", ctrlKey: true, repeat: true });
    await press(input, "x", { code: "KeyX", ctrlKey: true, isComposing: true });
    await press(input, "Dead", { code: "Quote" });
    await press(input, "Shift", { code: "ShiftLeft", shiftKey: true });
    expect(input.value).toBe("Ctrl+K");
    expect(
      wrapper
        .get('[data-testid="shortcut-observed"]')
        .findAll("code")
        .map((code) => code.text()),
    ).toEqual(["k", "KeyK"]);

    input.blur();
    const outside = await press(document.body, "x", { code: "KeyX" });
    expect(outside.defaultPrevented).toBe(false);
    expect(input.value).toBe("Ctrl+K");
    await press(document.body, "k", { code: "KeyK", ctrlKey: true });
    expect(document.activeElement).toBe(wrapper.get(".global-search").element);
    expect(input.value).toBe("Ctrl+K");
  });

  it("keeps simultaneous chords separate from ordered sequences and provides escape routes", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="shortcut-platform"]').setValue("windows");
    const input = capture(wrapper);
    input.focus();
    await press(input, "k", { code: "KeyK", ctrlKey: true });
    await press(input, "c", { code: "KeyC", ctrlKey: true });
    expect(input.value).toBe("Ctrl+C");
    expect(results(wrapper).some((row) => row.text().includes("Ctrl+K then Ctrl+C"))).toBe(false);

    await wrapper.get('[data-testid="shortcut-clear"]').trigger("click");
    await wrapper.get('[data-testid="shortcut-sequential"]').setValue(true);
    input.focus();
    await press(input, "k", { code: "KeyK", ctrlKey: true });
    await press(input, "c", { code: "KeyC", ctrlKey: true });
    expect(input.value).toBe("Ctrl+K then Ctrl+C");
    expect(results(wrapper).some((row) => row.text().includes("Visual Studio Code"))).toBe(true);
    expect(results(wrapper).every((row) => row.text().includes("Ctrl+K then Ctrl+C"))).toBe(true);

    const tab = await press(input, "Tab", { code: "Tab" });
    expect(tab.defaultPrevented).toBe(false);
    expect(input.value).toBe("Ctrl+K then Ctrl+C");
    const escape = await press(input, "Escape", { code: "Escape" });
    expect(escape.defaultPrevented).toBe(false);
    expect(document.activeElement).not.toBe(input);
    expect(input.value).toBe("Ctrl+K then Ctrl+C");
  });

  it("lets users configure browser-reserved chords and filter OS, surface, app, and text", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="shortcut-builder-modifier-Ctrl"]').trigger("click");
    await wrapper.get('[data-testid="shortcut-builder-key"]').setValue("F");
    await wrapper.get('[data-testid="shortcut-builder-add"]').trigger("click");
    expect(capture(wrapper).value).toBe("Ctrl+F");
    await wrapper.get('[data-testid="shortcut-platform"]').setValue("windows");
    await wrapper.get('[data-testid="shortcut-surface"]').setValue("browser");
    await wrapper.get('[data-testid="shortcut-app"]').setValue("firefox");
    expect(results(wrapper).length).toBeGreaterThan(0);
    expect(results(wrapper).every((row) => row.text().includes("Firefox"))).toBe(true);
    expect(results(wrapper).every((row) => !row.text().includes("GitHub"))).toBe(true);
    expect(results(wrapper)[0]!.get('[data-testid="shortcut-license"]').text()).toBe(
      "CC-BY-SA-3.0",
    );
    expect(results(wrapper)[0]!.get(".shortcut-card-source details").text()).toContain(
      "ShareAlike applies to adaptations",
    );
    await wrapper.get('[data-testid="shortcut-platform"]').setValue("macos");
    expect(results(wrapper)).toHaveLength(0);
    const input = capture(wrapper);
    input.focus();
    await press(input, "f", { code: "KeyF", metaKey: true });
    expect(input.value).toBe("Meta+F");
    expect(results(wrapper).length).toBeGreaterThan(0);
    await wrapper.get('[data-testid="shortcut-manual"]').setValue("Ctrl+F");
    await wrapper.get('[data-testid="shortcut-platform"]').setValue("windows");
    await wrapper.get('[data-testid="shortcut-text"]').setValue("page");
    expect(results(wrapper).length).toBeGreaterThan(0);
    await wrapper.get('[data-testid="shortcut-text"]').setValue("PRIVATE_SHORTCUT_INPUT_4903");
    expect(results(wrapper)).toHaveLength(0);
    expect(wrapper.get('[data-testid="shortcut-no-matches"]').text()).toMatch(
      /does not|unknown|unlisted/i,
    );
  });

  it("shows setup conditions, official provenance, and preserves private input only in memory", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="shortcut-manual"]').setValue("g then i");
    await wrapper.get('[data-testid="shortcut-app"]').setValue("github");
    expect(capture(wrapper).value).toBe("G then I");
    const rows = results(wrapper);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]!.text()).toMatch(/enable|turn.*on|settings/i);
    const source = rows[0]!.get('[data-testid="shortcut-source"]');
    expect(source.attributes("href")).toMatch(
      /^https:\/\/github\.com\/github\/docs\/blob\/[a-f0-9]{40}\/content\/get-started\/accessibility\/keyboard-shortcuts\.md$/,
    );
    expect(source.attributes("target")).toBe("_blank");
    expect(source.attributes("rel")).toContain("noopener");
    expect(rows[0]!.get('[data-testid="shortcut-checked"]').text()).toMatch(/2026-10-\d{2}/);
    expect(rows[0]!.text()).toMatch(/version|current|2026|rolling/i);
    const license = rows[0]!.get('[data-testid="shortcut-license"]');
    expect(license.text()).toBe("CC-BY-4.0");
    expect(license.attributes("href")).toBe(
      "https://creativecommons.org/licenses/by/4.0/legalcode.en",
    );
    expect(license.attributes("rel")).toContain("noopener");
    const notice = rows[0]!.get('[data-testid="shortcut-notice"]');
    const licenseText = rows[0]!.get('[data-testid="shortcut-license-text"]');
    expect(notice.attributes("href")).toBe("/licenses/shortcut-sources/notices.html");
    expect(licenseText.attributes("href")).toBe("/licenses/shortcut-sources/CC-BY-4.0.txt");
    expect(notice.attributes("rel")).toContain("noopener");
    expect(licenseText.attributes("rel")).toContain("noopener");
    const sourceNotes = rows[0]!.get(".shortcut-card-source details");
    expect(rows[0]!.get('[data-testid="shortcut-attribution"]').text()).toMatch(/GitHub|github/);
    expect(sourceNotes.text()).toContain("MIT license does not relicense these records");
    expect(sourceNotes.text()).toContain("publication candidate");

    const marker = "PRIVATE_SHORTCUT_INPUT_4903";
    await wrapper.get('[data-testid="shortcut-text"]').setValue(marker);
    settings.preferences.theme = "dark";
    expect(Object.keys(localStorage)).toEqual([STORAGE_KEY]);
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain(marker);
    expect(sessionStorage.length).toBe(0);
    expect(window.location.href).not.toContain(marker);
    window.history.replaceState(null, "", "/army-knife/#/tool/unicode");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await flushPromises();
    window.history.replaceState(null, "", "/army-knife/#/tool/shortcuts");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await vi.waitFor(() => expect(wrapper.find("#shortcut-capture").exists()).toBe(true));
    expect(capture(wrapper).value).toBe("");
    expect((wrapper.get('[data-testid="shortcut-text"]').element as HTMLInputElement).value).toBe(
      "",
    );
  });

  it("reacts to all five UI languages without resetting the selected sequence", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="shortcut-manual"]').setValue("g then i");
    await wrapper.get('[data-testid="shortcut-app"]').setValue("github");
    const english = wrapper.get('[data-testid="shortcut-result-count"]').text();
    const englishCandidate = wrapper.get('[data-testid="shortcut-candidate-notice"]').text();
    for (const locale of ["ja", "zh-CN", "zh-TW", "ko", "en"] as const) {
      settings.preferences.locale = locale;
      await nextTick();
      await flushPromises();
      expect(capture(wrapper).value).toBe("G then I");
      expect(results(wrapper).length).toBeGreaterThan(0);
      const count = wrapper.get('[data-testid="shortcut-result-count"]').text();
      const candidate = wrapper.get('[data-testid="shortcut-candidate-notice"]').text();
      expect(count).not.toMatch(/shortcuts\.|shortcut\./);
      expect(candidate).not.toMatch(/shortcuts\.|shortcut\./);
      if (locale === "en") {
        expect(count).toBe(english);
        expect(candidate).toBe(englishCandidate);
      } else {
        expect(count).not.toBe(english);
        expect(candidate).not.toBe(englishCandidate);
      }
    }
  });

  it("preserves reported key, code, and numpad location without inferring a layout", async () => {
    const wrapper = await mountTool();
    const input = capture(wrapper);
    input.focus();
    await press(input, "@", { code: "BracketLeft", ctrlKey: true });
    expect(input.value).toBe("Ctrl+@");
    expect(wrapper.get('[data-testid="shortcut-observed"]').text()).toContain("BracketLeft");
    expect(wrapper.get('[data-testid="shortcut-observed"]').text()).toContain("@");

    await press(input, "+", { code: "NumpadAdd", location: 3 });
    expect(input.value).toBe("NumpadAdd");
    expect(wrapper.get('[data-testid="shortcut-observed"]').text()).toContain("NumpadAdd");
    expect(wrapper.get('[data-testid="shortcut-observed"]').text()).toMatch(/3/);
    await wrapper.get('[data-testid="shortcut-manual"]').setValue("Ctrl+F");
    await wrapper.get('[data-testid="shortcut-app"]').setValue("firefox");
    expect(results(wrapper).length).toBeGreaterThan(0);
    await wrapper.get('[data-testid="shortcut-key-mode"]').setValue("physical");
    expect(results(wrapper)).toHaveLength(0);
    expect(wrapper.find('[data-testid="shortcut-no-matches"]').exists()).toBe(true);
    await wrapper.get('[data-testid="shortcut-key-mode"]').setValue("logical");
    expect(results(wrapper).length).toBeGreaterThan(0);
  });

  it("distinguishes exact sequence matches from a contained prefix", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="shortcut-platform"]').setValue("windows");
    await wrapper.get('[data-testid="shortcut-app"]').setValue("vscode");
    await wrapper.get('[data-testid="shortcut-manual"]').setValue("Ctrl+K");
    expect(results(wrapper).some((row) => row.text().includes("Ctrl+K then Ctrl+C"))).toBe(false);
    await wrapper.get('[data-testid="shortcut-match-mode"]').setValue("contains");
    expect(results(wrapper).some((row) => row.text().includes("Ctrl+K then Ctrl+C"))).toBe(true);
    await wrapper.get('[data-testid="shortcut-match-mode"]').setValue("exact");
    expect(results(wrapper).some((row) => row.text().includes("Ctrl+K then Ctrl+C"))).toBe(false);
  });

  it("builds modifier-only prefixes even when the app's bindings are absent from the catalog", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="shortcut-sequential"]').setValue(true);
    await wrapper.get('[data-testid="shortcut-platform"]').setValue("windows");
    await wrapper.get('[data-testid="shortcut-surface"]').setValue("web");
    await wrapper.get('[data-testid="shortcut-builder-modifier-Alt"]').trigger("click");
    await wrapper.get('[data-testid="shortcut-builder-modifier-Meta"]').trigger("click");
    await wrapper.get('[data-testid="shortcut-builder-key"]').setValue("");
    await wrapper.get('[data-testid="shortcut-builder-add"]').trigger("click");
    expect(capture(wrapper).value).toBe("Alt+Meta");
    await wrapper.get('[data-testid="shortcut-builder-modifier-Alt"]').trigger("click");
    await wrapper.get('[data-testid="shortcut-builder-modifier-Meta"]').trigger("click");
    await wrapper.get('[data-testid="shortcut-builder-key"]').setValue("H");
    await wrapper.get('[data-testid="shortcut-builder-add"]').trigger("click");
    expect(capture(wrapper).value).toBe("Alt+Meta then H");
    expect(results(wrapper)).toHaveLength(0);
    expect(wrapper.get('[data-testid="shortcut-no-matches"]').text()).toContain("does not mean");
    await wrapper.get('[data-testid="shortcut-platform"]').setValue("macos");
    expect(results(wrapper)).toHaveLength(0);
    await wrapper.get('[data-testid="shortcut-manual"]').setValue("Ctrl+Alt then H");
    expect(capture(wrapper).value).toBe("Ctrl+Alt then H");
    expect(results(wrapper)).toHaveLength(0);
    expect(wrapper.get('[data-testid="shortcut-no-matches"]').text()).toContain("does not mean");
  });

  it("bounds ordered capture, supports undo, and resets paginated results when searching", async () => {
    const wrapper = await mountTool();
    const first = results(wrapper)[0]!.attributes("data-record-id");
    expect(wrapper.get('[data-testid="shortcut-previous"]').attributes("disabled")).toBeDefined();
    await wrapper.get('[data-testid="shortcut-next"]').trigger("click");
    expect(results(wrapper)[0]!.attributes("data-record-id")).not.toBe(first);
    await wrapper.get('[data-testid="shortcut-sequential"]').setValue(true);
    const input = capture(wrapper);
    input.focus();
    for (const key of ["a", "b", "c", "d", "e"]) {
      await press(input, key, { code: `Key${key.toUpperCase()}` });
    }
    expect(input.value).toBe("A then B then C then D");
    expect(wrapper.find('[data-testid="shortcut-sequence-limit"]').exists()).toBe(true);
    await wrapper.get('[data-testid="shortcut-undo"]').trigger("click");
    expect(input.value).toBe("A then B then C");
    expect(wrapper.find('[data-testid="shortcut-sequence-limit"]').exists()).toBe(false);
    await wrapper.get('[data-testid="shortcut-manual"]').setValue("g then i");
    await wrapper.get('[data-testid="shortcut-app"]').setValue("github");
    expect(results(wrapper)).toHaveLength(1);
    expect(wrapper.find('[data-testid="shortcut-next"]').exists()).toBe(false);
    await wrapper.get('[data-testid="shortcut-manual"]').setValue("Ctrl+");
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(results(wrapper)).toHaveLength(0);
    expect(wrapper.find('[data-testid="shortcut-no-matches"]').exists()).toBe(false);
  });
});
