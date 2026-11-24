import { assertInputSize, ToolError } from "./errors";

export const ICALENDAR_LIMITS = {
  inputBytes: 256 * 1024,
  instantCharacters: 4096,
  lines: 8192,
  lineCharacters: 8192,
  components: 512,
  depth: 8,
  diagnostics: 128,
  outputBytes: 1024 * 1024,
  preview: 20,
} as const;

type DiagnosticCode =
  | "line" | "fold" | "structure" | "missing" | "duplicate" | "date"
  | "timezone" | "range" | "rule" | "version" | "escape" | "endConflict" | "dateMismatch";
interface Diagnostic {
  code: DiagnosticCode;
  line: number;
  property?: string;
}
type Diagnose = (code: DiagnosticCode, line: number, property?: string) => void;
interface Property {
  name: string;
  line: number;
  value: string;
  parameters: Record<string, string[]>;
}
interface EventDate {
  value: string;
  kind: "date" | "utc" | "tzid" | "floating" | "invalid";
  tzid?: string;
}
interface CalendarEvent {
  line: number;
  uid?: string;
  summary?: string;
  start?: EventDate;
  end?: EventDate;
  stamp?: EventDate;
  duration?: string;
  sequence?: string;
  recurrenceId?: EventDate & { range?: string };
  recurrence: Property[];
}
interface Calendar {
  line: number;
  version?: string;
  method?: string;
  events: CalendarEvent[];
  timezones: { line: number; tzid?: string }[];
}
export interface ICalendarReport {
  calendars: Calendar[];
  diagnostics: Diagnostic[];
  diagnosticCount: number;
}
interface Frame {
  name: string;
  line: number;
  properties: Property[];
}

const token = /^[A-Z0-9-]+$/i;
const selected = {
  VCALENDAR: new Set(["VERSION", "PRODID", "METHOD"]),
  VEVENT: new Set(["UID", "SUMMARY", "DTSTART", "DTEND", "DTSTAMP", "DURATION", "SEQUENCE", "RECURRENCE-ID", "RRULE", "RDATE", "EXDATE", "EXRULE"]),
  VTIMEZONE: new Set(["TZID"]),
};
const recurrenceNames = new Set(["RRULE", "RDATE", "EXDATE", "EXRULE"]);

function parseLine(text: string, line: number, diagnose: Diagnose): Property | undefined {
  const separator = text.search(/[;:]/);
  const name = text.slice(0, separator).toUpperCase();
  // RFC 5545 content lines exclude these controls but permit a horizontal tab.
  // oxlint-disable-next-line no-control-regex
  if (separator < 1 || !token.test(name) || /[\u0000-\u0008\u000a-\u001f\u007f]/.test(text)) {
    diagnose("line", line);
    return;
  }
  const parameters: Record<string, string[]> = Object.create(null);
  const parameter = /;([A-Z0-9-]+)=/iy;
  const value = /"([^"]*)"|([^";:,]*)/gy;
  let pos = separator;
  while (text[pos] === ";") {
    parameter.lastIndex = pos;
    const match = parameter.exec(text);
    if (!match) break;
    const key = match[1].toUpperCase();
    if (parameters[key] !== undefined) diagnose("duplicate", line, key);
    const parsed = parameters[key] ??= [];
    pos = parameter.lastIndex;
    do {
      value.lastIndex = pos;
      const item = value.exec(text)!;
      parsed.push(item[1] ?? item[2]);
      pos = value.lastIndex;
      if (text[pos] !== ",") break;
      pos++;
    } while (pos <= text.length);
  }
  if (text[pos] !== ":") {
    diagnose("line", line);
    return;
  }
  return { name, line, parameters, value: text.slice(pos + 1) };
}

function textValue(property: Property | undefined, diagnose: Diagnose): string | undefined {
  return property?.value.replace(/\\(?:[\s\S]|$)/g, (escape) => {
    if (escape === "\\n" || escape === "\\N") return "\n";
    if (escape === "\\\\" || escape === "\\;" || escape === "\\,") return escape[1];
    diagnose("escape", property.line, property.name);
    return escape;
  });
}

function dateValue(property: Property | undefined, diagnose: Diagnose): EventDate | undefined {
  if (!property) return;
  const { value, parameters, name, line } = property;
  const type = parameters.VALUE?.[0]?.toUpperCase() ?? "DATE-TIME";
  const tzid = parameters.TZID?.[0];
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/i.exec(value);
  let kind: EventDate["kind"] = "invalid";
  if (match) {
    const [, y, m, d, hh, mm, ss, z] = match;
    const year = Number(y), month = Number(m), day = Number(d);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month >= 1 && month <= 12 && day >= 1 && day <= monthDays[month - 1]) {
      if (type === "DATE" && hh === undefined && tzid === undefined) kind = "date";
      if (type === "DATE-TIME" && hh !== undefined && Number(hh) <= 23 && Number(mm) <= 59 && Number(ss) <= 60) {
        if (z && tzid === undefined) kind = "utc";
        if (!z && tzid === undefined) kind = "floating";
        if (!z && tzid) kind = "tzid";
      }
    }
  }
  if ((parameters.VALUE?.length ?? 0) > 1 || (parameters.TZID?.length ?? 0) > 1 ||
      (name === "DTSTAMP" && kind !== "utc")) kind = "invalid";
  if (kind === "invalid") diagnose("date", line, name);
  return { value, kind, ...(tzid === undefined ? {} : { tzid }) };
}

function field(frame: Frame, name: string, diagnose: Diagnose, required = false): Property | undefined {
  const matches = frame.properties.filter(property => property.name === name);
  for (const match of matches.slice(1)) diagnose("duplicate", match.line, name);
  if (required && !matches[0]?.value) diagnose("missing", matches[0]?.line ?? frame.line, name);
  return matches[0];
}

function eventReport(frame: Frame, method: string | undefined, zones: ReadonlySet<string>, diagnose: Diagnose): CalendarEvent {
  const uid = field(frame, "UID", diagnose, true);
  const summary = field(frame, "SUMMARY", diagnose);
  const start = dateValue(field(frame, "DTSTART", diagnose, !method), diagnose);
  const endProperty = field(frame, "DTEND", diagnose);
  const end = dateValue(endProperty, diagnose);
  const stamp = dateValue(field(frame, "DTSTAMP", diagnose, true), diagnose);
  const duration = field(frame, "DURATION", diagnose);
  const sequence = field(frame, "SEQUENCE", diagnose);
  const id = field(frame, "RECURRENCE-ID", diagnose);
  const original = dateValue(id, diagnose);
  const range = id?.parameters.RANGE?.[0];
  if (range !== undefined && (range.toUpperCase() !== "THISANDFUTURE" || id?.parameters.RANGE.length !== 1)) {
    diagnose("range", id!.line, "RECURRENCE-ID");
  }
  if (start && end && endProperty && start.kind !== "invalid" && end.kind !== "invalid" &&
      (start.kind === "date") !== (end.kind === "date")) diagnose("dateMismatch", endProperty.line, "DTEND");
  if (end && duration) diagnose("endConflict", duration.line, "DURATION");
  const recurrence = frame.properties.filter(property => recurrenceNames.has(property.name));
  field(frame, "RRULE", diagnose);
  for (const property of recurrence) {
    if (property.name === "EXRULE" || !property.value ||
        (property.name === "RRULE" && !/(?:^|;)FREQ=(?:SECONDLY|MINUTELY|HOURLY|DAILY|WEEKLY|MONTHLY|YEARLY)(?:;|$)/i.test(property.value))) {
      diagnose("rule", property.line, property.name);
    }
  }
  for (const property of frame.properties) {
    if (!["DTSTART", "DTEND", "RECURRENCE-ID", "RDATE", "EXDATE"].includes(property.name)) continue;
    const tzid = property.parameters.TZID?.[0];
    if (tzid && !zones.has(tzid)) diagnose("timezone", property.line, property.name);
  }
  return {
    line: frame.line,
    uid: textValue(uid, diagnose),
    summary: textValue(summary, diagnose),
    start, end, stamp, duration: duration?.value, sequence: sequence?.value,
    recurrenceId: original && { ...original, ...(range === undefined ? {} : { range }) },
    recurrence,
  };
}

export function inspectICalendar(input: string): ICalendarReport {
  assertInputSize(input, ICALENDAR_LIMITS.inputBytes);
  const physical = input.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  if (physical.at(-1) === "") physical.pop();
  const limit = () => { throw new ToolError("ICALENDAR_STRUCTURE_LIMIT"); };
  if (physical.length > ICALENDAR_LIMITS.lines) limit();

  const report: ICalendarReport = { calendars: [], diagnostics: [], diagnosticCount: 0 };
  const diagnose: Diagnose = (code, line, property) => {
    report.diagnosticCount++;
    if (report.diagnostics.length < ICALENDAR_LIMITS.diagnostics) report.diagnostics.push({ code, line, property });
  };
  const stack: Frame[] = [];
  let componentCount = 0;
  let events: Frame[] = [];
  let timezones: Frame[] = [];
  function accept(frame: Frame, parent: Frame | undefined) {
    if (parent?.name === "VCALENDAR" && stack.length === 1) {
      if (frame.name === "VEVENT") events.push(frame);
      if (frame.name === "VTIMEZONE") timezones.push(frame);
    }
    if (parent || frame.name !== "VCALENDAR") return;
    const version = field(frame, "VERSION", diagnose, true);
    field(frame, "PRODID", diagnose, true);
    if (version?.value && version.value !== "2.0") diagnose("version", version.line, "VERSION");
    const method = field(frame, "METHOD", diagnose)?.value;
    const zones = new Set<string>();
    const zoneReports = timezones.map(zone => {
      const property = field(zone, "TZID", diagnose, true);
      const tzid = textValue(property, diagnose);
      if (tzid) {
        if (zones.has(tzid)) diagnose("duplicate", property!.line, "TZID");
        zones.add(tzid);
      }
      return { line: zone.line, tzid };
    });
    report.calendars.push({
      line: frame.line, version: version?.value, method, timezones: zoneReports,
      events: events.map(event => eventReport(event, method, zones, diagnose)),
    });
    events = [];
    timezones = [];
  }

  for (let i = 0; i < physical.length;) {
    const line = i + 1;
    const first = physical[i++];
    if (/^[ \t]/.test(first)) {
      diagnose("fold", line);
      continue;
    }
    let length = first.length;
    const parts = [first];
    while (i < physical.length && /^[ \t]/.test(physical[i])) {
      const part = physical[i++].slice(1);
      length += part.length;
      if (length > ICALENDAR_LIMITS.lineCharacters) limit();
      parts.push(part);
    }
    if (length > ICALENDAR_LIMITS.lineCharacters) limit();
    const property = parseLine(parts.join(""), line, diagnose);
    if (!property) continue;
    const { name, value, parameters } = property;
    if (name === "BEGIN" || name === "END") {
      if (!token.test(value) || Object.keys(parameters).length) {
        diagnose("structure", line, name);
        continue;
      }
      const component = value.toUpperCase();
      if (name === "BEGIN") {
        if (++componentCount > ICALENDAR_LIMITS.components || stack.length >= ICALENDAR_LIMITS.depth) limit();
        if ((stack.length === 0) !== (component === "VCALENDAR") ||
            ((component === "VEVENT" || component === "VTIMEZONE") &&
             (stack.length !== 1 || stack[0].name !== "VCALENDAR"))) {
          diagnose("structure", line, name);
        }
        stack.push({ name: component, line, properties: [] });
      } else {
        let index = stack.length - 1;
        while (index >= 0 && stack[index].name !== component) index--;
        if (index < 0) {
          diagnose("structure", line, name);
          continue;
        }
        while (stack.length - 1 > index) diagnose("structure", stack.pop()!.line, "BEGIN");
        accept(stack.pop()!, stack.at(-1));
      }
    } else {
      const frame = stack.at(-1);
      if (!frame) diagnose("structure", line, name);
      else if ((selected[frame.name as keyof typeof selected] as Set<string> | undefined)?.has(name)) frame.properties.push(property);
    }
  }
  while (stack.length) {
    const frame = stack.pop()!;
    diagnose("structure", frame.line, "BEGIN");
    if (frame.name === "VCALENDAR") accept(frame, stack.at(-1));
  }
  if (!report.calendars.length) diagnose("missing", 1, "VCALENDAR");
  if (new TextEncoder().encode(JSON.stringify(report, null, 2)).byteLength > ICALENDAR_LIMITS.outputBytes) {
    throw new ToolError("ICALENDAR_OUTPUT_LIMIT");
  }
  return report;
}
