import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { tools } from "./catalog";
import {
  createPreferences,
  defaultPreferences,
  detectLocale,
  parsePreferences,
  STORAGE_KEY,
} from "./preferences";

const stops: (() => void)[] = [];
afterEach(() => {
  for (const stop of stops.splice(0)) stop();
});

describe("private browser preferences", () => {
  it("keeps every DevToys overlap off, including list operations", () => {
    const defaults = defaultPreferences();
    expect(defaults.enabledTools).toEqual(
      tools.filter((tool) => !tool.devtoys).map((tool) => tool.id),
    );
    for (const id of ["sets", "json-format", "contrast"])
      expect(defaults.enabledTools).not.toContain(id);
    expect(defaults.enabledTools).toContain("csv");
    expect(defaults.favorites).toEqual([]);
  });

  it.each([
    [["ja-JP"], "ja"],
    [["ko-KR"], "ko"],
    [["zh-Hant"], "zh-TW"],
    [["zh-HK"], "zh-TW"],
    [["zh-MO"], "zh-TW"],
    [["zh-Hans"], "zh-CN"],
    [["zh-CN"], "zh-CN"],
    [["EN-US"], "en"],
    [["fr-FR", "ja-JP"], "ja"],
    [["fr-FR"], "en"],
    [[], "en"],
  ] as const)("detects language preferences %j", (languages, expected) => {
    expect(detectLocale(languages)).toBe(expected);
  });

  it.each([null, "", "{", "null", "[]", "true", '{"version":2,"enabledTools":["contrast"]}'])(
    "recovers from missing, damaged, or unsupported storage: %s",
    (raw) => {
      expect(parsePreferences(raw, "ja")).toEqual(defaultPreferences("ja"));
    },
  );

  it("only restores known fields and valid tool IDs", () => {
    const parsed = parsePreferences(
      JSON.stringify({
        version: 1,
        locale: "invalid",
        theme: "neon",
        enabledTools: ["csv", "csv", "__proto__", "unknown", 1, null, "json-format"],
        favorites: ["cidr", "cidr", "unknown"],
        secretInput: "NEVER_RESTORE_ME",
      }),
      "ko",
    );
    expect(parsed).toEqual({
      version: 1,
      locale: "ko",
      theme: "system",
      enabledTools: ["csv", "json-format"],
      favorites: ["cidr"],
    });
    expect(Object.hasOwn(parsed, "secretInput")).toBe(false);
  });

  it("preserves an intentional empty tool selection and explicit overlapping tools", () => {
    expect(parsePreferences('{"version":1,"enabledTools":[]}', "en").enabledTools).toEqual([]);
    expect(
      parsePreferences('{"version":1,"enabledTools":["contrast"]}', "en").enabledTools,
    ).toEqual(["contrast"]);
    expect(
      parsePreferences('{"version":1,"enabledTools":["csv"]}', "en").enabledTools,
    ).not.toContain("sets");
  });

  it("serializes an allowlist of preferences and never arbitrary reactive fields", () => {
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    const controller = createPreferences(storage, ["en-US"]);
    stops.push(controller.stop);
    controller.preferences.theme = "dark";
    Object.assign(controller.preferences, {
      input: "PRIVATE_INPUT_M4RKR_7261",
      password: "PRIVATE_INPUT_M4RKR_7261",
    });
    const [key, raw] = storage.setItem.mock.calls.at(-1) as unknown as [string, string];
    expect(key).toBe(STORAGE_KEY);
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual([
      "enabledTools",
      "favorites",
      "locale",
      "theme",
      "version",
    ]);
    expect(raw).not.toContain("PRIVATE_INPUT_M4RKR_7261");
    expect(JSON.parse(raw).theme).toBe("dark");
  });

  it("continues in memory when browser storage is disabled", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    const controller = createPreferences(storage, ["ja-JP"]);
    stops.push(controller.stop);
    expect(controller.status.available).toBe(false);
    expect(() => {
      controller.preferences.theme = "dark";
    }).not.toThrow();
    expect(controller.preferences.theme).toBe("dark");
    expect(controller.status.available).toBe(false);
  });

  it("also works without a Storage object and restores defaults on reset", () => {
    const controller = createPreferences(undefined, ["ko-KR"]);
    stops.push(controller.stop);
    controller.preferences.theme = "dark";
    controller.preferences.enabledTools.push("contrast");
    controller.preferences.favorites.push("cidr");
    controller.reset();
    expect(controller.status.available).toBe(false);
    expect(controller.preferences).toEqual(defaultPreferences("ko"));
  });
});
