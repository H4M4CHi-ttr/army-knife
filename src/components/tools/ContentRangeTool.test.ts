import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import ContentRangeTool from "./ContentRangeTool.vue";
import { i18n } from "@/i18n";
import { contentRangeMessages } from "@/i18n/content-range";
import { defaultPreferences, settings } from "@/lib/preferences";
import { CONTENT_RANGE_SAMPLE } from "@/lib/tools/content-range-sample";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="content-range-result"]');
const sample = () => wrapper.get('[data-testid="content-range-sample"]').trigger("click");
const input = (value: string) => wrapper.get("#content-range-input").setValue(value);
const metric = (name: string) => wrapper.get('[data-testid="content-range-' + name + '"]').text();
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(ContentRangeTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Content-Range real Vapor workflow", () => {
  it("starts empty and renders exact recorded interval arithmetic", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.get("#content-range-input").element).toHaveProperty("value", CONTENT_RANGE_SAMPLE);
    expect(metric("first")).toBe("9007199254740993");
    expect(metric("last")).toBe("9007199254741992");
    expect(metric("range-bytes")).toBe("1000");
    expect(metric("after")).toBe("1000");
    expect(metric("whole")).toBe(contentRangeMessages.en["contentRange.no"]);
    await input("bytes 0-0/1");
    expect(metric("range-bytes")).toBe("1"); expect(metric("before")).toBe("0");
    expect(metric("after")).toBe("0"); expect(metric("whole")).toBe(contentRangeMessages.en["contentRange.yes"]);
  });
  it("distinguishes unknown, zero and inapplicable fields without inventing body size", async () => {
    await input("bytes 0-0/*");
    expect(metric("range-bytes")).toBe("1"); expect(metric("before")).toBe("0");
    expect(metric("total")).toBe(contentRangeMessages.en["contentRange.unknown"]);
    expect(metric("after")).toBe(contentRangeMessages.en["contentRange.unknown"]);
    expect(metric("whole")).toBe(contentRangeMessages.en["contentRange.unknown"]);
    await input("bytes */0");
    expect(metric("total")).toBe("0");
    for (const key of ["first", "last", "range-bytes", "before", "after", "whole"]) {
      expect(metric(key)).toBe(contentRangeMessages.en["contentRange.notApplicable"]);
    }
    expect(result().text()).toContain(contentRangeMessages.en["contentRange.unsatisfiedHelp"]);
  });
  it("exports complete exact JSON only on explicit request and rejects inert hostile input", async () => {
    await sample(); expect(copy).not.toHaveBeenCalled();
    await result().get(".output-actions button").trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toEqual({
      unit: "bytes", kind: "range", canonical: CONTENT_RANGE_SAMPLE.slice(15),
      first: "9007199254740993", last: "9007199254741992", rangeBytes: "1000",
      completeLength: "9007199254742993", bytesBefore: "9007199254740993", bytesAfter: "1000",
      coversWholeRepresentation: false,
    });
    await input("<img src=https://example.invalid/PRIVATE_CONTENT_RANGE_4196>");
    expect(result().exists()).toBe(false); expect(wrapper.find(".output-actions").exists()).toBe(false);
    expect(wrapper.find("img, script").exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_CONTENT_RANGE_4196");
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_CONTENT_RANGE_4196");
  });
  it("removes stale exports on rejected paste and recovers only through accepted input/sample/clear", async () => {
    await sample();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(257) } });
    wrapper.get("#content-range-input").element.dispatchEvent(event); await flushPromises();
    expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
    expect(wrapper.find(".output-actions").exists()).toBe(false);
    await input("bytes 0-0/1"); expect(result().exists()).toBe(true);
    await input("bytes 9-8/10"); expect(result().exists()).toBe(false);
    await sample(); expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="content-range-clear"]').trigger("click");
    expect(result().exists()).toBe(false); expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
  it("reads explicit local files and rejects BOM, invalid UTF-8 and oversized files atomically", async () => {
    const drop = async (file: File) => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [file], getData: () => "" } });
      wrapper.get("#content-range-input").element.dispatchEvent(event); await flushPromises();
    };
    await drop(new File(["bytes 0-0/1"], "synthetic.txt"));
    expect(metric("range-bytes")).toBe("1");
    for (const value of ["\ufeffbytes 0-0/1", Uint8Array.of(255), "x".repeat(257)]) {
      await sample(); await drop(new File([value], "synthetic.txt"));
      expect(result().exists()).toBe(false);
      expect(wrapper.find(".output-actions").exists()).toBe(false);
      expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    }
    await sample(); expect(result().exists()).toBe(true);
  });
  it("always applies this bounded workload immediately with deferred auto-apply off", async () => {
    settings.preferences.autoApply = false;
    await input("bytes 0-0/1" + " ".repeat(245));
    expect(result().exists()).toBe(true);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-mode")).toBe("instant");
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("applied");
    await input(""); expect(result().exists()).toBe(false);
  });
  it("translates all result states/errors in five locales and clears on remount", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await nextTick(); await sample();
      expect(wrapper.text()).toContain(contentRangeMessages[locale]["contentRange.scope"]);
      await input("bytes 0-0/*"); expect(metric("whole")).toBe(contentRangeMessages[locale]["contentRange.unknown"]);
      await input("bytes */0"); expect(metric("range-bytes")).toBe(contentRangeMessages[locale]["contentRange.notApplicable"]);
      for (const value of ["bad", "bytes 1-0/2", "bytes 0-" + "9".repeat(41) + "/*"]) {
        await input(value); expect(wrapper.get('[role="alert"]').text()).not.toContain("errors.CONTENT_RANGE");
      }
    }
    expect(errors).not.toHaveBeenCalled();
    wrapper.unmount(); wrapper = mountTool();
    expect(wrapper.get("#content-range-input").element).toHaveProperty("value", "");
    expect(result().exists()).toBe(false);
  });
});
