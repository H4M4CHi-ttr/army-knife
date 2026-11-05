import { assertInputSize, ToolError } from "./errors.ts";

export const HTTP_LINK_LIMITS = { bytes: 8192, links: 32, slots: 64, parameters: 32, deferredCharacters: 2048 } as const;
export interface HttpLinkReport {
  links: {
    position: number;
    target: string;
    relations: string[];
    parameters: { name: string; value: string | null }[];
    duplicateParameters: string[];
    missingRel: boolean;
  }[];
  emptyMembers: number;
}
const token = /[!#$%&'*+.^_`|~0-9A-Za-z-]/;
const fail = (code = "LINK_SYNTAX"): never => { throw new ToolError(code); };
// Lexical URI characters only. Full URI grammar, resolution and dereferencing
// deliberately belong outside this structure inspector.
function referenceCharacters(value: string) {
  return /^[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*$/.test(value) && !/%(?![0-9a-fA-F]{2})/.test(value);
}

/** Inspect one combined recorded field value; never interpret it as markup. */
export function inspectHttpLink(input: string): HttpLinkReport {
  assertInputSize(input, HTTP_LINK_LIMITS.bytes);
  for (const char of input) {
    const byte = char.charCodeAt(0);
    if (byte !== 9 && (byte < 32 || byte === 127 || byte > 255)) fail();
  }
  let cursor = 0, slots = 0, emptyMembers = 0;
  const links: HttpLinkReport["links"] = [];
  const whitespace = () => { while (input[cursor] === " " || input[cursor] === "\t") cursor++; };
  const readToken = () => {
    const start = cursor;
    while (cursor < input.length && token.test(input[cursor]!)) cursor++;
    if (start === cursor) fail();
    return input.slice(start, cursor);
  };
  const readValue = () => {
    if (input[cursor] !== '"') return readToken();
    cursor++;
    let value = "";
    while (cursor < input.length) {
      const char = input[cursor++]!;
      if (char === '"') return value;
      if (char === "\\") {
        if (cursor >= input.length) fail();
        value += input[cursor++]!;
      } else value += char;
    }
    return fail();
  };

  while (true) {
    if (++slots > HTTP_LINK_LIMITS.slots) fail("LINK_LIMIT");
    whitespace();
    if (cursor === input.length || input[cursor] === ",") emptyMembers++;
    else {
      if (links.length === HTTP_LINK_LIMITS.links) fail("LINK_LIMIT");
      if (input[cursor++] !== "<") fail();
      const start = cursor, end = input.indexOf(">", cursor);
      if (end === -1) fail();
      const target = input.slice(start, end);
      if (!referenceCharacters(target)) fail();
      cursor = end + 1;
      const parameters: HttpLinkReport["links"][number]["parameters"] = [];
      const seen = new Set<string>(), duplicates = new Set<string>();
      let firstRel: string | null | undefined;
      let hasRel = false;
      whitespace();
      while (input[cursor] === ";") {
        if (parameters.length === HTTP_LINK_LIMITS.parameters) fail("LINK_LIMIT");
        cursor++; whitespace();
        const name = readToken(), normalized = name.toLowerCase();
        whitespace();
        let value: string | null = null;
        if (input[cursor] === "=") { cursor++; whitespace(); value = readValue(); whitespace(); }
        parameters.push({ name, value });
        if (seen.has(normalized)) duplicates.add(normalized);
        seen.add(normalized);
        if (normalized === "rel" && !hasRel) { firstRel = value; hasRel = true; }
      }
      const relations = hasRel && firstRel ? firstRel.split(/ +/) : [];
      if (hasRel && (!relations.length || relations.some(value =>
        !/^[a-z][a-z0-9.-]*$/i.test(value) &&
        !(/^[a-z][a-z0-9+.-]*:/i.test(value) && referenceCharacters(value) && !value.includes("#"))
      ))) fail("LINK_RELATION");
      links.push({ position: links.length + 1, target, relations, parameters, duplicateParameters: [...duplicates], missingRel: !hasRel });
    }
    if (cursor === input.length) break;
    if (input[cursor++] !== ",") fail();
  }
  return { links, emptyMembers };
}
