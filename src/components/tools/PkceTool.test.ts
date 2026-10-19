import { webcrypto } from "node:crypto";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import PkceTool from "./PkceTool.vue";
import { i18n } from "@/i18n";
import { settings, defaultPreferences } from "@/lib/preferences";

const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(PkceTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function generate() {
  await wrapper.get('[data-testid="pkce-generate"]').trigger("click");
  await vi.waitFor(() => expect(wrapper.find('[data-testid="pkce-result"]').exists()).toBe(true));
}

describe("PKCE Vapor view", () => {
  it("generates only on request and invalidates on settings edits", async () => {
    expect(wrapper.find('[data-testid="pkce-result"]').exists()).toBe(false);
    await generate();
    expect(wrapper.get('[data-testid="pkce-verifier"]').text()).toHaveLength(43);
    expect(wrapper.get('[data-testid="pkce-state"]').text()).toHaveLength(32);
    await wrapper.get("#pkce-verifier-length").setValue("128");
    await flushPromises();
    expect(wrapper.find('[data-testid="pkce-result"]').exists()).toBe(false);
    await wrapper.get("#pkce-state-enabled").setValue(false);
    await generate();
    expect(wrapper.get('[data-testid="pkce-verifier"]').text()).toHaveLength(128);
    expect(wrapper.find('[data-testid="pkce-state"]').exists()).toBe(false);
  });
  it("checks the public RFC example and removes stale output on malformed input", async () => {
    await wrapper.get('[data-testid="pkce-sample"]').trigger("click");
    await vi.waitFor(() => expect(wrapper.get('[data-testid="pkce-challenge"]').text()).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"));
    await wrapper.get("#pkce-verifier-input").setValue(VERIFIER + " ");
    await flushPromises();
    expect(wrapper.find('[data-testid="pkce-result"]').exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("43–128");
  });
  it("copies only the explicitly selected output and never persists the values", async () => {
    await generate();
    const verifier = wrapper.get('[data-testid="pkce-verifier"]').text();
    const challenge = wrapper.get('[data-testid="pkce-challenge"]').text();
    const state = wrapper.get('[data-testid="pkce-state"]').text();
    expect(copy).not.toHaveBeenCalled();
    for (const [key, value] of [["verifier", verifier], ["challenge", challenge], ["state", state]]) {
      await wrapper.get(`[data-testid="pkce-copy-${key}"]`).trigger("click");
      await flushPromises();
      expect(copy).toHaveBeenLastCalledWith(value);
    }
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain(verifier);
    expect(location.href).not.toContain(verifier);
    await wrapper.get('[data-testid="pkce-clear"]').trigger("click");
    expect(wrapper.find('[data-testid="pkce-result"]').exists()).toBe(false);
  });
  it.each(["cancel", "clear", "edit", "unmount"])("discards a late native digest after %s", async (action) => {
    let finish!: (value: ArrayBuffer) => void;
    vi.spyOn(webcrypto.subtle, "digest").mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    await wrapper.get('[data-testid="pkce-generate"]').trigger("click");
    expect(wrapper.find('[data-testid="pkce-cancel"]').exists()).toBe(true);
    if (action === "edit") await wrapper.get("#pkce-verifier-length").setValue("64");
    else if (action === "unmount") wrapper.unmount();
    else await wrapper.get(`[data-testid="pkce-${action}"]`).trigger("click");
    finish(new ArrayBuffer(32));
    await flushPromises();
    expect(wrapper.find('[data-testid="pkce-result"]').exists()).toBe(false);
  });
  it("rejects an oversized paste before inserting a truncated valid verifier", async () => {
    await wrapper.get('[data-testid="pkce-sample"]').trigger("click");
    await vi.waitFor(() => expect(wrapper.find('[data-testid="pkce-result"]').exists()).toBe(true));
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "a".repeat(100000) } });
    wrapper.get("#pkce-verifier-input").element.dispatchEvent(paste);
    await flushPromises();
    expect(paste.defaultPrevented).toBe(true);
    expect(wrapper.find('[data-testid="pkce-result"]').exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain("43–128");
  });
});
