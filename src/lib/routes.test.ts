import { describe, expect, it } from "vite-plus/test";
import { tools } from "./catalog";
import { LOCALES } from "./locales";
import {
  indexDocumentRedirect,
  legacyHashTool,
  legacyToolRedirect,
  localeHomePath,
  resolvePageRoute,
  rootLocaleRedirect,
  toolPath,
} from "./routes";

describe("public static page routes", () => {
  it("round trips every catalog tool in every supported locale to a unique path", () => {
    const paths = new Set<string>();
    for (const locale of LOCALES) {
      expect(resolvePageRoute(localeHomePath(locale))).toEqual({
        kind: "home",
        locale,
        root: false,
      });
      for (const tool of tools) {
        const path = toolPath(locale, tool.id);
        expect(path).toBe(`/army-knife/${locale}/tools/${tool.id}/`);
        expect(path).not.toContain("#");
        expect(path).not.toContain("?");
        expect(resolvePageRoute(path)).toEqual({ kind: "tool", locale, toolId: tool.id });
        paths.add(path);
      }
    }
    expect(paths.size).toBe(LOCALES.length * tools.length);
  });

  it("resolves the original site root as Japanese and accepts directory URLs before a slash redirect", () => {
    expect(resolvePageRoute("/army-knife/")).toEqual({ kind: "home", locale: "ja", root: true });
    expect(resolvePageRoute("/army-knife")).toEqual({ kind: "home", locale: "ja", root: true });
    expect(resolvePageRoute("/army-knife/en/tools/cidr")).toEqual({
      kind: "tool",
      locale: "en",
      toolId: "cidr",
    });
  });

  it("uses the configured base for both generation and parsing", () => {
    expect(localeHomePath("ko", "/workbench")).toBe("/workbench/ko/");
    expect(toolPath("ko", "url", "/workbench/")).toBe("/workbench/ko/tools/url/");
    expect(resolvePageRoute("/workbench/ko/tools/url/", "/workbench/")).toEqual({
      kind: "tool",
      locale: "ko",
      toolId: "url",
    });
    expect(resolvePageRoute("/army-knife/ko/tools/url/", "/workbench/")).toEqual({
      kind: "unknown",
    });
  });

  it("keeps Japanese root visits and routes saved language choices to a localized document", () => {
    expect(rootLocaleRedirect("/army-knife/", "ja")).toBeNull();
    expect(rootLocaleRedirect("/army-knife/", "en")).toBe(localeHomePath("en"));
    expect(rootLocaleRedirect("/army-knife/zh-CN/", "en")).toBeNull();
    expect(rootLocaleRedirect("/army-knife/ja/tools/cidr/", "en")).toBeNull();
    expect(rootLocaleRedirect("/army-knife/missing/", "en")).toBeNull();
  });

  it("recognizes generated index documents and normalizes only their real directory aliases", () => {
    const aliases = [
      "/army-knife/index.html",
      ...LOCALES.flatMap((locale) => [
        `${localeHomePath(locale)}index.html`,
        ...tools.map((tool) => `${toolPath(locale, tool.id)}index.html`),
      ]),
    ];
    for (const pathname of aliases) {
      const directory = pathname.slice(0, -"index.html".length);
      expect(resolvePageRoute(pathname)).toEqual(resolvePageRoute(directory));
      expect(indexDocumentRedirect(pathname)).toBe(directory);
    }
    expect(indexDocumentRedirect("/army-knife/en/tools/missing/index.html")).toBeNull();
    expect(indexDocumentRedirect("/elsewhere/en/index.html")).toBeNull();
    expect(indexDocumentRedirect("/army-knife/en/")).toBeNull();
  });

  it.each([
    "/army-knife/en/tools/missing/",
    "/army-knife/fr/tools/cidr/",
    "/army-knife/zh-cn/tools/cidr/",
    "/army-knife/en/tools/cidr/extra/",
    "/army-knife/en//tools/cidr/",
    "/army-knife/en/tools/cidr//",
    "/army-knife/en/tools/%63idr/",
    "/army-knife/en/tools/cidr%2F/",
    "/army-knife/unknown/",
    "/elsewhere/en/tools/cidr/",
  ])("leaves unknown paths unknown: %s", (pathname) => {
    expect(resolvePageRoute(pathname)).toEqual({ kind: "unknown" });
  });
});

describe("legacy public hash compatibility", () => {
  it("maps every legacy tool link using the chosen locale without copying user data", () => {
    for (const tool of tools) {
      expect(legacyHashTool(`#/tool/${tool.id}`)).toBe(tool.id);
      expect(legacyToolRedirect(`#/tool/${tool.id}`, "zh-TW")).toBe(toolPath("zh-TW", tool.id));
    }
    expect(legacyToolRedirect("#/tool/csv/", "ja")).toBe(toolPath("ja", "csv"));
  });

  it.each([
    "",
    "#/",
    "#main-content",
    "#/tool/missing",
    "#/tool/csv?secret=input",
    "#/tool/csv/input",
    "#/tool/csv#input",
  ])("does not turn arbitrary fragments into a tool URL: %s", (hash) =>
    expect(legacyToolRedirect(hash, "en")).toBeNull(),
  );
});
