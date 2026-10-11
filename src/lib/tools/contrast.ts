import { ToolError } from "./errors";

export interface ContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  nonText: boolean;
  foregroundLuminance: number;
  backgroundLuminance: number;
}

function parseHexColor(input: string): { normalized: string; channels: number[] } {
  const value = input.trim();
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) throw new ToolError("COLOR_INVALID");
  const hex =
    value.length === 4
      ? [...value.slice(1)].map((digit) => digit + digit).join("")
      : value.slice(1);
  return {
    normalized: `#${hex.toUpperCase()}`,
    channels: [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255),
  };
}

function luminance(channels: number[]): number {
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return (
    0.2126 * (linear[0] as number) + 0.7152 * (linear[1] as number) + 0.0722 * (linear[2] as number)
  );
}

/** WCAG 2 contrast for opaque sRGB hex colors; checks never use a rounded ratio. */
export function analyzeContrast(foreground: string, background: string): ContrastResult {
  const foregroundColor = parseHexColor(foreground);
  const backgroundColor = parseHexColor(background);
  const foregroundLuminance = luminance(foregroundColor.channels);
  const backgroundLuminance = luminance(backgroundColor.channels);
  const ratio =
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  return {
    foreground: foregroundColor.normalized,
    background: backgroundColor.normalized,
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
    nonText: ratio >= 3,
    foregroundLuminance,
    backgroundLuminance,
  };
}
