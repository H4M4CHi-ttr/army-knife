import { describe, expect, it } from "vite-plus/test";
import {
  eventToStroke,
  formatShortcut,
  parseShortcut,
  searchShortcuts,
  validateShortcutPublication,
  type ShortcutDataLicense,
  type ShortcutDataLicenseId,
  type ShortcutKeyboardEvent,
  type ShortcutRecord,
  type ShortcutSource,
  type ShortcutStroke,
} from "./shortcuts";

function shortcut(text: string): ShortcutStroke[] {
  const parsed = parseShortcut(text);
  if (!parsed) throw new Error(`Invalid test shortcut: ${text}`);
  return parsed;
}

function keyboardEvent(overrides: Partial<ShortcutKeyboardEvent> = {}): ShortcutKeyboardEvent {
  return {
    key: "c",
    code: "KeyC",
    ctrlKey: true,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    repeat: false,
    isComposing: false,
    getModifierState: () => false,
    ...overrides,
  };
}

function record(
  id: string,
  sequence: string,
  overrides: Partial<ShortcutRecord> = {},
): ShortcutRecord {
  return {
    id,
    appId: "editor",
    app: "Editor",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: shortcut(sequence),
    action: "Open panel",
    actionJa: "パネルを開く",
    context: "Editor focused",
    contextJa: "エディターにフォーカス",
    version: "Current defaults",
    sourceId: "official",
    ...overrides,
  };
}

describe("shortcut notation", () => {
  it.each([
    ["Control+k", "Ctrl+K"],
    ["command+shift+p", "Shift+Meta+P"],
    ["Cmd+Option+Return", "Alt+Meta+Enter"],
    ["Windows+e", "Meta+E"],
    ["⌘⇧k", "Shift+Meta+K"],
    ["⌘+⇧+K", "Shift+Meta+K"],
    ["⌃⌥⇧k", "Ctrl+Alt+Shift+K"],
    ["Win+Spacebar", "Meta+Space"],
    ["alt + ctrl + shift + f12", "Ctrl+Alt+Shift+F12"],
    ["Ctrl+Control+C", "Ctrl+C"],
    ["Meta+PgUp", "Meta+PageUp"],
    ["Shift+Esc", "Shift+Escape"],
    ["Ctrl+↑", "Ctrl+ArrowUp"],
    ["Ctrl+→", "Ctrl+ArrowRight"],
  ])("normalizes aliases and stable modifier order: %s", (input, expected) => {
    expect(formatShortcut(shortcut(input))).toBe(expected);
  });

  it("preserves sequential order and distinguishes a sequence from a chord", () => {
    expect(shortcut("Ctrl+K, Ctrl+C")).toEqual(shortcut("Control+k then Ctrl+c"));
    expect(formatShortcut(shortcut("g then i"))).toBe("G then I");
    expect(shortcut("G → I")).toEqual(shortcut("G then I"));
    expect(shortcut("Ctrl+K then Ctrl+C")).not.toEqual(shortcut("Ctrl+K then C"));
    expect(shortcut("Ctrl+K then Ctrl+C")).not.toEqual(shortcut("Ctrl+C then Ctrl+K"));
    expect(shortcut("Alt+Meta then H")).toEqual([
      { modifiers: ["Alt", "Meta"], key: "" },
      { modifiers: [], key: "H" },
    ]);
    expect(formatShortcut(shortcut("Alt+Windows then H"))).toBe("Alt+Meta then H");
  });

  it.each([
    "+",
    "Ctrl++",
    ",",
    "Ctrl+,",
    "Ctrl+,, Ctrl+C",
    "Ctrl++ then Ctrl+,",
    "/",
    "Ctrl+/",
    "Ctrl+;",
    "Ctrl+:",
    "Ctrl+[",
    "Ctrl+]",
    "Ctrl+\\",
    "Ctrl+`",
    "ß",
    "あ",
  ])("round-trips literal punctuation and non-ASCII keys: %s", (input) => {
    const parsed = shortcut(input);
    expect(shortcut(formatShortcut(parsed))).toEqual(parsed);
  });

  it("allows Plus and Comma aliases without confusing comma keys with separators", () => {
    expect(shortcut("Ctrl+Plus, Ctrl+Comma")).toEqual(shortcut("Ctrl++ then Ctrl+,"));
    expect(shortcut("Ctrl+K,,")).toEqual(shortcut("Ctrl+K then Comma"));
    expect(shortcut("Ctrl+Comma, Ctrl+K")).toEqual(shortcut("Ctrl+, then Ctrl+K"));
  });

  it("preserves explicit numpad codes through formatting, including NumLock off", () => {
    expect(shortcut("Ctrl+NumpadAdd")).toEqual([
      { modifiers: ["Ctrl"], key: "+", code: "NumpadAdd" },
    ]);
    expect(shortcut("Numpad Enter")).toEqual([
      { modifiers: [], key: "Enter", code: "NumpadEnter" },
    ]);
    const numLockOff: ShortcutStroke[] = [{ modifiers: [], key: "End", code: "Numpad1" }];
    expect(formatShortcut(numLockOff)).toBe("End [Numpad1]");
    expect(shortcut(formatShortcut(numLockOff))).toEqual(numLockOff);
    for (const input of [
      "Ctrl+NumpadAdd",
      "Alt+NumpadDivide",
      "Numpad0",
      "NumpadEnter",
      "NumpadComma",
    ]) {
      expect(shortcut(formatShortcut(shortcut(input)))).toEqual(shortcut(input));
    }
  });

  it("never derives a physical code from a logical key", () => {
    expect(shortcut("Ctrl+/")).toEqual([{ modifiers: ["Ctrl"], key: "/" }]);
    expect(shortcut("Ctrl+/ [Slash]")).toEqual([{ modifiers: ["Ctrl"], key: "/", code: "Slash" }]);
    expect(shortcut("Ctrl+/ [IntlRo]")).toEqual([
      { modifiers: ["Ctrl"], key: "/", code: "IntlRo" },
    ]);
  });

  it.each([
    "",
    "   ",
    "Ctrl+",
    "Ctrl++C",
    "Ctrl+K+C",
    "Ctrl+K,",
    "then",
    "A then ",
    "A then B then C then D then E",
    "Ctrl+UnknownKey",
    "F25",
    "A\u0000",
    "x".repeat(257),
    "Numpad1 [KeyQ]",
    "Ctrl [KeyC]",
    "Ctrl+K then then Ctrl+C",
    "constructor",
    "__proto__",
  ])("rejects malformed or unbounded input: %s", (input) => {
    expect(parseShortcut(input)).toBeNull();
  });
});

describe("focused key event conversion", () => {
  it("preserves actual modifier flags and code without inferring Shift from uppercase", () => {
    expect(eventToStroke(keyboardEvent({ key: "C" }))).toEqual({
      modifiers: ["Ctrl"],
      key: "C",
      code: "KeyC",
    });
    expect(eventToStroke(keyboardEvent())).toEqual(eventToStroke(keyboardEvent({ key: "C" })));
    expect(
      eventToStroke(
        keyboardEvent({ key: "c", ctrlKey: false, metaKey: true, altKey: true, shiftKey: true }),
      ),
    ).toEqual({ modifiers: ["Alt", "Shift", "Meta"], key: "C", code: "KeyC" });
  });

  it("retains JIS/US observations and keypad location", () => {
    expect(eventToStroke(keyboardEvent({ key: "/", code: "Slash" }))).toEqual({
      modifiers: ["Ctrl"],
      key: "/",
      code: "Slash",
    });
    expect(eventToStroke(keyboardEvent({ key: "/", code: "IntlRo" }))).toEqual({
      modifiers: ["Ctrl"],
      key: "/",
      code: "IntlRo",
    });
    expect(eventToStroke(keyboardEvent({ key: "+", code: "NumpadAdd" }))).toEqual({
      modifiers: ["Ctrl"],
      key: "+",
      code: "NumpadAdd",
    });
    expect(eventToStroke(keyboardEvent({ key: "End", code: "Numpad1", ctrlKey: false }))).toEqual({
      modifiers: [],
      key: "End",
      code: "Numpad1",
    });
    expect(eventToStroke(keyboardEvent({ code: "" }))).toEqual({ modifiers: ["Ctrl"], key: "C" });
  });

  it.each([
    "Control",
    "Alt",
    "Shift",
    "Meta",
    "OS",
    "AltGraph",
    "Dead",
    "Process",
    "Unidentified",
    "Compose",
    "Fn",
    "FnLock",
  ])("ignores incomplete/modifier/composition keys: %s", (key) => {
    expect(eventToStroke(keyboardEvent({ key }))).toBeNull();
  });

  it("ignores repeats, IME and AltGraph rather than interpreting AltGraph as Ctrl+Alt", () => {
    expect(eventToStroke(keyboardEvent({ repeat: true }))).toBeNull();
    expect(eventToStroke(keyboardEvent({ isComposing: true }))).toBeNull();
    expect(eventToStroke(keyboardEvent({ keyCode: 229 }))).toBeNull();
    expect(
      eventToStroke(
        keyboardEvent({
          ctrlKey: true,
          altKey: true,
          getModifierState: (key) => key === "AltGraph",
        }),
      ),
    ).toBeNull();
    expect(eventToStroke(keyboardEvent({ ctrlKey: true, altKey: true }))).toEqual({
      modifiers: ["Ctrl", "Alt"],
      key: "C",
      code: "KeyC",
    });
  });

  it("leaves Tab and Escape policy to the accessible capture UI", () => {
    expect(eventToStroke(keyboardEvent({ key: "Tab", code: "Tab" }))?.key).toBe("Tab");
    expect(eventToStroke(keyboardEvent({ key: "Escape", code: "Escape" }))?.key).toBe("Escape");
    expect(eventToStroke(keyboardEvent({ key: " ", code: "Space" }))?.key).toBe("Space");
  });
});

describe("shortcut publication candidate metadata", () => {
  function candidateSource(
    id = "official",
    spdx: ShortcutDataLicenseId = "CC-BY-4.0",
  ): ShortcutSource {
    const licenseUrls: Record<ShortcutDataLicenseId, string> = {
      "CC-BY-4.0": "https://creativecommons.org/licenses/by/4.0/",
      "CC-BY-3.0-US": "https://creativecommons.org/licenses/by/3.0/us/",
      "CC-BY-SA-3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
      MIT: "https://opensource.org/license/mit/",
      "Apache-2.0": "https://www.apache.org/licenses/LICENSE-2.0",
    };
    return {
      id,
      title: "Official keyboard documentation",
      url: "https://example.org/docs/shortcuts",
      checkedAt: "2026-10-11",
      rights: "Applies to the specifically identified source-derived record contributions.",
      publication: {
        state: "candidate",
        reviewedAt: "2026-10-11",
        reason: "Prepared for review with explicit source attribution and license scope.",
      },
      license: {
        spdx,
        url: licenseUrls[spdx],
        attribution:
          "Documentation contributors; source title and original copyright notices retained.",
        upstreamUrl: "https://example.org/docs/shortcuts?revision=1234",
        changes: "Selected rows; normalized key notation; translated descriptions and context.",
        scope: "source-derived-records",
        shareAlike: spdx === "CC-BY-SA-3.0",
        offlinePath: "licenses/shortcut-sources.md",
        licenseTextPath: `licenses/${spdx}.txt`,
      },
    };
  }

  it("accepts separately identified licensed contributions without applying a license to app code", () => {
    const sources = [candidateSource("github"), candidateSource("firefox", "CC-BY-SA-3.0")];
    sources[1]!.license!.url = "https://creativecommons.org/licenses/by-sa/3.0/";
    sources[1]!.license!.attribution =
      "Firefox support contributors, Keyboard shortcuts — source and copyright notices retained.";
    const records = [
      record("github-row", "G then I", { sourceId: "github", surface: "web" }),
      record("firefox-row", "Ctrl+L", {
        sourceId: "firefox",
        surface: "browser",
        actionJa: "アドレス欄を選択",
      }),
    ];
    expect(validateShortcutPublication(records, sources)).toEqual([]);
    expect(sources[1]!.license!.scope).toBe("source-derived-records");
    expect(sources[1]!.license!.shareAlike).toBe(true);
  });

  it.each(["CC-BY-4.0", "CC-BY-3.0-US", "CC-BY-SA-3.0", "MIT", "Apache-2.0"] as const)(
    "accepts explicitly supplied supported license metadata: %s",
    (spdx) => {
      expect(
        validateShortcutPublication([record("row", "Ctrl+K")], [candidateSource("official", spdx)]),
      ).toEqual([]);
    },
  );

  it("treats missing publication metadata and held sources as unprepared", () => {
    const missing = candidateSource();
    delete missing.publication;
    delete missing.license;
    expect(validateShortcutPublication([record("row", "Ctrl+K")], [missing])).toEqual([
      "Source official: publication.state must be candidate",
      "Source official: publication.reviewedAt must be a calendar date",
      "Source official: publication.reason is required",
      "Source official: license metadata is required",
    ]);
    const held = candidateSource();
    held.publication!.state = "held";
    expect(validateShortcutPublication([record("row", "Ctrl+K")], [held])).toEqual([
      "Source official: publication.state must be candidate",
    ]);
  });

  it("rejects duplicate or unlinked records and source notices", () => {
    expect(
      validateShortcutPublication(
        [record("duplicate", "Ctrl+K"), record("duplicate", "Ctrl+C", { sourceId: "missing" })],
        [candidateSource(), candidateSource(), candidateSource("unused")],
      ),
    ).toEqual([
      "Source official: duplicate source id",
      "Record duplicate: duplicate record id",
      "Record duplicate: unknown sourceId missing",
      "Source unused: source has no candidate records",
    ]);
    expect(validateShortcutPublication([record("", "Ctrl+K")], [candidateSource()])).toEqual([
      "Record <missing id>: id is required",
    ]);
    expect(validateShortcutPublication([], [candidateSource("")])).toContain(
      "Source <missing id>: id is required",
    );
  });

  it.each(["", "2026-02-31", "2026-13-01", "2026-1-1", "2026-10-11T00:00:00Z"])(
    "requires an actual review calendar date: %s",
    (reviewedAt) => {
      const source = candidateSource();
      source.publication!.reviewedAt = reviewedAt;
      expect(validateShortcutPublication([record("row", "Ctrl+K")], [source])).toContain(
        "Source official: publication.reviewedAt must be a calendar date",
      );
    },
  );

  it("requires a review rationale, attribution, changes, and an explicit data scope", () => {
    const source = candidateSource();
    source.publication!.reason = "   ";
    source.license!.attribution = "";
    source.license!.changes = "   ";
    source.license!.scope = "app-code" as ShortcutDataLicense["scope"];
    expect(validateShortcutPublication([record("row", "Ctrl+K")], [source])).toEqual([
      "Source official: publication.reason is required",
      "Source official: license.attribution is required",
      "Source official: license.changes is required",
      "Source official: license.scope must be source-derived-records",
    ]);
  });

  it("rejects unsupported licenses and inconsistent ShareAlike declarations without inferring terms", () => {
    const unsupported = candidateSource();
    unsupported.license!.spdx = "unknown-open-license" as ShortcutDataLicenseId;
    expect(validateShortcutPublication([record("row", "Ctrl+K")], [unsupported])).toContain(
      "Source official: license.spdx is unsupported",
    );
    for (const [spdx, shareAlike] of [
      ["CC-BY-SA-3.0", false],
      ["MIT", true],
    ] as const) {
      const source = candidateSource("official", spdx);
      source.license!.shareAlike = shareAlike;
      expect(validateShortcutPublication([record("row", "Ctrl+K")], [source])).toContain(
        "Source official: license.shareAlike must match the supported data license",
      );
    }
  });

  it.each([
    "",
    "http://example.org/license",
    "javascript:alert(1)",
    "//example.org/license",
    "not a url",
    "https://user:secret@example.org/license",
  ])("requires public HTTPS links for both license and exact upstream: %s", (url) => {
    const source = candidateSource();
    source.license!.url = url;
    source.license!.upstreamUrl = url;
    expect(validateShortcutPublication([record("row", "Ctrl+K")], [source])).toEqual([
      "Source official: license.url must be an HTTPS URL",
      "Source official: license.upstreamUrl must be an HTTPS URL",
    ]);
  });

  it.each([
    "",
    "../notice.md",
    "licenses/../notice.md",
    "/licenses/notice.md",
    "C:\\notice.txt",
    "licenses\\notice.txt",
    "https://example.org/notice.md",
    "file:///notice.md",
    "licenses/%2e%2e/notice.md",
    "licenses/notice.md?download=1",
    "licenses/notice.md#section",
    "licenses/./notice.md",
  ])("requires safe local relative assets for notices and full license text: %s", (path) => {
    const source = candidateSource();
    source.license!.offlinePath = path;
    source.license!.licenseTextPath = path;
    expect(validateShortcutPublication([record("row", "Ctrl+K")], [source])).toEqual([
      "Source official: license.offlinePath must be a relative local asset path",
      "Source official: license.licenseTextPath must be a relative local asset path",
    ]);
  });

  it("requires both offline notice and full license paths and never mutates inputs", () => {
    const source = candidateSource();
    delete (source.license as Partial<ShortcutDataLicense>).offlinePath;
    delete (source.license as Partial<ShortcutDataLicense>).licenseTextPath;
    const records = [record("row", "Ctrl+K")];
    const before = JSON.stringify({ records, source });
    expect(validateShortcutPublication(records, [source])).toEqual([
      "Source official: license.offlinePath must be a relative local asset path",
      "Source official: license.licenseTextPath must be a relative local asset path",
    ]);
    expect(JSON.stringify({ records, source })).toBe(before);
    expect(records).toHaveLength(1);
  });
});

describe("shortcut dictionary search", () => {
  const records = [
    record("ctrl", "Ctrl+K"),
    record("cmd", "Meta+K", { platforms: ["macos"] }),
    record("shift", "Ctrl+Shift+K"),
    record("sequence", "Ctrl+K then Ctrl+C"),
    record("reversed", "Ctrl+C then Ctrl+K"),
    record("gmail", "G then I", {
      appId: "gmail",
      app: "Gmail",
      surface: "web",
      platforms: ["windows", "macos", "linux"],
      action: "Go to inbox",
      actionJa: "受信トレイを開く",
      context: "Shortcuts enabled",
    }),
    record("chord", "Ctrl+I"),
    record("browser", "Ctrl+L", { appId: "chrome", app: "Chrome", surface: "browser" }),
    record("access", "Alt+Meta then H", { appId: "excel", surface: "web" }),
  ];
  const ids = (options: Parameters<typeof searchShortcuts>[1]) =>
    searchShortcuts(records, options).map((item) => item.id);

  it("matches a complete normalized sequence by default without OS modifier conflation", () => {
    expect(ids({ sequence: shortcut("Control+k") })).toEqual(["ctrl"]);
    expect(ids({ sequence: shortcut("Cmd+k") })).toEqual(["cmd"]);
    expect(ids({ sequence: shortcut("Ctrl+Shift+K") })).toEqual(["shift"]);
    expect(ids({ sequence: shortcut("Ctrl+K then Ctrl+C") })).toEqual(["sequence"]);
    expect(ids({ sequence: shortcut("Ctrl+C then Ctrl+K") })).toEqual(["reversed"]);
    expect(ids({ sequence: shortcut("I") })).toEqual([]);
    expect(ids({ sequence: shortcut("G then I") })).toEqual(["gmail"]);
    expect(ids({ sequence: shortcut("Alt+Windows then H") })).toEqual(["access"]);
    expect(ids({ sequence: [{ modifiers: ["Shift", "Ctrl", "Ctrl"], key: "k" }] })).toEqual([
      "shift",
    ]);
  });

  it("optionally matches only a contiguous ordered subsequence, never modifier subsets", () => {
    expect(ids({ sequence: shortcut("Ctrl+K"), matchMode: "contains" })).toEqual([
      "ctrl",
      "sequence",
      "reversed",
    ]);
    expect(ids({ sequence: shortcut("I"), matchMode: "contains" })).toEqual(["gmail"]);
    const longer = [record("longer", "A then B then C then D")];
    expect(
      searchShortcuts(longer, { sequence: shortcut("B then C"), matchMode: "contains" }),
    ).toHaveLength(1);
    expect(
      searchShortcuts(longer, { sequence: shortcut("A then C"), matchMode: "contains" }),
    ).toHaveLength(0);
    expect(
      searchShortcuts(longer, { sequence: shortcut("C then B"), matchMode: "contains" }),
    ).toHaveLength(0);
  });

  it("intersects OS, application, surface and all text terms including Japanese", () => {
    expect(ids({ platform: "macos", sequence: shortcut("Ctrl+K") })).toEqual([]);
    expect(ids({ platform: "macos", surface: "web" })).toEqual(["gmail"]);
    expect(ids({ appId: "chrome", surface: "web" })).toEqual([]);
    expect(ids({ appId: "chrome", surface: "browser", text: "CHROME current" })).toEqual([
      "browser",
    ]);
    expect(ids({ text: "gmail inbox enabled" })).toEqual(["gmail"]);
    expect(ids({ text: "受信トレイ" })).toEqual(["gmail"]);
    expect(ids({ text: "gmail missing" })).toEqual([]);
    expect(ids({ sequence: [], platform: "", surface: "", appId: "", text: "   " })).toHaveLength(
      records.length,
    );
  });

  it("keeps main keys and numpad keys distinct even in logical matching", () => {
    const keypad = [
      record("main", "Ctrl++"),
      record("numpad", "Ctrl+NumpadAdd"),
      record("enter", "Enter"),
      record("numpad-enter", "NumpadEnter"),
    ];
    expect(
      searchShortcuts(keypad, { sequence: shortcut("Ctrl++") }).map((item) => item.id),
    ).toEqual(["main"]);
    expect(
      searchShortcuts(keypad, { sequence: shortcut("Ctrl+NumpadAdd") }).map((item) => item.id),
    ).toEqual(["numpad"]);
    expect(
      searchShortcuts(keypad, { sequence: shortcut("NumpadEnter") }).map((item) => item.id),
    ).toEqual(["numpad-enter"]);
  });

  it("uses logical key for JIS/US by default and requires observed codes for physical mode", () => {
    const layouts = [
      record("unknown", "Ctrl+/"),
      record("us", "Ctrl+/ [Slash]"),
      record("jis", "Ctrl+/ [IntlRo]"),
      record("different-character", "Ctrl+\\ [IntlRo]"),
    ];
    expect(
      searchShortcuts(layouts, { sequence: shortcut("Ctrl+/ [IntlRo]") }).map((item) => item.id),
    ).toEqual(["unknown", "us", "jis"]);
    expect(
      searchShortcuts(layouts, { sequence: shortcut("Ctrl+/ [IntlRo]"), keyMode: "physical" }).map(
        (item) => item.id,
      ),
    ).toEqual(["jis", "different-character"]);
    expect(searchShortcuts(layouts, { sequence: shortcut("Ctrl+/"), keyMode: "physical" })).toEqual(
      [],
    );
    expect(
      searchShortcuts([record("empty", "Ctrl")], { sequence: [{ modifiers: [], key: "" }] }),
    ).toEqual([]);
    expect(
      searchShortcuts(layouts, { sequence: [{ modifiers: ["Ctrl"], key: "UnknownKey" }] }),
    ).toEqual([]);
  });

  it("does not mutate records or queries and preserves deterministic source order", () => {
    const before = JSON.stringify(records);
    const query = shortcut("Ctrl+K");
    const queryBefore = JSON.stringify(query);
    searchShortcuts(records, { sequence: query, matchMode: "contains" });
    expect(JSON.stringify(records)).toBe(before);
    expect(JSON.stringify(query)).toBe(queryBefore);
    expect(searchShortcuts(records)).toEqual(records);
  });
});
