import { DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import App from "./App.vue";
import { i18n } from "./i18n";
import { setFontLocale } from "./lib/fonts";
import { defaultPreferences, settings, STORAGE_KEY } from "./lib/preferences";
import { legacyToolRedirect, localeHomePath, resolvePageRoute, toolPath } from "./lib/routes";
import * as engine from "./lib/wasm/client";

// The real font loader owns network resources. Its behavior has separate unit
// tests and the real font files are covered by the production browser suite.
vi.mock("./lib/fonts", () => ({
  setFontLocale: vi.fn(async (locale: string) => {
    document.documentElement.lang = locale;
  }),
}));

let app: VueWrapper | undefined;

function staticPageResponse(pathname: string): Response {
  const route = resolvePageRoute(pathname);
  if (route.kind === "unknown") return new Response("", { status: 404 });
  const locale = route.locale;
  const guide = route.kind === "tool" ? 'data-tool="' + route.toolId + '"' : 'data-page="home"';
  const html =
    '<!doctype html><html lang="' +
    locale +
    '"><head><title>Static test guide</title><meta name="description" content="Static description" />' +
    '<link rel="canonical" href="https://h4m4chi-ttr.github.io' +
    pathname +
    '" /></head><body><article id="page-guide" data-locale="' +
    locale +
    '" ' +
    guide +
    '><h1>Static test guide</h1></article></body></html>';
  return new Response(html, { headers: { "content-type": "text/html" } });
}

beforeEach(() => {
  vi.stubEnv("BASE_URL", "/army-knife/");
  window.history.replaceState(null, "", localeHomePath("en"));
  document.documentElement.classList.remove("dark");
  document.documentElement.lang = "en";
  document.body.replaceChildren();
  settings.reset();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const pathname = new URL(input.toString(), window.location.origin).pathname;
      return staticPageResponse(pathname);
    }),
  );
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
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function mountApp(hash = "#/"): Promise<VueWrapper> {
  return mountPage(legacyToolRedirect(hash, "en") ?? localeHomePath("en"));
}

async function mountPage(pathname: string): Promise<VueWrapper> {
  window.history.replaceState(null, "", pathname);
  const host = document.createElement("div");
  document.body.append(host);
  app = mount(App, { attachTo: host, global: { plugins: [vaporInteropPlugin, i18n] } });
  await flushPromises();
  return app;
}

async function route(hash: string): Promise<void> {
  // Browser document links are verified in E2E. Popstate exercises the same
  // page route resolution without replacing the unit-test document.
  window.history.replaceState(
    null,
    "",
    legacyToolRedirect(hash, settings.preferences.locale) ??
      localeHomePath(settings.preferences.locale),
  );
  window.dispatchEvent(new PopStateEvent("popstate"));
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
  it("uses the public URL language ahead of saved preferences and preserves static guide content", async () => {
    settings.preferences.locale = "ja";
    const guide = document.createElement("article");
    guide.id = "page-guide";
    guide.dataset.tool = "url";
    guide.dataset.locale = "en";
    guide.innerHTML = "<h1>URL parser guide</h1><p>Static usage remains available.</p>";
    document.body.append(guide);
    const wrapper = await mountPage(toolPath("en", "url"));
    await expectElement(wrapper, "#url-input");
    expect(settings.preferences.locale).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe(`${i18n.global.t("tool.url.name")} — Army Knife`);
    expect(wrapper.get(".workbench-title h2").text()).toBe(i18n.global.t("tool.url.name"));
    expect(wrapper.find(".workbench-title h1").exists()).toBe(false);
    expect(document.getElementById("page-guide")).toBe(guide);
    expect(guide.textContent).toContain("Static usage remains available.");
  });

  it("renders ordinary links with readable destinations and preserves modified click behavior", async () => {
    const wrapper = await mountApp();
    const link = wrapper.get('[data-testid="tool-card-cidr"]');
    expect(link.attributes("href")).toBe(toolPath("en", "cidr"));
    expect(wrapper.get("a.brand").attributes("href")).toBe(localeHomePath("en"));
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });
    link.element.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
  });

  it("does not show the collection for an unknown pathname", async () => {
    const wrapper = await mountPage("/army-knife/en/tools/not-a-tool/");
    expect(wrapper.find('[data-testid="page-not-found"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid^="tool-card-"]').exists()).toBe(false);
    expect(wrapper.find("textarea").exists()).toBe(false);
  });

  it("preserves homepage category and favorite navigation without adding input data to the URL", async () => {
    settings.preferences.favorites = ["cidr"];
    const wrapper = await mountPage(`${localeHomePath("en")}#category-network`);
    expect(wrapper.find('[data-testid="tool-card-cidr"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tool-card-csv"]').exists()).toBe(false);
    const favorites = wrapper.get('a[href="/army-knife/en/#favorites"]');
    expect(favorites.text()).toContain("Favorites");
    window.history.replaceState(null, "", `${localeHomePath("en")}#favorites`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await flushPromises();
    expect(wrapper.findAll('[data-testid^="tool-card-"]')).toHaveLength(1);
    expect(wrapper.find('[data-testid="tool-card-cidr"]').exists()).toBe(true);
  });

  it("shows the complementary tools and keeps every DevToys overlap off by default", async () => {
    const wrapper = await mountApp();
    const cards = wrapper
      .findAll('[data-testid^="tool-card-"]')
      .map((card) => card.attributes("data-testid"))
      .sort();
    expect(cards).toEqual([
      "tool-card-cache-control",
      "tool-card-chmod",
      "tool-card-cidr",
      "tool-card-content-disposition",
      "tool-card-cors",
      "tool-card-css-units",
      "tool-card-csv",
      "tool-card-data-units",
      "tool-card-env",
      "tool-card-explain",
      "tool-card-git-conflicts",
      "tool-card-har",
      "tool-card-html-accessibility",
      "tool-card-http-reference",
      "tool-card-json-diff",
      "tool-card-logs",
      "tool-card-magic",
      "tool-card-og-tags",
      "tool-card-pkce",
      "tool-card-server-timing",
      "tool-card-set-cookie",
      "tool-card-shortcuts",
      "tool-card-slug",
      "tool-card-unicode",
      "tool-card-unicode-normalize",
      "tool-card-url",
      "tool-card-user-agent",
    ]);
    expect(wrapper.find(".tool-panel").exists()).toBe(false);
    expect(setFontLocale).toHaveBeenCalledWith("en");
  });

  it.each(["sets", "json-format", "contrast", "radix"])(
    "keeps the disabled %s tool URL and does not instantiate its component",
    async (id) => {
      const wrapper = await mountApp(`#/tool/${id}`);
      expect(wrapper.find(`[data-testid="tool-card-${id}"]`).exists()).toBe(false);
      expect(wrapper.find('[data-testid="tool-disabled"]').exists()).toBe(true);
      expect(wrapper.get('[data-testid="disabled-settings"]').text()).toBe("Settings");
      expect(window.location.pathname).toBe(`/army-knife/en/tools/${id}/`);
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

  it("defers large radix input and applies only the latest value on demand", async () => {
    controlExecutionClock();
    settings.preferences.enabledTools.push("radix");
    settings.preferences.autoApply = false;
    const wrapper = await mountApp("#/tool/radix");
    await expectElement(wrapper, "#quick-input");
    const control = () => wrapper.get('[data-testid="apply-control"]');
    await wrapper.get("#quick-input").setValue("1".repeat(2_048));
    await flushPromises();
    expect(control().attributes("data-mode")).toBe("deferred");
    expect(control().attributes("data-status")).toBe("manual");
    expect(wrapper.find(".result-panel").exists()).toBe(false);

    await advanceExecutionClock(1_600);
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    await flushPromises();
    expect(control().attributes("data-status")).toBe("applied");
    expect(wrapper.findAll('[data-testid="quick-output-row"]')[2]!.get("td code").text()).toBe("1".repeat(2_048));

    await wrapper.get("#quick-input").setValue("2".repeat(2_048));
    await flushPromises();
    expect(wrapper.find(".result-panel").exists()).toBe(false);
    expect(control().attributes("data-status")).toBe("manual");
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    await flushPromises();
    expect(wrapper.findAll('[data-testid="quick-output-row"]')[2]!.get("td code").text()).toBe("2".repeat(2_048));
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

  it("applies settings through the actual dialog and keeps the page when its tool is disabled", async () => {
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
      expect(window.location.pathname).toBe(toolPath("ja", "json-format"));
      expect(wrapper.find("#json-left").exists()).toBe(false);
      expect(wrapper.find('[data-testid="tool-card-json-format"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="tool-disabled"]').exists()).toBe(true);
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).enabledTools).not.toContain(
      "json-format",
    );
  });
});
