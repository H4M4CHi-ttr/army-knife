import { ToolError, assertInputSize } from "./errors";
export type PathCase="keep"|"lower"|"upper";
export interface PathOptions {
  prefix:string; suffix:string; caseMode:PathCase; separator:"/"|"\\";
  numbering:boolean; start:number; pad:number; nfc:boolean
}
export interface PathRow {
  before:string; after:string; basename:string; stem:string; ext:string;
  duplicate:boolean; windowsUnsafe:boolean
}
export interface PathResult { rows:PathRow[]; csv:string; conflicts:number; warnings:number }
const RESERVED=/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i;
const unsafe=(leaf:string)=>RESERVED.test(leaf)||/[<>:"|?*\u0000-\u001f]/.test(leaf)||/[. ]$/.test(leaf);
function csvField(s:string):string {
  // Do not let a path entered by the user become an executable spreadsheet formula.
  const safe=/^\s*[=+@-]/.test(s)?"'"+s:s;
  return '"'+safe.replace(/"/g,'""')+'"';
}
export function transformPaths(input:string,o:PathOptions):PathResult {
  assertInputSize(input,65536);assertInputSize(o.prefix,128);assertInputSize(o.suffix,128);
  if(!["keep","lower","upper"].includes(o.caseMode)||!["/","\\"].includes(o.separator)||
    !Number.isInteger(o.start)||o.start<0||o.start>99999||
    !Number.isInteger(o.pad)||o.pad<0||o.pad>6||
    /[\/\\\u0000-\u001f]/.test(o.prefix+o.suffix)) throw new ToolError("PATH_INVALID_VALUE");
  const entries=input.split(/\r\n|\r|\n/).filter(Boolean);
  if(entries.length>500) throw new ToolError("INPUT_TOO_LARGE");
  const seen=new Set<string>();let conflicts=0,warnings=0;
  const rows=entries.map((before,i)=>{
    if(before.length>1024||/[\u0000-\u001f]/.test(before)) throw new ToolError("PATH_INVALID_VALUE");
    const segments=before.split(/[\/\\]/),base=segments.pop()!;
    if(!base||base==="."||base==="..") throw new ToolError("PATH_INVALID_VALUE");
    const dot=base.lastIndexOf("."), ext=dot>0?base.slice(dot+1):"";
    const stem=ext?base.slice(0,-ext.length-1):base;
    let leaf=o.prefix+stem+(o.numbering?String(o.start+i).padStart(o.pad,"0"):"")+
      o.suffix+(ext?"."+ext:"");
    if(o.nfc)leaf=leaf.normalize("NFC");
    if(o.caseMode==="lower")leaf=leaf.toLowerCase();
    if(o.caseMode==="upper")leaf=leaf.toUpperCase();
    if(leaf.length>1024)throw new ToolError("INPUT_TOO_LARGE");
    const after=[...segments,leaf].join(o.separator);
    const key=after.normalize("NFC").toLowerCase(),duplicate=seen.has(key);
    seen.add(key);
    const windowsUnsafe=unsafe(leaf);
    if(duplicate)conflicts++;if(windowsUnsafe)warnings++;
    return {before,after,basename:base,stem,ext,duplicate,windowsUnsafe};
  });
  return {rows,conflicts,warnings,
    csv:"before,after,basename,stem,extension,duplicate,windows_unsafe\n"+
      rows.map(r=>[r.before,r.after,r.basename,r.stem,r.ext].map(csvField).join(",")+
        ","+r.duplicate+","+r.windowsUnsafe).join("\n")};
}
