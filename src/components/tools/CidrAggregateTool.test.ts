import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import CidrAggregateTool from "./CidrAggregateTool.vue";
import { i18n } from "@/i18n";
import { cidrAggregateMessages } from "@/i18n/cidr-aggregate";
import { defaultPreferences, settings } from "@/lib/preferences";
import { aggregateCidrs } from "@/lib/tools/cidr-aggregate";
import { CIDR_AGGREGATE_SAMPLE } from "@/lib/tools/cidr-aggregate-sample";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="cidr-aggregate-result"]');
const sample = () => wrapper.get('[data-testid="cidr-aggregate-sample"]').trigger("click");
const input = (value: string) => wrapper.get("#cidr-aggregate-input").setValue(value);
const state = () => wrapper.get('[data-testid="apply-control"]').attributes("data-status");
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(CidrAggregateTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("CIDR aggregation real Vapor view", () => {
  it("starts empty and shows exact IPv4/IPv6 sample sets and counts", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.get("#cidr-aggregate-input").element).toHaveProperty("value", CIDR_AGGREGATE_SAMPLE);
    expect(wrapper.get('[data-testid="cidr-aggregate-prefixes"]').text()).toBe("192.0.2.0/24\n198.51.100.0/24");
    expect(wrapper.get('[data-testid="cidr-aggregate-input-count"]').text()).toBe("5");
    expect(wrapper.get('[data-testid="cidr-aggregate-output-count"]').text()).toBe("2");
    expect(wrapper.get('[data-testid="cidr-aggregate-total"]').text()).toBe("512");
    await wrapper.get('[data-testid="cidr-aggregate-ipv6-sample"]').trigger("click");
    expect(wrapper.get('[data-testid="cidr-aggregate-prefixes"]').text()).toBe("2001:db8::/64");
    expect(wrapper.get('[data-testid="cidr-aggregate-total"]').text()).toBe("18446744073709551616");
    expect(wrapper.get('[data-testid="cidr-aggregate-version"]').text()).toBe("IPv6");
  });
  it("renders every prefix and explicitly copies independent complete CIDR and JSON outputs", async () => {
    settings.preferences.autoApply = false;
    const values = Array.from({ length: 128 }, (_, i) => `10.0.${i}.0/32`), value = JSON.stringify(values);
    await input(value); expect(state()).toBe("applied");
    expect(wrapper.get('[data-testid="cidr-aggregate-output-count"]').text()).toBe("128");
    expect(wrapper.get('[data-testid="cidr-aggregate-prefixes"]').element.textContent).toBe(values.join("\n") + "\n");
    expect(copy).not.toHaveBeenCalled();
    await wrapper.get('[data-testid="cidr-aggregate-list"]').get(".output-actions button").trigger("click"); await flushPromises();
    expect(copy.mock.calls[0]![0]).toBe(values.join("\n") + "\n");
    await wrapper.get('[data-testid="cidr-aggregate-json"]').get(".output-actions button").trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[1]![0])).toEqual(aggregateCidrs(value));
  });
  it("identifies invalid items without exposing text, partial exports or active markup", async () => {
    await sample(); await input('["192.0.2.0/24", "192.0.2.1/24"]');
    expect(result().exists()).toBe(false); expect(wrapper.find(".output-actions").exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain(cidrAggregateMessages.en["errors.CIDR_AGGREGATE_HOST_BITS"]);
    expect(wrapper.get('[data-testid="cidr-aggregate-error-position"]').text()).toContain("2");
    await input('["::/0", "0.0.0.0/0"]');
    expect(wrapper.get('[role="alert"]').text()).toContain(cidrAggregateMessages.en["errors.CIDR_AGGREGATE_MIXED"]);
    await input(JSON.stringify(["::/0", '<img src="https://example.invalid/PRIVATE_CIDR_177">']));
    expect(wrapper.find("img,script").exists()).toBe(false); expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_CIDR_177");
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_CIDR_177");
    await input("["); expect(wrapper.find('[data-testid="cidr-aggregate-error-position"]').exists()).toBe(false);
    await sample();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    wrapper.get("#cidr-aggregate-input").element.dispatchEvent(event); await flushPromises();
    expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
    await input('["::/128"]'); expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="cidr-aggregate-clear"]').trigger("click"); expect(result().exists()).toBe(false);
  });
  it("imports strict local UTF-8 and hides exports throughout a superseded read", async () => {
    const drop = async (file: File) => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [file], getData: () => "" } });
      wrapper.get("#cidr-aggregate-input").element.dispatchEvent(event); await nextTick();
    };
    for (const bytes of ['["::/0"]', '\ufeff["::/0"]', Uint8Array.of(255), "x".repeat(8193)]) {
      await sample(); await drop(new File([bytes], "synthetic.json")); await flushPromises();
      expect(result().exists()).toBe(bytes === '["::/0"]');
    }
    let complete!: (value: ArrayBuffer) => void;
    const file = new File(['["::/128"]'], "synthetic.json");
    Object.defineProperty(file, "arrayBuffer", { value: () => new Promise<ArrayBuffer>(resolve => { complete = resolve; }) });
    await sample(); await drop(file); expect(result().exists()).toBe(false); expect(wrapper.find(".output-actions").exists()).toBe(false);
    await sample(); complete(new TextEncoder().encode('["::/128"]').buffer); await flushPromises();
    expect(wrapper.get("#cidr-aggregate-input").element).toHaveProperty("value", CIDR_AGGREGATE_SAMPLE);
    expect(wrapper.get('[data-testid="cidr-aggregate-total"]').text()).toBe("512");
  });
  it("runs small input with auto off and supports 800ms/manual/cancel/disposal", async () => {
    vi.useFakeTimers(); settings.preferences.autoApply = false;
    await input('["::/0"]'); expect(state()).toBe("applied");
    const value = '["::/128"]' + " ".repeat(2100);
    await input(value); expect(state()).toBe("manual"); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(state()).toBe("applied");
    await input(value + " "); settings.preferences.autoApply = true; await nextTick();
    expect(state()).toBe("pending"); await wrapper.get('[data-testid="cidr-aggregate-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(900); expect(state()).toBe("cancelled"); expect(result().exists()).toBe(false);
    await input(value + "  "); await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await nextTick(); expect(result().exists()).toBe(true);
    await input(value); wrapper.unmount(); await vi.advanceTimersByTimeAsync(1000);
    wrapper = mountTool(); expect(result().exists()).toBe(false);
  });
  it("preserves raw CRLF at the exact input-byte boundary", async () => {
    settings.preferences.autoApply = false;
    const paste = async (text: string) => {
      const field = wrapper.get("#cidr-aggregate-input").element as HTMLTextAreaElement; field.setSelectionRange(0, field.value.length);
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => text } }); field.dispatchEvent(event); await flushPromises();
    };
    const base = '["::/0"]\r\n', exact = base + " ".repeat(8192 - base.length);
    await sample(); await paste(exact); expect(wrapper.find('[data-testid="preserved-cr-input"]').exists()).toBe(true);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await sample(); await paste(exact + " "); expect(result().exists()).toBe(false);
  });
  it.each(["ja", "en", "zh-CN", "zh-TW", "ko"] as const)("translates indexed errors and totals in %s", async locale => {
    i18n.global.locale.value = locale; await nextTick(); await input('["192.0.2.0/24", "192.0.2.1/24"]');
    expect(wrapper.get('[role="alert"]').text()).toContain(cidrAggregateMessages[locale]["errors.CIDR_AGGREGATE_HOST_BITS"]);
    expect(wrapper.get('[data-testid="cidr-aggregate-error-position"]').text()).toContain("2");
    await wrapper.get('[data-testid="cidr-aggregate-ipv6-sample"]').trigger("click");
    expect(wrapper.get('[data-testid="cidr-aggregate-total"]').text()).toBe("18446744073709551616");
  });
});
