import { afterEach, describe, expect, it, vi } from "vite-plus/test";

async function loadAnalytics(hostname: string, pathname: string) {
  const script = { async: false, src: "" };
  const appendChild = vi.fn();
  const createElement = vi.fn(() => script);
  const mockWindow: {
    location: { hostname: string; pathname: string };
    dataLayer?: unknown[];
  } = { location: { hostname, pathname } };

  vi.stubGlobal("window", mockWindow);
  vi.stubGlobal("document", { createElement, head: { appendChild } });
  vi.resetModules();
  await import("./analytics");

  return { mockWindow, script, appendChild, createElement };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("Google Analytics bootstrap", () => {
  it.each(["/army-knife/", "/army-knife/ja/tools/idn/"])(
    "queues valid gtag commands on the published site at %s",
    async (pathname) => {
      const { mockWindow, script, appendChild, createElement } = await loadAnalytics(
        "h4m4chi-ttr.github.io",
        pathname,
      );

      expect(createElement).toHaveBeenCalledWith("script");
      expect(script.async).toBe(true);
      expect(script.src).toBe(
        "https://www.googletagmanager.com/gtag/js?id=G-9ZPQXVFKN7",
      );
      expect(appendChild).toHaveBeenCalledWith(script);

      const commands = mockWindow.dataLayer;
      expect(commands).toHaveLength(2);
      const [initialize, configure] = commands!;

      for (const command of commands!) {
        // gtag.js expects native Arguments objects, not rest-parameter Arrays.
        expect(Object.prototype.toString.call(command)).toBe("[object Arguments]");
        expect(Array.isArray(command)).toBe(false);
      }
      expect(Array.from(initialize as IArguments)).toEqual(["js", expect.any(Date)]);
      expect(Array.from(configure as IArguments)).toEqual([
        "config",
        "G-9ZPQXVFKN7",
      ]);
    },
  );

  it.each([
    ["localhost", "/army-knife/ja/"],
    ["h4m4chi-ttr.github.io", "/unrelated/"],
  ])("does not track %s%s", async (hostname, pathname) => {
    const { mockWindow, createElement, appendChild } = await loadAnalytics(
      hostname,
      pathname,
    );
    expect(mockWindow.dataLayer).toBeUndefined();
    expect(createElement).not.toHaveBeenCalled();
    expect(appendChild).not.toHaveBeenCalled();
  });
});
