import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";
import CacheAgeTool from "./CacheAgeTool.vue";

let wrapper: VueWrapper;
const result = () => wrapper.find('[data-testid="cache-age-result"]');
const input = (field: string) => wrapper.get(`#cache-age-${field}`);
const button = (action: string) => wrapper.get(`[data-testid="cache-age-${action}"]`);

beforeEach(() => {
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(CacheAgeTool)]) }), {
    global: { plugins: [vaporInteropPlugin, i18n] },
  });
});
afterEach(() => wrapper.unmount());

describe("Cache Age Vapor view", () => {
  it("calculates a sample immediately even with automatic deferred apply off, then clears every field", async () => {
    settings.preferences.autoApply = false;
    expect(result().exists()).toBe(false);
    await button("sample").trigger("click");
    expect(result().get('[data-testid="cache-age-current"]').text()).toBe("24.625 s");
    expect(result().text()).toContain("Corrected Age is larger");
    await input("evaluation").setValue("");
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[data-testid="cache-age-incomplete"]').text()).toContain("Enter Date");
    await button("clear").trigger("click");
    expect(wrapper.findAll("textarea").map((field) => (field.element as HTMLTextAreaElement).value)).toEqual(["", "", "", ""]);
  });

  it("shows the reason for no result, and exposes absent Age and possible clock skew", async () => {
    await button("sample").trigger("click");
    await input("input").setValue("Age: 8");
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("Date is required");
    await input("input").setValue("Date: Mon, 23 Nov 2026 00:00:13 GMT");
    expect(result().get('[data-testid="cache-age-current"]').text()).toBe("9.625 s");
    expect(result().text()).toContain("Age is absent");
    expect(result().text()).toContain("clocks may differ");
    await input("response").setValue("2026-11-23T00:00:01Z");
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("request ≤ response ≤ evaluation");
  });

  it("announces the result in a mounted live region", async () => {
    const live = wrapper.get('[data-testid="cache-age-announcement"]').element;
    expect(live.textContent).toBe("");
    await button("sample").trigger("click");
    expect(wrapper.get('[data-testid="cache-age-announcement"]').element).toBe(live);
    expect(live.textContent).toBe("Age at evaluation 24.625 s");
    await button("clear").trigger("click");
    expect(live.textContent).toBe("");
  });

  it("ignores dropped files in text-only inputs", async () => {
    await button("sample").trigger("click");
    const editor = input("request").element as HTMLTextAreaElement;
    const file = new File(["2026-11-23T00:00:12Z"], "synthetic.txt");
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { files: [file], getData: () => "" } });
    editor.dispatchEvent(event);
    await flushPromises();
    expect(event.defaultPrevented).toBe(true);
    expect(editor.disabled).toBe(false);
    expect(editor.value).toBe("2026-11-23T00:00:11.250Z");
    expect(result().get('[data-testid="cache-age-current"]').text()).toBe("24.625 s");
  });

  it("discards stale output if a paste is rejected and recomputes after a valid edit", async () => {
    await button("sample").trigger("click");
    const editor = input("request").element as HTMLTextAreaElement;
    editor.select();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(25) } });
    editor.dispatchEvent(event);
    await flushPromises();
    expect(event.defaultPrevented).toBe(true);
    expect(result().exists()).toBe(false);
    await input("request").setValue("2026-11-23T00:00:12Z");
    expect(result().get('[data-testid="cache-age-current"]').text()).toBe("23.875 s");
  });
});
