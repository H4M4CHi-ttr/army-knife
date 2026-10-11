import { DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import App from "./App.vue";
import { i18n } from "./i18n";
import { setFontLocale } from "./lib/fonts";
import { defaultPreferences, settings, STORAGE_KEY } from "./lib/preferences";
import * as engine from "./lib/wasm/client";

// The real font loader owns network resources. Its behavior has separate unit
// tests and the real font files are covered by the production browser suite.
vi.mock("./lib/fonts", () => ({
  setFontLocale: vi.fn(async (locale: string) => {
    document.documentElement.lang = locale;
  }),
}));

let app: VueWrapper | undefined;

beforeEach(() => {
  window.history.replaceState(null, "", "/army-knife/#/");
  document.documentElement.classList.remove("dark");
  document.documentElement.lang = "en";
  document.body.replaceChildren();
  settings.reset();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(async () => {
  app?.unmount();
  app = undefined;
  if (vi.isFakeTimers()) {
    vi.clearAllTimers();
    vi.useRealTimers();
  }
  await flushPromises();
  document.body.replaceChildren();
});

async function mountApp(hash = "#/"): Promise<VueWrapper> {
  window.history.replaceState(null, "", `/army-knife/${hash}`);
  const host = document.createElement("div");
  document.body.append(host);
  app = mount(App, { attachTo: host, global: { plugins: [vaporInteropPlugin, i18n] } });
  await flushPromises();
  return app;
}

async function route(hash: string): Promise<void> {
  // replaceState avoids an extra asynchronous emulator hashchange; the App
  // still receives the same native event it handles for user navigation.
  window.history.replaceState(null, "", `/army-knife/${hash}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  await flushPromises();
}

async function expectElement(wrapper: VueWrapper, selector: string): Promise<void> {
  await vi.waitFor(() => expect(wrapper.find(selector).exists()).toBe(true), {
    timeout: 3_000,
    interval: 10,
  });
}

function controlExecutionClock(): void {
  // Leave setImmediate native: Vue Test Utils uses it to flush promises while
  // only the application debounce/countdown clock needs deterministic time.
  vi.useFakeTimers({
    toFake: ["Date", "setTimeout", "clearTimeout", "setInterval", "clearInterval"],
  });
}

async function advanceExecutionClock(milliseconds: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(milliseconds);
  await nextTick();
}

async function openSettings(wrapper: VueWrapper): Promise<DOMWrapper<Element>> {
  await wrapper.get('[data-testid="settings-button"]').trigger("click");
  const body = new DOMWrapper(document.body);
  await vi.waitFor(() => expect(body.find('[role="dialog"]').exists()).toBe(true));
  return new DOMWrapper(body.get('[role="dialog"]').element);
}

describe("App integration with real local tools", () => {
  it("shows the complementary tools and keeps every DevToys overlap off by default", async () => {
    const wrapper = await mountApp();
    const cards = wrapper
      .findAll('[data-testid^="tool-card-"]')
      .map((card) => card.attributes("data-testid"))
      .sort();
    expect(cards).toEqual([
      "tool-card-cidr",
      "tool-card-csv",
      "tool-card-env",
      "tool-card-explain",
      "tool-card-har",
      "tool-card-json-diff",
      "tool-card-logs",
      "tool-card-unicode",
      "tool-card-url",
    ]);
    expect(wrapper.find(".tool-panel").exists()).toBe(false);
    expect(setFontLocale).toHaveBeenCalledWith("en");
  });

  it.each(["sets", "json-format", "contrast"])(
    "does not instantiate the disabled %s tool from a direct hash URL",
    async (id) => {
      const wrapper = await mountApp(`#/tool/${id}`);
      expect(wrapper.find(`[data-testid="tool-card-${id}"]`).exists()).toBe(false);
      expect(wrapper.find('[data-testid="tool-card-csv"]').exists()).toBe(true);
      expect(wrapper.find(".tool-panel").exists()).toBe(false);
      expect(wrapper.find(".result-panel").exists()).toBe(false);
      expect(wrapper.find("textarea").exists()).toBe(false);
    },
  );

  it("applies small JSON edits immediately and replaces the previous structural result", async () => {
    const wrapper = await mountApp("#/tool/json-diff");
    await expectElement(wrapper, "#json-left");
    await wrapper.get("#json-left").setValue('{"a/b":1,"remove":false,"stay":true}');
    await wrapper.get("#json-right").setValue('{"a/b":2,"add":"new","stay":true}');
    await flushPromises();
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-mode")).toBe("instant");
    expect(wrapper.find('[data-testid="apply-now"]').exists()).toBe(false);

    const rows = wrapper
      .findAll(".diff-table tbody tr")
      .map((row) => row.findAll("th, td").map((cell) => cell.text()));
    expect(rows).toEqual([
      ["Changed", "/a~1b", "1", "2"],
      ["Added", "/add", "—", '"new"'],
      ["Removed", "/remove", "false", "—"],
    ]);
    expect(wrapper.findAll(".metric").map((metric) => metric.text())).toEqual([
      "Added1",
      "Removed1",
      "Changed1",
    ]);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);

    await wrapper.get("#json-left").setValue('{"a/b":2,"add":"new","stay":true}');
    await flushPromises();
    expect(wrapper.find(".equal-state").exists()).toBe(true);
    expect(wrapper.find(".diff-table").exists()).toBe(false);
    await wrapper.get("#json-left").setValue("{");
    await flushPromises();
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it("applies real Unicode and CIDR edits without an Apply action", async () => {
    const wrapper = await mountApp("#/tool/unicode");
    await expectElement(wrapper, "#unicode-input");
    await wrapper.get("#unicode-input").setValue("a\u200bb");
    await flushPromises();
    expect(wrapper.get(".unicode-table").text()).toContain("U+200B");
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-mode")).toBe("instant");
    expect(wrapper.find('[data-testid="apply-now"]').exists()).toBe(false);

    await route("#/tool/cidr");
    await expectElement(wrapper, "#cidr-input");
    await wrapper.get("#cidr-input").setValue("192.0.2.129/25");
    await flushPromises();
    expect(wrapper.get(".cidr-network code").text()).toBe("192.0.2.128/25");
    expect(wrapper.get(".cidr-wide-metric .metric-value").text()).toBe("128");
    expect(wrapper.find('[data-testid="apply-now"]').exists()).toBe(false);
    await wrapper.get("#cidr-input").setValue("invalid");
    await flushPromises();
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it("debounces large JSON, switches to manual apply, and discards outdated results", async () => {
    controlExecutionClock();
    const wrapper = await mountApp("#/tool/json-diff");
    await expectElement(wrapper, "#json-left");
    const document = (revision: number) => JSON.stringify({ payload: "x".repeat(8300), revision });
    await wrapper.get("#json-left").setValue(document(1));
    await wrapper.get("#json-right").setValue(document(2));
    await flushPromises();
    const control = () => wrapper.get('[data-testid="apply-control"]');
    expect(control().attributes("data-mode")).toBe("deferred");
    expect(control().attributes("data-status")).toBe("pending");
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    await advanceExecutionClock(799);
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    await advanceExecutionClock(1);
    expect(wrapper.get(".diff-table tbody tr").text()).toContain("/revision");
    expect(control().attributes("data-status")).toBe("applied");

    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await wrapper.get("#json-left").setValue(document(3));
    await flushPromises();
    expect(control().attributes("data-status")).toBe("manual");
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    await advanceExecutionClock(1600);
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    await flushPromises();
    expect(
      wrapper
        .get(".diff-table tbody tr")
        .findAll("th, td")
        .map((cell) => cell.text()),
    ).toEqual(["Changed", "/revision", "3", "2"]);
    expect(settings.preferences.autoApply).toBe(false);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).autoApply).toBe(false);

    await wrapper.get("#json-left").setValue(document(2));
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(true);
    await flushPromises();
    expect(control().attributes("data-status")).toBe("pending");
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    await advanceExecutionClock(799);
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    await advanceExecutionClock(1);
    expect(wrapper.find(".equal-state").exists()).toBe(true);
    expect(wrapper.find(".diff-table").exists()).toBe(false);
  });

  it("repairs an oversized encoded URL by shortening or removing its query value", async () => {
    const wrapper = await mountApp("#/tool/url");
    await expectElement(wrapper, "#url-input");
    // The raw Unicode input fits the input limit. Percent encoding expands the
    // generated URL past the output limit, so editing must retain the raw base.
    const value = "あ".repeat(2000);
    await wrapper.get("#url-input").setValue(`https://example.test/?x=${value}`);
    await flushPromises();
    expect(wrapper.find('[data-testid="query-value-0"]').exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="url-output"]').exists()).toBe(false);

    await wrapper.get('[data-testid="query-value-0"]').setValue("short");
    await flushPromises();
    expect(wrapper.get('[data-testid="url-output"]').text()).toBe("https://example.test/?x=short");
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);

    await wrapper.get('[data-testid="query-value-0"]').setValue(value);
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    await wrapper.get('[data-testid="query-remove-0"]').trigger("click");
    await flushPromises();
    expect(wrapper.get('[data-testid="url-output"]').text()).toBe("https://example.test/");
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("discards CSV and log input when routing between tools and only stores preferences", async () => {
    // This spy calls through if invoked: no successful WASM response is mocked.
    // Navigating before the debounce deadline must cancel the reserved work.
    const runEngine = vi.spyOn(engine, "runEngine");
    controlExecutionClock();
    const marker = "PRIVATE_APP_INPUT_2647";
    const wrapper = await mountApp("#/tool/csv");
    await expectElement(wrapper, "#csv-input");
    await wrapper.get("#csv-input").setValue(`id,secret\n1,${marker}`);
    await flushPromises();
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await wrapper.get('button[aria-label="Add to favorites"]').trigger("click");
    await advanceExecutionClock(799);
    expect(runEngine).not.toHaveBeenCalled();

    await route("#/tool/logs");
    await expectElement(wrapper, "#logs-input");
    expect((wrapper.get("#logs-input").element as HTMLTextAreaElement).value).toBe("");
    expect(wrapper.find("#csv-input").exists()).toBe(false);
    await advanceExecutionClock(1);
    expect(runEngine).not.toHaveBeenCalled();
    await wrapper.get("#logs-input").setValue(`ERROR ${marker}`);
    await flushPromises();
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");

    await route("#/tool/csv");
    await expectElement(wrapper, "#csv-input");
    expect((wrapper.get("#csv-input").element as HTMLTextAreaElement).value).toBe("");
    await advanceExecutionClock(1600);
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    expect(runEngine).not.toHaveBeenCalled();

    expect(Object.keys(localStorage)).toEqual([STORAGE_KEY]);
    const saved = localStorage.getItem(STORAGE_KEY)!;
    expect(JSON.parse(saved)).toEqual({
      ...defaultPreferences("en"),
      favorites: ["csv"],
    });
    expect(saved).not.toContain(marker);
    expect(sessionStorage.length).toBe(0);
    expect(window.location.href).not.toContain(marker);
  });

  it("applies settings through the actual dialog and removes a tool when it is disabled", async () => {
    const wrapper = await mountApp();
    let dialog = await openSettings(wrapper);
    await dialog.get('[data-testid="theme-dark"]').trigger("click");
    await dialog.get('[data-testid="locale-select"]').setValue("ja");
    await dialog.get('[data-testid="toggle-json-format"]').trigger("click");
    await flushPromises();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.lang).toBe("ja");
    expect(setFontLocale).toHaveBeenLastCalledWith("ja");
    expect(dialog.get('[data-testid="theme-dark"]').attributes("aria-pressed")).toBe("true");
    expect(dialog.get('[data-testid="toggle-json-format"]').attributes("aria-checked")).toBe(
      "true",
    );
    expect(wrapper.get('[data-testid="settings-button"]').text()).toBe("日本語");
    expect(wrapper.get('[data-testid="tool-card-json-format"]').text()).toContain("JSON");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      ...defaultPreferences("en"),
      theme: "dark",
      locale: "ja",
      enabledTools: [...defaultPreferences("en").enabledTools, "json-format"],
    });

    await dialog.get('[data-testid="settings-close"]').trigger("click");
    await route("#/tool/json-format");
    await expectElement(wrapper, "#json-left");
    dialog = await openSettings(wrapper);
    await dialog.get('[data-testid="toggle-json-format"]').trigger("click");
    await dialog.get('[data-testid="settings-close"]').trigger("click");
    await vi.waitFor(() => {
      expect(window.location.hash).toBe("#/");
      expect(wrapper.find("#json-left").exists()).toBe(false);
      expect(wrapper.find('[data-testid="tool-card-json-format"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="tool-card-csv"]').exists()).toBe(true);
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).enabledTools).not.toContain(
      "json-format",
    );
  });
});
