import { describe, expect, it } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { shortcutRecords, shortcutSources } from "./shortcuts";
import {
  formatShortcut,
  parseShortcut,
  searchShortcuts,
  validateShortcutPublication,
} from "@/lib/tools/shortcuts";

describe("shortcut publication candidate", () => {
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

  it("contains only the individually matched licensed candidate scope", () => {
    expect(shortcutRecords).toHaveLength(82);
    expect(shortcutSources).toHaveLength(6);
    expect(validateShortcutPublication(shortcutRecords, shortcutSources)).toEqual([]);
    expect(new Set(shortcutRecords.map((record) => record.appId))).toEqual(
      new Set(["vscode", "warp", "windows-terminal", "firefox", "github"]),
    );
    const licenses = new Map(shortcutSources.map((source) => [source.id, source.license!.spdx]));
    const counts: Record<string, number> = {};
    for (const record of shortcutRecords) {
      const license = licenses.get(record.sourceId)!;
      counts[license] = (counts[license] ?? 0) + 1;
    }
    expect(counts).toEqual({ "CC-BY-3.0-US": 18, MIT: 15, "CC-BY-4.0": 33, "CC-BY-SA-3.0": 16 });
  });

  it("distinguishes actual Web applications from browser shortcuts", () => {
    const web = shortcutRecords.filter((record) => record.surface === "web");
    expect(web).toHaveLength(18);
    expect(web.every((record) => record.app.includes("GitHub"))).toBe(true);
    expect(shortcutRecords.filter((record) => record.surface === "browser")).toHaveLength(16);
    expect(web.some((record) => record.app.includes("Firefox"))).toBe(false);
    expect(shortcutRecords.filter((record) => record.surface === "desktop")).toHaveLength(48);
  });

  it("retains OS-specific and ordered mappings without inventing physical positions", () => {
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
      shortcutRecords.some((record) => record.sequence.length > 1 && record.surface === "web"),
    ).toBe(true);
    expect(shortcutRecords.every((record) => record.sequence.every((stroke) => !stroke.code))).toBe(
      true,
    );
  });

  it("bundles complete same-site licenses and source-specific attribution for every candidate", () => {
    const readPublic = (relative: string) => readFileSync(resolve("public", relative), "utf8");
    for (const source of shortcutSources) {
      const license = source.license!;
      const notice = readPublic(license.offlinePath);
      expect(notice, source.id).toContain(source.id);
      expect(notice, source.id).toContain(license.attribution.replaceAll("&", "&amp;"));
      expect(notice, source.id).toContain(license.spdx);
      expect(notice, source.id).toContain(source.url.replaceAll("&", "&amp;"));
      expect(notice, source.id).toContain(license.changes);
      const fullLicense = readPublic(license.licenseTextPath);
      expect(fullLicense.length, source.id).toBeGreaterThan(1000);
      for (const record of shortcutRecords.filter((record) => record.sourceId === source.id)) {
        expect(notice, record.id).toContain(record.id);
      }
    }
    expect(readPublic("licenses/shortcut-sources/CC-BY-4.0.txt")).toContain(
      "Section 8 -- Interpretation.",
    );
    expect(readPublic("licenses/shortcut-sources/CC-BY-SA-3.0.txt")).toContain("8. Miscellaneous");
    expect(readPublic("licenses/shortcut-sources/CC-BY-3.0-US.html")).toContain("8. Miscellaneous");
    expect(readPublic("licenses/shortcut-sources/warp-docs-MIT.txt")).toContain(
      "Copyright (C) 2020-2026 Denver Technologies, Inc.",
    );
    const notice = readPublic("licenses/shortcut-sources/notices.html");
    expect(notice).toContain("individual mozilla.org contributors");
    expect(notice).toContain("AliceWyman");
    expect(notice).toContain("Flavius Floare");
    expect(notice).toContain("Merely separating a file is not a determination");
    expect(notice).toContain("MIT license does not relicense the source-derived records");
    expect(notice).not.toMatch(/<(script|img|iframe)\b/i);
  });
});
