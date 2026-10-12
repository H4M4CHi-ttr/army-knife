import { describe, expect, it } from "vite-plus/test";
import { analyzeCssSpecificity as calc, SPECIFICITY_LIMITS } from "./css-specificity";
const score = (selector: string) => {
  const { a, b, c } = calc(selector)[0]!;
  return [a,b,c];
};
describe("CSS Selectors Level 4 specificity subset", () => {
  it("counts ID, class, attribute, pseudo-class, type and pseudo-element", () => {
    expect(score("main#app .card:hover::before")).toEqual([1,2,2]);
    expect(score("input[type='text']:focus")).toEqual([0,2,1]);
    expect(score("*")).toEqual([0,0,0]);
    expect(score(".a:before")).toEqual([0,1,1]);
  });
  it("uses max of :is/:not/:has; :where is zero; nth-child counts of-selector", () => {
    expect(score("div:is(.a, #b)")).toEqual([1,0,1]);
    expect(score(":not(:where(#id), .active)")).toEqual([0,1,0]);
    expect(score("section:has(> a.selected)")).toEqual([0,1,2]);
    expect(score("p:where(#id,.active)")).toEqual([0,0,1]);
    expect(score(":nth-child(2n of .a, #b)")).toEqual([1,1,0]);
    expect(score(":nth-last-child(even)")).toEqual([0,1,0]);
    expect(score(":host(.active)")).toEqual([0,2,0]);
    expect(score("::slotted(#id)")).toEqual([1,0,1]);
  });
  it("splits top-level commas only and preserves a per-part breakdown", () => {
    const results=calc("div:is(.a,#b), span[data-id='a,b']");
    expect(results).toHaveLength(2);
    expect([results[0]!.a,results[0]!.b,results[0]!.c]).toEqual([1,0,1]);
    expect([results[1]!.a,results[1]!.b,results[1]!.c]).toEqual([0,1,1]);
    expect(results[0]!.parts.map((part)=>part.text)).toEqual(["div",":is(.a,#b)"]);
  });
  it("rejects malformed selectors and unsupported nesting instead of guessing", () => {
    for (const value of ["div[",":is()",":not(.foo",":nth-child(bogus)","#","a ???","a/*x*/"]) {
      expect(() => calc(value),value).toThrow();
    }
    expect(() => calc("& .child")).toThrowError("CSS_UNSUPPORTED_NESTING");
    expect(() => calc(":custom(.child)")).toThrowError("CSS_UNSUPPORTED_SELECTOR");
    expect(() => calc("a".repeat(SPECIFICITY_LIMITS.characters+1))).toThrowError("INPUT_TOO_LARGE");
    expect(() => calc(Array.from({length:33},(_,i)=>".a"+i).join(","))).toThrowError("INPUT_TOO_LARGE");
  });
});
