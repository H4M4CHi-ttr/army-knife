import { assertInputSize, ToolError } from "./errors";
import { guard, lines, checkedRows, report, fail, type BacklogOptions, type BacklogReport } from "./backlog-core";

/** #51: diagnostic grouping; stable non-reversible hash rather than file paths or PII. */
export function groupStackTraces(input: string, opts: BacklogOptions = {}): BacklogReport {
  guard(input);
  const parser = opts.parser || "auto";
  if (!["auto", "javascript", "python", "java", "dotnet"].includes(parser)) return fail();
  const entries = lines(input);
  const traces: { exception: string; frames: string[] }[] = [];
  let current: { exception: string; frames: string[] } = { exception: "", frames: [] };
  function flush() { if (current.exception || current.frames.length) traces.push(current); current = { exception: "", frames: [] }; }
  const regexes = {
    javascript: /^\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?\s*$/,
    python: /^\s*File\s+"(.+?)",\s+line\s+(\d+),\s+in\s+(.+)\s*$/,
    java: /^\s*at\s+([\w.$<>]+)\(([^()]+):(\d+)\)\s*$/,
    dotnet: /^\s*at\s+(.+?)(?:\s+in\s+(.+?):line\s+(\d+))?\s*$/,
  };
  for (const line of entries) {
    if (!line.trim()) { flush(); continue; }
    const js = (parser === "auto" || parser === "javascript") ? regexes.javascript.exec(line) : null;
    const py = (parser === "auto" || parser === "python") ? regexes.python.exec(line) : null;
    const java = (parser === "auto" || parser === "java") ? regexes.java.exec(line) : null;
    const net = (parser === "auto" || parser === "dotnet") && !js && !java ? regexes.dotnet.exec(line) : null;
    const normalized = js ? js[1] || "<anonymous>" :
      py ? py[3] : java ? java[1] : net ? net[1] : null;
    if (normalized) {
      current.frames.push(normalized.replace(/\b\d+\b/g, "#").slice(0, 180));
      continue;
    }
    if (/^(?:Traceback \(most recent call last\):|Caused by:)/i.test(line)) continue;
    if (/^\S.*(?:Error|Exception|Traceback|Fault)(?:\b|:)/i.test(line.trim()) ||
        (line.match(/^[\w.]+(?:Error|Exception):/) && current.frames.length)) {
      if (current.exception && current.frames.length) flush();
      // Deliberately discard potentially sensitive exception messages.
      current.exception = (line.trim().match(/[\w.]+(?:Error|Exception|Fault)/)?.[0] || "Exception").slice(0, 120);
    }
  }
  flush();
  if (!traces.length) return fail();
  const groups = new Map<string, { count: number; exception: string; frames: number }>();
  for (const trace of traces) {
    const normalized = trace.exception + "|" + trace.frames.slice(0, 30).join("|");
    let h = 2166136261;
    for (let i = 0; i < normalized.length; i++) { h ^= normalized.charCodeAt(i); h = Math.imul(h, 16777619); }
    const id = (h >>> 0).toString(16).padStart(8, "0");
    const found = groups.get(id);
    if (found) found.count++;
    else groups.set(id, { count: 1, exception: trace.exception, frames: trace.frames.length });
  }
  const rows = [...groups].sort((a,b) => b[1].count - a[1].count)
    .map(([id, item]) => ({ label: item.exception + " #" + id, detail: String(item.count) + " × / " + item.frames + " frames" }));
  return report({ traces: traces.length, groups: groups.size, frames: traces.reduce((sum,t) => sum + t.frames.length, 0) },
    rows, JSON.stringify([...groups].map(([fingerprint, g]) => ({ fingerprint, ...g })), null, 2),
    ["heuristic", "sourceMapsUnavailable"]);
}
type RobotRule = { directive: "allow" | "disallow"; pattern: string; order: number };
type RobotGroup = { agents: string[]; rules: RobotRule[] };
/** #63: offline robots evaluation against RFC9309-oriented rules, with disclosed gaps. */
export function inspectRobots(input: string, opts: BacklogOptions = {}): BacklogReport {
  guard(input);
  const path = opts.path || "/";
  const agent = opts.agent || "*";
  if (!path.startsWith("/") || path.length > 2048 || agent.length > 200 || !agent.trim()) return fail();
  const groups: RobotGroup[] = [];
  let current: RobotGroup | null = null;
  let order = 0;
  let invalid = 0;
  for (const raw of lines(input)) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const m = /^(user-agent|allow|disallow)\s*:\s*(.*?)\s*$/i.exec(line);
    if (!m) { invalid++; continue; }
    const tag = m[1].toLowerCase(), value = m[2];
    if (tag === "user-agent") {
      if (!value) { invalid++; continue; }
      if (!current || current.rules.length) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      continue;
    }
    if (!current) { invalid++; continue; }
    if (tag === "disallow" && !value) continue;
    current.rules.push({ directive: tag as RobotRule["directive"], pattern: value, order: order++ });
  }
  const lower = agent.toLowerCase();
  let specificity = -1;
  const selected: RobotGroup[] = [];
  for (const group of groups) {
    const score = Math.max(...group.agents.map(a => a === "*" ? 0 : lower.includes(a) ? a.length : -1));
    if (score < 0) continue;
    if (score > specificity) { specificity = score; selected.length = 0; }
    if (score === specificity) selected.push(group);
  }
  const rules = selected.flatMap(group => group.rules);
  function matches(value: string) {
    const terminal = value.endsWith("$");
    const source = terminal ? value.slice(0, -1) : value;
    const body = source.split("*").map(bit => bit.replace(/[.*+?^$\u007b\u007d()|[\]\\]/g, "\\$&")).join(".*");
    return new RegExp("^" + body + (terminal ? "$" : "")).test(path);
  }
  const matching = rules.filter(r => matches(r.pattern))
    .sort((a,b) => b.pattern.replace(/[*$]/g, "").length - a.pattern.replace(/[*$]/g, "").length ||
      (a.directive === "allow" ? -1 : 1));
  const winner = matching[0];
  const allowed = !winner || winner.directive === "allow";
  const warnings = [...(invalid ? ["invalidRows"] : []), ...(path.includes("%") ? ["urlEncoding"] : []), "heuristic"];
  return report({ allowed: allowed ? "YES" : "NO", groups: selected.length, matching: matching.length,
    invalid }, matching.map(r => ({ label: r.directive, detail: r.pattern })),
    JSON.stringify({ agent, path, allowed, winningRule: winner ?? null,
      matchingRules: matching, ignoredDirectives: invalid }, null, 2), warnings);
}
/** #64: XML tree is inert and never used to follow a URL. */
export function inspectSitemap(input: string): BacklogReport {
  guard(input);
  if (/<!DOCTYPE|<!ENTITY/i.test(input)) return fail();
  const dom = new DOMParser().parseFromString(input, "application/xml");
  if (dom.getElementsByTagName("parsererror").length) return fail();
  const root = dom.documentElement;
  const ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
  const isIndex = root.localName === "sitemapindex";
  if (root.namespaceURI !== ns || (!isIndex && root.localName !== "urlset")) return fail();
  const entries = [...root.children].filter(e => e.localName === (isIndex ? "sitemap" : "url") && e.namespaceURI === ns);
  checkedRows(entries.length);
  const domains = new Map<string, number>();
  const seen = new Set<string>(), rows: BacklogReport["rows"] = [];
  let invalid = 0, duplicated = 0, missingDate = 0;
  const textChild = (element: Element, name: string): string =>
    [...element.children].find(e => e.localName === name && e.namespaceURI === ns)?.textContent?.trim() || "";
  for (const [i, element] of entries.entries()) {
    const loc = textChild(element, "loc");
    const lastmod = textChild(element, "lastmod");
    let host = "";
    try {
      const url = new URL(loc);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) invalid++;
      else host = url.hostname;
    } catch { invalid++; }
    if (seen.has(loc)) duplicated++;
    else seen.add(loc);
    if (lastmod && (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(lastmod) ||
      Number.isNaN(Date.parse(lastmod)))) invalid++;
    if (!lastmod) missingDate++;
    if (host) domains.set(host, (domains.get(host) ?? 0) + 1);
    rows.push({ label: "#" + (i + 1), detail: loc.slice(0, 500) });
  }
  const linesOut = ["loc,lastmod", ...entries.map(e => {
    const quote = (s: string) => '"' + s.replace(/"/g, '""') + '"';
    return quote(textChild(e, "loc")) + "," + quote(textChild(e, "lastmod"));
  })];
  return report({ entries: entries.length, invalid, duplicated, missingDate,
    domains: [...domains].map(([h,n]) => h + ":" + n).join(", ") || "—", type: isIndex ? "index" : "urlset" },
    rows, linesOut.join("\n"), invalid ? ["invalidRows"] : []);
}
type DurationParts = { years: number; months: number; weeks: number; days: number; hours: number; minutes: number; seconds: number };
function utcMonthDays(year: number, month: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month, 0);
  return date.getUTCDate();
}
/** #68: calendar months/years are never equated to a fixed number of seconds. */
export function inspectDuration(input: string, opts: BacklogOptions = {}): BacklogReport {
  guard(input);
  const source = input.trim();
  const negative = source.startsWith("-");
  const val = negative ? source.slice(1) : source;
  const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d{1,3})?)S)?)?$/.exec(val);
  if (!match || !match.slice(1).some(Boolean) || (val.includes("T") && !match.slice(5).some(Boolean))) return fail();
  if (match[3] && (match[1] || match[2] || match[4] || val.includes("T"))) return fail();
  const nums = match.slice(1).map(s => Number(s || 0));
  if (nums.some(n => !Number.isFinite(n) || n > 1_000_000)) return fail();
  const p: DurationParts = {
    years: nums[0], months: nums[1], weeks: nums[2], days: nums[3],
    hours: nums[4], minutes: nums[5], seconds: nums[6],
  };
  const multiplier = negative ? -1 : 1;
  const timeMs = multiplier * ((p.weeks * 7 + p.days) * 86400000 +
    p.hours * 3600000 + p.minutes * 60000 + p.seconds * 1000);
  if (!Number.isSafeInteger(timeMs)) return fail();
  const reference = opts.reference || "";
  let result = "";
  if (reference.trim()) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(reference)) return fail();
    const when = new Date(reference);
    if (Number.isNaN(when.getTime())) return fail();
    const after = new Date(when.getTime());
    const day = after.getUTCDate();
    const nextMonths = multiplier * (p.years * 12 + p.months);
    after.setUTCDate(1);
    after.setUTCMonth(after.getUTCMonth() + nextMonths);
    after.setUTCDate(Math.min(day, utcMonthDays(after.getUTCFullYear(), after.getUTCMonth() + 1)));
    after.setTime(after.getTime() + timeMs);
    if (Number.isNaN(after.getTime())) return fail();
    result = after.toISOString();
  }
  const componentRows = Object.entries(p).map(([key,value]) => ({ label: key, detail: String(multiplier * value) }));
  return report({ calendarMonths: multiplier * (p.years * 12 + p.months),
    fixedSeconds: String(timeMs / 1000), result: result || "(reference required)" },
    componentRows, JSON.stringify({ duration: source, components: p,
      calendarMonths: multiplier * (p.years * 12 + p.months),
      fixedSeconds: timeMs / 1000, reference: reference || null, result: result || null }, null, 2),
    ["utcCalendar"]);
}
function parseKeywordDsn(input: string): Record<string, string> {
  const fields = Object.create(null) as Record<string,string>;
  let cursor = 0;
  while (cursor < input.length) {
    while (/\s/.test(input[cursor] || "") && cursor < input.length) cursor++;
    if (cursor >= input.length) break;
    const keyMatch = /^[A-Za-z_][A-Za-z_0-9]*/.exec(input.slice(cursor));
    if (!keyMatch) return fail();
    const key = keyMatch[0].toLowerCase();
    cursor += key.length;
    while (/\s/.test(input[cursor] || "") && cursor < input.length) cursor++;
    if (input[cursor++] !== "=") return fail();
    while (/\s/.test(input[cursor] || "") && cursor < input.length) cursor++;
    let value = "";
    if (input[cursor] === "'") {
      cursor++;
      let closed = false;
      while (cursor < input.length) {
        const c = input[cursor++];
        if (c === "'") { closed = true; break; }
        if (c === "\\") {
          if (cursor >= input.length) return fail();
          value += input[cursor++];
        } else value += c;
      }
      if (!closed) return fail();
      if (cursor < input.length && !/\s/.test(input[cursor])) return fail();
    } else {
      while (cursor < input.length && !/\s/.test(input[cursor])) {
        if (input[cursor] === "\\") {
          cursor++;
          if (cursor >= input.length) return fail();
        }
        value += input[cursor++];
      }
    }
    if (Object.hasOwn(fields, key)) return fail();
    fields[key] = value;
  }
  return fields;
}
/** #112: passwords and other secret-bearing attributes are masked in every report. */
export function inspectPgDsn(input: string): BacklogReport {
  guard(input);
  let fields: Record<string, string>;
  const trimmed = input.trim();
  if (/^postgres(?:ql)?:\/\//i.test(trimmed)) {
    let url: URL;
    try { url = new URL(trimmed); } catch { return fail(); }
    if (!["postgres:", "postgresql:"].includes(url.protocol)) return fail();
    fields = Object.create(null) as Record<string,string>;
    try {
      fields.user = decodeURIComponent(url.username);
      fields.password = decodeURIComponent(url.password);
      fields.host = url.hostname;
      fields.port = url.port;
      fields.dbname = decodeURIComponent(url.pathname.replace(/^\//, ""));
      for (const [key, value] of url.searchParams) {
        if (Object.hasOwn(fields, key) && fields[key]) return fail();
        fields[key] = value;
      }
    } catch { return fail(); }
  } else fields = parseKeywordDsn(trimmed);
  if (!Object.keys(fields).length) return fail();
  const privateKey = /password|passfile|secret|token|key|credential/i;
  const masked: Record<string, string> = Object.create(null) as Record<string, string>;
  const notes: string[] = [];
  for (const [key,value] of Object.entries(fields)) {
    masked[key] = privateKey.test(key) ? (value ? "<redacted>" : "(empty)") : value;
  }
  if (fields.sslmode === "disable") notes.push("unencryptedConnection");
  if (fields.host && fields.host.includes(",")) notes.push("multipleHosts");
  if (fields.port && fields.port.split(",").some(v => v && !/^\d{1,5}$/.test(v))) notes.push("portSyntax");
  if (fields.hostaddr && fields.host && fields.hostaddr.split(",").length !== fields.host.split(",").length)
    notes.push("hostCountMismatch");
  const rows = Object.entries(masked).map(([label, detail]) => ({ label, detail }));
  return report({ fields: rows.length, hosts: fields.host ? fields.host.split(",").length : 0,
    hasPassword: fields.password === undefined ? "NO" : "YES" },
    rows, Object.entries(masked).map(([key,value]) => key + "='" + value.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'").join(" "),
    notes);
}