import { ToolError } from "./errors";

export interface FluidTypeSettings {
  minSize: number;
  maxSize: number;
  minViewport: number;
  maxViewport: number;
  rootSize: number;
}
export interface FluidTypeResult {
  css: string;
  slopeVw: number;
  interceptRem: number;
  minRem: number;
  maxRem: number;
  previewPx: (viewport: number) => number;
}

const round = (value: number) => Number(value.toFixed(6));
export function calculateFluidType(settings: FluidTypeSettings): FluidTypeResult {
  const { minSize, maxSize, minViewport, maxViewport, rootSize } = settings;
  if (![minSize, maxSize, minViewport, maxViewport, rootSize].every(Number.isFinite) ||
      minSize < 0.5 || maxSize > 256 || minSize > maxSize ||
      minViewport < 240 || maxViewport > 10000 || minViewport >= maxViewport ||
      rootSize < 8 || rootSize > 32)
    throw new ToolError("FLUID_INVALID_RANGE");
  const slope = (maxSize - minSize) / (maxViewport - minViewport);
  const slopeVw = 100 * slope;
  const interceptRem = (minSize - slope * minViewport) / rootSize;
  const minRem = minSize / rootSize;
  const maxRem = maxSize / rootSize;
  const sign = interceptRem < 0 ? " - " : " + ";
  const css = "font-size: clamp(" + round(minRem) + "rem, calc(" +
    round(slopeVw) + "vw" + sign + round(Math.abs(interceptRem)) + "rem), " +
    round(maxRem) + "rem);";
  const previewPx = (viewport: number) => {
    if (!Number.isFinite(viewport)) throw new ToolError("FLUID_INVALID_RANGE");
    return Math.max(minSize, Math.min(maxSize, minSize + slope * (viewport - minViewport)));
  };
  return { css, slopeVw, interceptRem, minRem, maxRem, previewPx };
}
