import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import ContentDispositionTool from "./ContentDispositionTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";

let wrapper: VueWrapper;
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(ContentDispositionTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
});
afterEach(() => { wrapper?.unmount(); vi.useRealTimers(); });
const result = () => wrapper.find('[data-testid="disposition-result"]');

describe("Content-Disposition Vapor view", () => {
  it("updates immediately and removes old exports on duplicate parameters and clear", async () => {
    expect(result().exists()).toBe(false);
    await wrapper.get("#disposition-input").setValue("attachment;filename*=UTF-8''%E2%82%AC.csv;filename=old.csv");
    expect(wrapper.get('[data-testid="disposition-selected"]').text()).toContain("€.csv");
    await wrapper.get("#disposition-input").setValue("attachment;filename=a;FILENAME=b");
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("Duplicate");
    await wrapper.get('[data-testid="disposition-sample"]').trigger("click");
    expect(result().text()).toContain("€ rates.csv");
    await wrapper.get('[data-testid="disposition-clear"]').trigger("click");
    expect(result().exists()).toBe(false);
    expect(wrapper.get<HTMLTextAreaElement>("#disposition-input").element.value).toBe("");
  });
  it("waits 800ms and supports cancellation, manual apply and disposal", async () => {
    vi.useFakeTimers();
    const long = `attachment;x="${"a".repeat(1024)}";y="${"b".repeat(1024)}"`;
    await wrapper.get("#disposition-input").setValue(long);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799);
    expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await flushPromises();
    expect(result().exists()).toBe(true);
    await wrapper.get("#disposition-input").setValue(long + ";filename=a");
    await wrapper.get('[data-testid="disposition-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await wrapper.get("#disposition-input").setValue(long + ";filename=b");
    await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    expect(result().text()).toContain('"b"');
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(true);
    await wrapper.get("#disposition-input").setValue(long);
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(1000);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("discards a report after rejected paste and recovers on editing", async () => {
    await wrapper.get('[data-testid="disposition-sample"]').trigger("click");
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    wrapper.get("#disposition-input").element.dispatchEvent(paste);
    await flushPromises();
    expect(paste.defaultPrevented).toBe(true);
    expect(result().exists()).toBe(false);
    await wrapper.get("#disposition-input").setValue("inline");
    expect(result().exists()).toBe(true);
  });
  it("escapes direction controls, keeps markup inert and never persists input", async () => {
    const marker = "PRIVATE_DISPOSITION_8812";
    await wrapper.get("#disposition-input").setValue(`attachment;filename="<img src='https://example.invalid/${marker}'>";filename*=UTF-8''safe%E2%80%AE.txt`);
    expect(result().text()).toContain(marker);
    expect(result().text()).toContain("\\u202e");
    expect(result().find("img").exists()).toBe(false);
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(marker);
    expect(location.href).not.toContain(marker);
  });
});
