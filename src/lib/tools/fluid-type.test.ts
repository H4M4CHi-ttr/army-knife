import { describe, expect, it } from "vite-plus/test";
import { calculateFluidType } from "./fluid-type";

describe("CSS fluid clamp calculation", () => {
  it("derives an exact two-point linear model (before CSS rounding)", () => {
    const result = calculateFluidType({minSize:16,maxSize:24,minViewport:320,maxViewport:1280,rootSize:16});
    expect(result.css).toBe("font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem);");
    expect(result.previewPx(320)).toBe(16);
    expect(result.previewPx(1280)).toBe(24);
    expect(result.previewPx(800)).toBe(20);
    expect(result.previewPx(120)).toBe(16);
    expect(result.previewPx(1920)).toBe(24);
  });
  it("handles constant sizes and bounds, rejecting invalid ranges", () => {
    expect(calculateFluidType({minSize:16,maxSize:16,minViewport:320,maxViewport:640,rootSize:16}).previewPx(480)).toBe(16);
    const valid = {minSize:16,maxSize:24,minViewport:320,maxViewport:1280,rootSize:16};
    expect(() => calculateFluidType({...valid,maxViewport:320})).toThrowError("FLUID_INVALID_RANGE");
    expect(() => calculateFluidType({...valid,minSize:26})).toThrowError("FLUID_INVALID_RANGE");
    expect(() => calculateFluidType({...valid,maxSize:Infinity})).toThrowError("FLUID_INVALID_RANGE");
    expect(() => calculateFluidType({...valid,rootSize:0})).toThrowError("FLUID_INVALID_RANGE");
  });
});
