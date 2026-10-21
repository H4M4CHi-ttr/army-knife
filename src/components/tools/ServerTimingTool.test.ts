import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import ServerTimingTool from "./ServerTimingTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";

let wrapper: VueWrapper;
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(ServerTimingTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
});
afterEach(() => { wrapper?.unmount(); vi.useRealTimers(); });
const result = () => wrapper.find('[data-testid="server-timing-result"]');

describe("Server-Timing Vapor view", () => {
  it("updates immediately and removes old exports after errors or clear", async () => {
    expect(result().exists()).toBe(false);
    await wrapper.get("#server-timing-input").setValue("db;dur=9007199254740993.125");
    expect(result().text()).toContain("9007199254740993.125");
    await wrapper.get("#server-timing-input").setValue('db;desc="broken');
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("syntax");
    await wrapper.get('[data-testid="server-timing-sample"]').trigger("click");
    expect(result().findAll(".timing-metric")).toHaveLength(3);
    await wrapper.get('[data-testid="server-timing-clear"]').trigger("click");
    expect(result().exists()).toBe(false);
    expect(wrapper.get<HTMLTextAreaElement>("#server-timing-input").element.value).toBe("");
  });
  it("waits 800ms, invalidates edits and supports manual apply and pending cancellation", async () => {
    vi.useFakeTimers();
    const long = `db;desc="${"a".repeat(1024)}", app;desc="${"b".repeat(1024)}"`;
    await wrapper.get("#server-timing-input").setValue(long);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799);
    expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await flushPromises();
    expect(result().exists()).toBe(true);
    await wrapper.get("#server-timing-input").setValue(long + ", cache");
    await wrapper.get('[data-testid="server-timing-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await wrapper.get("#server-timing-input").setValue(long + ", total");
    await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    expect(result().exists()).toBe(true);
  });
  it("discards the old report on rejected paste and recovers on editing", async () => {
    await wrapper.get('[data-testid="server-timing-sample"]').trigger("click");
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    wrapper.get("#server-timing-input").element.dispatchEvent(paste);
    await flushPromises();
    expect(paste.defaultPrevented).toBe(true);
    expect(result().exists()).toBe(false);
    await wrapper.get("#server-timing-input").setValue("cache");
    expect(result().exists()).toBe(true);
  });
  it("keeps markup inert and private data out of storage and URL", async () => {
    const marker = "PRIVATE_SERVER_TIMING_8812";
    await wrapper.get("#server-timing-input").setValue(`db;desc="<img src='https://example.invalid/${marker}'>"`);
    expect(result().text()).toContain(marker);
    expect(result().find("img").exists()).toBe(false);
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(marker);
    expect(location.href).not.toContain(marker);
  });
});
