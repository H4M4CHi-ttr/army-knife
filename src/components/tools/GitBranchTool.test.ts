import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import GitBranchTool from "./GitBranchTool.vue";
import { i18n } from "@/i18n";
import { gitBranchMessages } from "@/i18n/git-branch";
import { defaultPreferences, settings } from "@/lib/preferences";
import { inspectGitBranches } from "@/lib/tools/git-branch";
import { GIT_BRANCH_SAMPLE } from "@/lib/tools/git-branch-sample";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="git-branch-result"]');
const sample = () => wrapper.get('[data-testid="git-branch-sample"]').trigger("click");
const input = (value: string) => wrapper.get("#git-branch-input").setValue(value);
const state = () => wrapper.get('[data-testid="apply-control"]').attributes("data-status");
const mountTool = () => mount(defineComponent({ render: () => h("div", [h(GitBranchTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
beforeEach(() => {
  copy.mockClear(); localStorage.clear(); sessionStorage.clear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("Git branch real Vapor view", () => {
  it("starts empty and distinguishes literal branch rules and full refs", async () => {
    expect(result().exists()).toBe(false); await sample();
    expect(wrapper.get("#git-branch-input").element).toHaveProperty("value", GIT_BRANCH_SAMPLE);
    expect(wrapper.findAll('[data-testid="git-branch-row"]')).toHaveLength(7);
    expect(wrapper.get('[data-testid="git-branch-valid-count"]').text()).toBe("4");
    expect(wrapper.get('[data-testid="git-branch-invalid-count"]').text()).toBe("3");
    expect(result().text()).toContain("refs/heads/refs/heads/main");
    expect(result().text()).toContain(gitBranchMessages.en["gitBranch.issue.reservedHead"]);
    await input('["@"]'); expect(wrapper.get('[data-testid="git-branch-status"]').text()).toBe(gitBranchMessages.en["gitBranch.valid"]);
  });
  it("labels the 32-row preview and explicitly copies all valid and invalid rows", async () => {
    const value = JSON.stringify(Array.from({ length: 128 }, (_, i) => i % 2 ? "bad.." + i : "topic/" + i));
    await input(value);
    expect(wrapper.findAll('[data-testid="git-branch-row"]')).toHaveLength(32);
    expect(wrapper.get("caption").text()).toContain("32"); expect(wrapper.get("caption").text()).toContain("128");
    expect(copy).not.toHaveBeenCalled(); await result().get(".output-actions button").trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toEqual(inspectGitBranches(value));
  });
  it("renders hostile names and format controls inertly and invalidates rejected input", async () => {
    const name = '<img src="https://example.invalid/PRIVATE_BRANCH_176">\u0000\r\n\u202e\u200b';
    await input(JSON.stringify([name]));
    expect(wrapper.find("img, script").exists()).toBe(false);
    expect(result().text()).toContain("\\u0000\\r\\n\\u202e\\u200b");
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_BRANCH_176");
    await input('["valid", 1]'); expect(result().exists()).toBe(false); expect(wrapper.find(".output-actions").exists()).toBe(false);
    await sample();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(8193) } });
    wrapper.get("#git-branch-input").element.dispatchEvent(event); await flushPromises();
    expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
    await input('["ok"]'); expect(result().exists()).toBe(true);
    await wrapper.get('[data-testid="git-branch-clear"]').trigger("click"); expect(result().exists()).toBe(false);
  });
  it("supports bounded local imports and discards a late import after replacement", async () => {
    const drop = async (file: File) => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { files: [file], getData: () => "" } });
      wrapper.get("#git-branch-input").element.dispatchEvent(event); await nextTick();
    };
    for (const bytes of ['["main"]', '\ufeff["main"]', Uint8Array.of(255), "x".repeat(8193)]) {
      await sample(); await drop(new File([bytes], "synthetic.json")); await flushPromises();
      expect(result().exists()).toBe(bytes === '["main"]');
    }
    let complete!: (value: ArrayBuffer) => void;
    const file = new File(['["old"]'], "synthetic.json");
    Object.defineProperty(file, "arrayBuffer", { value: () => new Promise<ArrayBuffer>(resolve => { complete = resolve; }) });
    await sample(); await drop(file); expect(result().exists()).toBe(false);
    expect(wrapper.find(".output-actions").exists()).toBe(false);
    await sample(); complete(new TextEncoder().encode('["old"]').buffer); await flushPromises();
    expect(wrapper.get("#git-branch-input").element).toHaveProperty("value", GIT_BRANCH_SAMPLE);
  });
  it("runs small inputs immediately with auto off and supports manual/800ms/cancel/dispose", async () => {
    vi.useFakeTimers(); settings.preferences.autoApply = false;
    await input('["@"]'); expect(state()).toBe("applied");
    const value = '["main"]' + " ".repeat(2100);
    await input(value); expect(state()).toBe("manual"); expect(result().exists()).toBe(false);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(state()).toBe("applied");
    await input(value + " "); settings.preferences.autoApply = true; await nextTick();
    expect(state()).toBe("pending"); await wrapper.get('[data-testid="git-branch-cancel"]').trigger("click");
    await vi.advanceTimersByTimeAsync(900); expect(state()).toBe("cancelled"); expect(result().exists()).toBe(false);
    await input(value + "  "); await vi.advanceTimersByTimeAsync(799); expect(result().exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await nextTick(); expect(result().exists()).toBe(true);
    await input(value); wrapper.unmount(); await vi.advanceTimersByTimeAsync(1000);
    wrapper = mountTool(); expect(result().exists()).toBe(false);
  });
  it("preserves original CRLF input bytes at the exact raw boundary", async () => {
    settings.preferences.autoApply = false;
    const paste = async (text: string) => {
      const field = wrapper.get("#git-branch-input").element as HTMLTextAreaElement;
      field.setSelectionRange(0, field.value.length);
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", { value: { getData: () => text } });
      field.dispatchEvent(event); await flushPromises();
    };
    await sample(); const exact = '["界"]\r\n' + " ".repeat(8183);
    await paste(exact); expect(wrapper.find('[data-testid="preserved-cr-input"]').exists()).toBe(true);
    await wrapper.get('[data-testid="apply-now"]').trigger("click"); expect(result().exists()).toBe(true);
    await sample(); await paste(exact + " "); expect(result().exists()).toBe(false);
  });
  it.each(["ja", "en", "zh-CN", "zh-TW", "ko"] as const)("renders translated diagnostics in %s", async locale => {
    i18n.global.locale.value = locale; await nextTick(); await input('["HEAD"]');
    const m = gitBranchMessages[locale];
    expect(result().text()).toContain(m["gitBranch.issue.reservedHead"]);
    expect(wrapper.get('[data-testid="git-branch-status"]').text()).toBe(m["gitBranch.invalid"]);
    await input("["); expect(wrapper.get('[role="alert"]').text()).toBe(m["errors.GIT_BRANCH_JSON"]);
  });
});
