import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import DnsTxtTool from "./DnsTxtTool.vue";
import { i18n } from "@/i18n";
import { dnsTxtMessages } from "@/i18n/dns-txt";
import { defaultPreferences, settings } from "@/lib/preferences";
import { DNS_TXT_SAMPLE_RDATA, DNS_TXT_SAMPLE_TEXT } from "@/lib/tools/dns-txt-sample";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="dns-txt-result"]');
const sample = () => wrapper.get('[data-testid="dns-txt-sample"]').trigger("click");
const mode = (value: string) => wrapper.get("#dns-txt-mode").setValue(value);
const input = (value: string) => wrapper.get("#dns-txt-input").setValue(value);
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(DnsTxtTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("DNS TXT real Vapor workflow", () => {
  it("preserves BOM-only and BOM-prefixed files explicitly dropped into the input", async () => {
    for (const text of ["\ufeff", "\ufeffa"]) {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [new File([text], "synthetic.txt")], getData: () => "" } });
      wrapper.get("#dns-txt-input").element.dispatchEvent(event); await flushPromises();
      expect(wrapper.get('[data-testid="dns-txt-text"] pre').element.textContent).toBe(text);
      expect(wrapper.get('[data-testid="dns-txt-data-bytes"]').text()).toBe(String(new TextEncoder().encode(text).length));
    }
  });
  it("keeps a byte-limit-rejected text drop invalid after the async empty fallback", async () => {
    let respond: ((event: MessageEvent) => void) | null = null;
    class DropWorker {
      onerror = null; onmessageerror = null;
      set onmessage(handler: (event: MessageEvent) => void) { respond = handler; }
      postMessage() {}
      terminate() {}
    }
    vi.stubGlobal("Worker", DropWorker);
    await sample();
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { files: [], getData: () => "é".repeat(4097) } });
    wrapper.get("#dns-txt-input").element.dispatchEvent(event);
    await flushPromises();
    expect(respond).not.toBeNull();
    (respond as unknown as (event: MessageEvent) => void)({ data: { id: 1, ok: false, code: "INPUT_TOO_LARGE" } } as MessageEvent);
    await flushPromises();
    expect(wrapper.get("#dns-txt-input").element).toHaveProperty("value", "");
    expect(result().exists()).toBe(false);
    expect(wrapper.find(".output-actions").exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    await input("accepted"); expect(result().exists()).toBe(true);
    await input(""); expect(result().exists()).toBe(true);
  });
  it("starts untouched, splits the sample, and clears input on mode change", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.get('[data-testid="dns-txt-rdata"] pre').text()).toBe(DNS_TXT_SAMPLE_RDATA);
    expect(wrapper.get('[data-testid="dns-txt-text"] pre').text()).toBe(DNS_TXT_SAMPLE_TEXT);
    expect(wrapper.findAll('[data-testid="dns-txt-segment"]')).toHaveLength(2);
    expect(wrapper.get('[data-testid="dns-txt-data-bytes"]').text()).toBe("257");
    expect(wrapper.get('[data-testid="dns-txt-wire-bytes"]').text()).toBe("259");
    await mode("restore");
    expect(result().exists()).toBe(false);
    expect(wrapper.get("#dns-txt-input").element).toHaveProperty("value", "");
    await sample(); expect(wrapper.get("#dns-txt-input").element).toHaveProperty("value", DNS_TXT_SAMPLE_RDATA);
    expect(wrapper.get('[data-testid="dns-txt-text"] pre').text()).toBe(DNS_TXT_SAMPLE_TEXT);
  });
  it("represents an intentional empty value, including explicit empty text export", async () => {
    await input("x"); await input("");
    expect(result().exists()).toBe(true);
    expect(wrapper.get('[data-testid="dns-txt-rdata"] pre').text()).toBe('""');
    expect(wrapper.get('[data-testid="dns-txt-text"] pre').text()).toBe("");
    await wrapper.get('[data-testid="dns-txt-text"] .output-actions button').trigger("click"); await flushPromises();
    expect(copy).toHaveBeenLastCalledWith("");
    await wrapper.get('[data-testid="dns-txt-clear"]').trigger("click");
    expect(result().exists()).toBe(false);
    await mode("restore"); await input('""');
    expect(result().exists()).toBe(true); await input("");
    expect(result().exists()).toBe(false); expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });
  it("renders inert text and exports only on request with no storage leakage", async () => {
    const text = '<script>PRIVATE_DNS_TXT_5821</script>"\\\n';
    await input(text);
    expect(wrapper.get('[data-testid="dns-txt-text"] pre').element.textContent).toBe(text);
    expect(result().find("script, img, a").exists()).toBe(false);
    expect(copy).not.toHaveBeenCalled();
    await wrapper.get('[data-testid="dns-txt-text"] .output-actions button').trigger("click"); await flushPromises();
    expect(copy).toHaveBeenLastCalledWith(text);
    await wrapper.get('[data-testid="dns-txt-rdata"] .output-actions button').trigger("click"); await flushPromises();
    expect(copy).toHaveBeenLastCalledWith('"<script>PRIVATE_DNS_TXT_5821</script>\\"\\\\\\010"');
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_DNS_TXT_5821");
  });
  it("invalidates exports on rejected edits in both modes and resets with clear/sample", async () => {
    for (const current of ["split", "restore"]) {
      await mode(current); await sample();
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(current === "split" ? 8193 : 65537) } });
      wrapper.get("#dns-txt-input").element.dispatchEvent(event); await flushPromises();
      expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
      expect(wrapper.find(".output-actions").exists()).toBe(false);
      await sample(); expect(result().exists()).toBe(true);
      await wrapper.get('[data-testid="dns-txt-clear"]').trigger("click");
      expect(result().exists()).toBe(false);
    }
  });
  it("keeps light work immediate with auto off and invalidates malformed restoration", async () => {
    settings.preferences.autoApply = false;
    await input("abc"); expect(result().exists()).toBe(true);
    await mode("restore"); await input('"\\227" "\\129\\130"');
    expect(wrapper.get('[data-testid="dns-txt-text"] pre').text()).toBe("あ");
    await input('"\\255"'); expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).not.toContain("errors.DNS_TXT");
  });
  it("delays larger work for 800ms, supports cancel/manual, and disposes pending work", async () => {
    vi.useFakeTimers(); await input("x".repeat(2049));
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(result().exists()).toBe(true);
    await input("y".repeat(2049)); await wrapper.get('[data-testid="dns-txt-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await input("z".repeat(2049));
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await input("q".repeat(2049)); wrapper.unmount(); wrapper = mountTool();
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    expect(wrapper.get("#dns-txt-input").element).toHaveProperty("value", "");
  });
  it("translates modes, result and errors across all five locales", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await nextTick(); await sample();
      expect(wrapper.text()).toContain(dnsTxtMessages[locale]["dnsTxt.scope"]);
      expect(wrapper.text()).toContain(dnsTxtMessages[locale]["dnsTxt.rdata"]);
      await mode("restore");
      for (const value of ["bad", '"\\255"', '"' + "x".repeat(256) + '"', Array(65).fill('""').join(" ")]) {
        await input(value);
        expect(wrapper.get('[role="alert"]').text()).not.toContain("errors.DNS_TXT");
      }
      await mode("split");
    }
    expect(errors).not.toHaveBeenCalled();
  });
});
