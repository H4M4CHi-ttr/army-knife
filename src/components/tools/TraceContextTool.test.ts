import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import TraceContextTool from "./TraceContextTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";
import { TRACE_CONTEXT_SAMPLE } from "@/lib/tools/trace-context-sample";
import { traceContextMessages } from "@/i18n/trace-context";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="trace-result"]');
const sample = () => wrapper.get('[data-testid="trace-sample"]').trigger("click");
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(TraceContextTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); });

describe("Trace Context Vapor workflow", () => {
  it("starts empty, applies dual inputs immediately and masks flags", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.get('[data-testid="trace-id"]').text()).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    expect(wrapper.get('[data-testid="trace-sampled"]').text()).toContain("Set");
    settings.preferences.autoApply = false;
    await wrapper.get("#trace-parent-input").setValue(TRACE_CONTEXT_SAMPLE.parent.slice(0, -2) + "02");
    expect(wrapper.get('[data-testid="trace-sampled"]').text()).toContain("Unset");
    expect(wrapper.get('[data-testid="trace-other"]').text()).toContain("02");
    await wrapper.get("#trace-state-input").setValue("a=first,b=second");
    expect(result().text()).toContain("first"); expect(result().text()).not.toContain("t61rcWkgMzE");
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-mode")).toBe("instant");
  });
  it("exports only explicitly and clears both inputs on clear", async () => {
    await sample(); expect(copy).not.toHaveBeenCalled();
    await result().get('.output-actions button').trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toMatchObject({ traceparent: TRACE_CONTEXT_SAMPLE.parent, sampled: true, entries: [{ key: "rojo" }, { key: "congo" }] });
    await wrapper.get('[data-testid="trace-clear"]').trigger("click");
    expect(result().exists()).toBe(false);
    for (const id of ["parent", "state"]) expect(wrapper.get(`#trace-${id}-input`).element).toHaveProperty("value", "");
  });
  it("rejects either input atomically, keeps errors input-free and renders vendor text inert", async () => {
    await sample();
    await wrapper.get("#trace-state-input").setValue("a=<script>alert('PRIVATE_TRACE_9173')</script>");
    expect(result().text()).toContain("<script>"); expect(wrapper.find("script").exists()).toBe(false);
    await wrapper.get("#trace-state-input").setValue("a=PRIVATE_TRACE_9173,a=two");
    expect(result().exists()).toBe(false); expect(wrapper.find('.output-actions').exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_TRACE_9173");
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_TRACE_9173");
    await sample(); await wrapper.get("#trace-parent-input").setValue(""); expect(result().exists()).toBe(false);
    for (const [id, length] of [["parent", 129], ["state", 513]] as const) {
      await sample();
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(length) } });
      wrapper.get(`#trace-${id}-input`).element.dispatchEvent(event); await flushPromises();
      expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
      expect(wrapper.find('.output-actions').exists()).toBe(false);
      await sample(); expect(result().exists()).toBe(true);
    }
  });
  it("translates result and errors in all locales, then discards memory on remount", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await sample(); await nextTick();
      expect(wrapper.text()).toContain(traceContextMessages[locale]["trace.scope"]);
      for (const [parent, state] of [["bad", ""], ["01" + TRACE_CONTEXT_SAMPLE.parent.slice(2), ""], [TRACE_CONTEXT_SAMPLE.parent, "a=1,a=2"], [TRACE_CONTEXT_SAMPLE.parent, ",".repeat(32)]]) {
        await wrapper.get("#trace-parent-input").setValue(parent); await wrapper.get("#trace-state-input").setValue(state);
        expect(wrapper.get('[role="alert"]').text()).not.toContain("errors.TRACE_");
      }
    }
    expect(errors).not.toHaveBeenCalled(); wrapper.unmount(); wrapper = mountTool();
    expect(result().exists()).toBe(false); expect(wrapper.get("#trace-state-input").element).toHaveProperty("value", "");
  });
});
