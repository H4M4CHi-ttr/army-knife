import { describe, expect, it } from "vite-plus/test";
import { ICALENDAR_LIMITS, inspectICalendar } from "./icalendar";
import { ICALENDAR_SAMPLE } from "./icalendar-sample";

function calendar(...lines: string[]) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:test", ...lines, "END:VCALENDAR"].join("\n");
}

function event(...lines: string[]) {
  return ["BEGIN:VEVENT", "UID:test", "DTSTAMP:20260101T000000Z", ...lines, "END:VEVENT"];
}

describe("inspectICalendar", () => {
  it("unfolds CRLF, preserves original instance and records all-day dates", () => {
    const report = inspectICalendar("\uFEFF" + ICALENDAR_SAMPLE.replaceAll("\n", "\r\n") + "\r\n");
    expect(report.diagnostics).toEqual([]);
    const [entry] = report.calendars;
    expect(entry.timezones).toEqual([{ line: 4, tzid: "Example/Office" }]);
    expect(entry.events).toHaveLength(3);
    expect(entry.events[0]).toMatchObject({
      summary: "Planning, review",
      start: { kind: "tzid", value: "20261125T090000", tzid: "Example/Office" },
      stamp: { kind: "utc" },
      recurrence: [
        { name: "RRULE", value: "FREQ=WEEKLY;COUNT=4" },
        { name: "EXDATE", parameters: { TZID: ["Example/Office"] } },
      ],
    });
    expect(entry.events[1]).toMatchObject({
      uid: entry.events[0].uid,
      recurrenceId: { kind: "tzid", value: "20261209T090000" },
      start: { value: "20261209T110000" },
    });
    expect(entry.events[2]).toMatchObject({ start: { kind: "date" }, end: { kind: "date", value: "20261127" } });
  });

  it("isolates event and zone scope, keeps quoted parameters and does not interpret attachments or alarms", () => {
    const source = calendar(
      ...event("dtstart;TZID=\"Custom:Zone;Office,East\":20260201t090000", "SUMMARY:Line\\nTab",
        'RDATE;VALUE=PERIOD;X-ID="a,b",c,"d:e":20260201T100000Z/PT1H',
        "ATTACH:https://example.invalid/demo", "BEGIN:VALARM", "SUMMARY:ignore alarm", "END:VALARM"),
      ...event("DTSTART:20260201T123460", "RECURRENCE-ID;RANGE=THISANDFUTURE:20260201T120000"),
      ...event("DTSTART:20260201t090000z"),
      "BEGIN:VTIMEZONE", "TZID:Custom:Zone\\;Office\\,East", "END:VTIMEZONE",
    ) + "\n" + calendar(...event('DTSTART;TZID="Custom:Zone;Office,East":20260201T090000'));
    const report = inspectICalendar(source);
    expect(report.diagnostics).toEqual([{ code: "timezone", line: source.split("\n").length - 2, property: "DTSTART" }]);
    expect(report.calendars[0].events[0]).toMatchObject({
      summary: "Line\nTab", start: { kind: "tzid" },
      recurrence: [{ parameters: { VALUE: ["PERIOD"], "X-ID": ["a,b", "c", "d:e"] } }],
    });
    expect(report.calendars[0].events[1]).toMatchObject({
      start: { kind: "floating" },
      recurrenceId: { value: "20260201T120000", range: "THISANDFUTURE" },
    });
    expect(report.calendars[0].events[2].start?.kind).toBe("utc");
    expect(JSON.stringify(report)).not.toContain("example.invalid");
  });

  it("returns bounded diagnostics and retains only completed event records", () => {
    const source = " stray\n" + calendar(
      ...event("DTSTART;VALUE=DATE:20230229", "DTSTART:20260201T000000Z", "DTEND:20260101T000000+0100",
        "DURATION:PT1H", "EXRULE:FREQ=YEARLY", "RRULE:BYDAY=MO", "SUMMARY:unrecognized\\x",
        "RECURRENCE-ID;RANGE=THISANDPRIOR:20260101T000000Z", "DTSTAMP;VALUE=DATE:20260101"),
      ...event("DTSTART;VALUE=DATE:20240229", "DTEND:20240301T000000Z"),
      "BEGIN:VEVENT", "SUMMARY:unclosed",
    );
    const report = inspectICalendar(source);
    expect(report.calendars[0].events).toHaveLength(2);
    expect(report.diagnostics.map(item => item.code)).toEqual(expect.arrayContaining([
      "fold", "structure", "date", "duplicate", "range", "escape", "rule", "endConflict", "dateMismatch",
    ]));
    expect(report.calendars[0].events[0].start?.kind).toBe("invalid");
    const flood = inspectICalendar(("no colon\n").repeat(200));
    expect(flood.calendars).toEqual([]);
    expect(flood.diagnostics).toHaveLength(128);
    expect(flood.diagnosticCount).toBe(201);
  });

  it("rejects unsafe resource sizes before returning a result", () => {
    const overLine = calendar(...event("SUMMARY:" + "x".repeat(4096), " " + "x".repeat(4096)));
    const overDepth = calendar(...Array.from({ length: 8 }, () => "BEGIN:X-COMPONENT"));
    const overComponents = calendar(...Array.from({ length: 512 }, () => "BEGIN:X-OTHER\nEND:X-OTHER"));
    const overOutput = calendar(...event(...Array.from({ length: 25 }, () => "RDATE;X-P=" + ",".repeat(8000) + ":x")));
    expect(() => inspectICalendar("日".repeat(90000))).toThrow("262144");
    for (const input of ["\n".repeat(ICALENDAR_LIMITS.lines + 1), overLine, overDepth, overComponents]) {
      expect(() => inspectICalendar(input)).toThrow("ICALENDAR_STRUCTURE_LIMIT");
    }
    expect(() => inspectICalendar(overOutput)).toThrow("ICALENDAR_OUTPUT_LIMIT");
  });
});
