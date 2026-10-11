import { describe, expect, it } from "vite-plus/test";
import { analyzeContrast } from "./contrast";

describe("WCAG contrast", () => {
  it("calculates 21:1 for black on white and 1:1 for equal colors", () => {
    expect(analyzeContrast("#000", "#fff")).toMatchObject({
      ratio: 21,
      aaNormal: true,
      aaaNormal: true,
      foreground: "#000000",
      background: "#FFFFFF",
    });
    expect(analyzeContrast("#123456", "#123456")).toMatchObject({
      ratio: 1,
      aaNormal: false,
      aaLarge: false,
    });
  });

  it("does not round a ratio up to pass the 4.5 threshold", () => {
    const failing = analyzeContrast("#777777", "#FFFFFF");
    expect(failing.ratio).toBeCloseTo(4.4780894536, 8);
    expect(failing.ratio.toFixed(1)).toBe("4.5");
    expect(failing.aaNormal).toBe(false);
    expect(failing.aaLarge).toBe(true);
    expect(analyzeContrast("#767676", "#FFFFFF")).toMatchObject({
      aaNormal: true,
      aaaNormal: false,
    });
  });

  it("is symmetric and rejects unsupported alpha instead of silently discarding it", () => {
    expect(analyzeContrast("#1257ab", "#eef2ff").ratio).toBe(
      analyzeContrast("#eef2ff", "#1257ab").ratio,
    );
    for (const invalid of ["#0000", "#00000000", "red", "#12", "ffffff", "#zzzzzz"]) {
      expect(() => analyzeContrast(invalid, "#fff")).toThrow(
        expect.objectContaining({ code: "COLOR_INVALID" }),
      );
    }
  });
});
