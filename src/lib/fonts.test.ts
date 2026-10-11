import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

describe("local font stylesheet selection", () => {
  let links: HTMLLinkElement[];
  let fonts: typeof import("./fonts");

  beforeEach(async () => {
    vi.resetModules();
    links = [];
    // Intercept resources instead of allowing the DOM emulator to fetch them.
    vi.spyOn(document.head, "append").mockImplementation((...nodes) => {
      links.push(
        ...nodes.filter((node): node is HTMLLinkElement => node instanceof HTMLLinkElement),
      );
    });
    fonts = await import("./fonts");
  });

  it("activates only the latest locale when stylesheet requests finish out of order", async () => {
    const japanese = fonts.setFontLocale("ja");
    const korean = fonts.setFontLocale("ko");
    const japaneseLink = links.find((link) => link.dataset.fontLocale === "ja")!;
    const koreanLink = links.find((link) => link.dataset.fontLocale === "ko")!;

    koreanLink.dispatchEvent(new Event("load"));
    await korean;
    japaneseLink.dispatchEvent(new Event("load"));
    await japanese;

    expect(document.documentElement.lang).toBe("ko");
    expect(koreanLink.media).toBe("all");
    expect(japaneseLink.media).toBe("not all");
    expect(new URL(koreanLink.href).origin).toBe(window.location.origin);
    expect(new URL(koreanLink.href).search).toBe("");
    expect(new URL(koreanLink.href).pathname.endsWith("/fonts/ko.css")).toBe(true);
  });

  it("reuses a stylesheet when returning to a previously loaded locale", async () => {
    const japanese = fonts.setFontLocale("ja");
    links[0]!.dispatchEvent(new Event("load"));
    await japanese;
    const chinese = fonts.setFontLocale("zh-TW");
    links[1]!.dispatchEvent(new Event("load"));
    await chinese;
    await fonts.setFontLocale("ja");

    expect(links).toHaveLength(2);
    expect(links[0]!.media).toBe("all");
    expect(links[1]!.media).toBe("not all");
    expect(document.documentElement.lang).toBe("ja");
  });

  it("keeps language fallbacks available after failure and permits an explicit retry", async () => {
    const first = fonts.setFontLocale("zh-CN");
    const rejected = expect(first).rejects.toThrow(
      "Could not load the local zh-CN font stylesheet",
    );
    links[0]!.dispatchEvent(new Event("error"));
    await rejected;
    expect(document.documentElement.lang).toBe("zh-CN");

    const retry = fonts.setFontLocale("zh-CN");
    expect(links).toHaveLength(2);
    links[1]!.dispatchEvent(new Event("load"));
    await retry;
    expect(links[1]!.media).toBe("all");
  });

  it("rejects an unsupported locale before constructing an asset request", async () => {
    await expect(fonts.setFontLocale("../outside" as never)).rejects.toThrow(
      "Unsupported font locale",
    );
    expect(links).toHaveLength(0);
  });
});
