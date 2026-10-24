import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import HttpRangeTool from "./HttpRangeTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";

let wrapper: VueWrapper;
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(HttpRangeTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
});
afterEach(() => { wrapper?.unmount(); vi.useRealTimers(); });
const result = () => wrapper.find('[data-testid="range-result"]');
const long = "bytes=" + Array(32).fill("0".repeat(39) + "1-" + "9".repeat(40)).join(",");

describe("HTTP byte range Vapor view", () => {
  it("updates on either input and clears invalid or incomplete results and exports", async () => {
    expect(result().exists()).toBe(false);
    await wrapper.get("#http-range-input").setValue("bytes=0-99");
    expect(result().exists()).toBe(false);
    await wrapper.get("#http-range-length").setValue("1000");
    expect(wrapper.get('[data-testid="range-covered"]').text()).toBe("100");
    await wrapper.get("#http-range-length").setValue("10");
    expect(wrapper.get('[data-testid="range-covered"]').text()).toBe("10");
    await wrapper.get("#http-range-input").setValue("bytes=5-4");
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("Invalid");
    await wrapper.get('[data-testid="range-sample"]').trigger("click");
    expect(wrapper.get('[data-testid="range-covered"]').text()).toBe("200");
    await wrapper.get("#http-range-length").setValue("");
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="range-clear"]').trigger("click");
    expect(wrapper.get<HTMLTextAreaElement>("#http-range-input").element.value).toBe("");
    expect(wrapper.get<HTMLTextAreaElement>("#http-range-length").element.value).toBe("");
  });
  it("shows empty suffix semantics without negative offsets and exact large values", async () => {
    await wrapper.get("#http-range-input").setValue("bytes=-1");
    await wrapper.get("#http-range-length").setValue("0");
    expect(result().text()).toContain("Satisfiable, empty representation");
    expect(result().text()).not.toContain("0--1");
    await wrapper.get("#http-range-length").setValue("9007199254740997");
    expect(result().text()).toContain("bytes 9007199254740996-9007199254740996/9007199254740997");
  });
  it("delays, cancels, manually applies and disposes scheduled work", async () => {
    vi.useFakeTimers();
    await wrapper.get("#http-range-length").setValue("9".repeat(40));
    await wrapper.get("#http-range-input").setValue(long);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(result().exists()).toBe(true);
    await wrapper.get("#http-range-length").setValue("8".repeat(40));
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="range-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await wrapper.get("#http-range-length").setValue("7".repeat(40));
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(true);
    await wrapper.get("#http-range-length").setValue("6".repeat(40));
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(1000); expect(vi.getTimerCount()).toBe(0);
  });
  it.each(["#http-range-input", "#http-range-length"])("invalidates rejected paste in %s and keeps data memory-only", async (selector) => {
    await wrapper.get('[data-testid="range-sample"]').trigger("click");
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    wrapper.get(selector).element.dispatchEvent(paste); await flushPromises();
    expect(paste.defaultPrevented).toBe(true);
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="range-sample"]').trigger("click");
    expect(result().exists()).toBe(true);
    await wrapper.get("#http-range-input").setValue("<img src='https://example.invalid/PRIVATE_RANGE_51'>");
    expect(result().exists()).toBe(false);
    expect(wrapper.find("img").exists()).toBe(false);
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_RANGE_51");
  });
  it.each([
    ["#http-range-input", "#http-range-length", "2000", "bytes=0-49"],
    ["#http-range-length", "#http-range-input", "bytes=0-49", "2000"],
  ])("keeps a rejected %s invalid when only the other field is edited", async (rejectedField, otherField, otherValue, recoveryValue) => {
    await wrapper.get('[data-testid="range-sample"]').trigger("click");
    const reject = async () => {
      const paste = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(paste, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
      wrapper.get(rejectedField!).element.dispatchEvent(paste); await flushPromises();
    };
    await reject(); expect(result().exists()).toBe(false);
    await wrapper.get(otherField!).setValue(otherValue!);
    expect(result().exists()).toBe(false);
    await reject(); expect(result().exists()).toBe(false);
    await wrapper.get(rejectedField!).setValue(recoveryValue!);
    expect(result().exists()).toBe(true);
  });
});
