import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import PgTextArrayTool from "./PgTextArrayTool.vue";
import { i18n } from "@/i18n";
import { pgTextArrayMessages } from "@/i18n/pg-text-array";
import { defaultPreferences, settings } from "@/lib/preferences";
import { PG_TEXT_ARRAY_SAMPLE, PG_TEXT_ARRAY_SAMPLE_JSON } from "@/lib/tools/pg-text-array-sample";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="pg-array-result"]');
const sample = () => wrapper.get('[data-testid="pg-array-sample"]').trigger("click");
const mode = (value: string) => wrapper.get("#pg-array-mode").setValue(value);
const input = (value: string) => wrapper.get("#pg-array-input").setValue(value);
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(PgTextArrayTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("PostgreSQL text-array real Vapor workflow", () => {
  it("starts empty and distinguishes sample null, string NULL, empty and escaped text", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.get("#pg-array-input").element).toHaveProperty("value", PG_TEXT_ARRAY_SAMPLE);
    expect(wrapper.get('[data-testid="pg-array-count"]').text()).toBe("7");
    expect(wrapper.get('[data-testid="pg-array-nulls"]').text()).toBe("1");
    expect(wrapper.get('[data-testid="pg-array-empty"]').text()).toBe("1");
    expect(JSON.parse(wrapper.get('[data-testid="pg-array-json"] pre').element.textContent!)).toEqual(["a,b", null, "NULL", "", 'a"b', "c\\d", "日本語"]);
    expect(wrapper.get('[data-testid="pg-array-array"] pre').element.textContent).toBe(PG_TEXT_ARRAY_SAMPLE);
  });
  it("clears on mode change and encodes JSON without changing string values", async () => {
    await sample(); await mode("encode");
    expect(result().exists()).toBe(false); expect(wrapper.get("#pg-array-input").element).toHaveProperty("value", "");
    await sample(); expect(wrapper.get("#pg-array-input").element).toHaveProperty("value", PG_TEXT_ARRAY_SAMPLE_JSON);
    expect(wrapper.get('[data-testid="pg-array-array"] pre').element.textContent).toBe(PG_TEXT_ARRAY_SAMPLE);
  });
  it("shows explicit zero-dimensional empty arrays in both directions", async () => {
    for (const [operation, value] of [["decode", "{}"], ["encode", "[]"]]) {
      await mode(operation!); await input(value!);
      expect(wrapper.get('[data-testid="pg-array-count"]').text()).toBe("0");
      expect(wrapper.get('[data-testid="pg-array-zero-dim"]').text()).toBe(pgTextArrayMessages.en["pgArray.zeroDimensions"]);
      expect(wrapper.get('[data-testid="pg-array-json"] pre').text()).toBe("[]");
      expect(wrapper.get('[data-testid="pg-array-array"] pre').text()).toBe("{}");
    }
    await input(""); expect(result().exists()).toBe(false);
  });
  it("renders inert text and copies complete outputs only on request without persistence", async () => {
    await input('{"<script>PRIVATE_PG_ARRAY_7301</script>",NULL,""}');
    expect(wrapper.find("script, img, a").exists()).toBe(false); expect(copy).not.toHaveBeenCalled();
    await wrapper.get('[data-testid="pg-array-json"] .output-actions button').trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toEqual(["<script>PRIVATE_PG_ARRAY_7301</script>", null, ""]);
    await wrapper.get('[data-testid="pg-array-array"] .output-actions button').trigger("click"); await flushPromises();
    expect(copy).toHaveBeenLastCalledWith('{"<script>PRIVATE_PG_ARRAY_7301</script>",NULL,""}');
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_PG_ARRAY_7301");
  });
  it("labels the item preview and keeps all 40 values in exported JSON", async () => {
    await mode("encode"); await input(JSON.stringify(Array(40).fill("item")));
    expect(wrapper.findAll('[data-testid="pg-array-item"]')).toHaveLength(32);
    expect(wrapper.get("caption").text()).toContain("32"); expect(wrapper.get("caption").text()).toContain("40");
    await wrapper.get('[data-testid="pg-array-json"] .output-actions button').trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toEqual(Array(40).fill("item"));
  });
  it("invalidates stale outputs on malformed input and rejected edits in both modes", async () => {
    for (const operation of ["decode", "encode"]) {
      await mode(operation); await sample(); await input(operation === "decode" ? "{x,}" : "[1]");
      expect(result().exists()).toBe(false); expect(wrapper.find(".output-actions").exists()).toBe(false);
      await sample();
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
      wrapper.get("#pg-array-input").element.dispatchEvent(event); await flushPromises();
      expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
      expect(wrapper.find(".output-actions").exists()).toBe(false);
      await sample(); expect(result().exists()).toBe(true);
      await wrapper.get('[data-testid="pg-array-clear"]').trigger("click"); expect(result().exists()).toBe(false);
    }
  });
  it("preserves a dropped BOM and refuses it as outer syntax in either mode", async () => {
    for (const operation of ["decode", "encode"]) {
      await mode(operation); await sample();
      const text = "\ufeff" + (operation === "decode" ? "{}" : "[]");
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [new File([text], "synthetic.txt")], getData: () => "" } });
      wrapper.get("#pg-array-input").element.dispatchEvent(event); await flushPromises();
      expect(wrapper.get("#pg-array-input").element).toHaveProperty("value", text);
      expect(result().exists()).toBe(false); expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    }
  });
  it("keeps short calculations immediate with saved auto-apply off and no number rounding", async () => {
    settings.preferences.autoApply = false; await input("{1,9007199254740993}");
    expect(JSON.parse(wrapper.get('[data-testid="pg-array-json"] pre').element.textContent!)).toEqual(["1", "9007199254740993"]);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("applied");
  });
  it("delays by 800ms, cancels, applies manually and discards pending work on mode change/disposal", async () => {
    vi.useFakeTimers(); await input('{"' + "x".repeat(2049) + '"}');
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(result().exists()).toBe(true);
    await input('{"' + "y".repeat(2049) + '"}'); await wrapper.get('[data-testid="pg-array-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    settings.preferences.autoApply = false; await input('{"' + "z".repeat(2049) + '"}');
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    settings.preferences.autoApply = true; await input('{"' + "q".repeat(2049) + '"}'); await mode("encode");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await input('["' + "q".repeat(2049) + '"]'); wrapper.unmount(); wrapper = mountTool();
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    expect(wrapper.get("#pg-array-input").element).toHaveProperty("value", "");
  });
  it("localizes results and supported error states in all five locales", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await nextTick(); await mode("decode"); await sample();
      expect(wrapper.text()).toContain(pgTextArrayMessages[locale]["pgArray.scope"]);
      await input("{{x}}"); expect(wrapper.get('[role="alert"]').text()).toBe(pgTextArrayMessages[locale]["errors.PG_ARRAY_DIMENSIONS"]);
      await mode("encode"); await input("[1]");
      expect(wrapper.get('[role="alert"]').text()).toBe(pgTextArrayMessages[locale]["errors.PG_ARRAY_JSON_SHAPE"]);
    }
    expect(errors).not.toHaveBeenCalled();
  });
});
