import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import ForwardedTool from "./ForwardedTool.vue";
import { i18n } from "@/i18n";
import { forwardedMessages } from "@/i18n/forwarded";
import { defaultPreferences, settings } from "@/lib/preferences";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="forwarded-result"]');
const sample = () => wrapper.get('[data-testid="forwarded-sample"]').trigger("click");
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(ForwardedTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Forwarded real Vapor workflow", () => {
  it("starts empty, preserves recorded grouping and invalidates duplicate/empty input reports", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.findAll('[data-testid="forwarded-element"]')).toHaveLength(2);
    await wrapper.get("#forwarded-input").setValue(' ,for="[2001:db8::1]:04711";host="example.test:8443",,by=unknown');
    expect(wrapper.findAll('[data-testid="forwarded-element"]')).toHaveLength(2);
    expect(result().text()).toContain("[2001:db8::1]:04711");
    expect(result().text()).toContain("Recorded position 2");
    expect(result().text()).toContain("Recorded position 4");
    await wrapper.get("#forwarded-input").setValue("for=a;FOR=PRIVATE_FORWARDED_2719");
    expect(result().exists()).toBe(false); expect(wrapper.find(".output-actions").exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_FORWARDED_2719");
    await wrapper.get("#forwarded-input").setValue(""); expect(result().exists()).toBe(false);
  });
  it("renders opaque values inert and copies the complete JSON only on explicit request", async () => {
    await wrapper.get("#forwarded-input").setValue('for="not an IP";x="<script>PRIVATE_FORWARDED_2719</script>";empty=""');
    expect(result().text()).toContain("<script>PRIVATE_FORWARDED_2719</script>");
    expect(result().find("a, script, img").exists()).toBe(false); expect(copy).not.toHaveBeenCalled();
    await result().get(".output-actions button").trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toEqual({
      elements: [{ index: 1, parameters: [{ name: "for", value: "not an IP" }, { name: "x", value: "<script>PRIVATE_FORWARDED_2719</script>" }, { name: "empty", value: "" }], emptyParameterSlots: 0 }],
      emptyElements: 0,
    });
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_FORWARDED_2719");
    await wrapper.get('[data-testid="forwarded-clear"]').trigger("click"); expect(result().exists()).toBe(false);
  });
  it("invalidates an oversized rejected paste until accepted edit or sample", async () => {
    await sample();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    wrapper.get("#forwarded-input").element.dispatchEvent(event); await flushPromises();
    expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
    expect(wrapper.find(".output-actions").exists()).toBe(false);
    await wrapper.get("#forwarded-input").setValue("for=a"); expect(result().exists()).toBe(true);
    await sample(); expect(wrapper.findAll('[data-testid="forwarded-element"]')).toHaveLength(2);
  });
  it("waits exactly 800ms, cancels pending work, applies manually and disposes memory", async () => {
    vi.useFakeTimers(); await sample();
    const source = "for=a" + " ".repeat(2044);
    await wrapper.get("#forwarded-input").setValue(source);
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(result().exists()).toBe(true);
    await wrapper.get("#forwarded-input").setValue(source + " ");
    await wrapper.get('[data-testid="forwarded-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await wrapper.get("#forwarded-input").setValue(source);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    wrapper.unmount(); wrapper = mountTool(); await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false); expect(wrapper.get("#forwarded-input").element).toHaveProperty("value", "");
  });
  it("translates known parameter meanings, scope and all parser errors in five languages", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await nextTick(); await sample();
      expect(result().text()).toContain(forwardedMessages[locale]["forwarded.meaning.for"]);
      expect(wrapper.text()).toContain(forwardedMessages[locale]["forwarded.scope"]);
      for (const value of ["bad", "for=a\n", "for=a;FOR=b", ",,;;", "for=a" + ";".repeat(32)]) {
        await wrapper.get("#forwarded-input").setValue(value);
        expect(wrapper.get('[role="alert"]').text()).not.toContain("errors.FORWARDED_");
      }
    }
    expect(errors).not.toHaveBeenCalled();
  });
});
