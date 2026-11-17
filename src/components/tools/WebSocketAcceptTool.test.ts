import { webcrypto } from "node:crypto";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import WebSocketAcceptTool from "./WebSocketAcceptTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";
import { websocketAcceptMessages } from "@/i18n/websocket-accept";

const key = "dGhlIHNhbXBsZSBub25jZQ==", accept = "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=";
let wrapper: VueWrapper;
const copies: string[] = [];
const result = () => wrapper.find('[data-testid="websocket-accept-result"]');
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(WebSocketAcceptTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
const sample = async () => {
  await wrapper.get('[data-testid="websocket-accept-sample"]').trigger("click");
  await vi.waitFor(() => expect(result().exists()).toBe(true));
};
beforeEach(() => {
  copies.length = 0; localStorage.clear(); sessionStorage.clear();
  vi.stubGlobal("crypto", webcrypto);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { copies.push(text); } } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("WebSocket Accept Vapor workflow", () => {
  it("starts empty and computes/compares with actual crypto even when deferred auto-apply is off", async () => {
    expect(result().exists()).toBe(false); settings.preferences.autoApply = false;
    await wrapper.get("#websocket-accept-input").setValue(key);
    await vi.waitFor(() => expect(result().exists()).toBe(true));
    expect(wrapper.get('[data-testid="websocket-accept-expected"]').text()).toBe(accept);
    expect(wrapper.get('[data-testid="websocket-accept-status"]').text()).toBe(websocketAcceptMessages.en["wsAccept.notCompared"]);
    await wrapper.get("#websocket-accept-response").setValue(accept);
    await vi.waitFor(() => expect(wrapper.get('[data-testid="websocket-accept-status"]').text()).toBe(websocketAcceptMessages.en["wsAccept.match"]));
    await wrapper.get("#websocket-accept-response").setValue("AAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    await vi.waitFor(() => expect(wrapper.get('[data-testid="websocket-accept-status"]').text()).toBe(websocketAcceptMessages.en["wsAccept.mismatch"]));
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-mode")).toBe("instant");
  });
  it("exports the complete JSON and response header independently only on request", async () => {
    await sample(); expect(copies).toEqual([]);
    await wrapper.get('[data-testid="websocket-accept-json"] .output-actions button').trigger("click"); await flushPromises();
    expect(JSON.parse(copies[0]!)).toEqual({ key, nonceHex: "7468652073616d706c65206e6f6e6365", sha1Hex: "b37a4f2cc0624f1690f64606cf385945b2bec4ea",
      expectedAccept: accept, recordedAccept: accept, matches: true, responseHeader: "Sec-WebSocket-Accept: " + accept });
    await wrapper.get('[data-testid="websocket-accept-header"] .output-actions button').trigger("click"); await flushPromises();
    expect(copies[1]).toBe("Sec-WebSocket-Accept: " + accept);
    await wrapper.get('[data-testid="websocket-accept-clear"]').trigger("click");
    expect(result().exists()).toBe(false);
    for (const id of ["input", "response"]) expect(wrapper.get(`#websocket-accept-${id}`).element).toHaveProperty("value", "");
  });
  it("invalidates both exports on malformed or rejected edits and keeps rejections independent", async () => {
    for (const id of ["input", "response"]) {
      await sample(); await wrapper.get(`#websocket-accept-${id}`).setValue("<img src=https://example.invalid/PRIVATE_WS>"); await flushPromises();
      expect(result().exists()).toBe(false); expect(wrapper.find(".output-actions").exists()).toBe(false);
      expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_WS"); expect(wrapper.find("img").exists()).toBe(false);
      await sample();
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(129) } });
      wrapper.get(`#websocket-accept-${id}`).element.dispatchEvent(event); await flushPromises();
      expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
      const other = id === "input" ? "response" : "input";
      await wrapper.get(`#websocket-accept-${other}`).setValue(other === "input" ? "AAAAAAAAAAAAAAAAAAAAAA==" : "");
      expect(result().exists()).toBe(false);
      await wrapper.get(`#websocket-accept-${id}`).setValue(id === "input" ? key : accept);
      await vi.waitFor(() => expect(result().exists()).toBe(true));
    }
    await wrapper.get("#websocket-accept-response").setValue(" "); await flushPromises();
    expect(result().exists()).toBe(false); expect(wrapper.get('[role="alert"]').text()).toBe(websocketAcceptMessages.en["errors.WS_ACCEPT_RESPONSE"]);
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_WS");
  });
  it("shows running, cancels waiting and supports an explicit retry without publishing a late result", async () => {
    let finish!: (value: ArrayBuffer) => void;
    vi.stubGlobal("crypto", { subtle: { digest: () => new Promise<ArrayBuffer>((resolve) => { finish = resolve; }) } });
    await wrapper.get("#websocket-accept-input").setValue(key);
    expect(wrapper.get('[data-testid="websocket-accept-running"]').text()).toContain(websocketAcceptMessages.en["wsAccept.running"]);
    await wrapper.get('[data-testid="websocket-accept-cancel"]').trigger("click");
    finish(new ArrayBuffer(20)); await flushPromises(); expect(result().exists()).toBe(false);
    vi.stubGlobal("crypto", webcrypto);
    await wrapper.get('[data-testid="websocket-accept-retry"]').trigger("click");
    await vi.waitFor(() => expect(result().exists()).toBe(true));
    expect(wrapper.get('[data-testid="websocket-accept-expected"]').text()).toBe(accept);
  });
  it.each(["input", "response"])("invalidates exports from the start of a pending %s file read, including edits to the other field", async (id) => {
    await sample();
    let finish!: (value: ArrayBuffer) => void;
    const file = new File([id === "input" ? key : accept], "synthetic.txt", { type: "text/plain" });
    Object.defineProperty(file, "arrayBuffer", { value: () => new Promise<ArrayBuffer>((resolve) => { finish = resolve; }) });
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { files: [file], getData: () => "" } });
    wrapper.get(`#websocket-accept-${id}`).element.dispatchEvent(event); await nextTick();
    expect(result().exists()).toBe(false); expect(wrapper.find(".output-actions").exists()).toBe(false);
    await wrapper.get(`#websocket-accept-${id === "input" ? "response" : "input"}`).setValue(id === "input" ? "" : "AAAAAAAAAAAAAAAAAAAAAA==");
    await flushPromises(); expect(result().exists()).toBe(false);
    finish(new TextEncoder().encode(id === "input" ? key : accept).buffer);
    await vi.waitFor(() => expect(result().exists()).toBe(true));
    expect(wrapper.get('[data-testid="websocket-accept-status"]').text()).toBe(websocketAcceptMessages.en[id === "input" ? "wsAccept.notCompared" : "wsAccept.mismatch"]);
  });
  it("keeps two pending imports independent until both finish and ignores a read replaced by the sample", async () => {
    await sample();
    const finishes: ((value: ArrayBuffer) => void)[] = [];
    for (const id of ["input", "response"]) {
      const file = new File([id === "input" ? key : accept], "synthetic.txt");
      Object.defineProperty(file, "arrayBuffer", { value: () => new Promise<ArrayBuffer>((resolve) => { finishes.push(resolve); }) });
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [file], getData: () => "" } });
      wrapper.get(`#websocket-accept-${id}`).element.dispatchEvent(event);
    }
    await nextTick(); expect(result().exists()).toBe(false);
    finishes[0]!(new TextEncoder().encode(key).buffer); await flushPromises(); expect(result().exists()).toBe(false);
    finishes[1]!(new TextEncoder().encode(accept).buffer); await vi.waitFor(() => expect(result().exists()).toBe(true));
    let stale!: (value: ArrayBuffer) => void;
    const file = new File([key], "synthetic.txt");
    Object.defineProperty(file, "arrayBuffer", { value: () => new Promise<ArrayBuffer>((resolve) => { stale = resolve; }) });
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { files: [file], getData: () => "" } });
    wrapper.get("#websocket-accept-input").element.dispatchEvent(event); await nextTick(); expect(result().exists()).toBe(false);
    await sample(); stale(new TextEncoder().encode("AAAAAAAAAAAAAAAAAAAAAA==").buffer); await flushPromises();
    expect(wrapper.get("#websocket-accept-input").element).toHaveProperty("value", key);
    expect(wrapper.get('[data-testid="websocket-accept-status"]').text()).toBe(websocketAcceptMessages.en["wsAccept.match"]);
  });
  it("times out and sanitizes native crypto errors with a recoverable retry", async () => {
    vi.useFakeTimers(); vi.stubGlobal("crypto", { subtle: { digest: () => new Promise(() => {}) } });
    await wrapper.get("#websocket-accept-input").setValue(key);
    await vi.advanceTimersByTimeAsync(5000); await nextTick();
    expect(wrapper.get('[role="alert"]').text()).toBe(websocketAcceptMessages.en["errors.WS_ACCEPT_TIMEOUT"]);
    // Do not move Date backwards while Vue/Reka click listeners are mounted.
    vi.stubGlobal("crypto", undefined);
    await wrapper.get('[data-testid="websocket-accept-retry"]').trigger("click"); await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe(websocketAcceptMessages.en["errors.WS_ACCEPT_CRYPTO"]);
    vi.stubGlobal("crypto", webcrypto); await wrapper.get('[data-testid="websocket-accept-retry"]').trigger("click");
    await vi.waitFor(() => expect(result().exists()).toBe(true));
  });
  it("discards superseded completion and cancels pending work on clear or disposal", async () => {
    const finishes: ((value: ArrayBuffer) => void)[] = [];
    vi.stubGlobal("crypto", { subtle: { digest: () => new Promise<ArrayBuffer>((resolve) => { finishes.push(resolve); }) } });
    await wrapper.get("#websocket-accept-input").setValue(key);
    await wrapper.get("#websocket-accept-input").setValue("AAAAAAAAAAAAAAAAAAAAAA==");
    finishes[0]!(new ArrayBuffer(20)); await flushPromises(); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="websocket-accept-clear"]').trigger("click");
    finishes[1]!(new ArrayBuffer(20)); await flushPromises(); expect(result().exists()).toBe(false);
    await wrapper.get("#websocket-accept-input").setValue(key); wrapper.unmount();
    finishes[2]!(new ArrayBuffer(20)); await flushPromises(); wrapper = mountTool();
    expect(result().exists()).toBe(false); expect(wrapper.get("#websocket-accept-input").element).toHaveProperty("value", "");
  });
  it("renders match/mismatch/error/scope in all five locales without compiler errors", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await sample();
      const m = websocketAcceptMessages[locale]; expect(wrapper.text()).toContain(m["wsAccept.scope"]);
      for (const id of ["input", "response"]) expect(wrapper.get(`#websocket-accept-${id}-hint`).text()).toBe(m["wsAccept.inputLimit"]);
      expect(wrapper.get('[data-testid="websocket-accept-status"]').text()).toBe(m["wsAccept.match"]);
      await wrapper.get("#websocket-accept-response").setValue("AAAAAAAAAAAAAAAAAAAAAAAAAAA=");
      await vi.waitFor(() => expect(wrapper.get('[data-testid="websocket-accept-status"]').text()).toBe(m["wsAccept.mismatch"]));
      await wrapper.get("#websocket-accept-input").setValue("bad"); await flushPromises();
      expect(wrapper.get('[role="alert"]').text()).toBe(m["errors.WS_ACCEPT_KEY"]);
    }
    expect(errors).not.toHaveBeenCalled();
  });
});
