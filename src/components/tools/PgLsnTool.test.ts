import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import PgLsnTool from "./PgLsnTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";
import { pgLsnMessages } from "@/i18n/pg-lsn";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="pg-lsn-result"]');
const sample = () => wrapper.get('[data-testid="pg-lsn-sample"]').trigger("click");
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(PgLsnTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); });

describe("PostgreSQL LSN Vapor workflow", () => {
  it("starts empty and immediately replaces either position and segment option with auto-apply off", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.get('[data-testid="pg-lsn-delta"]').text()).toBe("33554432");
    settings.preferences.autoApply = false;
    await wrapper.get("#pg-lsn-first").setValue("200000/1");
    await wrapper.get("#pg-lsn-second").setValue("200000/2");
    expect(wrapper.get('[data-testid="pg-lsn-delta"]').text()).toBe("1");
    expect(result().text()).toContain("9007199254740993");
    await wrapper.get("#pg-lsn-segment").setValue("1");
    expect(result().text()).toContain("8589934592");
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-mode")).toBe("instant");
    await wrapper.get("#pg-lsn-second").setValue("200000/0");
    expect(wrapper.get('[data-testid="pg-lsn-delta"]').text()).toBe("-1");
    expect(result().text()).toContain(pgLsnMessages.en["lsn.backward"]);
  });
  it("exports a complete exact report only on request and resets all fields on clear", async () => {
    await sample(); expect(copy).not.toHaveBeenCalled();
    await result().get('.output-actions button').trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toMatchObject({ deltaBytes: "33554432", segmentMiB: 16, first: { lsn: "0/FF000000", segmentNumber: "255" }, second: { lsn: "1/1000000", segmentOffsetBytes: "0" } });
    await wrapper.get("#pg-lsn-segment").setValue("1024");
    await wrapper.get('[data-testid="pg-lsn-clear"]').trigger("click");
    expect(result().exists()).toBe(false);
    for (const id of ["first", "second"]) expect(wrapper.get(`#pg-lsn-${id}`).element).toHaveProperty("value", "");
    expect(wrapper.get("#pg-lsn-segment").element).toHaveProperty("value", "16");
  });
  it("invalidates stale exports on either malformed or rejected edit and recovers only after replacement", async () => {
    for (const id of ["first", "second"]) {
      await sample(); await wrapper.get(`#pg-lsn-${id}`).setValue("<img src=https://example.invalid/PRIVATE_LSN>");
      expect(result().exists()).toBe(false); expect(wrapper.find(".output-actions").exists()).toBe(false);
      expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_LSN");
      expect(wrapper.find("img").exists()).toBe(false);
      await sample();
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(65) } });
      wrapper.get(`#pg-lsn-${id}`).element.dispatchEvent(event); await flushPromises();
      expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
      await wrapper.get("#pg-lsn-segment").setValue("32"); expect(result().exists()).toBe(false);
      await wrapper.get(`#pg-lsn-${id}`).setValue("1/0"); expect(result().exists()).toBe(true);
      await wrapper.get(`#pg-lsn-${id}`).setValue(""); expect(result().exists()).toBe(false);
    }
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_LSN");
  });
  it("localizes all states and zero sentinel in five locales without compiler errors; remount clears data", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await sample(); await nextTick();
      const m = pgLsnMessages[locale]; expect(wrapper.text()).toContain(m["lsn.scope"]);
      await wrapper.get("#pg-lsn-first").setValue("0/0");
      expect(result().text()).toContain(m["lsn.zero"]);
      await wrapper.get("#pg-lsn-second").setValue("0/0"); expect(result().text()).toContain(m["lsn.equal"]);
      await wrapper.get("#pg-lsn-second").setValue("bad"); expect(wrapper.get('[role="alert"]').text()).toBe(m["errors.PG_LSN_SYNTAX"]);
    }
    expect(errors).not.toHaveBeenCalled(); await sample(); wrapper.unmount(); wrapper = mountTool();
    expect(result().exists()).toBe(false); expect(wrapper.get("#pg-lsn-first").element).toHaveProperty("value", "");
  });
});
