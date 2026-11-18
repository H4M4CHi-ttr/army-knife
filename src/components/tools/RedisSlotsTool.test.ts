import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import RedisSlotsTool from "./RedisSlotsTool.vue";
import { i18n } from "@/i18n";
import { redisSlotsMessages } from "@/i18n/redis-slots";
import { defaultPreferences, settings } from "@/lib/preferences";
import { inspectRedisSlots } from "@/lib/tools/redis-slots";
import { REDIS_SLOTS_SAMPLE } from "@/lib/tools/redis-slots-sample";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="redis-slots-result"]');
const sample = () => wrapper.get('[data-testid="redis-slots-sample"]').trigger("click");
const input = (value: string) => wrapper.get("#redis-slots-input").setValue(value);
const state = () => wrapper.get('[data-testid="apply-control"]').attributes("data-status");
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(RedisSlotsTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Redis slots real Vapor view", () => {
  it("starts empty; displays sample, empty key and exact tag/CRC/slot", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.get("#redis-slots-input").element).toHaveProperty("value", REDIS_SLOTS_SAMPLE);
    expect(wrapper.findAll('[data-testid="redis-slots-key"]')).toHaveLength(5);
    expect(wrapper.get('[data-testid="redis-slots-key"]').text()).toContain('"user1000"');
    expect(wrapper.get('[data-testid="redis-slots-slot"]').text()).toBe("3443");
    await input('[""]'); expect(wrapper.get('[data-testid="redis-slots-slot"]').text()).toBe("0");
    expect(wrapper.get('[data-testid="redis-slots-same"]').text()).toBe(redisSlotsMessages.en["redis.same"]);
    await input('["foo", "bar"]');
    expect(wrapper.get('[data-testid="redis-slots-same"]').text()).toBe(redisSlotsMessages.en["redis.different"]);
  });
  it("shows a labelled 32-row preview but explicitly copies every row", async () => {
    settings.preferences.autoApply = false;
    const value = JSON.stringify(Array.from({ length: 128 }, (_, i) => "k" + i));
    await input(value);
    expect(wrapper.findAll('[data-testid="redis-slots-key"]')).toHaveLength(32);
    expect(wrapper.get("caption").text()).toContain("32"); expect(wrapper.get("caption").text()).toContain("128");
    expect(copy).not.toHaveBeenCalled(); await result().get(".output-actions button").trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toEqual(inspectRedisSlots(value));
  });
  it("renders controls/hostile strings as inert JSON and invalidates malformed/rejected input", async () => {
    const privateKey = '<img src="https://example.invalid/PRIVATE_REDIS_175">\u0000\r\n\u202e\u200b';
    await input(JSON.stringify([privateKey]));
    expect(wrapper.find("img, script").exists()).toBe(false);
    expect(result().text()).toContain("\\u0000\\r\\n\\u202e\\u200b");
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_REDIS_175");
    await input('["valid", 1]'); expect(result().exists()).toBe(false);
    expect(wrapper.find(".output-actions").exists()).toBe(false);
    await sample();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    wrapper.get("#redis-slots-input").element.dispatchEvent(event); await flushPromises();
    expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
    expect(wrapper.find(".output-actions").exists()).toBe(false);
    await input('["valid"]'); expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="redis-slots-clear"]').trigger("click"); expect(result().exists()).toBe(false);
  });
  it("imports bounded UTF-8 locally, preserving BOM and rejecting invalid bytes", async () => {
    const drop = async (bytes: string | Uint8Array<ArrayBuffer>) => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [new File([bytes], "synthetic.json")], getData: () => "" } });
      wrapper.get("#redis-slots-input").element.dispatchEvent(event); await flushPromises();
    };
    await drop('["123456789"]'); expect(wrapper.get('[data-testid="redis-slots-slot"]').text()).toBe("12739");
    for (const bad of ['\ufeff["a"]', Uint8Array.of(255), "x".repeat(8193)]) {
      await sample(); await drop(bad); expect(result().exists()).toBe(false);
      expect(wrapper.find(".output-actions").exists()).toBe(false);
    }
  });
  it("executes small input immediately with auto off; supports 800ms/manual/cancel", async () => {
    vi.useFakeTimers(); settings.preferences.autoApply = false;
    await input('["foo"]'); expect(state()).toBe("applied");
    const value = '["foo"]' + " ".repeat(2100);
    await input(value); expect(state()).toBe("manual"); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(900); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(state()).toBe("applied");
    await input(value + " "); settings.preferences.autoApply = true; await nextTick();
    expect(state()).toBe("pending");
    await wrapper.get('[data-testid="redis-slots-cancel"]').trigger("click"); expect(state()).toBe("cancelled");
    await vi.advanceTimersByTimeAsync(900); expect(result().exists()).toBe(false);
    await input(value + "  "); await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await nextTick(); expect(result().exists()).toBe(true);
    await input(value); wrapper.unmount(); await vi.advanceTimersByTimeAsync(1000);
    wrapper = mountTool(); expect(result().exists()).toBe(false);
  });
  it("hides exports from the start of an import and discards superseded file reads", async () => {
    let complete!: (value: ArrayBuffer) => void;
    const drop = async () => {
      const file = new File(['["foo"]'], "synthetic.json");
      Object.defineProperty(file, "arrayBuffer", { value: () => new Promise<ArrayBuffer>(resolve => { complete = resolve; }) });
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [file], getData: () => "" } });
      wrapper.get("#redis-slots-input").element.dispatchEvent(event); await nextTick();
    };
    await sample(); await drop();
    expect(result().exists()).toBe(false); expect(wrapper.find(".output-actions").exists()).toBe(false);
    expect(wrapper.get("#redis-slots-input").attributes("disabled")).toBeDefined();
    complete(new TextEncoder().encode('["foo"]').buffer); await flushPromises();
    expect(wrapper.get('[data-testid="redis-slots-slot"]').text()).toBe("12182");
    await drop(); await sample();
    complete(new TextEncoder().encode('["foo"]').buffer); await flushPromises();
    expect(wrapper.get("#redis-slots-input").element).toHaveProperty("value", REDIS_SLOTS_SAMPLE);
    expect(wrapper.get('[data-testid="redis-slots-slot"]').text()).toBe("3443");
  });
  it("translates all statuses/errors in five languages and clears on remount", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await nextTick(); await sample();
      expect(wrapper.text()).toContain(redisSlotsMessages[locale]["redis.scope"]);
      for (const value of ["bad", "[1]", "[]", '["\\ud800"]', JSON.stringify(["x".repeat(1025)])]) {
        await input(value); expect(wrapper.get('[role="alert"]').text()).not.toContain("errors.REDIS");
      }
    }
    expect(errors).not.toHaveBeenCalled(); wrapper.unmount(); wrapper = mountTool();
    expect(wrapper.get("#redis-slots-input").element).toHaveProperty("value", ""); expect(result().exists()).toBe(false);
  });
});
