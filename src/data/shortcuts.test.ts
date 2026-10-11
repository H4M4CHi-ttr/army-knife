import { describe, expect, it } from "vite-plus/test";
import { shortcutRecords, shortcutSources } from "./shortcuts";
import { formatShortcut, parseShortcut, searchShortcuts } from "@/lib/tools/shortcuts";

describe("published shortcut dictionary", () => {
  it("preserves unique identities and complete official provenance", () => {
    expect(new Set(shortcutRecords.map((record) => record.id)).size).toBe(shortcutRecords.length);
    const sourceIds = new Set(shortcutSources.map((source) => source.id));
    expect(sourceIds.size).toBe(shortcutSources.length);
    for (const source of shortcutSources) {
      expect(source.title.trim()).not.toBe("");
      expect(new URL(source.url).protocol).toBe("https:");
      expect(source.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(source.checkedAt))).toBe(false);
      expect(source.rights.trim()).not.toBe("");
    }
    for (const record of shortcutRecords) {
      expect(sourceIds.has(record.sourceId), record.id).toBe(true);
      expect(record.appId.trim()).not.toBe("");
      expect(record.app.trim()).not.toBe("");
      expect(record.action.trim()).not.toBe("");
      expect(record.context.trim()).not.toBe("");
      expect(record.version.trim()).not.toBe("");
      expect(record.platforms.length, record.id).toBeGreaterThan(0);
      expect(new Set(record.platforms).size).toBe(record.platforms.length);
      expect(record.platforms.every((os) => ["windows", "macos", "linux"].includes(os))).toBe(true);
      expect(["os", "browser", "desktop", "web"]).toContain(record.surface);
      expect(record.sequence.length).toBeGreaterThan(0);
      expect(record.sequence.length).toBeLessThanOrEqual(4);
      for (const stroke of record.sequence) {
        expect(
          stroke.modifiers.every((modifier) => ["Ctrl", "Alt", "Shift", "Meta"].includes(modifier)),
        ).toBe(true);
        expect(new Set(stroke.modifiers).size).toBe(stroke.modifiers.length);
        expect(Boolean(stroke.key || stroke.modifiers.length), record.id).toBe(true);
      }
      const query = parseShortcut(formatShortcut(record.sequence));
      expect(query, record.id).not.toBeNull();
      expect(searchShortcuts([record], { sequence: query! }), record.id).toEqual([record]);
    }
  });

  it("covers real Web applications separately from browser and desktop shortcuts", () => {
    const web = shortcutRecords.filter((record) => record.surface === "web");
    for (const name of [
      "Gmail",
      "Google Docs",
      "Google Sheets",
      "GitHub",
      "Notion",
      "Slack",
      "Discord",
    ]) {
      expect(
        web.some((record) => record.app.includes(name)),
        name,
      ).toBe(true);
    }
    expect(web.some((record) => record.app.includes("Excel"))).toBe(true);
    for (const name of ["Chrome", "Edge", "Firefox"]) {
      expect(
        shortcutRecords.some((record) => record.app.includes(name) && record.surface === "browser"),
        name,
      ).toBe(true);
      expect(
        web.some((record) => record.app === name),
        name,
      ).toBe(false);
    }
    for (const name of ["Slack", "Discord", "Excel"]) {
      expect(
        shortcutRecords.some((record) => record.app.includes(name) && record.surface === "desktop"),
        name,
      ).toBe(true);
    }
  });

  it("retains OS-specific mappings, sequences, and explicit keypad positions", () => {
    expect(
      shortcutRecords.some(
        (record) =>
          record.platforms.includes("macos") &&
          record.sequence.some((stroke) => stroke.modifiers.includes("Meta")),
      ),
    ).toBe(true);
    expect(
      shortcutRecords.some((record) => record.sequence.length > 1 && record.appId === "vscode"),
    ).toBe(true);
    expect(
      shortcutRecords.some((record) =>
        record.sequence.some((stroke) => stroke.code?.startsWith("Numpad")),
      ),
    ).toBe(true);
    expect(
      shortcutRecords.some(
        (record) =>
          record.surface === "web" &&
          record.app.includes("Excel") &&
          record.sequence[0]?.key === "",
      ),
    ).toBe(true);
  });
});
