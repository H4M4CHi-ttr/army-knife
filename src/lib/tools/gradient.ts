import { ToolError } from "./errors";

export function normalizeHex(value:string):string {
  if (!/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) throw new ToolError("DESIGN_INVALID_COLOR");
  return value.toUpperCase();
}
export interface GradientStop { color:string; position:number }
export interface GradientOptions { kind:"linear"|"radial"; angle:number; stops:GradientStop[] }
export function createGradient(o:GradientOptions):string {
  if (!["linear","radial"].includes(o.kind) || !Array.isArray(o.stops) || o.stops.length<2 ||
    o.stops.length>8 || !Number.isFinite(o.angle) || Math.abs(o.angle)>360) throw new ToolError("DESIGN_INVALID_OPTIONS");
  const stops=o.stops.map(s=>{
    if (!Number.isFinite(s.position)||s.position<0||s.position>100) throw new ToolError("DESIGN_INVALID_OPTIONS");
    return normalizeHex(s.color)+" "+Number(s.position.toFixed(3))+"%";
  });
  // CSS preserves stop order, including coincident/decreasing authored positions.
  return o.kind==="linear" ? "linear-gradient("+o.angle+"deg, "+stops.join(", ")+")" :
    "radial-gradient(circle at center, "+stops.join(", ")+")";
}
