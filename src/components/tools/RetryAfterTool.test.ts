import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import RetryAfterTool from "./RetryAfterTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="retry-result"]');
const sample = () => wrapper.get('[data-testid="retry-sample"]').trigger("click");
beforeEach(() => {
  copy.mockClear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(RetryAfterTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Retry-After Vapor workflow", () => {
  it("requires both inputs and replaces exact results immediately", async () => {
    expect(result().exists()).toBe(false);
    await sample();
    expect(wrapper.get('[data-testid="retry-seconds"]').text()).toBe("120");
    expect(wrapper.get('[data-testid="retry-milliseconds"]').text()).toBe("119750");
    await wrapper.get("#retry-after-input").setValue("9007199254740993");
    expect(wrapper.get('[data-testid="retry-seconds"]').text()).toBe("9007199254740993");
    expect(result().text()).toContain("Outside supported year range");
    await wrapper.get("#retry-after-reference").setValue("");
    expect(result().exists()).toBe(false);
    await sample(); await wrapper.get('[data-testid="retry-clear"]').trigger("click");
    expect(result().exists()).toBe(false);
  });
  it("only copies explicit exact reports and does not store inputs", async () => {
    await sample();
    expect(copy).not.toHaveBeenCalled();
    await result().get('.output-actions button').trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toMatchObject({ kind: "date", minimumWholeSeconds: "120", waitMilliseconds: "119750", targetUtc: "2026-11-03T00:02:00.000Z" });
    await wrapper.get("#retry-after-input").setValue("PRIVATE_RETRY_INVALID");
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_RETRY_INVALID");
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_RETRY_INVALID");
  });
  it("invalidates exports on rejected edits in either input and recovers with the sample", async () => {
    for (const [selector, text] of [["#retry-after-input", "x".repeat(8193)], ["#retry-after-reference", "x".repeat(65)]]) {
      await sample(); expect(result().exists()).toBe(true);
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => text } });
      wrapper.get(selector!).element.dispatchEvent(event); await flushPromises();
      expect(event.defaultPrevented).toBe(true);
      expect(result().exists()).toBe(false); expect(wrapper.find('.output-actions').exists()).toBe(false);
    }
    await sample(); expect(result().exists()).toBe(true);
  });
  it("waits 800ms, cancels pending work and supports explicit manual apply", async () => {
    vi.useFakeTimers(); await sample();
    const source = "120" + " ".repeat(2100);
    await wrapper.get("#retry-after-input").setValue(source);
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(result().exists()).toBe(true);
    await wrapper.get("#retry-after-input").setValue(source + " ");
    await wrapper.get('[data-testid="retry-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await sample(); expect(result().exists()).toBe(true);
    await wrapper.get("#retry-after-input").setValue(source);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    expect(wrapper.get('[data-testid="retry-milliseconds"]').text()).toBe("120000");
    wrapper.unmount(); await vi.advanceTimersByTimeAsync(1000);
    expect(copy).not.toHaveBeenCalled();
  });
});
