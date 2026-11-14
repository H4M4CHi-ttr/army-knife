import { webcrypto } from "node:crypto";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import SshKeyTool from "./SshKeyTool.vue";
import { i18n } from "@/i18n";
import { sshKeyMessages } from "@/i18n/ssh-key";
import { defaultPreferences, settings, type Locale } from "@/lib/preferences";
import { SSH_KEY_SAMPLE } from "@/lib/tools/ssh-key";

const fingerprint = "SHA256:bbXpuKG6zhzdmnxq256TlqzFBzRl2f6OOg722cYNbU8";
let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="ssh-key-result"]');
const waitResult = () => vi.waitFor(() => expect(result().exists()).toBe(true));
const sample = async () => { await wrapper.get('[data-testid="ssh-key-sample"]').trigger("click"); await waitResult(); };
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto); copy.mockClear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mount(defineComponent({ render: () => h("div", [h(SshKeyTool)]) }), {
    global: { plugins: [vaporInteropPlugin, i18n] },
  });
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("SSH public-key real Vapor workflow", () => {
  it("offers .pub files in the native import picker", () => {
    expect(wrapper.get("#ssh-key-input-file").attributes("accept")).toBe(".pub,.txt,text/plain");
  });
  it("runs small input with saved auto-apply off and clears invalid output", async () => {
    settings.preferences.autoApply = false;
    expect(result().exists()).toBe(false);
    await sample();
    expect(wrapper.get('[data-testid="ssh-key-fingerprint"] pre').text()).toBe(fingerprint);
    expect(result().text()).toContain("256");
    await wrapper.get("#ssh-key-input").setValue("ssh-dss unsupported");
    await flushPromises();
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toBe(sshKeyMessages.en["errors.SSH_TYPE"]);
    expect(wrapper.find(".output-actions").exists()).toBe(false);
    await wrapper.get('[data-testid="ssh-key-clear"]').trigger("click");
    expect(wrapper.get<HTMLTextAreaElement>("#ssh-key-input").element.value).toBe("");
    expect(wrapper.get<HTMLTextAreaElement>("#ssh-key-expected").element.value).toBe("");
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
  it("shows matching, mismatching and omitted reference states without asserting trust", async () => {
    await sample();
    expect(wrapper.get('[data-testid="ssh-key-match"]').text()).toBe(sshKeyMessages.en["ssh.match"]);
    await wrapper.get("#ssh-key-expected").setValue("SHA256:" + "A".repeat(43)); await waitResult();
    expect(wrapper.get('[data-testid="ssh-key-match"]').text()).toBe(sshKeyMessages.en["ssh.mismatch"]);
    await wrapper.get("#ssh-key-expected").setValue(""); await waitResult();
    expect(wrapper.get('[data-testid="ssh-key-match"]').text()).toBe(sshKeyMessages.en["ssh.noReference"]);
    await wrapper.get("#ssh-key-expected").setValue("PRIVATE_BAD_REFERENCE"); await flushPromises();
    expect(result().exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toBe(sshKeyMessages.en["errors.SSH_FINGERPRINT"]);
  });
  it("copies the independent full fingerprint and complete JSON only on explicit action", async () => {
    await sample(); expect(copy).not.toHaveBeenCalled();
    await wrapper.get('[data-testid="ssh-key-fingerprint"] .output-actions button').trigger("click"); await flushPromises();
    expect(copy.mock.calls[0]![0]).toBe(fingerprint);
    await wrapper.get('[data-testid="ssh-key-result"] .result-header .output-actions button').trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[1]![0])).toEqual({
      type: "ssh-ed25519", keyBits: 256, blobBytes: 51, curve: null, exponent: null,
      comment: "army-knife-public-test-vector", fingerprint, expectedFingerprint: fingerprint, matches: true,
    });
  });
  it("keeps markup/URL comments inert and makes directional text visible", async () => {
    const comment = 'PRIVATE_SSH_VIEW <img src="https://example.invalid/private"> \u202e\u2028';
    await wrapper.get("#ssh-key-input").setValue(SSH_KEY_SAMPLE.split(" ").slice(0, 2).join(" ") + " " + comment);
    await waitResult();
    expect(wrapper.find("img, script, a").exists()).toBe(false);
    expect(wrapper.get('[data-testid="ssh-key-comment"]').text()).toContain("\\u202e\\u2028");
    expect(JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } })).not.toContain("PRIVATE_SSH_VIEW");
  });
  it.each(["en", "ja", "zh-CN", "zh-TW", "ko"] as Locale[])("renders localized controls and real results in %s", async locale => {
    i18n.global.locale.value = locale; await flushPromises(); await sample();
    const messages = sshKeyMessages[locale];
    expect(wrapper.get('label[for="ssh-key-input"]').text()).toBe(messages["ssh.input"]);
    expect(wrapper.get('label[for="ssh-key-expected"]').text()).toBe(messages["ssh.expected"]);
    expect(wrapper.get('[data-testid="ssh-key-match"]').text()).toBe(messages["ssh.match"]);
    expect(wrapper.get(".ssh-key-scope").text()).toBe(messages["ssh.scope"]);
    expect(wrapper.text()).not.toContain("errors.SSH_");
  });
  it("defers long input for 800ms and cancels/restarts it manually", async () => {
    vi.useFakeTimers();
    const source = SSH_KEY_SAMPLE + " ".repeat(2100);
    await wrapper.get("#ssh-key-input").setValue(source);
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("pending");
    await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await waitResult();
    await wrapper.get("#ssh-key-input").setValue(source + " ");
    expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="ssh-key-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="auto-apply-toggle"]').setValue(false);
    await wrapper.get("#ssh-key-input").setValue(source + "  ");
    await vi.advanceTimersByTimeAsync(1000); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); await waitResult();
    expect(wrapper.get('[data-testid="ssh-key-fingerprint"] pre').text()).toBe(fingerprint);
  });
  it.each([["ssh-key-input", 16385], ["ssh-key-expected", 129]] as const)(
    "removes prior exports after rejected oversized paste in %s", async (id, length) => {
      await sample();
      const paste = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(paste, "clipboardData", { value: { getData: () => "x".repeat(length) } });
      wrapper.get("#" + id).element.dispatchEvent(paste); await flushPromises();
      expect(paste.defaultPrevented).toBe(true);
      expect(result().exists()).toBe(false);
      expect(wrapper.find(".output-actions").exists()).toBe(false);
      await sample(); expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    });
  it.each(["cancel", "clear", "edit", "unmount"])("discards pending native completion after %s", async action => {
    let finish!: (value: ArrayBuffer) => void;
    vi.spyOn(webcrypto.subtle, "digest").mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    await wrapper.get('[data-testid="ssh-key-sample"]').trigger("click");
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("running");
    if (action === "edit") await wrapper.get("#ssh-key-expected").setValue("PRIVATE_INVALID");
    else if (action === "unmount") wrapper.unmount();
    else await wrapper.get('[data-testid="ssh-key-' + action + '"]').trigger("click");
    finish(new ArrayBuffer(32)); await flushPromises();
    expect(result().exists()).toBe(false);
  });
  it("restarts an identical sample after cancel without publishing its old digest", async () => {
    let finish!: (value: ArrayBuffer) => void;
    vi.spyOn(webcrypto.subtle, "digest").mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    await wrapper.get('[data-testid="ssh-key-sample"]').trigger("click");
    await wrapper.get('[data-testid="ssh-key-cancel"]').trigger("click");
    await sample();
    finish(new ArrayBuffer(32)); await flushPromises();
    expect(wrapper.get('[data-testid="ssh-key-fingerprint"] pre').text()).toBe(fingerprint);
    expect(wrapper.get('[data-testid="ssh-key-match"]').text()).toBe(sshKeyMessages.en["ssh.match"]);
  });
});
