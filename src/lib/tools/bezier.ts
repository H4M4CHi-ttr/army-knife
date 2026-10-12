import { ToolError } from "./errors";

export interface BezierOptions { x1:number; y1:number; x2:number; y2:number; duration:number }
export interface BezierResult { css:string; samples:{x:number;y:number}[]; minY:number; maxY:number }
const cubic=(t:number,a:number,b:number)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
export function createBezier(o:BezierOptions):BezierResult {
  if (![o.x1,o.x2].every(v=>Number.isFinite(v)&&v>=0&&v<=1) ||
      ![o.y1,o.y2].every(v=>Number.isFinite(v)&&v>=-5&&v<=5) ||
      !Number.isFinite(o.duration)||o.duration<50||o.duration>20000) throw new ToolError("DESIGN_INVALID_OPTIONS");
  const samples=Array.from({length:41},(_,i)=>{
    const x=i/40; let lo=0,hi=1;
    for(let j=0;j<42;j++){const t=(lo+hi)/2;if(cubic(t,o.x1,o.x2)<x)lo=t;else hi=t;}
    return {x,y:cubic((lo+hi)/2,o.y1,o.y2)};
  });
  return {
    css:"cubic-bezier("+[o.x1,o.y1,o.x2,o.y2].map(n=>Number(n.toFixed(6))).join(", ")+")",
    samples,minY:Math.min(0,...samples.map(s=>s.y)),maxY:Math.max(1,...samples.map(s=>s.y)),
  };
}
