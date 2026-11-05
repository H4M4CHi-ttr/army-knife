import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import HttpLinkTool from "./HttpLinkTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="link-result"]');
const sample = () => wrapper.get('[data-testid="link-sample"]').trigger("click");
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(HttpLinkTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Link inspector real Vapor workflow", () => {
  it("starts empty and replaces unresolved relations/attributes immediately", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.findAll('[data-testid="link-entry"]')).toHaveLength(3);
    await wrapper.get("#http-link-input").setValue('</x>; REL="next prev"; rel=last; x; empty=""');
    expect(wrapper.get('[data-testid="link-relations"]').text()).toBe("next · prev");
    expect(result().text()).toContain("rel"); expect(result().text()).toContain("Valueless");
    await wrapper.get("#http-link-input").setValue("<>");
    expect(result().text()).toContain("Missing rel");
    await wrapper.get("#http-link-input").setValue("bad PRIVATE_LINK_7193");
    expect(result().exists()).toBe(false); expect(wrapper.find('.output-actions').exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_LINK_7193");
  });
  it("renders malicious values inert and exports exact data only on explicit copy", async () => {
    await wrapper.get("#http-link-input").setValue('<javascript:alert(1)>; rel=next; title="<script>PRIVATE_LINK_7193</script>"');
    expect(result().text()).toContain("<script>PRIVATE_LINK_7193</script>");
    expect(result().find('a, script, img').exists()).toBe(false);
    expect(copy).not.toHaveBeenCalled();
    await result().get('.output-actions button').trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toMatchObject({ links: [{ target: "javascript:alert(1)", relations: ["next"], parameters: [{ name: "rel", value: "next" }, { name: "title", value: "<script>PRIVATE_LINK_7193</script>" }] }] });
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_LINK_7193");
    await wrapper.get('[data-testid="link-clear"]').trigger("click"); expect(result().exists()).toBe(false);
  });
  it("invalidates a rejected paste and recovers from it", async () => {
    await sample();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    wrapper.get("#http-link-input").element.dispatchEvent(event); await flushPromises();
    expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
    expect(wrapper.find('.output-actions').exists()).toBe(false);
    await sample(); expect(result().exists()).toBe(true);
  });
  it("waits 800ms, cancels pending work, applies manually and disposes memory", async () => {
    vi.useFakeTimers(); await sample();
    const source = '</x>; rel=next' + " ".repeat(2100);
    await wrapper.get("#http-link-input").setValue(source);
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(result().exists()).toBe(true);
    await wrapper.get("#http-link-input").setValue(source + " ");
    await wrapper.get('[data-testid="link-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await wrapper.get("#http-link-input").setValue(source);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    wrapper.unmount(); wrapper = mountTool(); await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false); expect(wrapper.get("#http-link-input").element).toHaveProperty("value", "");
  });
  it("localizes structure and errors in all five languages", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await nextTick(); await sample();
      expect(result().exists()).toBe(true); expect(wrapper.text()).not.toContain("link.scope");
      for (const value of ["bad", '</x>;rel=""', ','.repeat(64)]) {
        await wrapper.get("#http-link-input").setValue(value);
        expect(wrapper.get('[role="alert"]').text()).not.toContain("errors.LINK_");
      }
    }
    expect(errors).not.toHaveBeenCalled();
  });
});
