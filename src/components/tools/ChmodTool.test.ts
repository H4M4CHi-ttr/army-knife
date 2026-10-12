import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick, vaporInteropPlugin } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import App from "../../App.vue";
import { i18n } from "../../i18n";
import { chmodMessages } from "../../i18n/chmod";
import { defaultPreferences, settings, STORAGE_KEY } from "../../lib/preferences";
import { resolvePageRoute, toolPath } from "../../lib/routes";

vi.mock("../../lib/fonts", () => ({
  setFontLocale: vi.fn(async (locale: string) => {
    document.documentElement.lang = locale;
  }),
}));

let app: VueWrapper | undefined;

function staticPageResponse(pathname: string): Response {
  const route = resolvePageRoute(pathname, "/army-knife/");
  if (route.kind === "unknown") return new Response("", { status: 404 });
  const guide =
    route.kind === "tool" ? 'data-tool="' + route.toolId + '"' : 'data-page="home"';
  const html =
    '<!doctype html><html lang="' +
    route.locale +
    '"><head><title>Static test guide</title><meta name="description" content="Static description" />' +
    '<link rel="canonical" href="https://h4m4chi-ttr.github.io' +
    pathname +
    '" /></head><body><article id="page-guide" data-locale="' +
    route.locale +
    '" ' +
    guide +
    '><h1>Static test guide</h1></article></body></html>';
  return new Response(html, { headers: { "content-type": "text/html" } });
}

beforeEach(() => {
  vi.stubEnv("BASE_URL", "/army-knife/");
  document.body.replaceChildren();
  document.documentElement.classList.remove("dark");
  settings.reset();
  Object.assign(settings.preferences, defaultPreferences("en"));
  i18n.global.locale.value = "en";
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const pathname = new URL(input.toString(), window.location.origin).pathname;
      return staticPageResponse(pathname);
    }),
  );
});

afterEach(async () => {
  app?.unmount();
  app = undefined;
  await flushPromises();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function mountTool(): Promise<VueWrapper> {
  window.history.replaceState(null, "", toolPath("en", "chmod"));
  const host = document.createElement("div");
  document.body.append(host);
  app = mount(App, { attachTo: host, global: { plugins: [vaporInteropPlugin, i18n] } });
  await vi.waitFor(() => expect(app!.find("#chmod-mode").exists()).toBe(true));
  await flushPromises();
  return app;
}

function input(wrapper: VueWrapper, name: "mode" | "expression" | "umask"): HTMLInputElement {
  return wrapper.get(`[data-testid="chmod-${name}"]`).element as HTMLInputElement;
}

const octal = (wrapper: VueWrapper) => wrapper.get('[data-testid="chmod-octal"]').text();
const symbolic = (wrapper: VueWrapper) => wrapper.get('[data-testid="chmod-symbolic"]').text();

describe("chmod and umask through the real app", () => {
  it("starts empty and updates valid numeric modes and the accessible matrix immediately", async () => {
    settings.preferences.autoApply = false;
    const wrapper = await mountTool();
    expect(input(wrapper, "mode").value).toBe("");
    expect(input(wrapper, "expression").value).toBe("");
    expect(input(wrapper, "umask").value).toBe("");
    expect(wrapper.find('[data-testid="chmod-octal"]').exists()).toBe(false);
    expect(wrapper.get("fieldset").attributes("disabled")).toBeDefined();

    await wrapper.get('[data-testid="chmod-mode"]').setValue("644");
    expect(octal(wrapper)).toBe("0644");
    expect(symbolic(wrapper)).toBe("rw-r--r--");
    expect(wrapper.get("fieldset").attributes("disabled")).toBeUndefined();
    expect((wrapper.get("#chmod-bit-u-r").element as HTMLInputElement).checked).toBe(true);
    expect((wrapper.get("#chmod-bit-g-w").element as HTMLInputElement).checked).toBe(false);
    expect(wrapper.get("#chmod-bit-g-w").attributes("aria-label")).toBe("Group: Write");
    expect(wrapper.get('label[for="chmod-mode"]').text()).toBe("Octal mode");
    expect(wrapper.get('[data-testid="chmod-command"]').text()).toBe("chmod 00644 -- ./path");

    await wrapper.get("#chmod-bit-g-w").setValue(true);
    expect(input(wrapper, "mode").value).toBe("0664");
    expect(octal(wrapper)).toBe("0664");
    await wrapper.get("#chmod-bit-u-x").setValue(true);
    expect(octal(wrapper)).toBe("0764");
    expect(symbolic(wrapper)).toBe("rwxrw-r--");
    await wrapper.get("#chmod-bit-o-r").setValue(false);
    expect(octal(wrapper)).toBe("0760");
  });

  it("round-trips all special bits including uppercase display when execute is absent", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="chmod-mode"]').setValue("0000");
    expect(octal(wrapper)).toBe("0000");
    expect(symbolic(wrapper)).toBe("---------");
    await wrapper.get("#chmod-bit-setuid").setValue(true);
    await wrapper.get("#chmod-bit-setgid").setValue(true);
    await wrapper.get("#chmod-bit-sticky").setValue(true);
    expect(octal(wrapper)).toBe("7000");
    expect(symbolic(wrapper)).toBe("--S--S--T");
    await wrapper.get("#chmod-bit-u-x").setValue(true);
    await wrapper.get("#chmod-bit-g-x").setValue(true);
    await wrapper.get("#chmod-bit-o-x").setValue(true);
    expect(octal(wrapper)).toBe("7111");
    expect(symbolic(wrapper)).toBe("--s--s--t");
    await wrapper.get("#chmod-bit-setuid").setValue(false);
    expect(octal(wrapper)).toBe("3111");
    expect(symbolic(wrapper)).toBe("--x--s--t");

    await wrapper.get('[data-testid="chmod-mode"]').setValue("4755");
    expect(symbolic(wrapper)).toBe("rwsr-xr-x");
    expect((wrapper.get("#chmod-bit-setuid").element as HTMLInputElement).checked).toBe(true);
    expect((wrapper.get("#chmod-bit-setgid").element as HTMLInputElement).checked).toBe(false);
  });

  it("keeps symbolic previews separate, handles directory set-ID preservation, and applies once", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="chmod-mode"]').setValue("6755");
    await wrapper.get('[data-testid="chmod-expression"]').setValue("u=rw,g=rw");
    expect(octal(wrapper)).toBe("6755");
    expect(wrapper.get('[data-testid="chmod-preview-octal"]').text()).toBe("0665");
    await wrapper.get('[data-testid="chmod-directory"]').setValue(true);
    expect(wrapper.get('[data-testid="chmod-preview-octal"]').text()).toBe("6665");
    expect(octal(wrapper)).toBe("6755");
    await wrapper.get('[data-testid="chmod-expression"]').setValue("u=rw,g=rw,u-s");
    expect(wrapper.get('[data-testid="chmod-preview-octal"]').text()).toBe("2665");
    await wrapper.get('[data-testid="chmod-use-preview"]').trigger("click");
    expect(octal(wrapper)).toBe("2665");
    expect(input(wrapper, "mode").value).toBe("2665");
    expect(input(wrapper, "expression").value).toBe("");
    expect(wrapper.find('[data-testid="chmod-preview-octal"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="chmod-use-preview"]').exists()).toBe(false);
  });

  it("withdraws stale results and disables the matrix on invalid numeric input", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="chmod-mode"]').setValue("0644");
    await wrapper.get('[data-testid="chmod-expression"]').setValue("u+x");
    expect(wrapper.find('[data-testid="chmod-preview-octal"]').exists()).toBe(true);
    for (const value of ["888", "64", "0o644", "100644", `0644${" ".repeat(12)}755`]) {
      await wrapper.get('[data-testid="chmod-mode"]').setValue(value);
      expect(wrapper.get("#chmod-mode-error").text()).toBe(
        chmodMessages.en["errors.CHMOD_INVALID_MODE"],
      );
      expect(wrapper.find('[data-testid="chmod-octal"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="chmod-command"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="chmod-preview-octal"]').exists()).toBe(false);
      expect(wrapper.get("fieldset").attributes("disabled")).toBeDefined();
      expect(wrapper.get("#chmod-mode").attributes("aria-invalid")).toBe("true");
    }
    expect(wrapper.get("#chmod-mode").attributes("maxlength")).toBe("17");
    await wrapper.get('[data-testid="chmod-mode"]').setValue("");
    expect(wrapper.find("#chmod-mode-error").exists()).toBe(false);
    await wrapper.get('[data-testid="chmod-mode"]').setValue(" 0644 ");
    expect(octal(wrapper)).toBe("0644");
    expect(wrapper.get('[data-testid="chmod-preview-octal"]').text()).toBe("0744");
  });

  it("rejects unsupported or over-limit expressions without changing the selected mode", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="chmod-mode"]').setValue("0644");
    for (const expression of [
      "a+X",
      "g=u",
      "+x",
      "u+r-w",
      "u+x,,g-w",
      "PRIVATE_CHMOD_INPUT_9013",
    ]) {
      await wrapper.get('[data-testid="chmod-expression"]').setValue(expression);
      expect(wrapper.get("#chmod-preview-error").text()).toBe(
        chmodMessages.en["errors.CHMOD_INVALID_SYMBOLIC"],
      );
      expect(wrapper.find('[data-testid="chmod-preview-octal"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="chmod-use-preview"]').exists()).toBe(false);
      expect(octal(wrapper)).toBe("0644");
      expect(wrapper.get("#chmod-preview-error").text()).not.toContain(expression);
    }
    for (const expression of ["u+" + "r".repeat(255), Array(33).fill("u+r").join(",")]) {
      await wrapper.get('[data-testid="chmod-expression"]').setValue(expression);
      expect(wrapper.get("#chmod-preview-error").text()).toBe(
        chmodMessages.en["errors.CHMOD_SYMBOLIC_LIMIT"],
      );
      expect(octal(wrapper)).toBe("0644");
    }
    await wrapper.get('[data-testid="chmod-expression"]').setValue("u+x,g-w,o=");
    expect(wrapper.get('[data-testid="chmod-preview-octal"]').text()).toBe("0740");
    expect(wrapper.find("#chmod-preview-error").exists()).toBe(false);
  });

  it("calculates independent umask defaults and clears every user value", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="chmod-mode"]').setValue("4755");
    await wrapper.get('[data-testid="chmod-expression"]').setValue("g+s");
    await wrapper.get('[data-testid="chmod-directory"]').setValue(true);
    await wrapper.get('[data-testid="chmod-umask"]').setValue("022");
    expect(wrapper.get('[data-testid="chmod-umask-file"]').text()).toBe("0644");
    expect(wrapper.get('[data-testid="chmod-umask-directory"]').text()).toBe("0755");
    expect(octal(wrapper)).toBe("4755");
    await wrapper.get('[data-testid="chmod-umask"]').setValue("777");
    expect(wrapper.get('[data-testid="chmod-umask-file"]').text()).toBe("0000");
    expect(wrapper.get('[data-testid="chmod-umask-directory"]').text()).toBe("0000");
    for (const value of ["888", "1022", `0022${" ".repeat(12)}777`]) {
      await wrapper.get('[data-testid="chmod-umask"]').setValue(value);
      expect(wrapper.get("#chmod-umask-error").text()).toBe(
        chmodMessages.en["errors.CHMOD_INVALID_UMASK"],
      );
      expect(wrapper.find('[data-testid="chmod-umask-file"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="chmod-umask-directory"]').exists()).toBe(false);
    }
    expect(wrapper.get("#chmod-umask").attributes("maxlength")).toBe("17");
    await wrapper.get('[data-testid="chmod-clear"]').trigger("click");
    expect(input(wrapper, "mode").value).toBe("");
    expect(input(wrapper, "expression").value).toBe("");
    expect(input(wrapper, "umask").value).toBe("");
    expect(
      (wrapper.get('[data-testid="chmod-directory"]').element as HTMLInputElement).checked,
    ).toBe(false);
    expect(wrapper.find('[data-testid="chmod-octal"]').exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it("copies only the fixed placeholder command and translates clipboard failure", async () => {
    const wrapper = await mountTool();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    await wrapper.get('[data-testid="chmod-mode"]').setValue("4755");
    await wrapper.get('[data-testid="chmod-copy-command"]').trigger("click");
    await flushPromises();
    expect(writeText).toHaveBeenCalledExactlyOnceWith("chmod 04755 -- ./path");
    expect(wrapper.get('[data-testid="chmod-copy-command"]').text()).toBe("Copied");
    await wrapper.get('[data-testid="chmod-mode"]').setValue("0644");
    expect(wrapper.get('[data-testid="chmod-copy-command"]').text()).toBe(
      chmodMessages.en["chmod.copyCommand"],
    );
    writeText.mockRejectedValueOnce(new Error("PRIVATE_CLIPBOARD_MESSAGE"));
    await wrapper.get('[data-testid="chmod-copy-command"]').trigger("click");
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe(
      i18n.global.t("errors.CLIPBOARD_UNAVAILABLE"),
    );
    expect(wrapper.text()).not.toContain("PRIVATE_CLIPBOARD_MESSAGE");
  });

  it("updates all five languages and themes and clears inputs on locale navigation", async () => {
    const wrapper = await mountTool();
    await wrapper.get('[data-testid="chmod-mode"]').setValue("1777");
    await wrapper.get('[data-testid="chmod-expression"]').setValue("o-t");
    await wrapper.get('[data-testid="chmod-umask"]').setValue("077");
    for (const locale of ["ja", "zh-CN", "zh-TW", "ko", "en"] as const) {
      settings.preferences.locale = locale;
      await nextTick();
      await flushPromises();
      expect((wrapper.get('[data-testid="chmod-mode"]').element as HTMLInputElement).value).toBe(
        "",
      );
      expect(
        (wrapper.get('[data-testid="chmod-expression"]').element as HTMLInputElement).value,
      ).toBe("");
      expect((wrapper.get('[data-testid="chmod-umask"]').element as HTMLInputElement).value).toBe(
        "",
      );
      await wrapper.get('[data-testid="chmod-mode"]').setValue("1777");
      await wrapper.get('[data-testid="chmod-expression"]').setValue("o-t");
      await wrapper.get('[data-testid="chmod-umask"]').setValue("077");
      expect(wrapper.get('label[for="chmod-mode"]').text()).toBe(
        chmodMessages[locale]["chmod.octalInput"],
      );
      expect(wrapper.get("#chmod-expression-hint").text()).toBe(
        chmodMessages[locale]["chmod.expressionHint"],
      );
      expect(octal(wrapper)).toBe("1777");
      expect(wrapper.get('[data-testid="chmod-preview-octal"]').text()).toBe("0777");
      expect(wrapper.get('[data-testid="chmod-umask-file"]').text()).toBe("0600");
      expect(input(wrapper, "expression").value).toBe("o-t");
      for (const theme of ["dark", "light"] as const) {
        settings.preferences.theme = theme;
        await nextTick();
        expect(document.documentElement.classList.contains("dark")).toBe(theme === "dark");
        expect(octal(wrapper)).toBe("1777");
      }
    }
  });

  it("keeps private input out of storage, URLs, and requests and clears it after navigation", async () => {
    const wrapper = await mountTool();
    const request = vi.spyOn(window, "fetch");
    const marker = "PRIVATE_CHMOD_INPUT_9013";
    await wrapper.get('[data-testid="chmod-mode"]').setValue("0644");
    await wrapper.get('[data-testid="chmod-expression"]').setValue(marker);
    await wrapper.get('[data-testid="chmod-umask"]').setValue("022");
    settings.preferences.theme = "dark";
    await nextTick();
    expect(Object.keys(localStorage)).toEqual([STORAGE_KEY]);
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain(marker);
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain("0644");
    expect(sessionStorage.length).toBe(0);
    expect(window.location.href).not.toContain(marker);
    expect(window.location.search).toBe("");
    expect(request).not.toHaveBeenCalled();
    window.history.replaceState(null, "", toolPath("en", "unicode"));
    window.dispatchEvent(new PopStateEvent("popstate"));
    await vi.waitFor(() => expect(wrapper.find("#chmod-mode").exists()).toBe(false));
    window.history.replaceState(null, "", toolPath("en", "chmod"));
    window.dispatchEvent(new PopStateEvent("popstate"));
    await vi.waitFor(() => expect(wrapper.find("#chmod-mode").exists()).toBe(true));
    expect(input(wrapper, "mode").value).toBe("");
    expect(input(wrapper, "expression").value).toBe("");
    expect(input(wrapper, "umask").value).toBe("");
  });
});
