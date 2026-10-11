export type ShortcutPlatform = "windows" | "macos" | "linux";
export type ShortcutSurface = "desktop" | "web" | "browser" | "os";
export type Modifier = "Ctrl" | "Alt" | "Shift" | "Meta";

export interface ShortcutStroke {
  modifiers: Modifier[];
  /** Logical KeyboardEvent.key; punctuation is literal. Empty for an access-key prefix. */
  key: string;
  /** Observed or explicitly supplied KeyboardEvent.code; never inferred from key. */
  code?: string;
}

export interface ShortcutSource {
  id: string;
  title: string;
  url: string;
  checkedAt: string;
  rights: string;
}

export interface ShortcutRecord {
  id: string;
  appId: string;
  app: string;
  surface: ShortcutSurface;
  platforms: ShortcutPlatform[];
  sequence: ShortcutStroke[];
  action: string;
  actionJa?: string;
  context: string;
  contextJa?: string;
  version: string;
  sourceId: string;
}

export interface ShortcutSearchOptions {
  sequence?: ShortcutStroke[];
  platform?: ShortcutPlatform | "";
  surface?: ShortcutSurface | "";
  appId?: string;
  text?: string;
  matchMode?: "exact" | "contains";
  /** Physical matching requires explicit codes in both the query and the source record. */
  keyMode?: "logical" | "physical";
}

const modifierOrder: Modifier[] = ["Ctrl", "Alt", "Shift", "Meta"];
const modifierAliases: Record<string, Modifier> = {
  ctrl: "Ctrl",
  control: "Ctrl",
  "⌃": "Ctrl",
  alt: "Alt",
  option: "Alt",
  opt: "Alt",
  "⌥": "Alt",
  shift: "Shift",
  "⇧": "Shift",
  meta: "Meta",
  cmd: "Meta",
  command: "Meta",
  win: "Meta",
  windows: "Meta",
  super: "Meta",
  os: "Meta",
  "⌘": "Meta",
  "⊞": "Meta",
};
const keyAliases: Record<string, string> = {
  space: "Space",
  spacebar: "Space",
  enter: "Enter",
  return: "Enter",
  esc: "Escape",
  escape: "Escape",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  del: "Delete",
  insert: "Insert",
  ins: "Insert",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pgup: "PageUp",
  pagedown: "PageDown",
  pgdn: "PageDown",
  up: "ArrowUp",
  arrowup: "ArrowUp",
  "↑": "ArrowUp",
  down: "ArrowDown",
  arrowdown: "ArrowDown",
  "↓": "ArrowDown",
  left: "ArrowLeft",
  arrowleft: "ArrowLeft",
  "←": "ArrowLeft",
  right: "ArrowRight",
  arrowright: "ArrowRight",
  "→": "ArrowRight",
  printscreen: "PrintScreen",
  prtsc: "PrintScreen",
  pause: "Pause",
  break: "Pause",
  contextmenu: "ContextMenu",
  menu: "ContextMenu",
  capslock: "CapsLock",
  numlock: "NumLock",
  scrolllock: "ScrollLock",
  plus: "+",
  comma: ",",
  period: ".",
  dot: ".",
  slash: "/",
  backslash: "\\",
  minus: "-",
  equal: "=",
  semicolon: ";",
  quote: "'",
  backquote: "`",
  bracketleft: "[",
  bracketright: "]",
};
const numpadKeys: Record<string, string> = {
  Numpad0: "0",
  Numpad1: "1",
  Numpad2: "2",
  Numpad3: "3",
  Numpad4: "4",
  Numpad5: "5",
  Numpad6: "6",
  Numpad7: "7",
  Numpad8: "8",
  Numpad9: "9",
  NumpadAdd: "+",
  NumpadSubtract: "-",
  NumpadMultiply: "*",
  NumpadDivide: "/",
  NumpadDecimal: ".",
  NumpadComma: ",",
  NumpadEnter: "Enter",
  NumpadEqual: "=",
};

function normalizeModifiers(modifiers: readonly Modifier[]): Modifier[] {
  return modifierOrder.filter((modifier) => modifiers.includes(modifier));
}

function modifierAlias(value: string): Modifier | undefined {
  return Object.hasOwn(modifierAliases, value) ? modifierAliases[value] : undefined;
}

function normalizeKey(key: string): string | null {
  if (key === " ") return "Space";
  const trimmed = key.trim();
  if (!trimmed) return null;
  const name = trimmed.toLowerCase().replace(/\s+/g, "");
  const alias = Object.hasOwn(keyAliases, name) ? keyAliases[name] : undefined;
  if (alias) return alias;
  if (/^f(?:[1-9]|1[0-9]|2[0-4])$/i.test(trimmed)) return trimmed.toUpperCase();
  // Only ASCII letters fold case: uppercasing ß, for example, changes the logical key.
  if (/^[a-z]$/i.test(trimmed)) return trimmed.toUpperCase();
  if ([...trimmed].length === 1 && !/\p{C}/u.test(trimmed)) return trimmed;
  return null;
}

function parseStroke(input: string): ShortcutStroke | null {
  let rest = input.trim();
  let code: string | undefined;
  const explicitCode = /\s+\[([A-Z][A-Za-z0-9]{0,39})\]$/.exec(rest);
  if (explicitCode) {
    code = explicitCode[1];
    rest = rest.slice(0, explicitCode.index).trim();
  }
  // Symbols may be adjacent (⌘⇧K) or separated with plus signs (⌘+⇧+K).
  rest = rest.replace(/[⌃⌥⇧⌘⊞]/g, (symbol, offset: number, whole: string) => {
    const following = whole.slice(offset + symbol.length).trimStart();
    return `${modifierAliases[symbol]}${following && !following.startsWith("+") ? "+" : ""}`;
  });
  const modifiers: Modifier[] = [];
  while (true) {
    const plus = rest.indexOf("+");
    if (plus < 0) break;
    const modifier = modifierAlias(rest.slice(0, plus).trim().toLowerCase());
    if (!modifier) break;
    modifiers.push(modifier);
    rest = rest.slice(plus + 1).trim();
    if (!rest) return null;
  }
  const lastModifier = modifierAlias(rest.toLowerCase());
  if (lastModifier) {
    modifiers.push(lastModifier);
    if (code) return null;
    return { modifiers: normalizeModifiers(modifiers), key: "" };
  }
  const numpadCode = Object.keys(numpadKeys).find(
    (candidate) => candidate.toLowerCase() === rest.replace(/\s+/g, "").toLowerCase(),
  );
  if (numpadCode) {
    if (code && code !== numpadCode) return null;
    return {
      modifiers: normalizeModifiers(modifiers),
      key: numpadKeys[numpadCode]!,
      code: numpadCode,
    };
  }
  const key = normalizeKey(rest);
  if (key === null) return null;
  return { modifiers: normalizeModifiers(modifiers), key, ...(code ? { code } : {}) };
}

/**
 * Parse simultaneous chords and up to four ordered strokes. "then" is the
 * unambiguous sequence separator; a comma also separates strokes unless it is
 * itself the chord's key (Ctrl+,). Use Comma/Plus aliases if preferred.
 */
export function parseShortcut(text: string): ShortcutStroke[] | null {
  if (!text.trim() || text.length > 256) return null;
  const parts: string[] = [];
  // An arrow is a key alias, so only a spaced arrow denotes a sequence.
  for (const segment of text.split(/\s+then\s+|\s+→\s+/i)) {
    let current = "";
    for (const char of segment) {
      if (char === "," && current.trim() && !current.trimEnd().endsWith("+")) {
        parts.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    parts.push(current);
  }
  if (parts.length > 4) return null;
  const result: ShortcutStroke[] = [];
  for (const part of parts) {
    const stroke = parseStroke(part);
    if (!stroke) return null;
    result.push(stroke);
  }
  return result;
}

export function formatShortcut(sequence: readonly ShortcutStroke[]): string {
  return sequence
    .map((stroke) => {
      const modifiers = normalizeModifiers(stroke.modifiers);
      const key = stroke.key === "" ? "" : (normalizeKey(stroke.key) ?? stroke.key);
      let label = key;
      if (stroke.code?.startsWith("Numpad")) {
        label = numpadKeys[stroke.code] === key ? stroke.code : `${key} [${stroke.code}]`;
      }
      return [...modifiers, ...(label ? [label] : [])].join("+");
    })
    .join(" then ");
}

export type ShortcutKeyboardEvent = Pick<
  KeyboardEvent,
  "key" | "code" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey" | "repeat" | "isComposing"
> &
  Partial<Pick<KeyboardEvent, "getModifierState" | "keyCode">>;

/** Pure conversion; the caller scopes capture to its focused input and handles Tab/Escape. */
export function eventToStroke(event: ShortcutKeyboardEvent): ShortcutStroke | null {
  if (
    event.repeat ||
    event.isComposing ||
    event.keyCode === 229 ||
    event.getModifierState?.("AltGraph") ||
    ["Dead", "Process", "Unidentified", "Compose", "AltGraph", "Fn", "FnLock"].includes(
      event.key,
    ) ||
    modifierAlias(event.key.toLowerCase())
  )
    return null;
  const key = normalizeKey(event.key);
  if (key === null) return null;
  const modifiers: Modifier[] = [];
  if (event.ctrlKey) modifiers.push("Ctrl");
  if (event.altKey) modifiers.push("Alt");
  if (event.shiftKey) modifiers.push("Shift");
  if (event.metaKey) modifiers.push("Meta");
  return { modifiers, key, ...(event.code ? { code: event.code } : {}) };
}

function sameStroke(left: ShortcutStroke, right: ShortcutStroke, physical: boolean): boolean {
  const leftModifiers = normalizeModifiers(left.modifiers);
  const rightModifiers = normalizeModifiers(right.modifiers);
  if (
    leftModifiers.length !== rightModifiers.length ||
    leftModifiers.some((modifier, index) => modifier !== rightModifiers[index])
  )
    return false;
  // Access-key prefixes have no physical key. Their explicit modifier sets are sufficient.
  if (left.key === "" || right.key === "")
    return left.key === right.key && leftModifiers.length > 0;
  if (physical) return Boolean(left.code && right.code && left.code === right.code);
  // A keypad assignment must never become a main-keyboard assignment, even in logical mode.
  if (left.code?.startsWith("Numpad") || right.code?.startsWith("Numpad")) {
    if (left.code !== right.code) return false;
  }
  const leftKey = normalizeKey(left.key);
  const rightKey = normalizeKey(right.key);
  return leftKey !== null && leftKey === rightKey;
}

export function searchShortcuts(
  records: readonly ShortcutRecord[],
  options: ShortcutSearchOptions = {},
): ShortcutRecord[] {
  const sequence = options.sequence;
  const terms = (options.text ?? "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return records.filter((record) => {
    if (options.platform && !record.platforms.includes(options.platform)) return false;
    if (options.surface && record.surface !== options.surface) return false;
    if (options.appId && record.appId !== options.appId) return false;
    if (terms.length) {
      const haystack = [
        record.app,
        record.action,
        record.actionJa,
        record.context,
        record.contextJa,
        record.version,
        formatShortcut(record.sequence),
      ]
        .join(" ")
        .toLocaleLowerCase();
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    if (!sequence?.length) return true;
    if (sequence.length > 4 || sequence.length > record.sequence.length) return false;
    const starts =
      options.matchMode === "contains"
        ? record.sequence.length - sequence.length + 1
        : sequence.length === record.sequence.length
          ? 1
          : 0;
    for (let start = 0; start < starts; start += 1) {
      if (
        sequence.every((stroke, index) =>
          sameStroke(stroke, record.sequence[start + index]!, options.keyMode === "physical"),
        )
      )
        return true;
    }
    return false;
  });
}
