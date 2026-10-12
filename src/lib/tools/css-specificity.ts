import { ToolError } from "./errors";

export const SPECIFICITY_LIMITS = { characters: 4096, selectors: 32, depth: 8, tokens: 256 } as const;
export interface SpecificityPart {
  text: string;
  kind: "id" | "class" | "type" | "zero" | "logical";
  a: number;
  b: number;
  c: number;
}
export interface SpecificityResult {
  selector: string;
  a: number;
  b: number;
  c: number;
  parts: SpecificityPart[];
}

const invalid = () => new ToolError("CSS_INVALID_SELECTOR");
const unsupported = () => new ToolError("CSS_UNSUPPORTED_SELECTOR");
type Score = [number, number, number];
const add = (a: Score, b: Score): Score => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const greatest = (a: Score, b: Score): Score =>
  a[0] !== b[0] ? (a[0] > b[0] ? a : b) :
  a[1] !== b[1] ? (a[1] > b[1] ? a : b) : a[2] >= b[2] ? a : b;

/** Split comma-delimited selector lists without splitting functional pseudo arguments. */
function splitSelectors(value: string): string[] {
  const output: string[] = [];
  let parentheses = 0, brackets = 0, quote = "";
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i]!;
    if (char === "\\") {
      if (++i >= value.length) throw invalid();
    } else if (quote) {
      if (char === quote) quote = "";
    } else if (char === "'" || char === '"') {
      quote = char;
    } else if (char === "[") {
      if (brackets++) throw unsupported();
    } else if (char === "]") {
      if (--brackets < 0) throw invalid();
    } else if (!brackets && char === "(") {
      parentheses++;
    } else if (!brackets && char === ")") {
      if (--parentheses < 0) throw invalid();
    } else if (!brackets && !parentheses && char === ",") {
      const selector = value.slice(start, i).trim();
      if (!selector) throw invalid();
      output.push(selector);
      start = i + 1;
    }
  }
  if (quote || parentheses || brackets) throw invalid();
  const last = value.slice(start).trim();
  if (!last) throw invalid();
  output.push(last);
  if (output.length > SPECIFICITY_LIMITS.selectors) throw new ToolError("INPUT_TOO_LARGE");
  return output;
}

function readIdent(value: string, start: number): number {
  let index = start;
  while (index < value.length) {
    const ch = value[index]!;
    if (/[\w\-\u0080-\uffff]/u.test(ch)) index++;
    else if (ch === "\\") {
      index++;
      if (index >= value.length) throw invalid();
      if (/[0-9a-f]/i.test(value[index]!)) {
        let digits = 0;
        while (digits < 6 && /[0-9a-f]/i.test(value[index] ?? "")) { index++; digits++; }
        if (/\s/.test(value[index] ?? "")) index++;
      } else index++;
    } else break;
  }
  return index;
}

function readBlock(value: string, start: number, open: string, close: string) {
  let depth = 1, quote = "", index = start + 1;
  for (; index < value.length; index++) {
    const ch = value[index]!;
    if (ch === "\\") {
      if (++index >= value.length) throw invalid();
    } else if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === "'" || ch === '"') quote = ch;
    else if (ch === open) depth++;
    else if (ch === close && --depth === 0) return {content:value.slice(start+1,index),end:index+1};
  }
  throw invalid();
}

function list(value: string, depth: number): SpecificityResult[] {
  if (depth > SPECIFICITY_LIMITS.depth) throw new ToolError("CSS_NESTING_LIMIT");
  return splitSelectors(value).map((selector) => single(selector, depth));
}

function maxList(value: string, depth: number): Score {
  return list(value, depth).reduce<Score>((best, entry) =>
    greatest(best, [entry.a,entry.b,entry.c]), [0,0,0]);
}

/** A deliberately strict Selectors 4 subset. Unsupported syntax is rejected, never approximated. */
function single(selector: string, depth: number): SpecificityResult {
  let index = 0;
  let score: Score = [0,0,0];
  const parts: SpecificityPart[] = [];
  function record(text: string, kind: SpecificityPart["kind"], points: Score) {
    if (parts.length >= SPECIFICITY_LIMITS.tokens) throw new ToolError("INPUT_TOO_LARGE");
    score = add(score, points);
    parts.push({text,kind,a:points[0],b:points[1],c:points[2]});
  }
  while (index < selector.length) {
    const start = index;
    const char = selector[index]!;
    if (/\s/.test(char) || [">","+","~"].includes(char)) {
      index++;
      continue;
    }
    if (char === "&") throw new ToolError("CSS_UNSUPPORTED_NESTING");
    if (char === "#" || char === ".") {
      index = readIdent(selector, index+1);
      if (index === start+1) throw invalid();
      record(selector.slice(start,index), char === "#" ? "id" : "class", char === "#" ? [1,0,0] : [0,1,0]);
      continue;
    }
    if (char === "[") {
      const block=readBlock(selector,index,"[","]");
      if (!/^\s*(?:[\w-]|\\)/.test(block.content)) throw invalid();
      index=block.end;
      record(selector.slice(start,index),"class",[0,1,0]);
      continue;
    }
    if (char === ":") {
      const element = selector[index+1] === ":";
      index += element ? 2 : 1;
      const nameStart=index;
      index=readIdent(selector,index);
      if (index===nameStart) throw invalid();
      const name=selector.slice(nameStart,index).toLowerCase();
      if (selector[index] === "(") {
        const block=readBlock(selector,index,"(",")");
        index=block.end;
        const argument=block.content.trim();
        if (!argument) throw invalid();
        let points: Score, kind: SpecificityPart["kind"] = "logical";
        if (!element && ["is","not","has"].includes(name)) points=maxList(argument,depth+1);
        else if (!element && name==="where") {
          maxList(argument,depth+1);
          points=[0,0,0];
          kind="zero";
        } else if (!element && ["nth-child","nth-last-child"].includes(name)) {
          const ofMatch=/\s+of\s+/i.exec(argument);
          const formula=(ofMatch ? argument.slice(0,ofMatch.index) : argument).replace(/\s+/g,"");
          if (!/^(?:odd|even|[+-]?\d+|[+-]?(?:\d+)?n(?:[+-]\d+)?)$/i.test(formula)) throw invalid();
          points=add([0,1,0], ofMatch ? maxList(argument.slice(ofMatch.index+ofMatch[0].length),depth+1) : [0,0,0]);
        } else if (!element && ["host","host-context"].includes(name)) {
          points=add([0,1,0],maxList(argument,depth+1));
        } else if (element && name==="slotted") {
          points=add([0,0,1],maxList(argument,depth+1));
        } else if (element && name==="part") {
          points=[0,0,1];
        } else if (!element && ["lang","dir"].includes(name)) {
          points=[0,1,0];
        } else throw unsupported();
        record(selector.slice(start,index),kind,points);
      } else {
        const legacy = ["before","after","first-letter","first-line"].includes(name);
        record(selector.slice(start,index), element || legacy ? "type" : "class",
          element || legacy ? [0,0,1] : [0,1,0]);
      }
      continue;
    }
    if (char === "*") {
      index++;
      record("*","zero",[0,0,0]);
      continue;
    }
    if (char === "|" || char === "@" || char === "/" || char === "!") throw unsupported();
    index=readIdent(selector,index);
    if (index===start) throw invalid();
    record(selector.slice(start,index),"type",[0,0,1]);
  }
  return {selector,a:score[0],b:score[1],c:score[2],parts};
}

export function analyzeCssSpecificity(input: string): SpecificityResult[] {
  if (input.length > SPECIFICITY_LIMITS.characters) throw new ToolError("INPUT_TOO_LARGE");
  if (!input.trim()) return [];
  if (input.includes("/*")) throw unsupported();
  return list(input,0);
}
