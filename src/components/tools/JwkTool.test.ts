import { webcrypto } from "node:crypto";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import JwkTool from "./JwkTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";
import { JWK_SAMPLE } from "@/lib/tools/jwk";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="jwk-result"]');
const waitResult = () => vi.waitFor(() => expect(result().exists()).toBe(true));
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(JwkTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("JWK Vapor workflow", () => {
  it("immediately starts small input, renders the real thumbprint and removes invalid output", async () => {
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="jwk-sample"]').trigger("click"); await waitResult();
    expect(result().text()).toContain("kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k");
    expect(result().text()).toContain("Repeated public key");
    expect(result().text()).toContain("Family mismatch");
    await wrapper.get("#jwk-input").setValue('{"kty":"oct","k":"PRIVATE_SENTINEL"}');
    await flushPromises(); expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("public keys");
    expect(wrapper.find('.output-actions').exists()).toBe(false);
    await wrapper.get('[data-testid="jwk-clear"]').trigger("click");
    expect(wrapper.get<HTMLTextAreaElement>("#jwk-input").element.value).toBe("");
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
  it("copies only on explicit action and omits ignored extensions", async () => {
    const source = JSON.parse(JWK_SAMPLE); source.keys[0].custom = "PRIVATE_SENTINEL";
    source.keys[0].kid = "rotation\u202Ea";
    await wrapper.get("#jwk-input").setValue(JSON.stringify(source)); await waitResult();
    expect(copy).not.toHaveBeenCalled();
    expect(result().text()).not.toContain("PRIVATE_SENTINEL");
    expect(result().text()).toContain("rotation\\u202ea");
    expect(wrapper.find("a").exists()).toBe(false);
    await wrapper.get('.output-actions button').trigger("click"); await flushPromises();
    expect(copy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(copy.mock.calls[0]![0]).keys[0].thumbprint).toBe("kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k");
    expect(copy.mock.calls[0]![0]).not.toContain("PRIVATE_SENTINEL");
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_SENTINEL");
  });
  it("schedules at 800ms, cancels pending work and supports manual execution", async () => {
    vi.useFakeTimers();
    const source = JWK_SAMPLE + " ".repeat(2100);
    await wrapper.get("#jwk-input").setValue(source);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await waitResult();
    await wrapper.get("#jwk-input").setValue(source + " "); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="jwk-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await wrapper.get("#jwk-input").setValue(source + "  ");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); await waitResult();
  });
  it.each(["cancel", "clear", "edit", "unmount"])("discards native digest completion after %s", async action => {
    let finish!: (value: ArrayBuffer) => void;
    vi.spyOn(webcrypto.subtle, "digest").mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    await wrapper.get('[data-testid="jwk-sample"]').trigger("click");
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("running");
    if (action === "edit") await wrapper.get("#jwk-input").setValue("{}");
    else if (action === "unmount") wrapper.unmount();
    else await wrapper.get(`[data-testid="jwk-${action}"]`).trigger("click");
    finish(new ArrayBuffer(32)); await flushPromises();
    expect(result().exists()).toBe(false);
  });
  it("invalidates rejected oversized paste and recovers with a sample", async () => {
    await wrapper.get('[data-testid="jwk-sample"]').trigger("click"); await waitResult();
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "x".repeat(65537) } });
    wrapper.get("#jwk-input").element.dispatchEvent(paste); await flushPromises();
    expect(paste.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
    expect(wrapper.find('.output-actions').exists()).toBe(false);
    await wrapper.get('[data-testid="jwk-sample"]').trigger("click"); await waitResult();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
});
