import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";
import CacheStatusTool from "./CacheStatusTool.vue";

let wrapper: VueWrapper;
const result = () => wrapper.find('[data-testid="cache-status-result"]');
const input = () => wrapper.get("#cache-status-input");

beforeEach(() => {
  localStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(CacheStatusTool)]) }), {
    global: { plugins: [vaporInteropPlugin, i18n] },
  });
});
afterEach(() => {
  wrapper.unmount();
  vi.useRealTimers();
});

describe("Cache-Status Vapor view", () => {
  it("renders in order, distinguishes zero from omissions and invalidates errors", async () => {
    await wrapper.get('[data-testid="cache-status-sample"]').trigger("click");
    const rows = result().findAll("li.cache-row");
    expect(rows.map((row) => row.get("h3").text())).toEqual(["shield", "Edge cache"]);
    expect(rows[0]?.text()).toContain("-12");
    expect(rows[1]?.text()).toContain("The selected cached response was stale.");
    expect(rows[1]?.text()).toContain("304");
    await input().setValue("edge; fwd=vary-miss; ttl=0");
    expect(result().findAll("dd").map((field) => field.text())).toEqual(["0", "Not supplied. RFC 9211 uses the outer response status, which is unavailable here."]);
    await input().setValue("edge; hit; fwd=miss");
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("incompatible");
    await wrapper.get('[data-testid="cache-status-clear"]').trigger("click");
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("waits 800 ms for long inputs and supports pending cancellation and manual apply", async () => {
    vi.useFakeTimers();
    const long = 'edge; detail="' + "a".repeat(2048) + '"';
    await input().setValue(long);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799);
    expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(result().exists()).toBe(true);
    await input().setValue(long + ", next");
    await wrapper.get('[data-testid="cache-status-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(801);
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click");
    expect(result().findAll("li.cache-row")).toHaveLength(2);
  });

  it("counts original pasted CRLF bytes and clears reports on a rejected edit", async () => {
    await input().setValue("edge; hit");
    expect(result().exists()).toBe(true);
    const event = new Event("paste", { bubbles: true, cancelable: true });
    const text = 'Cache-Status: edge; detail="' + "a".repeat(8144) + '"\r\nCache-Status: next';
    expect(text).toHaveLength(8193);
    const editor = input().element as HTMLTextAreaElement;
    editor.select();
    Object.defineProperty(event, "clipboardData", { value: { getData: () => text } });
    editor.dispatchEvent(event);
    await flushPromises();
    expect(event.defaultPrevented).toBe(true);
    expect(result().exists()).toBe(false);
    await input().setValue("edge; ttl=0");
    expect(result().exists()).toBe(true);
  });
});
