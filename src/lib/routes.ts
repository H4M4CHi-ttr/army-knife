import { isToolId, type ToolId } from "./catalog.ts";
import { LOCALES, type Locale } from "./locales.ts";

export const SITE_BASE = "/army-knife/";

export type PageRoute =
  | { kind: "home"; locale: Locale; root: boolean }
  | { kind: "tool"; locale: Locale; toolId: ToolId }
  | { kind: "unknown" };

function normalizedBase(base: string): string {
  return `${base.replace(/\/+$/, "")}/`;
}

export function localeHomePath(locale: Locale, base = SITE_BASE): string {
  return `${normalizedBase(base)}${locale}/`;
}

export function toolPath(locale: Locale, id: ToolId, base = SITE_BASE): string {
  return `${localeHomePath(locale, base)}tools/${id}/`;
}

export function resolvePageRoute(pathname: string, base = SITE_BASE): PageRoute {
  pathname = pathname.replace(/\/index\.html$/, "/");
  const prefix = normalizedBase(base);
  if (pathname === prefix || pathname === prefix.slice(0, -1)) {
    return { kind: "home", locale: "ja", root: true };
  }
  if (!pathname.startsWith(prefix)) return { kind: "unknown" };
  const parts = pathname.slice(prefix.length).replace(/\/$/, "").split("/");
  const locale = parts[0];
  if (!LOCALES.includes(locale as Locale)) return { kind: "unknown" };
  if (parts.length === 1) return { kind: "home", locale: locale as Locale, root: false };
  if (parts.length === 3 && parts[1] === "tools" && isToolId(parts[2])) {
    return { kind: "tool", locale: locale as Locale, toolId: parts[2] };
  }
  return { kind: "unknown" };
}

export function legacyHashTool(hash: string): ToolId | null {
  const id = hash.match(/^#\/tool\/([^/?#]+)\/?$/)?.[1];
  return isToolId(id) ? id : null;
}

export function indexDocumentRedirect(pathname: string, base = SITE_BASE): string | null {
  return pathname.endsWith("/index.html") && resolvePageRoute(pathname, base).kind !== "unknown"
    ? pathname.slice(0, -"index.html".length)
    : null;
}

export function legacyToolRedirect(hash: string, locale: Locale, base = SITE_BASE): string | null {
  const id = legacyHashTool(hash);
  return id ? toolPath(locale, id, base) : null;
}

export function rootLocaleRedirect(
  pathname: string,
  locale: Locale,
  base = SITE_BASE,
): string | null {
  const route = resolvePageRoute(pathname, base);
  return route.kind === "home" && route.root && locale !== "ja"
    ? localeHomePath(locale, base)
    : null;
}
