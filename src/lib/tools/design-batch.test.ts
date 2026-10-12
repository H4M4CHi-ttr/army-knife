import { describe, expect, it } from "vite-plus/test";
import { createBezier } from "./bezier";
import { createGradient } from "./gradient";
import { createPlaceholder } from "./placeholder";
import { transformPaths, type PathOptions } from "./path-batch";
import { createPalette } from "./palette";

describe("new design and filename tools", () => {
  it("inverts the CSS cubic-bezier curve and allows overshoot but rejects invalid x", () => {
    const r=createBezier({x1:.25,y1:.1,x2:.25,y2:1,duration:600});
    expect(r.css).toBe("cubic-bezier(0.25, 0.1, 0.25, 1)");
    expect(r.samples).toHaveLength(41);
    expect(r.samples[0]!.y).toBeCloseTo(0);
    expect(r.samples[40]!.y).toBeCloseTo(1);
    const overshoot=createBezier({x1:0,y1:3,x2:1,y2:3,duration:100});
    expect(overshoot.maxY).toBeGreaterThan(1);
    expect(() => createBezier({x1:-.01,y1:0,x2:1,y2:1,duration:100})).toThrow();
    expect(() => createBezier({x1:0,y1:0,x2:1,y2:1,duration:0})).toThrow();
    expect(() => createBezier({x1:0,y1:0,x2:0,y2:1,duration:100})).not.toThrow();
  });

  it("creates CSS gradient with literal alpha, equal and descending stops", () => {
    expect(createGradient({kind:"linear",angle:90,stops:[
      {color:"#3366ff",position:50},{color:"#ffffff80",position:50},
    ]})).toBe("linear-gradient(90deg, #3366FF 50%, #FFFFFF80 50%)");
    expect(createGradient({kind:"radial",angle:0,stops:[
      {color:"#aabbcc",position:100},{color:"#ffffff",position:0},
    ]})).toContain("radial-gradient(circle at center, #AABBCC 100%, #FFFFFF 0%)");
    expect(()=>createGradient({kind:"linear",angle:0,stops:[
      {color:"red",position:0},{color:"#FFFFFF",position:100},
    ]})).toThrow();
    expect(()=>createGradient({kind:"linear",angle:0,stops:[
      {color:"#000000",position:0},
    ]})).toThrow();
  });

  it("escapes static SVG and rejects XML controls or giant canvas", () => {
    const r=createPlaceholder({width:640,height:360,background:"#ffffff",label:'<A&B "tag">',alignment:"center"});
    expect(r.svg).toContain("&lt;A&amp;B &quot;tag&quot;&gt;");
    expect(r.svg).not.toContain("<script");
    expect(r.svg).not.toContain("onload=");
    expect(r.textColor).toBe("#000000");
    const dark=createPlaceholder({width:1,height:1,background:"#000000",label:"",alignment:"top"});
    expect(dark.textColor).toBe("#FFFFFF");
    expect(() => createPlaceholder({width:4096,height:4096,background:"#000000",label:"",alignment:"bottom"})).toThrow();
    expect(() => createPlaceholder({width:10,height:10,background:"#000000",label:"\u0000",alignment:"top"})).toThrow();
    expect(() => createPlaceholder({width:10,height:10,background:"#000000",label:"\ud800",alignment:"top"})).toThrow();
  });

  it("transforms path strings without accessing files, reports collisions and spreadsheet formulas", () => {
    const opts:PathOptions={prefix:"",suffix:"",caseMode:"lower",separator:"/",numbering:false,start:1,pad:2,nfc:true};
    const r=transformPaths("a/Readme.TXT\na/README.txt\nC:\\temp\\.env\nCON.txt\n=SUM(A1).csv",opts);
    expect(r.rows[0]!.after).toBe("a/readme.txt");
    expect(r.rows[1]!.duplicate).toBe(true);
    expect(r.rows[2]!.stem).toBe(".env");
    expect(r.rows[2]!.ext).toBe("");
    expect(r.rows[3]!.windowsUnsafe).toBe(true);
    expect(r.csv).toContain("\"'=SUM(A1).csv\"");
    expect(r.conflicts).toBe(1);
    expect(() => transformPaths("dir/",opts)).toThrow();
    expect(() => transformPaths("a.txt",{...opts,prefix:"bad/"})).toThrow();
    expect(() => transformPaths(("test\n").repeat(501),opts)).toThrow();
    expect(transformPaths("a.txt",{...opts,prefix:"x",numbering:true,start:3,pad:3}).rows[0]!.after).toBe("xa003.txt");
  });

  it("generates bounded HSL palettes with optional alpha and rejects malformed inputs", () => {
    const triad=createPalette({base:"#FF0000",count:3,harmony:"triadic"});
    expect(triad.colors.map(x=>x.hex)).toEqual(["#FF0000","#00FF00","#0000FF"]);
    expect(triad.css).toContain("--army-palette-3: #0000FF;");
    const alpha=createPalette({base:"#3366FFAA",count:5,harmony:"analogous"});
    expect(alpha.colors).toHaveLength(5);
    expect(alpha.colors.every(x=>x.hex.endsWith("AA"))).toBe(true);
    expect(() => createPalette({base:"#ffffff",count:10,harmony:"complementary"})).toThrow();
    expect(() => createPalette({base:"red",count:3,harmony:"triadic"})).toThrow();
  });
});
