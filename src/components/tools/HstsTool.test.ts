import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import HstsTool from "./HstsTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="hsts-result"]');
const sample = () => wrapper.get('[data-testid="hsts-sample"]').trigger("click");
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(HstsTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("HSTS real Vapor workflow", () => {
  it("starts empty, updates exact summaries and clears invalid or zero policy results", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.get('[data-testid="hsts-seconds"]').text()).toBe("31536000");
    await wrapper.get("#hsts-input").setValue("max-age=9007199254740993");
    expect(wrapper.get('[data-testid="hsts-seconds"]').text()).toBe("9007199254740993");
    expect(result().text()).toContain("104249991374");
    await wrapper.get("#hsts-input").setValue("max-age=0; includeSubDomains");
    expect(wrapper.find('[data-testid="hsts-removal"]').exists()).toBe(true);
    await wrapper.get("#hsts-input").setValue("max-age=1; MAX-AGE=2; PRIVATE_HSTS_2731");
    expect(result().exists()).toBe(false); expect(wrapper.find('.output-actions').exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_HSTS_2731");
    await wrapper.get("#hsts-input").setValue(""); expect(result().exists()).toBe(false);
  });
  it("renders extension values inert and copies the complete exact report only on request", async () => {
    await wrapper.get("#hsts-input").setValue('max-age=60; x="<script>PRIVATE_HSTS_2731</script>"; empty=""; flag');
    expect(result().text()).toContain("<script>PRIVATE_HSTS_2731</script>");
    expect(result().find('a, script, img').exists()).toBe(false);
    expect(copy).not.toHaveBeenCalled();
    await result().get('.output-actions button').trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toEqual({
      maxAgeSeconds: "60", duration: { days: "0", hours: 0, minutes: 1, seconds: 0 },
      operation: "declare", includeSubDomains: false, preload: false, emptySlots: 0,
      directives: [{ name: "max-age", value: "60", recognized: true }, { name: "x", value: "<script>PRIVATE_HSTS_2731</script>", recognized: false }, { name: "empty", value: "", recognized: false }, { name: "flag", value: null, recognized: false }],
    });
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_HSTS_2731");
    await wrapper.get('[data-testid="hsts-clear"]').trigger("click"); expect(result().exists()).toBe(false);
  });
  it("invalidates rejected pastes until an accepted edit or example replaces them", async () => {
    await sample();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(4097) } });
    wrapper.get("#hsts-input").element.dispatchEvent(event); await flushPromises();
    expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
    expect(wrapper.find('.output-actions').exists()).toBe(false);
    await wrapper.get("#hsts-input").setValue("max-age=1"); expect(result().exists()).toBe(true);
    await sample(); expect(wrapper.get('[data-testid="hsts-seconds"]').text()).toBe("31536000");
  });
  it("uses the 800ms boundary, cancellation, manual apply and memory disposal", async () => {
    vi.useFakeTimers(); await sample();
    const source = "max-age=1" + " ".repeat(2040);
    await wrapper.get("#hsts-input").setValue(source);
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(result().exists()).toBe(true);
    await wrapper.get("#hsts-input").setValue(source + " ");
    await wrapper.get('[data-testid="hsts-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await wrapper.get("#hsts-input").setValue(source);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    wrapper.unmount(); wrapper = mountTool(); await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false); expect(wrapper.get("#hsts-input").element).toHaveProperty("value", "");
  });
  it("localizes summaries and every parser error in all five languages", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await nextTick(); await sample();
      expect(result().exists()).toBe(true); expect(wrapper.text()).not.toContain("hsts.scope");
      for (const value of ["bad", "max-age=1\n", "max-age=1;x;X", "max-age=1;includeSubDomains=true", "max-age=1" + ";".repeat(64)]) {
        await wrapper.get("#hsts-input").setValue(value);
        expect(wrapper.get('[role="alert"]').text()).not.toContain("errors.HSTS_");
      }
    }
    expect(errors).not.toHaveBeenCalled();
  });
});
