import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import JsonMergePatchTool from "./JsonMergePatchTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";
import { mergePatchMessages } from "@/i18n/json-merge-patch";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="merge-patch-result"]');
const sample = () => wrapper.get('[data-testid="merge-patch-sample"]').trigger("click");
const json = () => wrapper.get('[data-testid="merge-patch-json"]').text();
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(JsonMergePatchTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("JSON Merge Patch real Vapor workflow", () => {
  it("starts empty and applies object rules and every falsy scalar result immediately", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(JSON.parse(json())).toEqual({ title: "Published", owner: { name: "Aoi" }, tags: ["new"], archived: false });
    for (const value of ["null", "false", "0", '""', "[]"]) {
      await wrapper.get("#merge-patch-patch").setValue(value);
      expect(JSON.parse(json())).toEqual(JSON.parse(value));
      expect(wrapper.get('[data-testid="merge-patch-mode"]').text()).toBe(mergePatchMessages.en["mergePatch.replace"]);
    }
  });
  it("invalidates old results for either invalid or empty input", async () => {
    for (const field of ["target", "patch"]) {
      await sample(); await wrapper.get(`#merge-patch-${field}`).setValue('{"PRIVATE_MERGE_6317":9007199254740993}');
      expect(result().exists()).toBe(false); expect(wrapper.find('.output-actions').exists()).toBe(false);
      expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_MERGE_6317");
      await wrapper.get(`#merge-patch-${field}`).setValue(""); expect(result().exists()).toBe(false);
      expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    }
  });
  it("renders strings inert and copies only the actual merged document explicitly", async () => {
    await wrapper.get("#merge-patch-target").setValue('{"__proto__":{"keep":1},"a":2}');
    await wrapper.get("#merge-patch-patch").setValue('{"__proto__":{"x":"<script>PRIVATE_MERGE_6317</script>"},"a":null}');
    expect(result().text()).toContain("<script>PRIVATE_MERGE_6317</script>");
    expect(result().find('a, script, img').exists()).toBe(false);
    expect(copy).not.toHaveBeenCalled();
    await result().get('.output-actions button').trigger("click"); await flushPromises();
    expect(copy.mock.calls[0]![0]).toBe(json());
    expect(JSON.parse(copy.mock.calls[0]![0])).toEqual(JSON.parse('{"__proto__":{"keep":1,"x":"<script>PRIVATE_MERGE_6317</script>"}}'));
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_MERGE_6317");
  });
  it("tracks rejected edits separately and cannot revive output by editing the other input", async () => {
    for (const field of ["target", "patch"]) {
      await sample();
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(16385) } });
      wrapper.get(`#merge-patch-${field}`).element.dispatchEvent(event); await flushPromises();
      expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
      await wrapper.get(`#merge-patch-${field === "target" ? "patch" : "target"}`).setValue("{}");
      expect(result().exists()).toBe(false); expect(wrapper.find('.output-actions').exists()).toBe(false);
      await wrapper.get(`#merge-patch-${field}`).setValue("{}"); expect(result().exists()).toBe(true);
    }
  });
  it("uses combined size for the 800ms boundary, cancellation, manual apply and disposal", async () => {
    vi.useFakeTimers();
    await wrapper.get("#merge-patch-target").setValue("{}" + " ".repeat(1022));
    await wrapper.get("#merge-patch-patch").setValue("{}" + " ".repeat(1022));
    expect(result().exists()).toBe(true);
    await wrapper.get("#merge-patch-patch").setValue("{}" + " ".repeat(1023));
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(result().exists()).toBe(true);
    await wrapper.get("#merge-patch-target").setValue("{}" + " ".repeat(1023));
    await wrapper.get('[data-testid="merge-patch-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await wrapper.get("#merge-patch-patch").setValue("{}" + " ".repeat(1024));
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await wrapper.get("#merge-patch-patch").setValue("{}" + " ".repeat(1025));
    wrapper.unmount(); wrapper = mountTool(); await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false);
    expect(wrapper.get("#merge-patch-target").element).toHaveProperty("value", "");
    expect(wrapper.get("#merge-patch-patch").element).toHaveProperty("value", "");
  });
  it("localizes rules, root replacement and structure errors in five languages", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await nextTick(); await sample();
      expect(wrapper.text()).toContain(mergePatchMessages[locale]["mergePatch.rules"]);
      await wrapper.get("#merge-patch-patch").setValue("null");
      expect(wrapper.get('[data-testid="merge-patch-mode"]').text()).toBe(mergePatchMessages[locale]["mergePatch.replace"]);
      await wrapper.get("#merge-patch-patch").setValue("[".repeat(33) + "0" + "]".repeat(33));
      expect(wrapper.get('[role="alert"]').text()).toBe(mergePatchMessages[locale]["errors.MERGE_PATCH_DEPTH"]);
      await wrapper.get('[data-testid="merge-patch-clear"]').trigger("click");
      expect(result().exists()).toBe(false);
    }
    expect(errors).not.toHaveBeenCalled();
  });
});
