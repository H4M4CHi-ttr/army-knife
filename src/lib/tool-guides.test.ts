import { describe, expect, it } from "vite-plus/test";
import { tools } from "./catalog";
import { ADDED_LOCALES, LOCALES, languageNames, localeFontPacks } from "./locales";
import { guideLabels, toolGuides } from "./tool-guides";

describe("complete localized public guides", () => {
  it("covers every tool and language without fallback-only pages", () => {
    const locales = [...LOCALES].sort();
    expect(Object.keys(languageNames).sort()).toEqual(locales);
    expect(Object.keys(localeFontPacks).sort()).toEqual(locales);
    expect(Object.keys(guideLabels).sort()).toEqual(locales);
    expect(Object.keys(toolGuides).sort()).toEqual(tools.map(({ id }) => id).sort());
    for (const locale of LOCALES) {
      expect(Object.keys(guideLabels[locale]).sort()).toEqual(Object.keys(guideLabels.en).sort());
      expect(Object.values(guideLabels[locale]).every((text) => text.trim())).toBe(true);
    }
    for (const { id } of tools) {
      expect(Object.keys(toolGuides[id]).sort(), id).toEqual(locales);
      for (const locale of LOCALES) {
        const guide = toolGuides[id][locale];
        expect(guide.introduction.trim(), `${locale}/${id}`).not.toBe("");
        expect(guide.exampleInput.trim(), `${locale}/${id}`).not.toBe("");
        expect(guide.exampleResult.trim(), `${locale}/${id}`).not.toBe("");
        expect(guide.steps.length, `${locale}/${id}`).toBeGreaterThan(0);
        expect(guide.limitations.length, `${locale}/${id}`).toBeGreaterThan(0);
        expect([...guide.steps, ...guide.limitations].every((text) => text.trim())).toBe(true);
      }
      for (const locale of ADDED_LOCALES) {
        expect(toolGuides[id][locale].exampleInput, `${locale}/${id} keeps technical input`).toBe(
          toolGuides[id].en.exampleInput,
        );
        expect(toolGuides[id][locale].introduction, `${locale}/${id} is translated`).not.toBe(
          toolGuides[id].en.introduction,
        );
      }
    }
  });
});
