import { DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
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
  await flushPromises();
  document.body.replaceChildren();
});

async function mountApp(hash = "#/"): Promise<VueWrapper> {
  window.history.replaceState(null, "", `/army-knife/${hash}`);
  const host = document.createElement("div");
  document.body.append(host);
  app = mount(App, { attachTo: host, global: { plugins: [i18n] } });
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

async function run(wrapper: VueWrapper): Promise<void> {
  const buttons = wrapper.findAll("button").filter((button) => button.text() === "Run");
  expect(buttons).toHaveLength(1);
  await buttons[0]!.trigger("click");
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
      "tool-card-json-diff",
      "tool-card-logs",
      "tool-card-unicode",
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

  it("runs the real JSON comparison and displays each structural change correctly", async () => {
    const wrapper = await mountApp("#/tool/json-diff");
    await expectElement(wrapper, "#json-left");
    await wrapper.get("#json-left").setValue('{"a/b":1,"remove":false,"stay":true}');
    await wrapper.get("#json-right").setValue('{"a/b":2,"add":"new","stay":true}');
    await run(wrapper);

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

    await wrapper.get("#json-left").setValue('{"changed":true}');
    expect(wrapper.find(".result-panel").exists()).toBe(false);
  });

  it("discards CSV and log input when routing between tools and only stores preferences", async () => {
    // This spy calls through if invoked: no successful WASM response is mocked.
    // Routing and typing must never start the engine at all.
    const runEngine = vi.spyOn(engine, "runEngine");
    const marker = "PRIVATE_APP_INPUT_2647";
    const wrapper = await mountApp("#/tool/csv");
    await expectElement(wrapper, "#csv-input");
    await wrapper.get("#csv-input").setValue(`id,secret\n1,${marker}`);
    await wrapper.get('button[aria-label="Add to favorites"]').trigger("click");

    await route("#/tool/logs");
    await expectElement(wrapper, "#logs-input");
    expect((wrapper.get("#logs-input").element as HTMLTextAreaElement).value).toBe("");
    expect(wrapper.find("#csv-input").exists()).toBe(false);
    await wrapper.get("#logs-input").setValue(`ERROR ${marker}`);

    await route("#/tool/csv");
    await expectElement(wrapper, "#csv-input");
    expect((wrapper.get("#csv-input").element as HTMLTextAreaElement).value).toBe("");
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
