import { assertInputSize, ToolError } from "./errors";

export const URL_LIMITS = { inputBytes: 16 * 1024, queryItems: 200 } as const;

export interface UrlQueryItem {
  key: string;
  value: string;
  hasEquals: boolean;
}
export interface UrlReport {
  href: string;
  scheme: string;
  origin: string | null;
  hostname: string;
  port: string;
  /** Username / password / path / fragment keep the URL parser's percent encoding. */
  username: string;
  password: string;
  pathname: string;
  fragment: string;
  query: UrlQueryItem[];
  duplicateKeys: { key: string; count: number }[];
  hasCredentials: boolean;
  normalized: boolean;
}

function assertWellFormed(value: string): void {
  // URL and URLSearchParams otherwise replace lone UTF-16 surrogates with U+FFFD.
  for (let index = 0; index < value.length; index++) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new ToolError("URL_INVALID_UNICODE");
    } else if (unit >= 0xdc00 && unit <= 0xdfff) throw new ToolError("URL_INVALID_UNICODE");
  }
}

function parseUrl(input: string): URL {
  assertInputSize(input, URL_LIMITS.inputBytes);
  assertWellFormed(input);
  const source = input.trim();
  // Reject control-character recovery, relative / opaque URLs, and empty hosts.
  // Standard URL construction is purely local: no fetch, resolution, or navigation.
  if (!/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(source) || /[\u0000-\u001F\u007F]/.test(source)) {
    throw new ToolError("URL_INVALID");
  }
  try {
    const url = new URL(source);
    if (!url.hostname) throw new ToolError("URL_INVALID");
    return url;
  } catch (error) {
    if (error instanceof ToolError) throw error;
    throw new ToolError("URL_INVALID");
  }
}

function decodeQuery(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    throw new ToolError("URL_QUERY_ENCODING");
  }
}

function queryItems(url: URL): UrlQueryItem[] {
  // Empty ampersand segments have no entries under URLSearchParams semantics.
  const parts = url.search.slice(1).split("&").filter(Boolean);
  if (parts.length > URL_LIMITS.queryItems) throw new ToolError("URL_TOO_MANY_QUERY_ITEMS");
  return parts.map((part) => {
    const equals = part.indexOf("=");
    return {
      key: decodeQuery(equals < 0 ? part : part.slice(0, equals)),
      value: decodeQuery(equals < 0 ? "" : part.slice(equals + 1)),
      hasEquals: equals >= 0,
    };
  });
}

/** Inspect an absolute hierarchical URL without opening it or contacting its host. */
export function analyzeUrl(input: string): UrlReport {
  const url = parseUrl(input);
  const query = queryItems(url);
  const counts = new Map<string, number>();
  for (const item of query) counts.set(item.key, (counts.get(item.key) ?? 0) + 1);
  return {
    href: url.href,
    scheme: url.protocol.slice(0, -1),
    origin: url.origin === "null" ? null : url.origin,
    hostname: url.hostname,
    port: url.port,
    username: url.username,
    password: url.password,
    pathname: url.pathname,
    fragment: url.hash.slice(1),
    query,
    duplicateKeys: [...counts]
      .filter(([, count]) => count > 1)
      .map(([key, count]) => ({ key, count })),
    hasCredentials: Boolean(url.username || url.password),
    normalized: url.href !== input,
  };
}

/**
 * Serialize edited query entries with WHATWG form encoding (spaces become +).
 * Entry order and duplicate keys remain intact. Bare flags retain no '='.
 * Authority / path / fragment are preserved after standard URL normalization.
 */
export function editUrlQuery(input: string, entries: readonly UrlQueryItem[]): string {
  const url = parseUrl(input);
  if (entries.length > URL_LIMITS.queryItems) throw new ToolError("URL_TOO_MANY_QUERY_ITEMS");
  let rawLength = 0;
  const parts = entries.map((entry) => {
    if (
      !entry ||
      typeof entry.key !== "string" ||
      typeof entry.value !== "string" ||
      typeof entry.hasEquals !== "boolean" ||
      (!entry.hasEquals && (entry.value !== "" || entry.key === ""))
    ) {
      throw new ToolError("URL_QUERY_ITEM_INVALID");
    }
    rawLength += entry.key.length + entry.value.length + 2;
    if (rawLength > URL_LIMITS.inputBytes) throw new ToolError("INPUT_TOO_LARGE");
    assertWellFormed(entry.key);
    assertWellFormed(entry.value);
    const encoded = new URLSearchParams([[entry.key, entry.value]]).toString();
    return entry.hasEquals ? encoded : encoded.slice(0, -1);
  });
  url.search = parts.join("&");
  assertInputSize(url.href, URL_LIMITS.inputBytes);
  return url.href;
}
