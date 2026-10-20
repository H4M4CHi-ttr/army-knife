import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import CacheControlTool from "./CacheControlTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";

let wrapper: VueWrapper;
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(CacheControlTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
});
afterEach(() => { wrapper?.unmount(); vi.useRealTimers(); });
const result = () => wrapper.find('[data-testid="cache-control-result"]');

describe("Cache-Control Vapor view", () => {
  it("inspects small edits immediately and discards old output on syntax errors and clear", async () => {
    expect(result().exists()).toBe(false);
    await wrapper.get("#cache-control-input").setValue("public, max-age=60");
    expect(result().text()).toContain("60");
    await wrapper.get("#cache-control-input").setValue('max-age="broken');
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("syntax");
    await wrapper.get('[data-testid="cache-control-sample"]').trigger("click");
    expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="cache-control-clear"]').trigger("click");
    expect(result().exists()).toBe(false);
    expect(wrapper.get<HTMLTextAreaElement>("#cache-control-input").element.value).toBe("");
  });
  it("waits 800ms for long input, supports manual apply and cancels pending work", async () => {
    vi.useFakeTimers();
    const long = `x="${"a".repeat(1024)}", y="${"b".repeat(1024)}", max-age=60`;
    await wrapper.get("#cache-control-input").setValue(long);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(799);
    expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await flushPromises();
    expect(result().exists()).toBe(true);
    await wrapper.get("#cache-control-input").setValue(long + ", public");
    await wrapper.get('[data-testid="cache-control-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await wrapper.get("#cache-control-input").setValue(long + ", no-store");
    await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    expect(result().exists()).toBe(true);
  });
  it("invalidates a previous report after an oversized paste, then recovers on an accepted edit", async () => {
    await wrapper.get('[data-testid="cache-control-sample"]').trigger("click");
    expect(result().exists()).toBe(true);
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    wrapper.get("#cache-control-input").element.dispatchEvent(paste);
    await flushPromises();
    expect(paste.defaultPrevented).toBe(true);
    expect(result().exists()).toBe(false);
    await wrapper.get("#cache-control-input").setValue("no-cache");
    expect(result().exists()).toBe(true);
  });
  it("renders untrusted extension text inertly and never persists it", async () => {
    const marker = "PRIVATE_CACHE_CONTROL_7261";
    const input = `x-note="<img src='https://example.invalid/${marker}'>"`;
    await wrapper.get("#cache-control-input").setValue(input);
    expect(result().text()).toContain(marker);
    expect(result().find("img").exists()).toBe(false);
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(marker);
    expect(location.href).not.toContain(marker);
  });
});
