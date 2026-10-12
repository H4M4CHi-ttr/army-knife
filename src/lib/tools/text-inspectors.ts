import { assertInputSize, ToolError } from "./errors";

export const TEXT_INSPECTOR_LIMITS = {
  userAgentBytes: 8192,
  cookieBytes: 64 * 1024,
  cookieLines: 64,
} as const;

export interface UserAgentReport {
  browser: string;
  engine: string;
  os: string;
  device: string;
  bot: string;
  evidence: string[];
  warnings: string[];
}

/** Heuristic classification only. UA and Client Hints can be missing or spoofed. */
export function inspectUserAgent(input: string): UserAgentReport {
  assertInputSize(input, TEXT_INSPECTOR_LIMITS.userAgentBytes);
  const ua = input.trim();
  if (!ua) throw new ToolError("INVALID_REQUEST");
  const evidence: string[] = [];
  function match(pattern: RegExp): string | null {
    const found = ua.match(pattern)?.[0] ?? null;
    if (found && evidence.length < 8) evidence.push(found);
    return found;
  }
  const bot = match(/\b(?:Googlebot|Bingbot|DuckDuckBot|Slurp|YandexBot|(?:\w+)?crawler|(?:\w+)?spider|HeadlessChrome)[/\w.\-]*/i);
  const ios = /iPhone|iPad|iPod/i.test(ua);
  const browser = match(/\bEdg(?:A|iOS)?\/[\d.]+/i) ??
    match(/\bOPR\/[\d.]+/i) ??
    match(/\b(?:Firefox|FxiOS)\/[\d.]+/i) ??
    match(/\b(?:Chrome|CriOS)\/[\d.]+/i) ??
    (match(/\bVersion\/[\d.]+(?=.*\bSafari\/)/i) ?? match(/\bSafari\/[\d.]+/i)) ??
    "Unknown";
  const os = match(/\bWindows NT [\d.]+/i) ??
    match(/\bAndroid(?: [\d.]+)?/i) ??
    match(/\b(?:iPhone|iPad|iPod)\b[^)]*/i) ??
    match(/\bCrOS [^;)]+/i) ??
    match(/\bMac OS X [\d_.]+/i) ??
    match(/\bLinux\b/i) ??
    "Unknown";
  const device = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
    ? "Tablet" : /Mobile|iPhone|iPod/i.test(ua) ? "Mobile" : "Desktop/Unknown";
  const engine = ios ? "WebKit (likely; iOS engine may vary)" :
    /Edg|OPR|Chrome|Chromium/i.test(browser) ? "Blink (likely)" :
    /Firefox/i.test(browser) ? "Gecko (likely)" :
    /Safari|Version/i.test(browser) ? "WebKit (likely)" : "Unknown";
  return {
    browser, engine, os, device, bot: bot ?? "Not detected", evidence,
    warnings: ["UA_UNTRUSTED", ...(/Windows NT 10\.0/i.test(ua) ? ["UA_FROZEN"] : [])],
  };
}

export interface CookieReportRow {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  partitioned: boolean;
  sameSite: string;
  domain: string;
  path: string;
  expires: string;
  maxAge: string;
  warnings: string[];
}

export interface CookieReport { cookies: CookieReportRow[]; skipped: number; }

/**
 * Each physical line is one Set-Cookie header. Never split on commas: Expires
 * uses RFC 1123 commas, and joined Set-Cookie response headers are ambiguous.
 * Cookie values are discarded immediately and never appear in the report.
 */
export function inspectSetCookie(input: string): CookieReport {
  assertInputSize(input, TEXT_INSPECTOR_LIMITS.cookieBytes);
  const lines = input.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length > TEXT_INSPECTOR_LIMITS.cookieLines) throw new ToolError("TOO_MANY_ROWS");
  const cookies: CookieReportRow[] = [];
  let skipped = 0;
  const cookieName = /^[!#$%&'*+.^_|~0-9A-Za-z-]+$/;
  for (const originalLine of lines) {
    const line = originalLine.replace(/^\s*set-cookie\s*:/i, "").trim();
    const parts = line.split(";");
    const pair = parts.shift()?.trim() ?? "";
    const equal = pair.indexOf("=");
    if (equal <= 0 || !cookieName.test(pair.slice(0, equal))) {
      skipped += 1;
      continue;
    }
    const name = pair.slice(0, equal);
    const attr = new Map<string, string>();
    const duplicates: string[] = [];
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const split = trimmed.indexOf("=");
      const key = (split < 0 ? trimmed : trimmed.slice(0, split)).trim().toLowerCase();
      if (!/^[a-z][a-z0-9-]*$/.test(key)) continue;
      const value = split < 0 ? "" : trimmed.slice(split + 1).trim();
      if (attr.has(key)) duplicates.push(key);
      attr.set(key, value);
    }
    const has = (key: string) => attr.has(key);
    const sameSite = attr.get("samesite") ?? "(unspecified)";
    const secure = has("secure");
    const partitioned = has("partitioned");
    const path = attr.get("path") ?? "";
    const domain = attr.get("domain") ?? "";
    const expires = attr.get("expires") ?? "";
    const maxAge = attr.get("max-age") ?? "";
    const warnings: string[] = [];
    if (duplicates.length) warnings.push("DUPLICATE_ATTRIBUTE");
    if (!["strict", "lax", "none"].includes(sameSite.toLowerCase()) && has("samesite"))
      warnings.push("INVALID_SAMESITE");
    if (sameSite.toLowerCase() === "none" && !secure) warnings.push("SAMESITE_NEEDS_SECURE");
    if (partitioned && !secure) warnings.push("PARTITIONED_NEEDS_SECURE");
    if (name.startsWith("__Secure-") && !secure) warnings.push("SECURE_PREFIX");
    if (name.startsWith("__Host-") && (!secure || path !== "/" || has("domain")))
      warnings.push("HOST_PREFIX");
    if (expires && Number.isNaN(Date.parse(expires))) warnings.push("INVALID_EXPIRES");
    if (has("max-age") && !/^-?\d+$/.test(maxAge)) warnings.push("INVALID_MAX_AGE");
    if (has("secure") && attr.get("secure")) warnings.push("FLAG_WITH_VALUE");
    if (has("httponly") && attr.get("httponly")) warnings.push("FLAG_WITH_VALUE");
    cookies.push({
      name, secure, httpOnly: has("httponly"), partitioned,
      sameSite, domain, path, expires, maxAge, warnings,
    });
  }
  return { cookies, skipped };
}
