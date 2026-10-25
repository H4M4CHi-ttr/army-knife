import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import IdnTool from "./IdnTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";

let wrapper: VueWrapper;
const long = [63, 63, 40].map(n => "a".repeat(n)).join(".");
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(IdnTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
});
afterEach(() => { wrapper?.unmount(); vi.useRealTimers(); });
const result = () => wrapper.find('[data-testid="idn-result"]');

describe("IDN Vapor view", () => {
  it("updates instantly, explains mapping and clears invalid and empty results", async () => {
    expect(result().exists()).toBe(false);
    await wrapper.get("#idn-input").setValue("bücher。example");
    expect(wrapper.get('[data-testid="idn-ascii"]').text()).toBe("xn--bcher-kva.example");
    expect(wrapper.get('[data-testid="idn-unicode"]').text()).toBe("bücher.example");
    expect(result().text()).toContain("normalized");
    await wrapper.get("#idn-input").setValue("pаypal.example");
    expect(result().text()).toContain("Multiple scripts");
    await wrapper.get("#idn-input").setValue("https://example.com");
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("domain");
    await wrapper.get('[data-testid="idn-sample"]').trigger("click");
    expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="idn-clear"]').trigger("click");
    expect(wrapper.get<HTMLTextAreaElement>("#idn-input").element.value).toBe("");
    expect(result().exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
  it("delays, cancels, manually applies and disposes pending work", async () => {
    vi.useFakeTimers();
    await wrapper.get("#idn-input").setValue(long);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(result().exists()).toBe(true);
    await wrapper.get("#idn-input").setValue(long + "b");
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="idn-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await wrapper.get("#idn-input").setValue(long + "c");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(true);
    await wrapper.get("#idn-input").setValue(long + "d");
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(1000); expect(vi.getTimerCount()).toBe(0);
  });
  it("invalidates rejected paste and never renders links or persists domain input", async () => {
    await wrapper.get('[data-testid="idn-sample"]').trigger("click");
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "x".repeat(2049) } });
    wrapper.get("#idn-input").element.dispatchEvent(paste); await flushPromises();
    expect(paste.defaultPrevented).toBe(true);
    expect(result().exists()).toBe(false);
    expect(wrapper.find('[data-testid="output-download"]').exists()).toBe(false);
    await wrapper.get("#idn-input").setValue("PRIVATE_IDN_9167.example");
    expect(result().exists()).toBe(false);
    await wrapper.get("#idn-input").setValue("private-idn-9167.example");
    expect(result().exists()).toBe(true);
    expect(wrapper.find("a").exists()).toBe(false);
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("idn-9167");
  });
  it("rejects file drops immediately without reading them or retaining old exports", async () => {
    await wrapper.get('[data-testid="idn-sample"]').trigger("click");
    const file = new File(["new.example"], "domain.txt", { type: "text/plain" });
    const read = vi.fn(() => new Promise<ArrayBuffer>(() => {}));
    Object.defineProperty(file, "arrayBuffer", { value: read });
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", { value: { files: [file], getData: () => "" } });
    wrapper.get("#idn-input").element.dispatchEvent(drop); await flushPromises();
    expect(drop.defaultPrevented).toBe(true);
    expect(result().exists()).toBe(false);
    expect(wrapper.get("#idn-input").attributes("disabled")).toBeUndefined();
    expect(read).not.toHaveBeenCalled();
    await wrapper.get("#idn-input").setValue("new.example");
    expect(result().exists()).toBe(true);
  });
});
