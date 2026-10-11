// Independently selected default-binding facts. See docs/shortcuts.md for scope and source rights.
import type { ShortcutRecord, ShortcutSource } from "@/lib/tools/shortcuts";

export const shortcutSources: readonly ShortcutSource[] = [
  {
    id: "windows-official",
    title: "Windows keyboard reference (Microsoft)",
    url: "https://support.microsoft.com/en-us/accessibility/windows/keyboard-shortcuts-in-windows",
    checkedAt: "2026-10-11",
    rights:
      "Microsoft support content; no open documentation license asserted. Independent shortcut facts and newly authored labels only; source prose and artwork are not redistributed.",
  },
  {
    id: "chrome-official",
    title: "Chrome keyboard reference (Google)",
    url: "https://support.google.com/chrome/answer/157179?co=GENIE.Platform%3DDesktop&hl=en",
    checkedAt: "2026-10-11",
    rights:
      "Google help content; no open documentation license asserted. Independent shortcut facts and newly authored labels only; no source prose or artwork copied.",
  },
  {
    id: "edge-official",
    title: "Edge keyboard reference (Microsoft)",
    url: "https://support.microsoft.com/en-us/edge/keyboard-shortcuts-in-microsoft-edge",
    checkedAt: "2026-10-11",
    rights:
      "Microsoft support content; no open documentation license asserted. Independent shortcut facts and newly authored labels only; no source prose or artwork copied.",
  },
  {
    id: "firefox-official",
    title: "Firefox keyboard reference (Mozilla contributors)",
    url: "https://support.mozilla.org/en-US/kb/keyboard-shortcuts-perform-firefox-tasks-quickly",
    checkedAt: "2026-10-11",
    rights:
      "Source: Mozilla support contributors, ©1998–2026. Documentation CC BY-SA 3.0 or later per https://www.mozilla.org/en-US/foundation/licensing/website-content/ (not Firefox software MPL). Independently selected assignment facts and original short labels; no source prose/images redistributed.",
  },
  {
    id: "vscode-official",
    title: "VS Code default keyboard reference (Microsoft)",
    url: "https://code.visualstudio.com/docs/reference/default-keybindings",
    checkedAt: "2026-10-11",
    rights:
      "Documentation: Microsoft, CC BY 3.0 US per https://github.com/microsoft/vscode-docs/blob/main/LICENSE.md; distinct from MIT code. Independently selected assignment facts and original labels; no copied article prose.",
  },
  {
    id: "zed-official",
    title: "Zed Windows default keymap, commit 93d7456",
    url: "https://github.com/zed-industries/zed/blob/93d745668805029476e6d7fbb19652116fed51de/assets/keymaps/default-windows.json",
    checkedAt: "2026-10-11",
    rights:
      "Zed Industries source snapshot 93d745668805029476e6d7fbb19652116fed51de. README at this commit declares primarily GPL-3.0-or-later, with Apache components where marked. This keymap has no file-level SPDX marker; do not assert MIT or blanket Apache. Independently selected binding facts and original descriptions; no source code/comments copied.",
  },
  {
    id: "warp-official",
    title: "Warp keyboard reference",
    url: "https://docs.warp.dev/getting-started/keyboard-shortcuts/",
    checkedAt: "2026-10-11",
    rights:
      "Warp documentation; no open documentation license asserted. Independent shortcut facts and original short labels only; source prose/images not copied.",
  },
  {
    id: "terminal-official",
    title: "Windows Terminal action defaults (Microsoft)",
    url: "https://learn.microsoft.com/en-us/windows/terminal/customize-settings/actions",
    checkedAt: "2026-10-11",
    rights:
      "MicrosoftDocs/terminal documentation CC BY 4.0 per https://github.com/MicrosoftDocs/terminal/blob/main/LICENSE; distinct from Terminal software MIT. Independent assignment facts and newly authored labels; no article code snippets or prose copied.",
  },
  {
    id: "terminal-palette-official",
    title: "Windows Terminal palette (Microsoft)",
    url: "https://learn.microsoft.com/en-us/windows/terminal/command-palette",
    checkedAt: "2026-10-11",
    rights:
      "MicrosoftDocs/terminal documentation CC BY 4.0 per https://github.com/MicrosoftDocs/terminal/blob/main/LICENSE. Independent assignment fact and original description; no source snippet copied.",
  },
  {
    id: "idea-official",
    title: "IntelliJ IDEA Windows/Linux reference card (JetBrains)",
    url: "https://resources.jetbrains.com/storage/products/intellij-idea/docs/IntelliJIDEA_ReferenceCard.pdf",
    checkedAt: "2026-10-11",
    rights:
      "JetBrains reference card; no open documentation license asserted. Independently selected shortcut facts and original labels; PDF wording, layout and artwork not redistributed.",
  },
  {
    id: "slack-desktop-official",
    title: "Slack keyboard reference, desktop scope",
    url: "https://slack.com/help/articles/201374536-Slack-keyboard-shortcuts",
    checkedAt: "2026-10-11",
    rights:
      "Slack documentation; no open documentation license asserted. Independently selected assignment facts and original labels only. Desktop-only annotations retained; source prose not copied.",
  },
  {
    id: "discord-desktop-official",
    title: "Discord Windows hotkey reference",
    url: "https://support.discord.com/hc/en-us/articles/225977308--Windows-Discord-Hotkeys",
    checkedAt: "2026-10-11",
    rights:
      "Discord support content; no open documentation license asserted. Independent shortcut facts and original labels only; source chart/image/prose not copied. Official page was last updated in 2020; current app behavior not physically tested.",
  },
  {
    id: "discord-navigation-official",
    title: "Discord keyboard navigation reference",
    url: "https://support.discord.com/hc/en-us/articles/1500000056121-Keyboard-Navigation-FAQ",
    checkedAt: "2026-10-11",
    rights:
      "Discord support content; no open documentation license asserted. Independent assignment facts and original labels; source prose/images not copied. Page explicitly covers desktop and browser; these records are desktop scope.",
  },
  {
    id: "obsidian-official",
    title: "Obsidian editing shortcut reference",
    url: "https://obsidian.md/help/editing-shortcuts",
    checkedAt: "2026-10-11",
    rights:
      "Obsidian help content; no open documentation license asserted. Independently selected editing facts and original labels only; no article prose copied. These system/framework shortcuts differ from configurable Obsidian command hotkeys.",
  },
  {
    id: "excel-desktop-official",
    title: "Excel keyboard reference, Windows section (Microsoft)",
    url: "https://support.microsoft.com/en-us/accessibility/excel/keyboard-shortcuts-in-excel",
    checkedAt: "2026-10-11",
    rights:
      "Microsoft support content; no open documentation license asserted. Independent assignment facts and original labels only; source prose not copied. Windows desktop / US-layout scope retained; Web assignments not inferred.",
  },
  {
    id: "blender-official",
    title: "Blender default keymap source, version 4.5.0",
    url: "https://github.com/blender/blender/blob/v4.5.0/scripts/presets/keyconfig/keymap_data/blender_default.py",
    checkedAt: "2026-10-11",
    rights:
      "Exact file: ©2018–2023 Blender Authors; SPDX GPL-2.0-or-later. Independent selection of key-assignment facts and original labels, with no source code/comments copied. The CC BY-SA Blender manual and pending-publication Japanese descriptions were not used.",
  },
  {
    id: "web-gmail",
    title: "Google Gmail Help — Keyboard shortcuts for Gmail",
    url: "https://support.google.com/mail/answer/6594?hl=en&co=GENIE.Platform%3DDesktop",
    checkedAt: "2026-10-11",
    rights:
      "Publisher retains rights in the official help page. Curated key-assignment facts and independently written short labels only; no source prose, tables, screenshots, or icons republished. No blanket open-source licence for the source page confirmed.",
  },
  {
    id: "web-google-docs",
    title: "Google Docs Editors Help — Keyboard shortcuts for Google Docs",
    url: "https://support.google.com/docs/answer/179738?hl=en&co=GENIE.Platform%3DDesktop",
    checkedAt: "2026-10-11",
    rights:
      "Publisher retains rights in the official help page. Curated key-assignment facts and independently written short labels only; no source prose, tables, screenshots, or icons republished. No blanket open-source licence for the source page confirmed.",
  },
  {
    id: "web-google-sheets",
    title: "Google Docs Editors Help — Keyboard shortcuts for Google Sheets",
    url: "https://support.google.com/docs/answer/181110?hl=en&co=GENIE.Platform%3DDesktop",
    checkedAt: "2026-10-11",
    rights:
      "Publisher retains rights in the official help page. Curated key-assignment facts and independently written short labels only; no source prose, tables, screenshots, or icons republished. No blanket open-source licence for the source page confirmed.",
  },
  {
    id: "web-github",
    title: "GitHub Docs — Keyboard shortcuts",
    url: "https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts",
    checkedAt: "2026-10-11",
    rights:
      "GitHub's documentation repository LICENSE is CC BY 4.0: https://github.com/github/docs/blob/main/LICENSE . Source credited here; curated key assignments with independently written labels, no documentation prose or images reproduced. Preserve this attribution and note changes if adapting licensed prose.",
  },
  {
    id: "web-notion",
    title: "Notion Help — Keyboard shortcuts",
    url: "https://www.notion.com/help/keyboard-shortcuts",
    checkedAt: "2026-10-11",
    rights:
      "Publisher retains rights in the official help page. Curated key-assignment facts and independently written short labels only; no source prose, tables, screenshots, or icons republished. No blanket open-source licence for the source page confirmed.",
  },
  {
    id: "web-slack-navigation",
    title: "Slack Help — Navigate Slack with your keyboard",
    url: "https://slack.com/help/articles/115003340723-Navigate-Slack-with-your-keyboard",
    checkedAt: "2026-10-11",
    rights:
      "Publisher retains rights in the official help page. Curated key-assignment facts and independently written short labels only; no source prose, tables, screenshots, or icons republished. No blanket open-source licence for the source page confirmed.",
  },
  {
    id: "web-slack-shortcuts",
    title: "Slack Help — Slack keyboard shortcuts",
    url: "https://slack.com/help/articles/201374536-Slack-keyboard-shortcuts",
    checkedAt: "2026-10-11",
    rights:
      "Publisher retains rights in the official help page. Curated key-assignment facts and independently written short labels only; no source prose, tables, screenshots, or icons republished. No blanket open-source licence for the source page confirmed.",
  },
  {
    id: "web-discord-navigation",
    title: "Discord Support — Keyboard Navigation FAQ",
    url: "https://support.discord.com/hc/en-us/articles/1500000056121-Keyboard-Navigation-FAQ",
    checkedAt: "2026-10-11",
    rights:
      "Publisher retains rights in the official help page. Curated key-assignment facts and independently written short labels only; no source prose, tables, screenshots, or icons republished. No blanket open-source licence for the source page confirmed.",
  },
  {
    id: "web-excel",
    title: "Microsoft Support — Keyboard shortcuts in Excel, Web section",
    url: "https://support.microsoft.com/en-us/accessibility/excel/keyboard-shortcuts-in-excel",
    checkedAt: "2026-10-11",
    rights:
      "Publisher retains rights in the official help page. Curated key-assignment facts and independently written short labels only; no source prose, tables, screenshots, or icons republished. No blanket open-source licence for the source page confirmed.",
  },
];

export const shortcutRecords: readonly ShortcutRecord[] = [
  {
    id: "windows-01",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "K",
      },
    ],
    action: "Cast display",
    actionJa: "画面のキャスト",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-02",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "L",
      },
    ],
    action: "Lock session",
    actionJa: "PCをロック",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-03",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "D",
      },
    ],
    action: "Reveal desktop",
    actionJa: "デスクトップを表示",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-04",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "E",
      },
    ],
    action: "Launch Explorer",
    actionJa: "エクスプローラーを開く",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-05",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "I",
      },
    ],
    action: "Show settings",
    actionJa: "設定を開く",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-06",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "R",
      },
    ],
    action: "Run dialog",
    actionJa: "実行ダイアログ",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-07",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "S",
      },
    ],
    action: "System search",
    actionJa: "Windows検索",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-08",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Shift", "Meta"],
        key: "S",
      },
    ],
    action: "Screen capture",
    actionJa: "画面領域の撮影",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-09",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "Tab",
      },
    ],
    action: "Task overview",
    actionJa: "タスクビュー",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-10",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Meta"],
        key: "D",
      },
    ],
    action: "Create desktop",
    actionJa: "仮想デスクトップを追加",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-11",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "Escape",
      },
    ],
    action: "Task manager",
    actionJa: "タスクマネージャー",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "windows-12",
    appId: "windows",
    app: "Windows",
    surface: "os",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "Delete",
      },
    ],
    action: "Security screen",
    actionJa: "セキュリティ画面",
    context: "OS reserved",
    contextJa: "OSが処理する既定操作",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "explorer-01",
    appId: "explorer",
    app: "File Explorer",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Folder search",
    actionJa: "フォルダー内検索",
    context: "Explorer focused",
    contextJa: "エクスプローラーにフォーカス",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "explorer-02",
    appId: "explorer",
    app: "File Explorer",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "L",
      },
    ],
    action: "Edit folder address",
    actionJa: "アドレスを編集",
    context: "Explorer focused",
    contextJa: "エクスプローラーにフォーカス",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "explorer-03",
    appId: "explorer",
    app: "File Explorer",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "N",
      },
    ],
    action: "Create folder",
    actionJa: "フォルダーを作成",
    context: "Explorer focused",
    contextJa: "エクスプローラーにフォーカス",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "explorer-04",
    appId: "explorer",
    app: "File Explorer",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "ArrowUp",
      },
    ],
    action: "Parent folder",
    actionJa: "親フォルダーへ",
    context: "Explorer focused",
    contextJa: "エクスプローラーにフォーカス",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "explorer-05",
    appId: "explorer",
    app: "File Explorer",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "ArrowLeft",
      },
    ],
    action: "Previous folder",
    actionJa: "前のフォルダーへ",
    context: "Explorer focused",
    contextJa: "エクスプローラーにフォーカス",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "explorer-06",
    appId: "explorer",
    app: "File Explorer",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "ArrowRight",
      },
    ],
    action: "Next folder",
    actionJa: "次のフォルダーへ",
    context: "Explorer focused",
    contextJa: "エクスプローラーにフォーカス",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "explorer-07",
    appId: "explorer",
    app: "File Explorer",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "Enter",
      },
    ],
    action: "Item properties",
    actionJa: "項目のプロパティ",
    context: "Item selected",
    contextJa: "項目が選択されている",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "explorer-08",
    appId: "explorer",
    app: "File Explorer",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "P",
      },
    ],
    action: "Preview pane",
    actionJa: "プレビューを切り替え",
    context: "Explorer focused",
    contextJa: "エクスプローラーにフォーカス",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "explorer-09",
    appId: "explorer",
    app: "File Explorer",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: [],
        key: "F2",
      },
    ],
    action: "Rename item",
    actionJa: "項目名を変更",
    context: "Item selected",
    contextJa: "項目が選択されている",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "explorer-10",
    appId: "explorer",
    app: "File Explorer",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "T",
      },
    ],
    action: "Create folder tab",
    actionJa: "フォルダータブを追加",
    context: "Explorer focused",
    contextJa: "エクスプローラーにフォーカス",
    version: "Windows 11",
    sourceId: "windows-official",
  },
  {
    id: "chrome-01",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Address search",
    actionJa: "アドレスバーで検索",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-02",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Page search",
    actionJa: "ページ内検索",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-03",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "T",
      },
    ],
    action: "Create tab",
    actionJa: "タブを追加",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-04",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "T",
      },
    ],
    action: "Restore closed tab",
    actionJa: "閉じたタブを復元",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-05",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "N",
      },
    ],
    action: "Incognito window",
    actionJa: "シークレットウィンドウ",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-06",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "L",
      },
    ],
    action: "Address focus",
    actionJa: "URLを編集",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-07",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "R",
      },
    ],
    action: "Reload page",
    actionJa: "ページを再読込",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-08",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "R",
      },
    ],
    action: "Reload without cache",
    actionJa: "キャッシュを無視して再読込",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-09",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "W",
      },
    ],
    action: "Close tab",
    actionJa: "タブを閉じる",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-10",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Tab",
      },
    ],
    action: "Next tab",
    actionJa: "次のタブへ",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-11",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "H",
      },
    ],
    action: "History screen",
    actionJa: "履歴を表示",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-12",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "J",
      },
    ],
    action: "Downloads screen",
    actionJa: "ダウンロードを表示",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-13",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Shift"],
        key: "Escape",
      },
    ],
    action: "Browser task manager",
    actionJa: "ブラウザのタスク管理",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-14",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "P",
      },
    ],
    action: "Print page",
    actionJa: "ページを印刷",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-15",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "U",
      },
    ],
    action: "Page source",
    actionJa: "ページのソース",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-16",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "F",
      },
    ],
    action: "Page search",
    actionJa: "ページ内検索",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-17",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "L",
      },
    ],
    action: "Address focus",
    actionJa: "URLを編集",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "chrome-18",
    appId: "chrome",
    app: "Google Chrome",
    surface: "browser",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Shift", "Meta"],
        key: "N",
      },
    ],
    action: "Incognito window",
    actionJa: "シークレットウィンドウ",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "chrome-official",
  },
  {
    id: "edge-01",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Address search",
    actionJa: "アドレスバーで検索",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-02",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Page search",
    actionJa: "ページ内検索",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-03",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "P",
      },
    ],
    action: "System print dialog",
    actionJa: "システムの印刷ダイアログ",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-04",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "K",
      },
    ],
    action: "Duplicate tab",
    actionJa: "タブを複製",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-05",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "M",
      },
    ],
    action: "Mute tab",
    actionJa: "タブのミュートを切り替え",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-06",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "T",
      },
    ],
    action: "Create tab",
    actionJa: "タブを追加",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-07",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "N",
      },
    ],
    action: "InPrivate window",
    actionJa: "InPrivateウィンドウ",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-08",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "L",
      },
    ],
    action: "Edit URL",
    actionJa: "URLを編集",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-09",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "H",
      },
    ],
    action: "History screen",
    actionJa: "履歴を表示",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-10",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "J",
      },
    ],
    action: "Downloads screen",
    actionJa: "ダウンロードを表示",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-11",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "I",
      },
    ],
    action: "Developer tools",
    actionJa: "開発者ツール",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-12",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "U",
      },
    ],
    action: "Read aloud",
    actionJa: "音声読み上げを切り替え",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-13",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "R",
      },
    ],
    action: "Reload page",
    actionJa: "ページを再読込",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-14",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "T",
      },
    ],
    action: "Restore closed tab",
    actionJa: "閉じたタブを復元",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "edge-15",
    appId: "edge",
    app: "Microsoft Edge",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "W",
      },
    ],
    action: "Close tab",
    actionJa: "タブを閉じる",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "edge-official",
  },
  {
    id: "firefox-01",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Search focus",
    actionJa: "検索欄へフォーカス",
    context: "Search bar if visible; otherwise address bar",
    contextJa: "検索バーがあれば検索バー、なければアドレスバー",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-02",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Page search",
    actionJa: "ページ内検索",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-03",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "P",
      },
    ],
    action: "Private window",
    actionJa: "プライベートウィンドウ",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-04",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "T",
      },
    ],
    action: "Create tab",
    actionJa: "タブを追加",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-05",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "T",
      },
    ],
    action: "Restore closed tab",
    actionJa: "閉じたタブを復元",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-06",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "W",
      },
    ],
    action: "Close unpinned tab",
    actionJa: "固定されていないタブを閉じる",
    context: "Active tab not pinned",
    contextJa: "現在のタブが固定されていない",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-07",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "R",
      },
    ],
    action: "Reload page",
    actionJa: "ページを再読込",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-08",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "R",
      },
    ],
    action: "Reload without cache",
    actionJa: "キャッシュを無視して再読込",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-09",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "P",
      },
    ],
    action: "Print page",
    actionJa: "ページを印刷",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-10",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "D",
      },
    ],
    action: "Bookmark page",
    actionJa: "ページをブックマーク",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-11",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "B",
      },
    ],
    action: "Bookmarks bar",
    actionJa: "ブックマークバーを切り替え",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-12",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "M",
      },
    ],
    action: "Mute tab",
    actionJa: "タブのミュートを切り替え",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-13",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: [],
        key: "F3",
      },
    ],
    action: "Next search match",
    actionJa: "次の検索一致",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-14",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Page search",
    actionJa: "ページ内検索",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-15",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "F",
      },
    ],
    action: "Page search",
    actionJa: "ページ内検索",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
  {
    id: "firefox-16",
    appId: "firefox",
    app: "Mozilla Firefox",
    surface: "browser",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Shift", "Meta"],
        key: "P",
      },
    ],
    action: "Private window",
    actionJa: "プライベートウィンドウ",
    context: "Browser focused",
    contextJa: "ブラウザにフォーカス",
    version: "Official defaults; version unspecified",
    sourceId: "firefox-official",
  },
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
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
    version: "Official defaults; US keyboard",
    sourceId: "vscode-official",
  },
  {
    id: "zed-01",
    appId: "zed",
    app: "Zed",
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
    context: "Workspace; base keymap",
    contextJa: "ワークスペース、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-02",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "P",
      },
    ],
    action: "File chooser",
    actionJa: "ファイルを選択",
    context: "Workspace; base keymap",
    contextJa: "ワークスペース、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-03",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "S",
      },
    ],
    action: "Save file",
    actionJa: "ファイルを保存",
    context: "Workspace; base keymap",
    contextJa: "ワークスペース、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-04",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "N",
      },
    ],
    action: "Create window",
    actionJa: "ウィンドウを追加",
    context: "Workspace; base keymap",
    contextJa: "ワークスペース、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-05",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "`",
      },
    ],
    action: "Terminal panel",
    actionJa: "ターミナルを切り替え",
    context: "Workspace; base keymap",
    contextJa: "ワークスペース、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-06",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
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
    context: "Workspace; base keymap",
    contextJa: "ワークスペース、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-07",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
      {
        modifiers: [],
        key: "S",
      },
    ],
    action: "Save every file",
    actionJa: "全ファイルを保存",
    context: "Workspace; base keymap",
    contextJa: "ワークスペース、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-08",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Create keybinding",
    actionJa: "キー割り当てを作成",
    context: "Keymap editor focused",
    contextJa: "キー割り当てエディターにフォーカス",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-09",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Search keybindings",
    actionJa: "キー割り当てを検索",
    context: "Keymap editor focused",
    contextJa: "キー割り当てエディターにフォーカス",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-10",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
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
    action: "Line comment switch",
    actionJa: "行コメントを切り替え",
    context: "Editor; base keymap",
    contextJa: "エディター、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-11",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
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
    context: "Editor; base keymap",
    contextJa: "エディター、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-12",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: [],
        key: "F12",
      },
    ],
    action: "Symbol definition",
    actionJa: "シンボルの定義へ",
    context: "Editor; base keymap",
    contextJa: "エディター、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-13",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: [],
        key: "F2",
      },
    ],
    action: "Rename symbol",
    actionJa: "シンボル名を変更",
    context: "Editor; base keymap",
    contextJa: "エディター、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-14",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "F",
      },
    ],
    action: "Project search",
    actionJa: "プロジェクト内検索",
    context: "Pane/workspace; defaults",
    contextJa: "ペイン／ワークスペース、既定設定",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
  },
  {
    id: "zed-15",
    appId: "zed",
    app: "Zed",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "B",
      },
    ],
    action: "Left dock switch",
    actionJa: "左ドックを切り替え",
    context: "Workspace; base keymap",
    contextJa: "ワークスペース、Windows既定キーマップ",
    version: "Source snapshot 93d7456; default Windows keymap",
    sourceId: "zed-official",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    action: "Command history search",
    actionJa: "コマンド履歴を検索",
    context: "Terminal; defaults",
    contextJa: "ターミナル、既定設定",
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official default Windows/Linux keymap",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
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
    version: "Official defaults; version unspecified",
    sourceId: "terminal-official",
  },
  {
    id: "intellij-idea-01",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "A",
      },
    ],
    action: "Find IDE action",
    actionJa: "IDEの操作を検索",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-02",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "Enter",
      },
    ],
    action: "Show suggested fix",
    actionJa: "修正候補を表示",
    context: "Editor caret on code with available intention or inspection",
    contextJa: "修正候補または検査があるコード上のカーソル",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-03",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "E",
      },
    ],
    action: "Choose recent file",
    actionJa: "最近のファイルを選択",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-04",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "L",
      },
    ],
    action: "Reformat code",
    actionJa: "コードを整形",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-05",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt", "Shift"],
        key: "T",
      },
    ],
    action: "Choose refactoring",
    actionJa: "リファクタリングを選択",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-06",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "W",
      },
    ],
    action: "Expand code selection",
    actionJa: "コードの選択範囲を広げる",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-07",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "W",
      },
    ],
    action: "Reduce code selection",
    actionJa: "コードの選択範囲を狭める",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-08",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "/",
      },
    ],
    action: "Toggle line comment",
    actionJa: "行コメントを切り替え",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-09",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "B",
      },
    ],
    action: "Go to declaration",
    actionJa: "宣言に移動",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-10",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "F7",
      },
    ],
    action: "Find symbol usages",
    actionJa: "シンボルの使用箇所を検索",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-11",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Find in current file",
    actionJa: "現在のファイル内を検索",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-12",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "R",
      },
    ],
    action: "Replace in current file",
    actionJa: "現在のファイル内を置換",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-13",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "F",
      },
    ],
    action: "Search across project",
    actionJa: "プロジェクト全体を検索",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-14",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Y",
      },
    ],
    action: "Remove current line",
    actionJa: "現在の行を削除",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "intellij-idea-15",
    appId: "intellij-idea",
    app: "IntelliJ IDEA",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "D",
      },
    ],
    action: "Duplicate line or selection",
    actionJa: "行または選択範囲を複製",
    context: "IDE editor or workspace; default keymap",
    contextJa: "IDEのエディターまたはワークスペース。既定キーマップ",
    version: "Default Windows/Linux keymap; official reference card",
    sourceId: "idea-official",
  },
  {
    id: "slack-01",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Choose conversation",
    actionJa: "会話を選択",
    context: "Slack desktop workspace; keyboard layout may affect symbol keys",
    contextJa: "Slackデスクトップのワークスペース。記号キーは配列の影響を受ける",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-02",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Search current conversation",
    actionJa: "現在の会話を検索",
    context: "Channel or direct message open",
    contextJa: "チャンネルまたはDMを開いている",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-03",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "G",
      },
    ],
    action: "Search workspace",
    actionJa: "ワークスペースを検索",
    context: "Slack desktop workspace; keyboard layout may affect symbol keys",
    contextJa: "Slackデスクトップのワークスペース。記号キーは配列の影響を受ける",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-04",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: ",",
      },
    ],
    action: "Open Slack preferences",
    actionJa: "Slackの設定を開く",
    context: "Desktop app only",
    contextJa: "デスクトップアプリのみ",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-05",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "O",
      },
    ],
    action: "Upload file",
    actionJa: "ファイルをアップロード",
    context: "Desktop app only",
    contextJa: "デスクトップアプリのみ",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-06",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Q",
      },
    ],
    action: "Quit Slack app",
    actionJa: "Slackアプリを終了",
    context: "Desktop app only",
    contextJa: "デスクトップアプリのみ",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-07",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "N",
      },
    ],
    action: "Compose new message",
    actionJa: "新しいメッセージを作成",
    context: "Slack desktop workspace; keyboard layout may affect symbol keys",
    contextJa: "Slackデスクトップのワークスペース。記号キーは配列の影響を受ける",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-08",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "Y",
      },
    ],
    action: "Edit status",
    actionJa: "ステータスを編集",
    context: "Slack desktop workspace; keyboard layout may affect symbol keys",
    contextJa: "Slackデスクトップのワークスペース。記号キーは配列の影響を受ける",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-09",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "Enter",
      },
    ],
    action: "Create text snippet",
    actionJa: "テキストスニペットを作成",
    context: "Slack desktop workspace; keyboard layout may affect symbol keys",
    contextJa: "Slackデスクトップのワークスペース。記号キーは配列の影響を受ける",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-10",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "H",
      },
    ],
    action: "Start, join or leave huddle",
    actionJa: "ハドルの開始・参加・退出",
    context: "Action depends on current huddle state",
    contextJa: "現在のハドル状態によって操作が変わる",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-11",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "Space",
      },
    ],
    action: "Toggle huddle microphone",
    actionJa: "ハドルのマイクを切り替え",
    context: "Active huddle",
    contextJa: "参加中のハドル",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-12",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "ArrowUp",
      },
    ],
    action: "Previous sidebar conversation",
    actionJa: "サイドバーの前の会話へ",
    context: "Slack desktop workspace; keyboard layout may affect symbol keys",
    contextJa: "Slackデスクトップのワークスペース。記号キーは配列の影響を受ける",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-13",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Alt", "Shift"],
        key: "ArrowDown",
      },
    ],
    action: "Next unread conversation",
    actionJa: "次の未読会話へ",
    context: "Slack desktop workspace; keyboard layout may affect symbol keys",
    contextJa: "Slackデスクトップのワークスペース。記号キーは配列の影響を受ける",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-14",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "B",
      },
    ],
    action: "Apply message bold",
    actionJa: "メッセージを太字にする",
    context: "Message composer with text selection",
    contextJa: "メッセージ入力欄のテキスト選択",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "slack-15",
    appId: "slack",
    app: "Slack",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "M",
      },
    ],
    action: "Open activity view",
    actionJa: "アクティビティを開く",
    context: "Desktop app only",
    contextJa: "デスクトップアプリのみ",
    version: "Current official desktop shortcuts; default mappings",
    sourceId: "slack-desktop-official",
  },
  {
    id: "discord-01",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Choose direct message",
    actionJa: "DMを選択",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-02",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "ArrowUp",
      },
    ],
    action: "Previous server",
    actionJa: "前のサーバーへ",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-03",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "ArrowDown",
      },
    ],
    action: "Next server",
    actionJa: "次のサーバーへ",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-04",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "ArrowUp",
      },
    ],
    action: "Previous channel",
    actionJa: "前のチャンネルへ",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-05",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "ArrowDown",
      },
    ],
    action: "Next channel",
    actionJa: "次のチャンネルへ",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-06",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt", "Shift"],
        key: "ArrowDown",
      },
    ],
    action: "Next unread channel",
    actionJa: "次の未読チャンネルへ",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-07",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt", "Shift"],
        key: "ArrowDown",
      },
    ],
    action: "Next channel with mention",
    actionJa: "メンションがある次のチャンネルへ",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-08",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "P",
      },
    ],
    action: "Show channel pins",
    actionJa: "チャンネルのピン留めを表示",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-09",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "I",
      },
    ],
    action: "Show recent mentions",
    actionJa: "最近のメンションを表示",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-10",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "U",
      },
    ],
    action: "Toggle member list",
    actionJa: "メンバー一覧を切り替え",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-11",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "E",
      },
    ],
    action: "Choose emoji",
    actionJa: "絵文字を選択",
    context: "Message input active",
    contextJa: "メッセージ入力欄が有効",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-12",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "M",
      },
    ],
    action: "Toggle voice mute",
    actionJa: "ボイスのミュートを切り替え",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-13",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "D",
      },
    ],
    action: "Toggle voice deafen",
    actionJa: "ボイスのスピーカーミュートを切り替え",
    context: "Discord Windows desktop workspace",
    contextJa: "DiscordのWindowsデスクトップ版ワークスペース",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-14",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Enter",
      },
    ],
    action: "Accept incoming call",
    actionJa: "着信に応答",
    context: "Incoming call",
    contextJa: "着信中",
    version: "Official Windows hotkey table (last updated 2020); defaults",
    sourceId: "discord-desktop-official",
  },
  {
    id: "discord-15",
    appId: "discord",
    app: "Discord",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: [],
        key: "F6",
      },
    ],
    action: "Move to next app section",
    actionJa: "アプリの次の領域へ",
    context: "Keyboard navigation; desktop app",
    contextJa: "キーボードナビゲーション。デスクトップアプリ",
    version: "Current keyboard navigation documentation",
    sourceId: "discord-navigation-official",
  },
  {
    id: "obsidian-01",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "C",
      },
    ],
    action: "Copy selected text",
    actionJa: "選択したテキストをコピー",
    context: "Editor with selected text",
    contextJa: "編集欄でテキストを選択中",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-02",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "C",
      },
    ],
    action: "Copy paragraph",
    actionJa: "段落をコピー",
    context: "Editor with no selected text",
    contextJa: "編集欄で選択範囲がない",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-03",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "X",
      },
    ],
    action: "Cut selected text",
    actionJa: "選択したテキストを切り取り",
    context: "Editor with selected text",
    contextJa: "編集欄でテキストを選択中",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-04",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "X",
      },
    ],
    action: "Cut paragraph",
    actionJa: "段落を切り取り",
    context: "Editor with no selected text",
    contextJa: "編集欄で選択範囲がない",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-05",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "V",
      },
    ],
    action: "Paste plain text",
    actionJa: "書式なしで貼り付け",
    context: "Note editor with keyboard focus; system/framework shortcuts",
    contextJa: "ノート編集欄にフォーカス中。OSまたは基盤フレームワークのショートカット",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-06",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Z",
      },
    ],
    action: "Undo edit",
    actionJa: "編集を取り消す",
    context: "Note editor with keyboard focus; system/framework shortcuts",
    contextJa: "ノート編集欄にフォーカス中。OSまたは基盤フレームワークのショートカット",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-07",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "Z",
      },
    ],
    action: "Redo edit",
    actionJa: "編集をやり直す",
    context: "Note editor with keyboard focus; system/framework shortcuts",
    contextJa: "ノート編集欄にフォーカス中。OSまたは基盤フレームワークのショートカット",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-08",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Backspace",
      },
    ],
    action: "Remove previous word",
    actionJa: "前の単語を削除",
    context: "Note editor with keyboard focus; system/framework shortcuts",
    contextJa: "ノート編集欄にフォーカス中。OSまたは基盤フレームワークのショートカット",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-09",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Delete",
      },
    ],
    action: "Remove next word",
    actionJa: "次の単語を削除",
    context: "Note editor with keyboard focus; system/framework shortcuts",
    contextJa: "ノート編集欄にフォーカス中。OSまたは基盤フレームワークのショートカット",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-10",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "K",
      },
    ],
    action: "Remove current line",
    actionJa: "現在の行を削除",
    context: "Editor with no selected text",
    contextJa: "編集欄で選択範囲がない",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-11",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "ArrowLeft",
      },
    ],
    action: "Move before previous word",
    actionJa: "前の単語の先頭へ",
    context: "Note editor with keyboard focus; system/framework shortcuts",
    contextJa: "ノート編集欄にフォーカス中。OSまたは基盤フレームワークのショートカット",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-12",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "ArrowRight",
      },
    ],
    action: "Move after next word",
    actionJa: "次の単語の末尾へ",
    context: "Note editor with keyboard focus; system/framework shortcuts",
    contextJa: "ノート編集欄にフォーカス中。OSまたは基盤フレームワークのショートカット",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-13",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Home",
      },
    ],
    action: "Go to note start",
    actionJa: "ノートの先頭へ",
    context: "Note editor with keyboard focus; system/framework shortcuts",
    contextJa: "ノート編集欄にフォーカス中。OSまたは基盤フレームワークのショートカット",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-14",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "B",
      },
    ],
    action: "Apply bold text",
    actionJa: "テキストを太字にする",
    context: "Note editor with text selection",
    contextJa: "ノート編集欄のテキスト選択",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "obsidian-15",
    appId: "obsidian",
    app: "Obsidian",
    surface: "desktop",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "I",
      },
    ],
    action: "Apply italic text",
    actionJa: "テキストを斜体にする",
    context: "Note editor with text selection",
    contextJa: "ノート編集欄のテキスト選択",
    version: "Current default OS/framework editing shortcuts",
    sourceId: "obsidian-official",
  },
  {
    id: "excel-01",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Add hyperlink",
    actionJa: "ハイパーリンクを追加",
    context: "Windows desktop worksheet; default bindings; US keyboard",
    contextJa: "Windowsデスクトップ版のワークシート。既定の割り当て。USキーボード",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-02",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "1",
      },
    ],
    action: "Format selected cells",
    actionJa: "選択したセルの書式を設定",
    context: "Windows desktop worksheet; default bindings; US keyboard",
    contextJa: "Windowsデスクトップ版のワークシート。既定の割り当て。USキーボード",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-03",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "W",
      },
    ],
    action: "Close current workbook",
    actionJa: "現在のブックを閉じる",
    context: "Windows desktop worksheet; default bindings; US keyboard",
    contextJa: "Windowsデスクトップ版のワークシート。既定の割り当て。USキーボード",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-04",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "O",
      },
    ],
    action: "Choose workbook to open",
    actionJa: "開くブックを選択",
    context: "Windows desktop worksheet; default bindings; US keyboard",
    contextJa: "Windowsデスクトップ版のワークシート。既定の割り当て。USキーボード",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-05",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "S",
      },
    ],
    action: "Save current workbook",
    actionJa: "現在のブックを保存",
    context: "Windows desktop worksheet; default bindings; US keyboard",
    contextJa: "Windowsデスクトップ版のワークシート。既定の割り当て。USキーボード",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-06",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: [],
        key: "F2",
      },
    ],
    action: "Edit active cell",
    actionJa: "アクティブなセルを編集",
    context:
      "Selected cell; formula editing can change Point mode; edit-in-cell setting affects target",
    contextJa: "選択したセル。数式編集時はポイントモードを切り替え、セル内編集設定で対象が変わる",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-07",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "Enter",
      },
    ],
    action: "New line inside cell",
    actionJa: "セル内で改行",
    context: "Cell editor active",
    contextJa: "セルを編集中",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-08",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: ";",
      },
    ],
    action: "Insert current date",
    actionJa: "現在の日付を入力",
    context: "Windows desktop worksheet; default bindings; US keyboard",
    contextJa: "Windowsデスクトップ版のワークシート。既定の割り当て。USキーボード",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-09",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "`",
      },
    ],
    action: "Toggle formula display",
    actionJa: "数式の表示を切り替え",
    context: "Windows desktop worksheet; default bindings; US keyboard",
    contextJa: "Windowsデスクトップ版のワークシート。既定の割り当て。USキーボード",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-10",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "V",
      },
    ],
    action: "Choose special paste",
    actionJa: "形式を選択して貼り付け",
    context: "Windows desktop worksheet; default bindings; US keyboard",
    contextJa: "Windowsデスクトップ版のワークシート。既定の割り当て。USキーボード",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-11",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "T",
      },
    ],
    action: "Create table from cells",
    actionJa: "セル範囲からテーブルを作成",
    context: "Windows desktop worksheet; default bindings; US keyboard",
    contextJa: "Windowsデスクトップ版のワークシート。既定の割り当て。USキーボード",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-12",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "E",
      },
    ],
    action: "Fill detected pattern",
    actionJa: "検出したパターンで入力",
    context: "Worksheet with adjacent sample data for Flash Fill",
    contextJa: "フラッシュフィルの見本となる隣接データがあるワークシート",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-13",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "H",
      },
      {
        modifiers: [],
        key: "H",
      },
    ],
    action: "Choose cell fill color",
    actionJa: "セルの塗りつぶし色を選択",
    context: "Ribbon KeyTips; press Alt+H, release, then H",
    contextJa: "リボンのKeyTips。Alt+Hを押して離し、Hを押す",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-14",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "H",
      },
      {
        modifiers: [],
        key: "A",
      },
      {
        modifiers: [],
        key: "C",
      },
    ],
    action: "Center cell contents",
    actionJa: "セルの内容を中央揃え",
    context: "Ribbon KeyTips; Alt+H, then A, then C",
    contextJa: "リボンのKeyTips。Alt+H、A、Cの順に押す",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "excel-15",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "desktop",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "H",
      },
      {
        modifiers: [],
        key: "D",
      },
      {
        modifiers: [],
        key: "C",
      },
    ],
    action: "Delete selected columns",
    actionJa: "選択した列を削除",
    context: "Ribbon KeyTips; Alt+H, then D, then C",
    contextJa: "リボンのKeyTips。Alt+H、D、Cの順に押す",
    version: "Excel for Microsoft 365 / Excel 2024; US layout",
    sourceId: "excel-desktop-official",
  },
  {
    id: "blender-01",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "T",
      },
    ],
    action: "Toggle viewport toolbar",
    actionJa: "ビューポートのツールバーを切り替え",
    context: "3D viewport region",
    contextJa: "3Dビューポート領域",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-02",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "N",
      },
    ],
    action: "Toggle viewport sidebar",
    actionJa: "ビューポートのサイドバーを切り替え",
    context: "3D viewport region",
    contextJa: "3Dビューポート領域",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-03",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "0",
        code: "Numpad0",
      },
    ],
    action: "View through camera",
    actionJa: "カメラからの視点に切り替え",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-04",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "1",
        code: "Numpad1",
      },
    ],
    action: "View from front",
    actionJa: "正面から表示",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-05",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "3",
        code: "Numpad3",
      },
    ],
    action: "View from right",
    actionJa: "右から表示",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-06",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "7",
        code: "Numpad7",
      },
    ],
    action: "View from top",
    actionJa: "上から表示",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-07",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "5",
        code: "Numpad5",
      },
    ],
    action: "Toggle perspective view",
    actionJa: "透視投影を切り替え",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-08",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "2",
        code: "Numpad2",
      },
    ],
    action: "Orbit downward",
    actionJa: "視点を下へ回転",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-09",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "4",
        code: "Numpad4",
      },
    ],
    action: "Orbit leftward",
    actionJa: "視点を左へ回転",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-10",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "6",
        code: "Numpad6",
      },
    ],
    action: "Orbit rightward",
    actionJa: "視点を右へ回転",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-11",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "8",
        code: "Numpad8",
      },
    ],
    action: "Orbit upward",
    actionJa: "視点を上へ回転",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-12",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "1",
        code: "Numpad1",
      },
    ],
    action: "View from back",
    actionJa: "背面から表示",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-13",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "3",
        code: "Numpad3",
      },
    ],
    action: "View from left",
    actionJa: "左から表示",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-14",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: ".",
        code: "NumpadDecimal",
      },
    ],
    action: "Frame selected objects",
    actionJa: "選択したオブジェクトを表示範囲に収める",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "blender-15",
    appId: "blender",
    app: "Blender",
    surface: "desktop",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "/",
        code: "NumpadDivide",
      },
    ],
    action: "Toggle local object view",
    actionJa: "選択したオブジェクトのローカルビューを切り替え",
    context: "3D viewport; default keymap; numpad emulation off",
    contextJa: "3Dビューポート。既定キーマップ。テンキーのエミュレートは無効",
    version: "Blender 4.5.0; factory Blender keymap",
    sourceId: "blender-official",
  },
  {
    id: "web-gmail-send-pc",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Enter",
      },
    ],
    action: "Send the draft",
    actionJa: "下書きを送信",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-send-mac",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "Enter",
      },
    ],
    action: "Send the draft",
    actionJa: "下書きを送信",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-link-pc",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Add a text link",
    actionJa: "本文にリンクを挿入",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-link-mac",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "K",
      },
    ],
    action: "Add a text link",
    actionJa: "本文にリンクを挿入",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-cc-pc",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "C",
      },
    ],
    action: "Reveal the CC field",
    actionJa: "CC 宛先欄を表示",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-cc-mac",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "C",
      },
    ],
    action: "Reveal the CC field",
    actionJa: "CC 宛先欄を表示",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-bcc-pc",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "B",
      },
    ],
    action: "Reveal the BCC field",
    actionJa: "BCC 宛先欄を表示",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-bcc-mac",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "B",
      },
    ],
    action: "Reveal the BCC field",
    actionJa: "BCC 宛先欄を表示",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-bold-pc",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "B",
      },
    ],
    action: "Use bold text",
    actionJa: "本文を太字にする",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-bold-mac",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "B",
      },
    ],
    action: "Use bold text",
    actionJa: "本文を太字にする",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-italic-pc",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "I",
      },
    ],
    action: "Use italic text",
    actionJa: "本文を斜体にする",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-italic-mac",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "I",
      },
    ],
    action: "Use italic text",
    actionJa: "本文を斜体にする",
    context:
      "Gmail browser tab; compose editor or recipient field appropriate to the action. Default mapping; custom Gmail mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブ。作成本文や宛先欄など該当する欄にフォーカス。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-compose",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows", "macos"],
    sequence: [
      {
        modifiers: [],
        key: "C",
      },
    ],
    action: "Start a draft",
    actionJa: "メールを新規作成",
    context:
      "Gmail browser tab outside text entry; keyboard shortcuts must be enabled in Settings. Default mapping; custom mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブで文字入力中以外。設定でキーボード ショートカットを有効にする必要があります。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-search",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows", "macos"],
    sequence: [
      {
        modifiers: [],
        key: "/",
      },
    ],
    action: "Focus mail search",
    actionJa: "メール検索欄へ移動",
    context:
      "Gmail browser tab outside text entry; keyboard shortcuts must be enabled in Settings. Default mapping; custom mappings may differ. Browser unspecified.",
    contextJa:
      "Gmail のブラウザタブで文字入力中以外。設定でキーボード ショートカットを有効にする必要があります。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-archive",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows", "macos"],
    sequence: [
      {
        modifiers: [],
        key: "E",
      },
    ],
    action: "Archive the conversation",
    actionJa: "会話をアーカイブ",
    context:
      "Gmail browser tab outside text entry; keyboard shortcuts must be enabled in Settings. Default mapping; custom mappings may differ. Browser unspecified. A conversation must be selected or open.",
    contextJa:
      "Gmail のブラウザタブで文字入力中以外。設定でキーボード ショートカットを有効にする必要があります。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。 対象の会話を選択、または開いている必要があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-reply",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows", "macos"],
    sequence: [
      {
        modifiers: [],
        key: "R",
      },
    ],
    action: "Start a reply",
    actionJa: "会話へ返信",
    context:
      "Gmail browser tab outside text entry; keyboard shortcuts must be enabled in Settings. Default mapping; custom mappings may differ. Browser unspecified. A conversation must be selected or open.",
    contextJa:
      "Gmail のブラウザタブで文字入力中以外。設定でキーボード ショートカットを有効にする必要があります。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。 対象の会話を選択、または開いている必要があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-forward",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows", "macos"],
    sequence: [
      {
        modifiers: [],
        key: "F",
      },
    ],
    action: "Forward the conversation",
    actionJa: "会話を転送",
    context:
      "Gmail browser tab outside text entry; keyboard shortcuts must be enabled in Settings. Default mapping; custom mappings may differ. Browser unspecified. A conversation must be selected or open.",
    contextJa:
      "Gmail のブラウザタブで文字入力中以外。設定でキーボード ショートカットを有効にする必要があります。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。 対象の会話を選択、または開いている必要があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-inbox",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows", "macos"],
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
    action: "Visit the inbox",
    actionJa: "受信トレイへ移動",
    context:
      "Gmail browser tab outside text entry; keyboard shortcuts must be enabled in Settings. Default mapping; custom mappings may differ. Browser unspecified. Press G then I separately; this is a sequence.",
    contextJa:
      "Gmail のブラウザタブで文字入力中以外。設定でキーボード ショートカットを有効にする必要があります。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。 G、I の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-sent",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows", "macos"],
    sequence: [
      {
        modifiers: [],
        key: "G",
      },
      {
        modifiers: [],
        key: "T",
      },
    ],
    action: "Visit sent mail",
    actionJa: "送信済みメールへ移動",
    context:
      "Gmail browser tab outside text entry; keyboard shortcuts must be enabled in Settings. Default mapping; custom mappings may differ. Browser unspecified. Press G then T separately; this is a sequence.",
    contextJa:
      "Gmail のブラウザタブで文字入力中以外。設定でキーボード ショートカットを有効にする必要があります。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。 G、T の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-gmail-drafts",
    appId: "gmail",
    app: "Gmail",
    surface: "web",
    platforms: ["windows", "macos"],
    sequence: [
      {
        modifiers: [],
        key: "G",
      },
      {
        modifiers: [],
        key: "D",
      },
    ],
    action: "Visit drafts",
    actionJa: "下書き一覧へ移動",
    context:
      "Gmail browser tab outside text entry; keyboard shortcuts must be enabled in Settings. Default mapping; custom mappings may differ. Browser unspecified. Press G then D separately; this is a sequence.",
    contextJa:
      "Gmail のブラウザタブで文字入力中以外。設定でキーボード ショートカットを有効にする必要があります。既定の割り当てで、カスタマイズ設定により変わります。ブラウザ指定なし。 G、D の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-gmail",
  },
  {
    id: "web-google-docs-link-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Add or change a text link",
    actionJa: "リンクを挿入・編集",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-link-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "K",
      },
    ],
    action: "Add or change a text link",
    actionJa: "リンクを挿入・編集",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-page-break-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Enter",
      },
    ],
    action: "Create a page break",
    actionJa: "改ページを挿入",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-page-break-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "Enter",
      },
    ],
    action: "Create a page break",
    actionJa: "改ページを挿入",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-help-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "/",
      },
    ],
    action: "Show shortcut reference",
    actionJa: "ショートカット一覧を表示",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-help-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "/",
      },
    ],
    action: "Show shortcut reference",
    actionJa: "ショートカット一覧を表示",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-tool-finder-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "/",
      },
    ],
    action: "Search available commands",
    actionJa: "コマンドを検索",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-tool-finder-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "/",
      },
    ],
    action: "Search available commands",
    actionJa: "コマンドを検索",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-find-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F",
      },
    ],
    action: "Search document text",
    actionJa: "文書内を検索",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-find-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "F",
      },
    ],
    action: "Search document text",
    actionJa: "文書内を検索",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-replace-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "H",
      },
    ],
    action: "Replace document text",
    actionJa: "文書内を検索・置換",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-replace-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "H",
      },
    ],
    action: "Replace document text",
    actionJa: "文書内を検索・置換",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-comment-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "M",
      },
    ],
    action: "Add a comment",
    actionJa: "コメントを追加",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-comment-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Alt"],
        key: "M",
      },
    ],
    action: "Add a comment",
    actionJa: "コメントを追加",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-bold-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "B",
      },
    ],
    action: "Use bold text",
    actionJa: "選択した文字を太字にする",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-bold-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "B",
      },
    ],
    action: "Use bold text",
    actionJa: "選択した文字を太字にする",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-plain-paste-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "V",
      },
    ],
    action: "Paste plain text",
    actionJa: "書式なしで貼り付け",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-plain-paste-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "V",
      },
    ],
    action: "Paste plain text",
    actionJa: "書式なしで貼り付け",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-compact-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "F",
      },
    ],
    action: "Toggle compact controls",
    actionJa: "メニューを折りたたむ",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-compact-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "F",
      },
    ],
    action: "Toggle compact controls",
    actionJa: "メニューを折りたたむ",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-file-chrome",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "F",
      },
    ],
    action: "Show the document file menu",
    actionJa: "文書のファイルメニューを開く",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ. Google Chrome only; this is the app menu.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。 Google Chrome の場合。文書側のメニューです。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-file-other",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt", "Shift"],
        key: "F",
      },
    ],
    action: "Show the document file menu",
    actionJa: "文書のファイルメニューを開く",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ. Other browsers use Alt+Shift.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。 Chrome 以外のブラウザは Alt+Shift を使います。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-file-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "F",
      },
    ],
    action: "Show the document file menu",
    actionJa: "文書のファイルメニューを開く",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-next-heading-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "N",
      },
      {
        modifiers: ["Ctrl", "Alt"],
        key: "H",
      },
    ],
    action: "Go to the next heading",
    actionJa: "次の見出しへ移動",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ. Keep Ctrl+Alt held while pressing N then H.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。 Ctrl+Alt を押したまま N、H の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-next-heading-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Ctrl", "Meta"],
        key: "N",
      },
      {
        modifiers: ["Ctrl", "Meta"],
        key: "H",
      },
    ],
    action: "Go to the next heading",
    actionJa: "次の見出しへ移動",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ. Keep Control+Command held while pressing N then H.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。 Control+Command を押したまま N、H の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-next-comment-pc",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "N",
      },
      {
        modifiers: ["Ctrl", "Alt"],
        key: "C",
      },
    ],
    action: "Go to the next comment",
    actionJa: "次のコメントへ移動",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ. Keep Ctrl+Alt held while pressing N then C.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。 Ctrl+Alt を押したまま N、C の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-docs-next-comment-mac",
    appId: "google-docs",
    app: "Google Docs",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Ctrl", "Meta"],
        key: "N",
      },
      {
        modifiers: ["Ctrl", "Meta"],
        key: "C",
      },
    ],
    action: "Go to the next comment",
    actionJa: "次のコメントへ移動",
    context:
      "Google Docs browser editor; use edit permission for edit operations. Browser unspecified unless stated. Some languages/keyboards differ. Keep Control+Command held while pressing N then C.",
    contextJa:
      "Google Docs のブラウザ編集画面。編集操作には編集権限が必要です。指定がない項目はブラウザ未指定。言語・配列により変わる場合があります。 Control+Command を押したまま N、C の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-docs",
  },
  {
    id: "web-google-sheets-link-pc",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Add a cell link",
    actionJa: "セルにリンクを挿入",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-link-mac",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "K",
      },
    ],
    action: "Add a cell link",
    actionJa: "セルにリンクを挿入",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-help-pc",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "/",
      },
    ],
    action: "Show shortcut reference",
    actionJa: "ショートカット一覧を表示",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-help-mac",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "/",
      },
    ],
    action: "Show shortcut reference",
    actionJa: "ショートカット一覧を表示",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-tool-finder-pc",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "/",
      },
    ],
    action: "Search available commands",
    actionJa: "コマンドを検索",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-tool-finder-mac",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "/",
      },
    ],
    action: "Search available commands",
    actionJa: "コマンドを検索",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-fill-range-pc",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Enter",
      },
    ],
    action: "Fill the selected range",
    actionJa: "選択範囲を入力内容で埋める",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-fill-range-mac",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "Enter",
      },
    ],
    action: "Fill the selected range",
    actionJa: "選択範囲を入力内容で埋める",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-fill-down-pc",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "D",
      },
    ],
    action: "Fill from above",
    actionJa: "上のセルから下へコピー",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-fill-down-mac",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "D",
      },
    ],
    action: "Fill from above",
    actionJa: "上のセルから下へコピー",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-fill-right-pc",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "R",
      },
    ],
    action: "Fill from the left",
    actionJa: "左のセルから右へコピー",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-fill-right-mac",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "R",
      },
    ],
    action: "Fill from the left",
    actionJa: "左のセルから右へコピー",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-paste-values-pc",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "V",
      },
    ],
    action: "Paste cell values",
    actionJa: "値だけを貼り付け",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-paste-values-mac",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "V",
      },
    ],
    action: "Paste cell values",
    actionJa: "値だけを貼り付け",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-replace-pc",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "H",
      },
    ],
    action: "Replace worksheet text",
    actionJa: "表内を検索・置換",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-replace-mac",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "H",
      },
    ],
    action: "Replace worksheet text",
    actionJa: "表内を検索・置換",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-comment-pc",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "M",
      },
    ],
    action: "Add or edit a comment",
    actionJa: "コメントを挿入・編集",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-comment-mac",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Alt"],
        key: "M",
      },
    ],
    action: "Add or edit a comment",
    actionJa: "コメントを挿入・編集",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-select-column",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows", "macos"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Space",
      },
    ],
    action: "Select a whole column",
    actionJa: "列全体を選択",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ. Mac uses Control, not Command for this mapping.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。 この操作は Mac でも Control を使います。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-select-row",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows", "macos"],
    sequence: [
      {
        modifiers: ["Shift"],
        key: "Space",
      },
    ],
    action: "Select a whole row",
    actionJa: "行全体を選択",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-percent",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows", "macos"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "5",
      },
    ],
    action: "Display values as percentages",
    actionJa: "パーセント形式にする",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ. Mac uses Control, not Command for this mapping.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。 この操作は Mac でも Control を使います。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-row-above-chrome",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "I",
      },
      {
        modifiers: [],
        key: "R",
      },
      {
        modifiers: [],
        key: "R",
      },
    ],
    action: "Add a row above",
    actionJa: "上に行を挿入",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ. Google Chrome only; press Alt+I, release, R, R.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。 Google Chrome の場合。Alt+I を押して離し、R、R の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
  },
  {
    id: "web-google-sheets-row-above-other",
    appId: "google-sheets",
    app: "Google Sheets",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt", "Shift"],
        key: "I",
      },
      {
        modifiers: [],
        key: "R",
      },
      {
        modifiers: [],
        key: "R",
      },
    ],
    action: "Add a row above",
    actionJa: "上に行を挿入",
    context:
      "Google Sheets browser worksheet; selected cells unless editing a formula/text. Editing permissions needed for edits. Browser unspecified. Layout/language can differ. Other browsers use Alt+Shift+I, release, R, R.",
    contextJa:
      "Google Sheets のブラウザ表計算画面。数式・文字の編集時を除きセル選択状態。編集操作には編集権限が必要です。ブラウザ指定なし。言語・配列により変わる場合があります。 Chrome 以外のブラウザでは Alt+Shift+I を押して離し、R、R の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-google-sheets",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
    action: "Visit workflow runs",
    actionJa: "Actions タブへ移動",
    context:
      "GitHub browser page outside text entry; character-key shortcuts must be enabled in accessibility settings. Page-specific scope applies. Browser unspecified. Inside a repository. G then A; sequential keys.",
    contextJa:
      "GitHub のブラウザ画面で文字入力中以外。アクセシビリティ設定で文字キーのショートカットを有効にする必要があります。画面ごとの条件あり。ブラウザ指定なし。 リポジトリ内。 G、A の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "Current official online documentation; app and browser version unspecified; not execution-tested",
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
      "GitHub browser comment editor focused; Markdown context. Browser unspecified. Modifier shortcuts are separate from character-shortcut setting. Saved replies must exist; open menu then choose its numbered reply. Official example uses Ctrl on all platforms.",
    contextJa:
      "GitHub のブラウザ画面のコメント編集欄にフォーカス。Markdown 編集時。ブラウザ指定なし。修飾キー付き操作は文字キーショートカットの設定とは別です。 保存した返信が必要です。メニューを開いて番号を指定します。公式の表記は全 OS とも Ctrl です。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-github",
  },
  {
    id: "web-notion-search-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Search or choose a recent page",
    actionJa: "検索・最近のページ選択",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Outside selected text; database peek view has its own contextual navigation bindings.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 文字を選択していない状態。データベースのピーク表示では別の文脈依存の操作があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-search-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "K",
      },
    ],
    action: "Search or choose a recent page",
    actionJa: "検索・最近のページ選択",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Outside selected text; database peek view has its own contextual navigation bindings.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 文字を選択していない状態。データベースのピーク表示では別の文脈依存の操作があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-link-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Add a selected-text link",
    actionJa: "選択文字にリンクを挿入",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. With text selected.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 文字を選択した状態。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-link-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "K",
      },
    ],
    action: "Add a selected-text link",
    actionJa: "選択文字にリンクを挿入",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. With text selected.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 文字を選択した状態。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-bold-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "B",
      },
    ],
    action: "Use bold selected text",
    actionJa: "選択文字を太字にする",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. With text selected.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 文字を選択した状態。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-bold-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "B",
      },
    ],
    action: "Use bold selected text",
    actionJa: "選択文字を太字にする",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. With text selected.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 文字を選択した状態。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-inline-code-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "E",
      },
    ],
    action: "Use inline code",
    actionJa: "選択文字をインラインコードにする",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. With text selected.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 文字を選択した状態。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-inline-code-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "E",
      },
    ],
    action: "Use inline code",
    actionJa: "選択文字をインラインコードにする",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. With text selected.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 文字を選択した状態。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-duplicate-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "D",
      },
    ],
    action: "Duplicate selected blocks",
    actionJa: "選択したブロックを複製",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Blocks selected.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 ブロックを選択した状態。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-duplicate-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "D",
      },
    ],
    action: "Duplicate selected blocks",
    actionJa: "選択したブロックを複製",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Blocks selected.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 ブロックを選択した状態。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-block-menu-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "/",
      },
    ],
    action: "Show selected-block actions",
    actionJa: "選択ブロックの操作メニューを開く",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. One or more blocks selected.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 1 個以上のブロックを選択した状態。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-block-menu-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "/",
      },
    ],
    action: "Show selected-block actions",
    actionJa: "選択ブロックの操作メニューを開く",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. One or more blocks selected.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 1 個以上のブロックを選択した状態。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-block-action-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Enter",
      },
    ],
    action: "Activate the current block",
    actionJa: "現在のブロックを操作",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Opens a page, toggles a checkbox/toggle, or enlarges an embed/image, depending on block type.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 ページを開く、チェック状態や開閉状態を切り替えるなど、ブロックの種類で機能が変わります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-block-action-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "Enter",
      },
    ],
    action: "Activate the current block",
    actionJa: "現在のブロックを操作",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Opens a page, toggles a checkbox/toggle, or enlarges an embed/image, depending on block type.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 ページを開く、チェック状態や開閉状態を切り替えるなど、ブロックの種類で機能が変わります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-comment-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "M",
      },
    ],
    action: "Add a comment",
    actionJa: "コメントを追加",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Editor/selection context.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 編集欄または選択箇所。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-comment-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "M",
      },
    ],
    action: "Add a comment",
    actionJa: "コメントを追加",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Editor/selection context.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 編集欄または選択箇所。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-h1-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "1",
      },
    ],
    action: "Use a first-level heading",
    actionJa: "見出し 1 に変更",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Current content block; OS binding may conflict on Windows.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 現在の内容ブロック。Windows の既存設定と競合する場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-h1-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Alt"],
        key: "1",
      },
    ],
    action: "Use a first-level heading",
    actionJa: "見出し 1 に変更",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Current content block; OS binding may conflict on Windows.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 現在の内容ブロック。Windows の既存設定と競合する場合があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-dark-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "L",
      },
    ],
    action: "Switch the colour theme",
    actionJa: "ライト・ダーク表示を切り替え",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Notion page.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 Notion ページ内。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-dark-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "L",
      },
    ],
    action: "Switch the colour theme",
    actionJa: "ライト・ダーク表示を切り替え",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested. Notion page.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。 Notion ページ内。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-line-break",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: ["Shift"],
        key: "Enter",
      },
    ],
    action: "Break a line within a block",
    actionJa: "ブロック内で改行",
    context:
      "Notion browser editor; English/QWERTY keyboard per official instructions; edit permission for edits. General shortcut section, excluding its separate Desktop subsection. Browser delivery not execution-tested.",
    contextJa:
      "Notion のブラウザ編集画面。公式資料は英語・QWERTY 配列が対象。編集には編集権限が必要です。一般操作の項目を採用し、別記のデスクトップ専用項目は除外。ブラウザでの実行は未検証です。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-slack-section-next-pc",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F6",
      },
    ],
    action: "Focus the next app section",
    actionJa: "次のアプリ内領域へフォーカス",
    context:
      "Slack browser app, focus inside Slack; browser unspecified. Windows screen readers may require virtual cursor off. Based on explicit browser-shortcut column, not desktop equivalence.",
    contextJa:
      "Slack のブラウザ版でアプリ内にフォーカス。ブラウザ指定なし。Windows のスクリーンリーダーでは仮想カーソルを無効にする必要がある場合があります。公式のブラウザ用の列を参照しています。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-navigation",
  },
  {
    id: "web-slack-section-next-mac",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "F6",
      },
    ],
    action: "Focus the next app section",
    actionJa: "次のアプリ内領域へフォーカス",
    context:
      "Slack browser app, focus inside Slack; browser unspecified. Windows screen readers may require virtual cursor off. Based on explicit browser-shortcut column, not desktop equivalence.",
    contextJa:
      "Slack のブラウザ版でアプリ内にフォーカス。ブラウザ指定なし。Windows のスクリーンリーダーでは仮想カーソルを無効にする必要がある場合があります。公式のブラウザ用の列を参照しています。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-navigation",
  },
  {
    id: "web-slack-section-previous-pc",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "F6",
      },
    ],
    action: "Focus the previous app section",
    actionJa: "前のアプリ内領域へフォーカス",
    context:
      "Slack browser app, focus inside Slack; browser unspecified. Windows screen readers may require virtual cursor off. Based on explicit browser-shortcut column, not desktop equivalence.",
    contextJa:
      "Slack のブラウザ版でアプリ内にフォーカス。ブラウザ指定なし。Windows のスクリーンリーダーでは仮想カーソルを無効にする必要がある場合があります。公式のブラウザ用の列を参照しています。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-navigation",
  },
  {
    id: "web-slack-section-previous-mac",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "F6",
      },
    ],
    action: "Focus the previous app section",
    actionJa: "前のアプリ内領域へフォーカス",
    context:
      "Slack browser app, focus inside Slack; browser unspecified. Windows screen readers may require virtual cursor off. Based on explicit browser-shortcut column, not desktop equivalence.",
    contextJa:
      "Slack のブラウザ版でアプリ内にフォーカス。ブラウザ指定なし。Windows のスクリーンリーダーでは仮想カーソルを無効にする必要がある場合があります。公式のブラウザ用の列を参照しています。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-navigation",
  },
  {
    id: "web-slack-quick-switcher-pc",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Choose a conversation",
    actionJa: "会話を検索して移動",
    context:
      "Slack browser app, focus inside Slack; browser unspecified. Windows screen readers may require virtual cursor off. Based on explicit browser-shortcut column, not desktop equivalence.",
    contextJa:
      "Slack のブラウザ版でアプリ内にフォーカス。ブラウザ指定なし。Windows のスクリーンリーダーでは仮想カーソルを無効にする必要がある場合があります。公式のブラウザ用の列を参照しています。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-navigation",
  },
  {
    id: "web-slack-quick-switcher-mac",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "K",
      },
    ],
    action: "Choose a conversation",
    actionJa: "会話を検索して移動",
    context:
      "Slack browser app, focus inside Slack; browser unspecified. Windows screen readers may require virtual cursor off. Based on explicit browser-shortcut column, not desktop equivalence.",
    contextJa:
      "Slack のブラウザ版でアプリ内にフォーカス。ブラウザ指定なし。Windows のスクリーンリーダーでは仮想カーソルを無効にする必要がある場合があります。公式のブラウザ用の列を参照しています。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-navigation",
  },
  {
    id: "web-slack-unreads-pc",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "A",
      },
    ],
    action: "Show unread messages",
    actionJa: "未読メッセージの画面を開く",
    context:
      "Slack browser app, focus inside Slack; browser unspecified. Windows screen readers may require virtual cursor off. Based on explicit browser-shortcut column, not desktop equivalence.",
    contextJa:
      "Slack のブラウザ版でアプリ内にフォーカス。ブラウザ指定なし。Windows のスクリーンリーダーでは仮想カーソルを無効にする必要がある場合があります。公式のブラウザ用の列を参照しています。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-navigation",
  },
  {
    id: "web-slack-unreads-mac",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta", "Shift"],
        key: "A",
      },
    ],
    action: "Show unread messages",
    actionJa: "未読メッセージの画面を開く",
    context:
      "Slack browser app, focus inside Slack; browser unspecified. Windows screen readers may require virtual cursor off. Based on explicit browser-shortcut column, not desktop equivalence.",
    contextJa:
      "Slack のブラウザ版でアプリ内にフォーカス。ブラウザ指定なし。Windows のスクリーンリーダーでは仮想カーソルを無効にする必要がある場合があります。公式のブラウザ用の列を参照しています。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-navigation",
  },
  {
    id: "web-slack-edit",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "E",
      },
    ],
    action: "Edit your focused message",
    actionJa: "フォーカスした自分のメッセージを編集",
    context:
      "Slack browser app, an individual message focused rather than the composer. Generic help links these contextual one-key actions from browser navigation. Browser unspecified.",
    contextJa:
      "Slack のブラウザ版。入力欄ではなくメッセージ自体にフォーカス。ブラウザ用の操作説明から参照される単独キー操作です。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-shortcuts",
  },
  {
    id: "web-slack-thread",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "T",
      },
    ],
    action: "Open the focused thread",
    actionJa: "フォーカスしたメッセージのスレッドを開く",
    context:
      "Slack browser app, an individual message focused rather than the composer. Generic help links these contextual one-key actions from browser navigation. Browser unspecified.",
    contextJa:
      "Slack のブラウザ版。入力欄ではなくメッセージ自体にフォーカス。ブラウザ用の操作説明から参照される単独キー操作です。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-shortcuts",
  },
  {
    id: "web-slack-react",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "R",
      },
    ],
    action: "Choose a reaction",
    actionJa: "フォーカスしたメッセージにリアクションを付ける",
    context:
      "Slack browser app, an individual message focused rather than the composer. Generic help links these contextual one-key actions from browser navigation. Browser unspecified.",
    contextJa:
      "Slack のブラウザ版。入力欄ではなくメッセージ自体にフォーカス。ブラウザ用の操作説明から参照される単独キー操作です。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-shortcuts",
  },
  {
    id: "web-slack-save",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "A",
      },
    ],
    action: "Toggle saving a message",
    actionJa: "フォーカスしたメッセージの保存状態を切り替え",
    context:
      "Slack browser app, an individual message focused rather than the composer. Generic help links these contextual one-key actions from browser navigation. Browser unspecified.",
    contextJa:
      "Slack のブラウザ版。入力欄ではなくメッセージ自体にフォーカス。ブラウザ用の操作説明から参照される単独キー操作です。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-shortcuts",
  },
  {
    id: "web-slack-mark-read",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "Escape",
      },
    ],
    action: "Mark the conversation read",
    actionJa: "会話を既読にする",
    context:
      "Slack browser app, focus inside Slack; browser unspecified. Windows screen readers may require virtual cursor off. Based on explicit browser-shortcut column, not desktop equivalence. Only while not typing and no menus are open.",
    contextJa:
      "Slack のブラウザ版でアプリ内にフォーカス。ブラウザ指定なし。Windows のスクリーンリーダーでは仮想カーソルを無効にする必要がある場合があります。公式のブラウザ用の列を参照しています。 文字入力中ではなく、メニューが開いていない場合。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-navigation",
  },
  {
    id: "web-slack-bold-pc",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "linux"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "B",
      },
    ],
    action: "Use bold selected text",
    actionJa: "選択した本文を太字にする",
    context:
      "Slack browser app; cursor in message field with text selected. Generic source does not mark this mapping desktop-only; linked browser contextual navigation.",
    contextJa:
      "Slack のブラウザ版でメッセージ入力欄の文字を選択。一般資料でデスクトップ専用と記載されていない項目です。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-shortcuts",
  },
  {
    id: "web-slack-bold-mac",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "B",
      },
    ],
    action: "Use bold selected text",
    actionJa: "選択した本文を太字にする",
    context:
      "Slack browser app; cursor in message field with text selected. Generic source does not mark this mapping desktop-only; linked browser contextual navigation.",
    contextJa:
      "Slack のブラウザ版でメッセージ入力欄の文字を選択。一般資料でデスクトップ専用と記載されていない項目です。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-shortcuts",
  },
  {
    id: "web-slack-line-break",
    appId: "slack",
    app: "Slack",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: ["Shift"],
        key: "Enter",
      },
    ],
    action: "Break a composer line",
    actionJa: "メッセージ入力欄で改行",
    context: "Slack browser app; message field focused. Browser unspecified.",
    contextJa: "Slack のブラウザ版でメッセージ入力欄にフォーカス。ブラウザ指定なし。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-slack-shortcuts",
  },
  {
    id: "web-discord-quote",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "Q",
      },
    ],
    action: "Quote focused message",
    actionJa: "フォーカスしたメッセージを引用",
    context:
      "Discord browser app; Keyboard Mode started with Tab; the specific message is focused (blue ring). Browser unspecified. FAQ updated 2020-12-14; current execution not tested. Ownership/permission applies to editing, deletion and pinning.",
    contextJa:
      "Discord のブラウザ版。Tab でキーボードモードを開始し、対象メッセージに青い枠でフォーカス。ブラウザ指定なし。FAQ の更新日は 2020-12-14、現在の実行は未検証。 編集・削除・ピン留めには所有者や権限の条件があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-discord-reply",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "R",
      },
    ],
    action: "Reply to focused message",
    actionJa: "フォーカスしたメッセージへ返信",
    context:
      "Discord browser app; Keyboard Mode started with Tab; the specific message is focused (blue ring). Browser unspecified. FAQ updated 2020-12-14; current execution not tested. Ownership/permission applies to editing, deletion and pinning.",
    contextJa:
      "Discord のブラウザ版。Tab でキーボードモードを開始し、対象メッセージに青い枠でフォーカス。ブラウザ指定なし。FAQ の更新日は 2020-12-14、現在の実行は未検証。 編集・削除・ピン留めには所有者や権限の条件があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-discord-edit",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "E",
      },
    ],
    action: "Edit focused message",
    actionJa: "フォーカスしたメッセージを編集",
    context:
      "Discord browser app; Keyboard Mode started with Tab; the specific message is focused (blue ring). Browser unspecified. FAQ updated 2020-12-14; current execution not tested. Ownership/permission applies to editing, deletion and pinning.",
    contextJa:
      "Discord のブラウザ版。Tab でキーボードモードを開始し、対象メッセージに青い枠でフォーカス。ブラウザ指定なし。FAQ の更新日は 2020-12-14、現在の実行は未検証。 編集・削除・ピン留めには所有者や権限の条件があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-discord-delete",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "Backspace",
      },
    ],
    action: "Delete focused message",
    actionJa: "フォーカスしたメッセージを削除",
    context:
      "Discord browser app; Keyboard Mode started with Tab; the specific message is focused (blue ring). Browser unspecified. FAQ updated 2020-12-14; current execution not tested. Ownership/permission applies to editing, deletion and pinning.",
    contextJa:
      "Discord のブラウザ版。Tab でキーボードモードを開始し、対象メッセージに青い枠でフォーカス。ブラウザ指定なし。FAQ の更新日は 2020-12-14、現在の実行は未検証。 編集・削除・ピン留めには所有者や権限の条件があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-discord-pin",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "P",
      },
    ],
    action: "Pin focused message",
    actionJa: "フォーカスしたメッセージをピン留め",
    context:
      "Discord browser app; Keyboard Mode started with Tab; the specific message is focused (blue ring). Browser unspecified. FAQ updated 2020-12-14; current execution not tested. Ownership/permission applies to editing, deletion and pinning.",
    contextJa:
      "Discord のブラウザ版。Tab でキーボードモードを開始し、対象メッセージに青い枠でフォーカス。ブラウザ指定なし。FAQ の更新日は 2020-12-14、現在の実行は未検証。 編集・削除・ピン留めには所有者や権限の条件があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-discord-chatbar",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "Escape",
      },
    ],
    action: "Focus the chat composer",
    actionJa: "チャット入力欄へ戻る",
    context:
      "Discord browser app; Keyboard Mode started with Tab; the specific message is focused (blue ring). Browser unspecified. FAQ updated 2020-12-14; current execution not tested. Ownership/permission applies to editing, deletion and pinning.",
    contextJa:
      "Discord のブラウザ版。Tab でキーボードモードを開始し、対象メッセージに青い枠でフォーカス。ブラウザ指定なし。FAQ の更新日は 2020-12-14、現在の実行は未検証。 編集・削除・ピン留めには所有者や権限の条件があります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-discord-unread",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "Enter",
      },
    ],
    action: "Mark focused message unread",
    actionJa: "フォーカスしたメッセージを未読にする",
    context:
      "Discord browser app; Keyboard Mode started with Tab; the specific message is focused (blue ring). Browser unspecified. FAQ updated 2020-12-14; current execution not tested.",
    contextJa:
      "Discord のブラウザ版。Tab でキーボードモードを開始し、対象メッセージに青い枠でフォーカス。ブラウザ指定なし。FAQ の更新日は 2020-12-14、現在の実行は未検証。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-discord-copy-pc",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "C",
      },
    ],
    action: "Copy focused message text",
    actionJa: "フォーカスしたメッセージの内容をコピー",
    context:
      "Discord browser app; Keyboard Mode started with Tab; the specific message is focused (blue ring). Browser unspecified. FAQ updated 2020-12-14; current execution not tested.",
    contextJa:
      "Discord のブラウザ版。Tab でキーボードモードを開始し、対象メッセージに青い枠でフォーカス。ブラウザ指定なし。FAQ の更新日は 2020-12-14、現在の実行は未検証。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-discord-copy-mac",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Meta"],
        key: "C",
      },
    ],
    action: "Copy focused message text",
    actionJa: "フォーカスしたメッセージの内容をコピー",
    context:
      "Discord browser app; Keyboard Mode started with Tab; the specific message is focused (blue ring). Browser unspecified. FAQ updated 2020-12-14; current execution not tested.",
    contextJa:
      "Discord のブラウザ版。Tab でキーボードモードを開始し、対象メッセージに青い枠でフォーカス。ブラウザ指定なし。FAQ の更新日は 2020-12-14、現在の実行は未検証。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-discord-section-next",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: [],
        key: "F6",
      },
    ],
    action: "Focus the next app section",
    actionJa: "次のアプリ内領域へフォーカス",
    context:
      "Discord browser app; Keyboard Mode active. Browser unspecified; FAQ explicitly includes browser app.",
    contextJa:
      "Discord のブラウザ版。キーボードモード中。ブラウザ指定なし。公式 FAQ がブラウザ対応を明記。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-discord-section-previous",
    appId: "discord",
    app: "Discord",
    surface: "web",
    platforms: ["windows", "macos", "linux"],
    sequence: [
      {
        modifiers: ["Shift"],
        key: "F6",
      },
    ],
    action: "Focus the previous app section",
    actionJa: "前のアプリ内領域へフォーカス",
    context:
      "Discord browser app; Keyboard Mode active. Browser unspecified; FAQ explicitly includes browser app.",
    contextJa:
      "Discord のブラウザ版。キーボードモード中。ブラウザ指定なし。公式 FAQ がブラウザ対応を明記。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-discord-navigation",
  },
  {
    id: "web-excel-go-to",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "G",
      },
    ],
    action: "Navigate to a cell reference",
    actionJa: "指定セルへ移動",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-link",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Add a worksheet hyperlink",
    actionJa: "ハイパーリンクを挿入",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-line-break",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt"],
        key: "Enter",
      },
    ],
    action: "Break a line inside a cell",
    actionJa: "セル内で改行",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-section-next",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "F6",
      },
    ],
    action: "Switch ribbon and worksheet focus",
    actionJa: "リボンとワークシートの間でフォーカスを移動",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-autofilter",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "L",
      },
    ],
    action: "Toggle the worksheet filter",
    actionJa: "オートフィルターを切り替え",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-edit-cell",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: [],
        key: "F2",
      },
    ],
    action: "Edit the selected cell",
    actionJa: "選択セルを編集",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-follow-link",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Enter",
      },
    ],
    action: "Open the selected hyperlink",
    actionJa: "選択したハイパーリンクを開く",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-select-column",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "Space",
      },
    ],
    action: "Select a whole column",
    actionJa: "列全体を選択",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-select-row",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Shift"],
        key: "Space",
      },
    ],
    action: "Select a whole row",
    actionJa: "行全体を選択",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-sheet-next",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "PageDown",
      },
    ],
    action: "Visit the next worksheet",
    actionJa: "次のシートへ移動",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-sheet-next-other",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "PageDown",
      },
    ],
    action: "Visit the next worksheet",
    actionJa: "次のシートへ移動",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys. Browser other than Chrome (or Microsoft Teams); Chrome differs.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。 Chrome 以外のブラウザ、または Microsoft Teams での操作。Chrome は異なります。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-help-overridden",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: [],
        key: "F1",
      },
    ],
    action: "Show workbook help",
    actionJa: "Excel のヘルプを表示",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys. Enable Help > Keyboard Shortcuts > Override browser shortcuts; without override F1 belongs to the browser.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。 ヘルプ → キーボード ショートカット → ブラウザ ショートカットの上書きを有効化。無効時の F1 はブラウザの操作です。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-open-overridden",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "O",
      },
    ],
    action: "Open a workbook",
    actionJa: "ブックを開く",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys. Enable browser shortcut overrides; source introductory note says Ctrl+O otherwise applies to browser although frequent-shortcut table also lists it.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。 ブラウザ ショートカットの上書きを有効化。公式の冒頭説明では通常の Ctrl+O はブラウザ操作ですが、よく使う操作表にも併記されています。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-home-pc",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt", "Meta"],
        key: "",
      },
      {
        modifiers: [],
        key: "H",
      },
    ],
    action: "Visit the Home ribbon tab",
    actionJa: "ホーム タブへ移動",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys. Press Alt+Windows logo key together, release, then H; modifier-only prefix.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。 Alt+Windows キーを押して離し、H を押します。最初は修飾キーだけの操作です。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-home-mac",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "",
      },
      {
        modifiers: [],
        key: "H",
      },
    ],
    action: "Visit the Home ribbon tab",
    actionJa: "ホーム タブへ移動",
    context:
      "Excel for the web on Mac; Control+Option starts access keys, release then H. Editing mode for Search; browser unspecified. No Ctrl→Command inference.",
    contextJa:
      "Mac の Excel Web 版。Control+Option を押して離し、H を押します。検索は編集モード。ブラウザ指定なし。Ctrl の Command への推定置換はしていません。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-search-pc",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt", "Meta"],
        key: "",
      },
      {
        modifiers: [],
        key: "Q",
      },
    ],
    action: "Search available workbook commands",
    actionJa: "Excel のコマンドを検索",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys. Press Alt+Windows logo key together, release, then Q; modifier-only prefix.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。 Alt+Windows キーを押して離し、Q を押します。最初は修飾キーだけの操作です。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-search-mac",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Ctrl", "Alt"],
        key: "",
      },
      {
        modifiers: [],
        key: "Q",
      },
    ],
    action: "Search available workbook commands",
    actionJa: "Excel のコマンドを検索",
    context:
      "Excel for the web on Mac; Control+Option starts access keys, release then Q. Editing mode for Search; browser unspecified. No Ctrl→Command inference.",
    contextJa:
      "Mac の Excel Web 版。Control+Option を押して離し、Q を押します。検索は編集モード。ブラウザ指定なし。Ctrl の Command への推定置換はしていません。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-excel-row-above-access",
    appId: "excel",
    app: "Microsoft Excel",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Alt", "Meta"],
        key: "",
      },
      {
        modifiers: [],
        key: "H",
      },
      {
        modifiers: [],
        key: "I",
      },
      {
        modifiers: [],
        key: "R",
      },
    ],
    action: "Add a row above",
    actionJa: "現在の行の上へ行を挿入",
    context:
      "Excel for the web; Editing mode for edits, worksheet focused. US keyboard layout per official source. Edge is recommended; browser/version unspecified otherwise. Browser overrides may affect conflicting keys. Alt+Windows modifier-only prefix, release, then H, I, R separately.",
    contextJa:
      "Excel の Web 版。編集操作には編集モード、ワークシートにフォーカス。公式資料は US 配列が対象。Edge が推奨され、ほかはブラウザ・版の指定なし。競合するキーはブラウザ上書き設定に影響されます。 Alt+Windows キーを押して離し、H、I、R の順に押します。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-excel",
  },
  {
    id: "web-notion-previous-db-pc",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["windows"],
    sequence: [
      {
        modifiers: ["Ctrl"],
        key: "K",
      },
    ],
    action: "Visit the previous database page",
    actionJa: "前のデータベースページへ移動",
    context:
      "Notion database peek view only. English/QWERTY per official general shortcut instructions, outside Desktop subsection; browser execution not tested.",
    contextJa:
      "Notion のデータベースのピーク表示に限る操作です。公式の一般操作は英語・QWERTY 配列が対象。デスクトップ専用の節を除外し、ブラウザでの実行は未検証。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
  {
    id: "web-notion-previous-db-mac",
    appId: "notion",
    app: "Notion",
    surface: "web",
    platforms: ["macos"],
    sequence: [
      {
        modifiers: ["Ctrl", "Shift"],
        key: "K",
      },
    ],
    action: "Visit the previous database page",
    actionJa: "前のデータベースページへ移動",
    context:
      "Notion database peek view only. English/QWERTY per official general shortcut instructions, outside Desktop subsection; browser execution not tested.",
    contextJa:
      "Notion のデータベースのピーク表示に限る操作です。公式の一般操作は英語・QWERTY 配列が対象。デスクトップ専用の節を除外し、ブラウザでの実行は未検証。",
    version:
      "Current official online documentation; app and browser version unspecified; not execution-tested",
    sourceId: "web-notion",
  },
];
