import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import HttpAcceptTool from "./HttpAcceptTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";
import { ACCEPT_SAMPLE } from "@/lib/tools/http-accept-sample";
let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="accept-result"]');
const sample = () => wrapper.get('[data-testid="accept-sample"]').trigger("click");
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(HttpAcceptTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
async function reject(selector: string) {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
  wrapper.get(selector).element.dispatchEvent(event); await flushPromises();
  expect(event.defaultPrevented).toBe(true);
}
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("HTTP Accept real Vapor workflow", () => {
  it("starts empty and immediately evaluates specificity, weights and invalidation from either input", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.get('[data-testid="accept-selected"]').text()).toBe("application/json");
    expect(wrapper.get('[data-testid="accept-offer-1"]').text()).toContain("Excluded by q=0");
    await wrapper.get("#http-accept-input").setValue("text/plain;q=0.001");
    expect(wrapper.get('[data-testid="accept-selected"]').text()).toBe("text/plain; charset=utf-8");
    expect(wrapper.get('[data-testid="accept-offer-2"]').text()).toContain("0.001");
    await wrapper.get("#http-accept-input").setValue("bad");
    expect(result().exists()).toBe(false); expect(wrapper.find('.output-actions').exists()).toBe(false);
    await sample(); await wrapper.get("#accept-offers").setValue("text/*");
    expect(result().exists()).toBe(false); expect(wrapper.get('[role="alert"]').text()).toContain("concrete");
    await wrapper.get("#accept-offers").setValue(""); expect(result().exists()).toBe(false);
  });
  it("distinguishes empty present and absent fields and restores disabled input state", async () => {
    await wrapper.get("#accept-offers").setValue("text/plain\napplication/json");
    expect(wrapper.find('[data-testid="accept-none"]').exists()).toBe(true);
    expect(result().text()).toContain("HTTP 406");
    await wrapper.get('[data-testid="accept-absent"]').setValue(true);
    expect(wrapper.get("#http-accept-input").attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-testid="accept-selected"]').text()).toBe("text/plain");
    await wrapper.get('[data-testid="accept-absent"]').setValue(false);
    expect(wrapper.find('[data-testid="accept-none"]').exists()).toBe(true);
  });
  it("renders quoted values inert and exports the complete exact report only on request", async () => {
    const input = 'text/plain;profile="<script>PRIVATE_ACCEPT_4819</script>"';
    await wrapper.get("#http-accept-input").setValue(input); await wrapper.get("#accept-offers").setValue(input);
    expect(result().text()).toContain("PRIVATE_ACCEPT_4819");
    expect(result().find('script, a, img').exists()).toBe(false); expect(copy).not.toHaveBeenCalled();
    await result().get('.output-actions button').trigger("click"); await flushPromises();
    const report = JSON.parse(copy.mock.calls[0]![0]);
    expect(report.selectedOfferIndex).toBe(1); expect(report.offers[0].quality).toBe(1000);
    expect(report.offers[0].parameters).toEqual([{ name: 'profile', value: '<script>PRIVATE_ACCEPT_4819</script>' }]);
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_ACCEPT_4819");
    await wrapper.get('[data-testid="accept-clear"]').trigger("click"); expect(result().exists()).toBe(false);
  });
  it("keeps rejected edits invalid per input until that input is accepted", async () => {
    await sample(); await reject("#http-accept-input");
    expect(result().exists()).toBe(false);
    await wrapper.get("#accept-offers").setValue("text/plain"); expect(result().exists()).toBe(false);
    await wrapper.get("#http-accept-input").setValue("*/*"); expect(result().exists()).toBe(true);
    await reject("#accept-offers"); await wrapper.get("#http-accept-input").setValue("text/*");
    expect(result().exists()).toBe(false); expect(wrapper.find('.output-actions').exists()).toBe(false);
    await wrapper.get("#accept-offers").setValue("text/plain"); expect(result().exists()).toBe(true);
    await reject("#http-accept-input"); await wrapper.get('[data-testid="accept-absent"]').setValue(true);
    expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="accept-absent"]').setValue(false); expect(result().exists()).toBe(false);
    await sample(); expect(result().exists()).toBe(true);
  });
  it("uses combined active input length for 800ms scheduling, cancel, manual apply and disposal", async () => {
    vi.useFakeTimers(); await sample();
    const header = ACCEPT_SAMPLE + ' '.repeat(1000), offers = 'text/plain' + ' '.repeat(1100);
    await wrapper.get("#http-accept-input").setValue(header); await wrapper.get("#accept-offers").setValue(offers);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    expect(result().exists()).toBe(false); await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); expect(result().exists()).toBe(true);
    await wrapper.get("#http-accept-input").setValue(header + ' '); await wrapper.get('[data-testid="accept-cancel"]').trigger('click');
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger('click'); expect(result().exists()).toBe(true);
    await wrapper.get("#accept-offers").setValue(offers + ' '); await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger('click'); expect(result().exists()).toBe(true);
    wrapper.unmount(); wrapper = mountTool(); await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false); expect(wrapper.get('#http-accept-input').element).toHaveProperty('value', '');
    expect(wrapper.get('#accept-offers').element).toHaveProperty('value', '');
  });
  it("localizes all parser codes and guides in five languages without logging input", async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const locale of ['ja', 'en', 'zh-CN', 'zh-TW', 'ko'] as const) {
      i18n.global.locale.value = locale; await nextTick(); await sample();
      expect(result().exists()).toBe(true); expect(wrapper.text()).not.toContain('accept.scope');
      for (const input of ['PRIVATE_ACCEPT_4819: bad', 'text/plain;q=2', 'text/plain;x=a;X=b', 'application/*+json', 'text/plain,text/plain;q=0', 'text/plain' + ','.repeat(64)]) {
        await wrapper.get('#http-accept-input').setValue(input); await wrapper.get('#accept-offers').setValue('text/plain');
        expect(wrapper.get('[role="alert"]').text()).not.toMatch(/errors\.ACCEPT_|PRIVATE_ACCEPT_4819/);
        expect(result().exists()).toBe(false);
      }
      await wrapper.get('#accept-offers').setValue(' \t');
      expect(result().exists()).toBe(false);
    }
    expect(errors).not.toHaveBeenCalled();
  });
});
