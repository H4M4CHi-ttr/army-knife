// Source-derived shortcut data: per-source licenses apply; application MIT does not relicense these records.
// Selected source-reviewed catalog. See docs/shortcuts.md and the bundled source notices.
import type { ShortcutRecord, ShortcutSource } from "@/lib/tools/shortcuts";
import { firefoxShortcutRecords, firefoxShortcutSource } from "./shortcuts-firefox";

export const shortcutSources: readonly ShortcutSource[] = [
  {
    id: "vscode-official",
    title: "Visual Studio Code keyboard shortcut references (Windows / Linux / macOS)",
    url: "https://github.com/microsoft/vscode-docs/blob/aeaa6ffe7e675ab1eaf3e9e8af1df9358c91911b/docs/customization/keyboard-shortcuts-windows.docx",
    checkedAt: "2026-10-11",
    rights:
      "Copyright (c) Microsoft Corporation. Documentation: Creative Commons Attribution 3.0 United States (CC BY 3.0 US), https://creativecommons.org/licenses/by/3.0/us/legalcode ; source license https://github.com/microsoft/vscode-docs/blob/aeaa6ffe7e675ab1eaf3e9e8af1df9358c91911b/LICENSE.md . Selected subset, reordered entries, normalized key notation and authored concise English/Japanese labels; reviewed 2026-10-11. No publisher endorsement is implied. Binding values also verified in Windows/Linux/macOS DOCX references at the same source commit. Software MIT and trademark permissions are separate.",
    publication: {
      state: "candidate",
      reviewedAt: "2026-10-11",
      reason:
        "Existing assignments matched against this exact licensed primary-source route; attribution and complete license are bundled. Selected for the owner-approved 82-record catalog. Other unresolved records remain excluded; source-specific license conditions still apply.",
    },
    license: {
      spdx: "CC-BY-3.0-US",
      url: "https://creativecommons.org/licenses/by/3.0/us/legalcode",
      attribution:
        "Copyright (c) Microsoft Corporation. All rights reserved. Documentation contributors. DOCX metadata: creator Brad Gashler; last modified by Greg Van Liew (Windows/macOS) and Nick Trogh (Linux).",
      upstreamUrl:
        "https://github.com/microsoft/vscode-docs/blob/aeaa6ffe7e675ab1eaf3e9e8af1df9358c91911b/LICENSE.md",
      licenseTextPath: "licenses/shortcut-sources/CC-BY-3.0-US.html",
      changes:
        "Selected and reordered a subset; normalized shortcut notation and OS alternatives; condensed context notes and authored English/Japanese labels. Adapted by H4M4CHi-ttr, 2026-10-11. No publisher endorsement is implied.",
      scope: "source-derived-records",
      shareAlike: false,
      offlinePath: "licenses/shortcut-sources/notices.html",
    },
  },
  {
    id: "warp-official",
    title: "Keyboard Shortcuts (Warp / Denver Technologies, Inc.)",
    url: "https://github.com/warpdotdev/docs/blob/173a3262de95df65b1c10fed013a7182643a3b89/src/content/docs/getting-started/keyboard-shortcuts.mdx",
    checkedAt: "2026-10-11",
    rights:
      "Copyright (C) 2020-2026 Denver Technologies, Inc. This exact documentation repository/file is MIT licensed: https://github.com/warpdotdev/docs/blob/173a3262de95df65b1c10fed013a7182643a3b89/LICENSE . Selected subset, reordered entries, normalized key notation and authored concise English/Japanese labels; reviewed 2026-10-11. No publisher endorsement is implied. Preserve the complete copyright, permission and warranty notice supplied in the companion license artifact when publishing these entries.",
    publication: {
      state: "candidate",
      reviewedAt: "2026-10-11",
      reason:
        "Existing assignments matched against this exact licensed primary-source route; attribution and complete license are bundled. Selected for the owner-approved 82-record catalog. Other unresolved records remain excluded; source-specific license conditions still apply.",
    },
    license: {
      spdx: "MIT",
      url: "https://github.com/warpdotdev/docs/blob/173a3262de95df65b1c10fed013a7182643a3b89/LICENSE",
      attribution: "Copyright (C) 2020-2026 Denver Technologies, Inc.",
      upstreamUrl:
        "https://github.com/warpdotdev/docs/blob/173a3262de95df65b1c10fed013a7182643a3b89/LICENSE",
      licenseTextPath: "licenses/shortcut-sources/warp-docs-MIT.txt",
      changes:
        "Selected and reordered a subset; normalized shortcut notation and OS alternatives; condensed context notes and authored English/Japanese labels. Adapted by H4M4CHi-ttr, 2026-10-11. No publisher endorsement is implied.",
      scope: "source-derived-records",
      shareAlike: false,
      offlinePath: "licenses/shortcut-sources/notices.html",
    },
  },
  {
    id: "terminal-official",
    title: "Windows Terminal Actions (Microsoft)",
    url: "https://github.com/MicrosoftDocs/terminal/blob/c341a6362f9f0346a17ecc5e1e74d2cd9372c8f9/TerminalDocs/customize-settings/actions.md",
    checkedAt: "2026-10-11",
    rights:
      "Microsoft / MicrosoftDocs/terminal contributors. Documentation: Creative Commons Attribution 4.0 International (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/legalcode ; source license https://github.com/MicrosoftDocs/terminal/blob/c341a6362f9f0346a17ecc5e1e74d2cd9372c8f9/LICENSE . Selected subset, reordered entries, normalized key notation and authored concise English/Japanese labels; reviewed 2026-10-11. No publisher endorsement is implied. Upstream material is provided without warranties under that license. This document license is separate from Terminal software MIT.",
    publication: {
      state: "candidate",
      reviewedAt: "2026-10-11",
      reason:
        "Existing assignments matched against this exact licensed primary-source route; attribution and complete license are bundled. Selected for the owner-approved 82-record catalog. Other unresolved records remain excluded; source-specific license conditions still apply.",
    },
    license: {
      spdx: "CC-BY-4.0",
      url: "https://creativecommons.org/licenses/by/4.0/legalcode.en",
      attribution: "Microsoft and MicrosoftDocs/terminal documentation contributors.",
      upstreamUrl:
        "https://github.com/MicrosoftDocs/terminal/blob/c341a6362f9f0346a17ecc5e1e74d2cd9372c8f9/LICENSE",
      licenseTextPath: "licenses/shortcut-sources/CC-BY-4.0.txt",
      changes:
        "Selected and reordered a subset; normalized shortcut notation and OS alternatives; condensed context notes and authored English/Japanese labels. Adapted by H4M4CHi-ttr, 2026-10-11. No publisher endorsement is implied.",
      scope: "source-derived-records",
      shareAlike: false,
      offlinePath: "licenses/shortcut-sources/notices.html",
    },
  },
  {
    id: "terminal-palette-official",
    title: "Windows Terminal Command Palette (Microsoft)",
    url: "https://github.com/MicrosoftDocs/terminal/blob/c341a6362f9f0346a17ecc5e1e74d2cd9372c8f9/TerminalDocs/command-palette.md",
    checkedAt: "2026-10-11",
    rights:
      "Microsoft / MicrosoftDocs/terminal contributors. Documentation: Creative Commons Attribution 4.0 International (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/legalcode ; source license https://github.com/MicrosoftDocs/terminal/blob/c341a6362f9f0346a17ecc5e1e74d2cd9372c8f9/LICENSE . Selected subset, reordered entries, normalized key notation and authored concise English/Japanese labels; reviewed 2026-10-11. No publisher endorsement is implied. Upstream material is provided without warranties under that license. This document license is separate from Terminal software MIT.",
    publication: {
      state: "candidate",
      reviewedAt: "2026-10-11",
      reason:
        "Existing assignments matched against this exact licensed primary-source route; attribution and complete license are bundled. Selected for the owner-approved 82-record catalog. Other unresolved records remain excluded; source-specific license conditions still apply.",
    },
    license: {
      spdx: "CC-BY-4.0",
      url: "https://creativecommons.org/licenses/by/4.0/legalcode.en",
      attribution: "Microsoft and MicrosoftDocs/terminal documentation contributors.",
      upstreamUrl:
        "https://github.com/MicrosoftDocs/terminal/blob/c341a6362f9f0346a17ecc5e1e74d2cd9372c8f9/LICENSE",
      licenseTextPath: "licenses/shortcut-sources/CC-BY-4.0.txt",
      changes:
        "Selected and reordered a subset; normalized shortcut notation and OS alternatives; condensed context notes and authored English/Japanese labels. Adapted by H4M4CHi-ttr, 2026-10-11. No publisher endorsement is implied.",
      scope: "source-derived-records",
      shareAlike: false,
      offlinePath: "licenses/shortcut-sources/notices.html",
    },
  },
  {
    id: "web-github",
    title: "GitHub Docs — Keyboard shortcuts",
    url: "https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md",
    checkedAt: "2026-10-11",
    rights:
      "GitHub Docs, GitHub Inc. and documentation contributors; article footer GitHub Inc. © 2026. Documentation/content/data are CC BY 4.0 per https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/README.md and https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/LICENSE. License and warranty disclaimer: https://creativecommons.org/licenses/by/4.0/legalcode.en . Source article: https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts . Changes: selected assignments, normalized key names and platform variants, authored concise English/Japanese labels and context notes; no images or upstream code included. GitHub marks remain their owners' property; no endorsement asserted. This attribution is preserved for this licensed publication route; application MIT does not replace it.",
    publication: {
      state: "candidate",
      reviewedAt: "2026-10-11",
      reason:
        "Existing assignments matched against this exact licensed primary-source route; attribution and complete license are bundled. Selected for the owner-approved 82-record catalog. Other unresolved records remain excluded; source-specific license conditions still apply.",
    },
    license: {
      spdx: "CC-BY-4.0",
      url: "https://creativecommons.org/licenses/by/4.0/legalcode.en",
      attribution: "GitHub Inc. © 2026 and GitHub Docs documentation contributors.",
      upstreamUrl:
        "https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/LICENSE",
      licenseTextPath: "licenses/shortcut-sources/CC-BY-4.0.txt",
      changes:
        "Selected and reordered a subset; normalized shortcut notation and OS alternatives; condensed context notes and authored English/Japanese labels. Adapted by H4M4CHi-ttr, 2026-10-11. No publisher endorsement is implied.",
      scope: "source-derived-records",
      shareAlike: false,
      offlinePath: "licenses/shortcut-sources/notices.html",
    },
  },
  firefoxShortcutSource,
];

export const shortcutRecords: readonly ShortcutRecord[] = [
  {
    id: "vscode-01",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Buffer search",
    actionJa: "編集中ファイルを検索",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-02",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "P",
      },
    ],
    action: "Command chooser",
    actionJa: "コマンドを選択",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-03",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "P",
      },
    ],
    action: "File chooser",
    actionJa: "ファイルを選択",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-04",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "F",
      },
    ],
    action: "Project search",
    actionJa: "プロジェクト内検索",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-05",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
      {
        modifiers: ["Ctrl"],
        key: "C",
      },
    ],
    action: "Add line comments",
    actionJa: "行コメントを付ける",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-06",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
      {
        modifiers: ["Ctrl"],
        key: "U",
      },
    ],
    action: "Remove line comments",
    actionJa: "行コメントを外す",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-07",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Format selection",
    actionJa: "選択部分を整形",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-08",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
      {
        modifiers: ["Ctrl"],
        key: "S",
      },
    ],
    action: "Keyboard preferences",
    actionJa: "キー割り当てを開く",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-09",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
      {
        modifiers: [],
        key: "M",
      },
    ],
    action: "Language selector",
    actionJa: "言語モードを変更",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-10",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
      {
        modifiers: [],
        key: "Z",
      },
    ],
    action: "Zen layout",
    actionJa: "Zenモードへ",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-11",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "Escape",
      },
      {
        modifiers: [],
        key: "Escape",
      },
    ],
    action: "Leave Zen layout",
    actionJa: "Zenモードを終了",
    context: "Zen mode",
    contextJa: "Zenモード中",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-12",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "/",
      },
    ],
    action: "Line comment switch",
    actionJa: "行コメントを切り替え",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-13",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "`",
      },
    ],
    action: "Terminal panel",
    actionJa: "ターミナルを切り替え",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-14",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "F12",
      },
    ],
    action: "Symbol definition",
    actionJa: "シンボルの定義へ",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-15",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "F2",
      },
    ],
    action: "Rename symbol",
    actionJa: "シンボル名を変更",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-16",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "F",
      },
    ],
    action: "Buffer search",
    actionJa: "編集中ファイルを検索",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-17",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Shift", "Meta"],
        key: "P",
      },
    ],
    action: "Command chooser",
    actionJa: "コマンドを選択",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "vscode-18",
    appId: "vscode",
    app: "Visual Studio Code",
    surface: "desktop",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "K",
      },
      {
        modifiers: ["Meta"],
        key: "C",
      },
    ],
    action: "Add line comments",
    actionJa: "行コメントを付ける",
    context: "Editor focused; defaults",
    contextJa: "エディターにフォーカス、既定設定、US配列表記",
    version: "Defaults; US layout; vscode-docs aeaa6ffe snapshot",
    sourceId: "vscode-official",
  },
  {
    id: "warp-01",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Cut input suffix",
    actionJa: "カーソル右側の入力を切り取る",
    context: "Input editor",
    contextJa: "入力エディター",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-02",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Advance cursor or accept suggestion",
    actionJa: "右へ移動／補完を受け入れる",
    context: "Input editor",
    contextJa: "入力エディター",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-03",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "P",
      },
    ],
    action: "Extend selection upward",
    actionJa: "選択範囲を上へ伸ばす",
    context: "Input editor",
    contextJa: "入力エディター",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-04",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "P",
      },
    ],
    action: "Command chooser",
    actionJa: "コマンドを選択",
    context: "Terminal/workspace context",
    contextJa: "ターミナル／ワークスペースのコンテキスト",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-05",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "R",
      },
    ],
    action: "Command search",
    actionJa: "コマンドを検索",
    context: "Workspace command search; defaults",
    contextJa: "ワークスペースのコマンド検索。既定の割り当て",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-06",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "F",
      },
    ],
    action: "Output search",
    actionJa: "出力を検索",
    context: "Terminal output",
    contextJa: "ターミナル出力",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-07",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "F",
      },
    ],
    action: "Select next character",
    actionJa: "右の文字を選択",
    context: "Input editor",
    contextJa: "入力エディター",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-08",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "D",
      },
    ],
    action: "Create right pane",
    actionJa: "右にペインを追加",
    context: "Terminal; defaults",
    contextJa: "ターミナル、既定設定",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-09",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "E",
      },
    ],
    action: "Create lower pane",
    actionJa: "下にペインを追加",
    context: "Terminal; defaults",
    contextJa: "ターミナル、既定設定",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-10",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "T",
      },
    ],
    action: "Create terminal tab",
    actionJa: "ターミナルタブを追加",
    context: "Terminal; defaults",
    contextJa: "ターミナル、既定設定",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-11",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "L",
      },
    ],
    action: "Focus terminal input",
    actionJa: "ターミナル入力へフォーカス",
    context: "Terminal; defaults",
    contextJa: "ターミナル、既定設定",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-12",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "K",
      },
    ],
    action: "Discard blocks",
    actionJa: "ブロックをクリア",
    context: "Block list",
    contextJa: "ブロック一覧",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-13",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "C",
      },
    ],
    action: "Copy selected command",
    actionJa: "選択コマンドをコピー",
    context: "Selected blocks",
    contextJa: "ブロックが選択されている",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-14",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "L",
      },
    ],
    action: "Clear visible screen",
    actionJa: "表示画面をクリア",
    context: "Input editor",
    contextJa: "入力エディター",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "warp-15",
    appId: "warp",
    app: "Warp",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: ",",
      },
    ],
    action: "Preferences",
    actionJa: "設定を開く",
    context: "Terminal; defaults",
    contextJa: "ターミナル、既定設定",
    version: "Windows/Linux defaults; Warp docs 173a3262 snapshot",
    sourceId: "warp-official",
  },
  {
    id: "windows-terminal-01",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "P",
      },
    ],
    action: "Command chooser",
    actionJa: "コマンドを選択",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-palette-official",
  },
  {
    id: "windows-terminal-02",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "F",
      },
    ],
    action: "Buffer search",
    actionJa: "バッファー内検索",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-03",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "T",
      },
    ],
    action: "Create terminal tab",
    actionJa: "ターミナルタブを追加",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-04",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "D",
      },
    ],
    action: "Duplicate terminal tab",
    actionJa: "ターミナルタブを複製",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-05",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "Space",
      },
    ],
    action: "Profile menu",
    actionJa: "プロファイルメニュー",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-06",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: ",",
      },
    ],
    action: "Preferences",
    actionJa: "設定を開く",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-07",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: ",",
      },
    ],
    action: "Edit settings JSON",
    actionJa: "設定JSONを編集",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-08",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Tab",
      },
    ],
    action: "Next terminal tab",
    actionJa: "次のターミナルタブへ",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-09",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "Tab",
      },
    ],
    action: "Previous terminal tab",
    actionJa: "前のターミナルタブへ",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-10",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt", "Shift"],
        key: "D",
      },
    ],
    action: "Duplicate pane",
    actionJa: "ペインを複製",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-11",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "ArrowLeft",
      },
    ],
    action: "Focus left pane",
    actionJa: "左ペインへフォーカス",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-12",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "ArrowRight",
      },
    ],
    action: "Focus right pane",
    actionJa: "右ペインへフォーカス",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-13",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "C",
      },
    ],
    action: "Copy selected buffer",
    actionJa: "選択したバッファーをコピー",
    context: "Selection present; otherwise forwarded",
    contextJa: "選択範囲あり。選択がなければ端末へ転送",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-14",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "V",
      },
    ],
    action: "Paste into terminal",
    actionJa: "ターミナルへ貼り付け",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "windows-terminal-15",
    appId: "windows-terminal",
    app: "Windows Terminal",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "M",
      },
    ],
    action: "Keyboard selection mode",
    actionJa: "キーボード選択モード",
    context: "Terminal; default actions",
    contextJa: "ターミナル、既定アクション",
    version: "Default actions; Terminal docs c341a636 snapshot; app version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "web-github-search",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "/",
      },
    ],
    action: "Focus site search",
    actionJa: "サイト検索欄へ移動",
    context:
      "GitHub browser page outside text entry; character-key shortcuts must be enabled in accessibility settings. Page-specific scope applies. Browser unspecified. Site-wide.",
    contextJa:
      "GitHub のブラウザ画面で文字入力中以外。アクセシビリティ設定で文字キーのショートカットを有効にする必要があります。画面ごとの条件あり。ブラウザ指定なし。 サイト全体。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-file-finder",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "T",
      },
    ],
    action: "Find a repository file",
    actionJa: "リポジトリのファイルを検索",
    context:
      "GitHub browser page outside text entry; character-key shortcuts must be enabled in accessibility settings. Page-specific scope applies. Browser unspecified. Repository code view.",
    contextJa:
      "GitHub のブラウザ画面で文字入力中以外。アクセシビリティ設定で文字キーのショートカットを有効にする必要があります。画面ごとの条件あり。ブラウザ指定なし。 リポジトリのコード画面。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-line",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "L",
      },
    ],
    action: "Navigate to a code line",
    actionJa: "コードの行番号へ移動",
    context:
      "GitHub browser page outside text entry; character-key shortcuts must be enabled in accessibility settings. Page-specific scope applies. Browser unspecified. Source code browsing.",
    contextJa:
      "GitHub のブラウザ画面で文字入力中以外。アクセシビリティ設定で文字キーのショートカットを有効にする必要があります。画面ごとの条件あり。ブラウザ指定なし。 ソースコードの閲覧中。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-permalink",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "Y",
      },
    ],
    action: "Use the permanent file URL",
    actionJa: "ファイルの固定 URL に切り替え",
    context:
      "GitHub browser page outside text entry; character-key shortcuts must be enabled in accessibility settings. Page-specific scope applies. Browser unspecified. Source code browsing.",
    contextJa:
      "GitHub のブラウザ画面で文字入力中以外。アクセシビリティ設定で文字キーのショートカットを有効にする必要があります。画面ごとの条件あり。ブラウザ指定なし。 ソースコードの閲覧中。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-notifications",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "G",
      },
      {
        modifiers: [],
        key: "N",
      },
    ],
    action: "Visit notifications",
    actionJa: "通知画面へ移動",
    context:
      "GitHub browser page outside text entry; character-key shortcuts must be enabled in accessibility settings. Page-specific scope applies. Browser unspecified. Site-wide. G then N; sequential keys.",
    contextJa:
      "GitHub のブラウザ画面で文字入力中以外。アクセシビリティ設定で文字キーのショートカットを有効にする必要があります。画面ごとの条件あり。ブラウザ指定なし。 サイト全体。 G、N の順に押します。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-code",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "G",
      },
      {
        modifiers: [],
        key: "C",
      },
    ],
    action: "Visit repository code",
    actionJa: "Code タブへ移動",
    context:
      "GitHub browser page outside text entry; character-key shortcuts must be enabled in accessibility settings. Page-specific scope applies. Browser unspecified. Inside a repository. G then C; sequential keys.",
    contextJa:
      "GitHub のブラウザ画面で文字入力中以外。アクセシビリティ設定で文字キーのショートカットを有効にする必要があります。画面ごとの条件あり。ブラウザ指定なし。 リポジトリ内。 G、C の順に押します。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-issues",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "G",
      },
      {
        modifiers: [],
        key: "I",
      },
    ],
    action: "Visit repository issues",
    actionJa: "Issues タブへ移動",
    context:
      "GitHub browser page outside text entry; character-key shortcuts must be enabled in accessibility settings. Page-specific scope applies. Browser unspecified. Inside a repository. G then I; sequential keys.",
    contextJa:
      "GitHub のブラウザ画面で文字入力中以外。アクセシビリティ設定で文字キーのショートカットを有効にする必要があります。画面ごとの条件あり。ブラウザ指定なし。 リポジトリ内。 G、I の順に押します。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-pulls",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "G",
      },
      {
        modifiers: [],
        key: "P",
      },
    ],
    action: "Visit pull requests",
    actionJa: "Pull requests タブへ移動",
    context:
      "GitHub browser page outside text entry; character-key shortcuts must be enabled in accessibility settings. Page-specific scope applies. Browser unspecified. Inside a repository. G then P; sequential keys.",
    contextJa:
      "GitHub のブラウザ画面で文字入力中以外。アクセシビリティ設定で文字キーのショートカットを有効にする必要があります。画面ごとの条件あり。ブラウザ指定なし。 リポジトリ内。 G、P の順に押します。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-actions",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "G",
      },
      {
        modifiers: [],
        key: "A",
      },
    ],
    action: "Visit repository Actions",
    actionJa: "Actions タブへ移動",
    context:
      "GitHub browser page outside text entry; character-key shortcuts must be enabled in accessibility settings. Page-specific scope applies. Browser unspecified. Inside a repository. G then A; sequential keys.",
    contextJa:
      "GitHub のブラウザ画面で文字入力中以外。アクセシビリティ設定で文字キーのショートカットを有効にする必要があります。画面ごとの条件あり。ブラウザ指定なし。 リポジトリ内。 G、A の順に押します。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-submit-pc",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Enter",
      },
    ],
    action: "Submit the comment",
    actionJa: "コメントを投稿",
    context:
      "GitHub browser comment editor focused; Markdown context. Browser unspecified. Modifier shortcuts are separate from character-shortcut setting.",
    contextJa:
      "GitHub のブラウザ画面のコメント編集欄にフォーカス。Markdown 編集時。ブラウザ指定なし。修飾キー付き操作は文字キーショートカットの設定とは別です。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-submit-mac",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "Enter",
      },
    ],
    action: "Submit the comment",
    actionJa: "コメントを投稿",
    context:
      "GitHub browser comment editor focused; Markdown context. Browser unspecified. Modifier shortcuts are separate from character-shortcut setting.",
    contextJa:
      "GitHub のブラウザ画面のコメント編集欄にフォーカス。Markdown 編集時。ブラウザ指定なし。修飾キー付き操作は文字キーショートカットの設定とは別です。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-link-pc",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Insert Markdown link syntax",
    actionJa: "Markdown リンクを挿入",
    context:
      "GitHub browser comment editor focused; Markdown context. Browser unspecified. Modifier shortcuts are separate from character-shortcut setting.",
    contextJa:
      "GitHub のブラウザ画面のコメント編集欄にフォーカス。Markdown 編集時。ブラウザ指定なし。修飾キー付き操作は文字キーショートカットの設定とは別です。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-link-mac",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "K",
      },
    ],
    action: "Insert Markdown link syntax",
    actionJa: "Markdown リンクを挿入",
    context:
      "GitHub browser comment editor focused; Markdown context. Browser unspecified. Modifier shortcuts are separate from character-shortcut setting.",
    contextJa:
      "GitHub のブラウザ画面のコメント編集欄にフォーカス。Markdown 編集時。ブラウザ指定なし。修飾キー付き操作は文字キーショートカットの設定とは別です。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-preview-pc",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "P",
      },
    ],
    action: "Switch comment preview",
    actionJa: "コメントの入力・プレビューを切り替え",
    context:
      "GitHub browser comment editor focused; Markdown context. Browser unspecified. Modifier shortcuts are separate from character-shortcut setting.",
    contextJa:
      "GitHub のブラウザ画面のコメント編集欄にフォーカス。Markdown 編集時。ブラウザ指定なし。修飾キー付き操作は文字キーショートカットの設定とは別です。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-preview-mac",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "P",
      },
    ],
    action: "Switch comment preview",
    actionJa: "コメントの入力・プレビューを切り替え",
    context:
      "GitHub browser comment editor focused; Markdown context. Browser unspecified. Modifier shortcuts are separate from character-shortcut setting.",
    contextJa:
      "GitHub のブラウザ画面のコメント編集欄にフォーカス。Markdown 編集時。ブラウザ指定なし。修飾キー付き操作は文字キーショートカットの設定とは別です。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-inline-code-pc",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "E",
      },
    ],
    action: "Insert inline code syntax",
    actionJa: "インラインコードを挿入",
    context:
      "GitHub browser comment editor focused; Markdown context. Browser unspecified. Modifier shortcuts are separate from character-shortcut setting.",
    contextJa:
      "GitHub のブラウザ画面のコメント編集欄にフォーカス。Markdown 編集時。ブラウザ指定なし。修飾キー付き操作は文字キーショートカットの設定とは別です。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-inline-code-mac",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "E",
      },
    ],
    action: "Insert inline code syntax",
    actionJa: "インラインコードを挿入",
    context:
      "GitHub browser comment editor focused; Markdown context. Browser unspecified. Modifier shortcuts are separate from character-shortcut setting.",
    contextJa:
      "GitHub のブラウザ画面のコメント編集欄にフォーカス。Markdown 編集時。ブラウザ指定なし。修飾キー付き操作は文字キーショートカットの設定とは別です。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-github-saved-reply-first",
    appId: "github",
    app: "GitHub",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: ".",
      },
      {
        modifiers: ["Ctrl"],
        key: "1",
      },
    ],
    action: "Insert saved reply number 1",
    actionJa: "保存した返信の 1 番を挿入",
    context:
      "GitHub browser comment editor focused; Markdown context. Browser unspecified. Modifier shortcuts are separate from character-shortcut setting. Saved replies must exist; open menu then choose its numbered reply. Official row lists Ctrl without an OS qualifier; macOS behavior has not been execution-tested.",
    contextJa:
      "GitHub のブラウザ画面のコメント編集欄にフォーカス。Markdown 編集時。ブラウザ指定なし。修飾キー付き操作は文字キーショートカットの設定とは別です。 保存した返信が必要です。メニューを開いて番号を指定します。公式の行は OS を限定せず Ctrl と記載。macOS 動作は実機未検証です。",
    version:
      "GitHub Docs commit c008b66a92206bee5fbbad54ffbbde60451fb1f5 (2026-09-29); GitHub.com and browser versions unspecified; documentation-derived, not execution-tested",
    sourceId: "web-github",
  },
  ...firefoxShortcutRecords,
];
