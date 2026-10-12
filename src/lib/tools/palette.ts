import { ToolError } from "./errors";
import { normalizeHex } from "./gradient";

export type Harmony="analogous"|"complementary"|"triadic";
export interface PaletteOptions { base:string; count:number; harmony:Harmony }
export interface PaletteResult { colors:{hex:string;hue:number;offset:number}[]; css:string }
function rgbToHsl(r:number,g:number,b:number):[number,number,number] {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min, l=(max+min)/2;
  let h=0, s=0;
  if(d>0){
    s=d/(1-Math.abs(2*l-1));
    if(max===r)h=((g-b)/d)%6;
    else if(max===g)h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h=(h*60+360)%360;
  }
  return [h,s,l];
}
function hslToHex(h:number,s:number,l:number):string {
  const f=(n:number)=>{
    const k=(n+h/30)%12, a=s*Math.min(l,1-l);
    return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))));
  };
  return "#"+[f(0),f(8),f(4)].map(x=>x.toString(16).padStart(2,"0")).join("").toUpperCase();
}
export function createPalette(o:PaletteOptions):PaletteResult {
  const color=normalizeHex(o.base);
  if(!Number.isInteger(o.count)||o.count<2||o.count>8||
    !["analogous","complementary","triadic"].includes(o.harmony)) throw new ToolError("DESIGN_INVALID_OPTIONS");
  const alpha=color.length===9?color.slice(7):"";
  const [h,s,l]=rgbToHsl(...[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)) as [number,number,number]);
  const offsets=o.harmony==="analogous" ?
    Array.from({length:o.count},(_,i)=>(i/(o.count-1)-0.5)*60) :
    o.harmony==="complementary" ? [0,180] : [0,120,240];
  const colors=Array.from({length:o.count},(_,i)=>{
    const offset=offsets[i%offsets.length]!;
    const cycle=Math.floor(i/offsets.length);
    const light=Math.max(0,Math.min(1,l+(cycle?((cycle%2)?1:-1)*0.10*Math.ceil(cycle/2):0)));
    const hue=(h+offset+360)%360;
    return {hex:hslToHex(hue,s,light)+alpha,hue,offset};
  });
  return {colors,css:":root {\n"+colors.map((c,i)=>"  --army-palette-"+(i+1)+": "+c.hex+";").join("\n")+"\n}"};
}
