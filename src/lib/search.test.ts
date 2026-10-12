import { describe, expect, it } from "vite-plus/test";
import { matchesSearch } from "./search";

describe("localized tool-name search", () => {
  it.each([
    ["codificacion", "Codificación de URL", "es"],
    ["specificite css", "Calculateur de spécificité CSS", "fr"],
    ["grosse", "Größe der Daten", "de"],
    ["codificacao", "Codificação de URL", "pt-BR"],
    ["UKURAN DATA", "Konverter ukuran data", "id"],
    ["doi ma", "Chuyển đổi mã Unicode", "vi"],
    ["chuyển", "Chuyển đổi Unicode", "vi"],
  ] as const)("finds %s in %s (%s)", (query, text, locale) => {
    expect(matchesSearch(query, text, locale)).toBe(true);
  });

  it("requires every query word and keeps technical punctuation significant", () => {
    expect(matchesSearch("url missing", "Codificación de URL", "es")).toBe(false);
    expect(matchesSearch("c++", "C++ Rust CSV", "fr")).toBe(true);
    expect(matchesSearch("c++", "CSS converter", "fr")).toBe(false);
    expect(matchesSearch(" \t ", "Codificación de URL", "es")).toBe(true);
  });

  it("preserves Japanese voicing distinctions and normalizes equivalent Unicode input", () => {
    expect(matchesSearch("は", "ば", "ja")).toBe(false);
    expect(matchesSearch("ば", "は\u3099", "ja")).toBe(true);
  });
});
