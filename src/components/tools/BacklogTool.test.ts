import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import BacklogTool from "./BacklogTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";
import type { BacklogKind } from "@/lib/tools/backlog-core";

let wrapper: VueWrapper;
function open(kind: BacklogKind = "pg-dsn") {
  wrapper = mount(defineComponent({ render: () => h("div", [h(BacklogTool, { kind })]) }), {
    global: { plugins: [vaporInteropPlugin, i18n] },
  });
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
});
afterEach(() => { wrapper?.unmount(); vi.useRealTimers(); });
const result = () => wrapper.find('[data-testid="backlog-results"]');

describe("shared inspector Vapor lifecycle", () => {
  it("discards exports after rejected paste and recovers via the same sample", async () => {
    open();
    await wrapper.get('[data-testid="backlog-sample"]').trigger("click");
    expect(result().exists()).toBe(true);
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "x".repeat(65_537) } });
    wrapper.get("#pg-dsn-input").element.dispatchEvent(paste);
    await flushPromises();
    expect(paste.defaultPrevented).toBe(true);
    expect(result().exists()).toBe(false);
    expect(wrapper.find(".output-actions").exists()).toBe(false);
    await wrapper.get('[data-testid="backlog-sample"]').trigger("click");
    expect(result().exists()).toBe(true);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    await wrapper.get('[data-testid="backlog-clear"]').trigger("click");
    expect(result().exists()).toBe(false);
  });

  it("cancels pending work, applies manually and disposes scheduled work", async () => {
    vi.useFakeTimers(); open("sitemap");
    const xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + " ".repeat(2500) + "</urlset>";
    await wrapper.get("#sitemap-input").setValue(xml);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await wrapper.get('[data-testid="backlog-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await wrapper.get("#sitemap-input").setValue(xml + " ");
    await vi.advanceTimersByTimeAsync(1000);
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(true);
    await wrapper.get("#sitemap-input").setValue(xml + "  ");
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(1000);
    expect(vi.getTimerCount()).toBe(0);
  });
});
