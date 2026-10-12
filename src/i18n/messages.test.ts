import { describe, expect, it, vi } from "vite-plus/test";
import { createI18n } from "vue-i18n";
import { messages } from "./index";
import { LOCALES } from "../lib/locales";

function flatten(value: Record<string, unknown>, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof entry === "string"
        ? [[path, entry]]
        : Object.entries(flatten(entry as Record<string, unknown>, path));
    }),
  );
}

function parameters(message: string) {
  return [...new Set([...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].sort();
}

const source = flatten(messages.en);
describe("the complete translated interface", () => {
  it("registers exactly the public language catalog", () => {
    expect(Object.keys(messages).sort()).toEqual([...LOCALES].sort());
  });
  for (const [language, translations] of Object.entries(messages)) {
    it(`${language} has every message and compiles with the same named parameters`, () => {
      const translated = flatten(translations);
      expect(Object.keys(translated).sort()).toEqual(Object.keys(source).sort());
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnings = vi.spyOn(console, "warn").mockImplementation(() => {});
      const runtime = createI18n({
        legacy: false,
        locale: language,
        fallbackLocale: false,
        flatJson: true,
        messages: { [language]: { ...translated } },
      });
      for (const [key, value] of Object.entries(translated)) {
        expect(value.trim(), key).not.toBe("");
        expect(parameters(value), key).toEqual(parameters(source[key]!));
        const args = Object.fromEntries(
          parameters(value).map((name) => [name, name === "count" ? 2 : `sample-${name}`]),
        );
        expect(runtime.global.t(key, args), key).not.toBe(key);
      }
      expect(errors).not.toHaveBeenCalled();
      expect(warnings).not.toHaveBeenCalled();
      runtime.dispose();
    });
  }
});
