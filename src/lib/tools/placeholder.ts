import { ToolError, assertInputSize } from "./errors";
import { normalizeHex } from "./gradient";
export interface PlaceholderOptions {
  width:number; height:number; background:string; label:string; alignment:"top"|"center"|"bottom"
}
export interface PlaceholderResult { svg:string; textColor:string }
const xmlEscape=(value:string)=>value.replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"
})[c]!);
export function createPlaceholder(o:PlaceholderOptions):PlaceholderResult {
  const {width,height,label,alignment}=o;
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
      width>4096||height>4096||width*height>4194304||
      !["top","center","bottom"].includes(alignment)) throw new ToolError("DESIGN_INVALID_OPTIONS");
  assertInputSize(label,160);
  for(const char of label){
    const cp=char.codePointAt(0)!;
    if(!(cp===9||cp===10||cp===13||(cp>=32&&cp<=0xd7ff)||
         (cp>=0xe000&&cp<=0xfffd)||(cp>=0x10000&&cp<=0x10ffff)))
      throw new ToolError("DESIGN_INVALID_LABEL");
  }
  const bg=normalizeHex(o.background);
  const rgb=[1,3,5].map(i=>parseInt(bg.slice(i,i+2),16));
  const linear=(v:number)=>{const s=v/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;};
  const lum=0.2126*linear(rgb[0]!)+0.7152*linear(rgb[1]!)+0.0722*linear(rgb[2]!);
  // Contrasting text assumes an opaque background; translucent backgrounds depend on the backdrop.
  const textColor=lum>0.179?"#000000":"#FFFFFF";
  const y=alignment==="top"?height*.2:alignment==="bottom"?height*.8:height/2;
  const size=Math.max(1,Math.min(28,width/Math.max(2,label.length*.6),height/5));
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+
    '" viewBox="0 0 '+width+" "+height+'"><rect width="100%" height="100%" fill="'+bg+'"/>'+
    (label?'<text x="50%" y="'+y+'" fill="'+textColor+'" font-family="sans-serif" font-size="'+
      Number(size.toFixed(2))+'" text-anchor="middle" dominant-baseline="middle">'+xmlEscape(label)+'</text>':"")+
    "</svg>";
  return {svg,textColor};
}
