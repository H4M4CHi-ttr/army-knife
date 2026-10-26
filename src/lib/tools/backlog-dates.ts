/** Millisecond-precision RFC 3339 subset: no rollover, leap seconds or unknown offset. */
export function recordedInstant(input: string, dateOnly = false): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2}))?$/.exec(input);
  if (!match || (!dateOnly && !match[4]) || match[8] === "-00:00") return NaN;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const hour = Number(match[4] || 0), minute = Number(match[5] || 0), second = Number(match[6] || 0);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > monthDays(year, month) ||
      hour > 23 || minute > 59 || second > 59) return NaN;
  const zone = match[8] || "Z";
  const zoneHours = zone === "Z" ? 0 : Number(zone.slice(1, 3));
  const zoneMinutes = zone === "Z" ? 0 : Number(zone.slice(4, 6));
  if (zoneHours > 23 || zoneMinutes > 59) return NaN;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, Number((match[7] || "").padEnd(3, "0")));
  const offset = (zoneHours * 60 + zoneMinutes) * (zone.startsWith("-") ? -1 : 1);
  return date.getTime() - offset * 60_000;
}

export function monthDays(year: number, month: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month, 0);
  return date.getUTCDate();
}
