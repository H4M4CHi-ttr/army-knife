import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import ImageReferenceTool from "./ImageReferenceTool.vue";
import { i18n } from "@/i18n";
import { defaultPreferences, settings } from "@/lib/preferences";
import { IMAGE_REFERENCE_SAMPLE } from "@/lib/tools/image-reference-sample";
import { imageReferenceMessages } from "@/i18n/image-reference";

let wrapper: VueWrapper;
const copy = vi.fn(async (_text: string) => {});
const result = () => wrapper.find('[data-testid="image-result"]');
const sample = () => wrapper.get('[data-testid="image-sample"]').trigger("click");
function mountTool() {
  return mount(defineComponent({ render: () => h("div", [h(ImageReferenceTool)]) }), { global: { plugins: [vaporInteropPlugin, i18n] } });
}
beforeEach(() => {
  copy.mockClear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  localStorage.clear(); sessionStorage.clear();
  Object.assign(settings.preferences, defaultPreferences("en")); i18n.global.locale.value = "en";
  wrapper = mountTool();
});
afterEach(() => { if (wrapper?.exists()) wrapper.unmount(); vi.restoreAllMocks(); });

describe("Docker image reference Vapor workflow", () => {
  it("starts empty and immediately shows defaults and digest precedence", async () => {
    expect(result().exists()).toBe(false);
    await sample();
    expect(wrapper.get('[data-testid="image-normalized"]').text()).toBe(IMAGE_REFERENCE_SAMPLE);
    expect(wrapper.get('[data-testid="image-pull"]').text()).toBe(IMAGE_REFERENCE_SAMPLE.replace(":stable@", "@"));
    expect(wrapper.find('[data-testid="image-ignored"]').exists()).toBe(true);
    await wrapper.get("#image-reference-input").setValue("alpine");
    expect(wrapper.get('[data-testid="image-pull"]').text()).toBe("docker.io/library/alpine:latest");
    expect(wrapper.get('[data-testid="image-defaults"]').text()).toContain("library/");
    expect(wrapper.find('[data-testid="image-ignored"]').exists()).toBe(false);
    settings.preferences.autoApply = false;
    await wrapper.get("#image-reference-input").setValue("localhost:5000/r:V2");
    expect(wrapper.get('[data-testid="image-pull"]').text()).toBe("localhost:5000/r:V2");
    expect(wrapper.get('[data-testid="apply-control"]').attributes("data-status")).toBe("applied");
  });
  it("exports only on explicit copy and removes all exports after errors or clear", async () => {
    await sample(); expect(copy).not.toHaveBeenCalled();
    await result().get('.output-actions button').trigger("click"); await flushPromises();
    expect(JSON.parse(copy.mock.calls[0]![0])).toMatchObject({ selection: "digest", tag: "stable", tagIgnored: true, registry: "registry.example:5000", port: "5000" });
    await wrapper.get("#image-reference-input").setValue("<img src='https://example.invalid/PRIVATE_IMAGE_7193'>");
    expect(result().exists()).toBe(false); expect(wrapper.find('.output-actions').exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).not.toContain("PRIVATE_IMAGE_7193");
    expect(wrapper.find("img").exists()).toBe(false);
    expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain("PRIVATE_IMAGE_7193");
    await sample(); await wrapper.get('[data-testid="image-clear"]').trigger("click");
    expect(result().exists()).toBe(false); expect(wrapper.get("#image-reference-input").element).toHaveProperty("value", "");
  });
  it("invalidates rejected paste and recovers even when reloading the same sample", async () => {
    await sample();
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => "x".repeat(1025) } });
    wrapper.get("#image-reference-input").element.dispatchEvent(event); await flushPromises();
    expect(event.defaultPrevented).toBe(true); expect(result().exists()).toBe(false);
    expect(wrapper.find('.output-actions').exists()).toBe(false);
    await sample(); expect(result().exists()).toBe(true);
    await wrapper.get("#image-reference-input").setValue("alpine@blake3:1234");
    expect(wrapper.get('[role="alert"]').text()).toContain("unsupported");
    expect(result().exists()).toBe(false);
  });
  it("renders complete translations and discards memory on a new mount", async () => {
    await sample();
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale; await nextTick();
      expect(wrapper.text()).toContain(imageReferenceMessages[locale]["image.ignored"]);
      expect(wrapper.text()).toContain(imageReferenceMessages[locale]["image.scope"]);
      expect(wrapper.text()).not.toContain("image.selection");
    }
    wrapper.unmount(); wrapper = mountTool();
    expect(result().exists()).toBe(false); expect(copy).not.toHaveBeenCalled();
    expect(wrapper.get("#image-reference-input").element).toHaveProperty("value", "");
  });
  it("renders every localized error without message compiler errors", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const locale of ["ja", "en", "zh-CN", "zh-TW", "ko"] as const) {
      i18n.global.locale.value = locale;
      for (const input of ["a".repeat(64), "UPPER", "r:.tag", "r@sha256:a", "r@blake3:a", "https://example.invalid/r"]) {
        await wrapper.get("#image-reference-input").setValue(input);
        expect(wrapper.get('[role="alert"]').text()).not.toContain("errors.IMAGE_REFERENCE");
      }
    }
    expect(errors).not.toHaveBeenCalled();
  });
});
