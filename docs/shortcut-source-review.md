# Shortcut source review

Review date: **2026-10-11 UTC**. This records source-route checks and preparation of a smaller publication candidate. **Merge and publication remain on hold; this is not a declaration that all rights checks are complete.** Document matching does not verify installed-app behavior or the current hosted deployment.

## Candidate and held scope

The current candidate contains **82 records across five applications**:

| Application        | Records | Source/data license route            |
| ------------------ | ------: | ------------------------------------ |
| Visual Studio Code |      18 | CC BY 3.0 US documentation           |
| Windows Terminal   |      15 | CC BY 4.0 documentation              |
| Warp               |      15 | MIT documentation                    |
| Mozilla Firefox    |      16 | CC BY-SA 3.0 source-derived data     |
| GitHub Web         |      18 | CC BY 4.0 documentation/content/data |

Totals by license route are **CC BY 4.0: 33**, **CC BY 3.0 US: 18**, **CC BY-SA 3.0: 16**, **MIT: 15**. Source conditions and notices remain separate from the application's MIT code license. The served [source notices](../public/licenses/shortcut-sources/notices.html), full license files and [third-party credits](../THIRD_PARTY_NOTICES.md) carry the attribution and change notices.

The initial, newly authored 380-record dictionary was compared by record ID with the 82 candidates. **298 records remain held**, including **138 Web records**:

| Held scope            | Records | Breakdown                                                                   |
| --------------------- | ------: | --------------------------------------------------------------------------- |
| Microsoft Support     |      70 | Windows 12, Explorer 10, Edge 15, Excel desktop 15, Excel Web 18            |
| Zed                   |      15 | Source-file licensing scope still unresolved                                |
| Blender               |      15 | GPL factory-keymap route not cleared for this publication                   |
| IntelliJ IDEA         |      15 | Supplied Apache route lacks a verified repository/path                      |
| Other desktop/browser |      63 | Chrome 18, Slack 15, Discord 15, Obsidian 15                                |
| Other Web             |     120 | Gmail 20, Google Docs 27, Google Sheets 23, Notion 23, Slack 16, Discord 11 |

“Other” therefore totals **183**, and the Web hold is Excel Web 18 plus other Web 120. Holding these records does not assert that every factual assignment is copyrighted or that every upstream source prohibits reuse; it means this review has not established the required publication basis. Microsoft Support's linked [Terms of Use](https://www.microsoft.com/en-us/legal/terms-of-use) has personal/noncommercial and Documents restrictions that a factual-extraction note alone does not resolve.

The earlier **560-record personal archive is a separate, pending-clearance task**. Its files and descriptions were not consulted or imported for this review or candidate. Shrinking the current dictionary does **not** erase the earlier 380-record snapshot from commit `32586750f8af3047f598c91b9a9656dc683ea049` or from PR history; no history removal is claimed.

## Fixed primary sources

The following source paths and their applicable licenses were checked at the stated commits. A software license was not transferred to an unrelated support page.

| Evidence label | Official repository / fixed commit                                  | Exact path                                                        |
| -------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| VS-W           | microsoft/vscode-docs / `aeaa6ffe7e675ab1eaf3e9e8af1df9358c91911b`  | [docs/customization/keyboard-shortcuts-windows.docx][vs-w]        |
| VS-L           | same VS Code commit                                                 | [docs/customization/keyboard-shortcuts-linux.docx][vs-l]          |
| VS-M           | same VS Code commit                                                 | [docs/customization/keyboard-shortcuts-macos.docx][vs-m]          |
| T-A            | MicrosoftDocs/terminal / `c341a6362f9f0346a17ecc5e1e74d2cd9372c8f9` | [TerminalDocs/customize-settings/actions.md][t-a]                 |
| T-P            | same Terminal commit                                                | [TerminalDocs/command-palette.md][t-p]                            |
| W              | warpdotdev/docs / `173a3262de95df65b1c10fed013a7182643a3b89`        | [src/content/docs/getting-started/keyboard-shortcuts.mdx][warp]   |
| G              | github/docs / `c008b66a92206bee5fbbad54ffbbde60451fb1f5`            | [content/get-started/accessibility/keyboard-shortcuts.md][github] |

VS Code's same-commit [LICENSE.md][vs-license] specifies [CC BY 3.0 US](https://creativecommons.org/licenses/by/3.0/us/legalcode) for documentation. Its default-reference Markdown uses `kb(commandId)` rendering macros, so literal keys were independently checked in all three DOCX files. Their `docProps/core.xml` creator metadata was inspected: all three identify **Brad Gashler**; Windows/macOS list Greg Van Liew and Linux lists Nick Trogh as last modifier. Creator credit is retained in the notice.

Terminal's actual Learn Edit links identify the source paths above; the same-commit [LICENSE][terminal-license] is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode). Warp's same-commit [LICENSE][warp-license] is MIT, Copyright (C) 2020-2026 Denver Technologies, Inc.; its complete permission and disclaimer notice is bundled. GitHub's same-commit [README][github-readme] and [LICENSE][github-license] cover documentation/content/data under CC BY 4.0. These routes were rechecked against current candidate assignments rather than merely changing a license label on the previous rows.

## Row evidence

**W = Windows, L = Linux, M = macOS.** `Lnn` is a one-based source-file line. `Pnn` is the zero-based index among nonempty paragraph texts extracted from DOCX `word/document.xml`; paragraph text is assembled from its `w:t` nodes in document order. No source prose or code is reproduced in these tables.

### Visual Studio Code — 18 records

Each Windows/Linux assertion was checked separately; the macOS records use documented Command bindings. The exit instruction for `vscode-11` is embedded in the Zen Mode entry.

| Row ID      | OS  | DOCX position        |
| ----------- | --- | -------------------- |
| `vscode-01` | W/L | VS-W P90; VS-L P137  |
| `vscode-02` | W/L | VS-W P5; VS-L P5     |
| `vscode-03` | W/L | VS-W P7; VS-L P7     |
| `vscode-04` | W/L | VS-W P212; VS-L P114 |
| `vscode-05` | W/L | VS-W P58; VS-L P47   |
| `vscode-06` | W/L | VS-W P60; VS-L P49   |
| `vscode-07` | W/L | VS-W P139; VS-L P64  |
| `vscode-08` | W/L | VS-W P15; VS-L P15   |
| `vscode-09` | W/L | VS-W P155; VS-L P80  |
| `vscode-10` | W/L | VS-W P230; VS-L P134 |
| `vscode-11` | W/L | VS-W P230; VS-L P134 |
| `vscode-12` | W/L | VS-W P62; VS-L P51   |
| `vscode-13` | W/L | VS-W P246; VS-L P234 |
| `vscode-14` | W/L | VS-W P141; VS-L P66  |
| `vscode-15` | W/L | VS-W P151; VS-L P76  |
| `vscode-16` | M   | VS-M P88             |
| `vscode-17` | M   | VS-M P5              |
| `vscode-18` | M   | VS-M P48             |

### Windows Terminal — 15 records

The selected-copy condition is retained for `windows-terminal-13`: without a selection, the chord is forwarded to the terminal application. Bindings and action associations were checked together.

| Row ID                | OS  | Source position |
| --------------------- | --- | --------------- |
| `windows-terminal-01` | W   | T-P L17         |
| `windows-terminal-02` | W   | T-A L239        |
| `windows-terminal-03` | W   | T-A L487        |
| `windows-terminal-04` | W   | T-A L460        |
| `windows-terminal-05` | W   | T-A L276        |
| `windows-terminal-06` | W   | T-A L296        |
| `windows-terminal-07` | W   | T-A L297        |
| `windows-terminal-08` | W   | T-A L527        |
| `windows-terminal-09` | W   | T-A L551        |
| `windows-terminal-10` | W   | T-A L914        |
| `windows-terminal-11` | W   | T-A L973        |
| `windows-terminal-12` | W   | T-A L974        |
| `windows-terminal-13` | W   | T-A L1171       |
| `windows-terminal-14` | W   | T-A L1200       |
| `windows-terminal-15` | W   | T-A L1249       |

### Warp — 15 records

Every row was checked in both OS sections. Input editor, workspace and output contexts remain separate. `warp-05` was corrected to “Command search” rather than restricting the action to command history; no key was changed.

| Row ID    | OS  | Windows / Linux source lines |
| --------- | --- | ---------------------------- |
| `warp-01` | W/L | W L274; L L434               |
| `warp-02` | W/L | W L270; L L430               |
| `warp-03` | W/L | W L286; L L446               |
| `warp-04` | W/L | W L316; L L476               |
| `warp-05` | W/L | W L205; L L365               |
| `warp-06` | W/L | W L348; L L508               |
| `warp-07` | W/L | W L284; L L444               |
| `warp-08` | W/L | W L202; L L362               |
| `warp-09` | W/L | W L326; L L486               |
| `warp-10` | W/L | W L350; L L510               |
| `warp-11` | W/L | W L208; L L368               |
| `warp-12` | W/L | W L220; L L380               |
| `warp-13` | W/L | W L226; L L386               |
| `warp-14` | W/L | W L275; L L435               |
| `warp-15` | W/L | W L313; L L473               |

### GitHub Web — 18 records

Generic character keys are documented without OS qualifiers; their W/L/M browser scope is not a claim of execution testing. Explicit Ctrl/Command alternatives preserve the documented OS labels. Single-character shortcuts require the account's character-key setting; comment focus notes include the operational inference identified in the evidence. The saved-reply sequence retains the documented Ctrl notation without inventing a Command replacement.

| Row ID                         | OS    | Source position                                                                                                                                     |
| ------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web-github-search`            | W/M/L | [G L36](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L36)   |
| `web-github-file-finder`       | W/M/L | [G L86](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L86)   |
| `web-github-line`              | W/M/L | [G L87](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L87)   |
| `web-github-permalink`         | W/M/L | [G L89](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L89)   |
| `web-github-notifications`     | W/M/L | [G L37](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L37)   |
| `web-github-code`              | W/M/L | [G L45](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L45)   |
| `web-github-issues`            | W/M/L | [G L46](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L46)   |
| `web-github-pulls`             | W/M/L | [G L47](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L47)   |
| `web-github-actions`           | W/M/L | [G L48](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L48)   |
| `web-github-submit-pc`         | W/L   | [G L120](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L120) |
| `web-github-submit-mac`        | M     | [G L120](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L120) |
| `web-github-link-pc`           | W/L   | [G L113](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L113) |
| `web-github-link-mac`          | M     | [G L113](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L113) |
| `web-github-preview-pc`        | W/L   | [G L115](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L115) |
| `web-github-preview-mac`       | M     | [G L115](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L115) |
| `web-github-inline-code-pc`    | W/L   | [G L112](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L112) |
| `web-github-inline-code-mac`   | M     | [G L112](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L112) |
| `web-github-saved-reply-first` | W/M/L | [G L121](https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md#L121) |

### Firefox — 16 records

`firefox-01` through `firefox-16` retain the official [support article](https://support.mozilla.org/en-US/kb/keyboard-shortcuts-perform-firefox-tasks-quickly), checked on 2026-10-11, and the [Mozilla 3.0-or-later content policy](https://www.mozilla.org/en-US/foundation/licensing/website-content/). Unlike the repositories above, this is a date-checked article, not a fixed Git commit. The candidate explicitly selects [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/legalcode) for these source-derived records and adaptations in [shortcuts-firefox.ts](../src/data/shortcuts-firefox.ts), separately from MIT search/UI code.

The served [notice](../public/licenses/shortcut-sources/notices.html) contains the supplied individual contributor credits, copyright, full license/disclaimer and the change notice: selected/reordered subset, normalized notation and OS alternatives, condensed contexts and new English/Japanese labels, adapted by H4M4CHi-ttr on 2026-10-11. This conservative data scope does not assume all assignment facts are protected or that independently authored labels automatically resolve every extraction question.

## Additional Web proposals

GitHub's 18 rows are already included in the 82-record candidate. The approximately ten JupyterLab and approximately ten Excalidraw rows below are **research proposals only**: no additional rows or implementation were added, and target Web behavior remains unverified. The separate proposal memo identified these fixed official routes; this review also checked their license files.

| Proposal          | Approximate scope                                          | Fixed official route                                                                                                                                                                                  | License                                                                               |
| ----------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| JupyterLab v4.6.4 | 10 command/edit-mode notebook bindings, including D then D | `384bff3af6598b3a6348df58fe34450914b49c41`; [packages/notebook-extension/schema/tracker.json][jupyter-keys], [docs/source/user/notebook.md][jupyter-doc]                                              | [BSD-3-Clause][jupyter-license], Copyright (c) 2015-2026 Project Jupyter Contributors |
| Excalidraw        | About 10 canvas/tool bindings with focus/mode conditions   | `2df993fb397dd6d64625908c9c10337727617f6f`; [packages/excalidraw/components/HelpDialog.tsx][excal-help], [packages/common/src/keys.ts][excal-keys], [packages/excalidraw/shortcut.ts][excal-shortcut] | [MIT][excal-license], Copyright (c) 2020 Excalidraw                                   |

Any expansion needs per-row key, OS, mode/focus, version and notice checks before incorporation. Missing results remain missing dictionary entries, not evidence that a key is unused or free of conflicts.

[vs-w]: https://github.com/microsoft/vscode-docs/blob/aeaa6ffe7e675ab1eaf3e9e8af1df9358c91911b/docs/customization/keyboard-shortcuts-windows.docx
[vs-l]: https://github.com/microsoft/vscode-docs/blob/aeaa6ffe7e675ab1eaf3e9e8af1df9358c91911b/docs/customization/keyboard-shortcuts-linux.docx
[vs-m]: https://github.com/microsoft/vscode-docs/blob/aeaa6ffe7e675ab1eaf3e9e8af1df9358c91911b/docs/customization/keyboard-shortcuts-macos.docx
[vs-license]: https://github.com/microsoft/vscode-docs/blob/aeaa6ffe7e675ab1eaf3e9e8af1df9358c91911b/LICENSE.md
[t-a]: https://github.com/MicrosoftDocs/terminal/blob/c341a6362f9f0346a17ecc5e1e74d2cd9372c8f9/TerminalDocs/customize-settings/actions.md
[t-p]: https://github.com/MicrosoftDocs/terminal/blob/c341a6362f9f0346a17ecc5e1e74d2cd9372c8f9/TerminalDocs/command-palette.md
[terminal-license]: https://github.com/MicrosoftDocs/terminal/blob/c341a6362f9f0346a17ecc5e1e74d2cd9372c8f9/LICENSE
[warp]: https://github.com/warpdotdev/docs/blob/173a3262de95df65b1c10fed013a7182643a3b89/src/content/docs/getting-started/keyboard-shortcuts.mdx
[warp-license]: https://github.com/warpdotdev/docs/blob/173a3262de95df65b1c10fed013a7182643a3b89/LICENSE
[github]: https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/content/get-started/accessibility/keyboard-shortcuts.md
[github-readme]: https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/README.md
[github-license]: https://github.com/github/docs/blob/c008b66a92206bee5fbbad54ffbbde60451fb1f5/LICENSE
[jupyter-keys]: https://github.com/jupyterlab/jupyterlab/blob/384bff3af6598b3a6348df58fe34450914b49c41/packages/notebook-extension/schema/tracker.json
[jupyter-doc]: https://github.com/jupyterlab/jupyterlab/blob/384bff3af6598b3a6348df58fe34450914b49c41/docs/source/user/notebook.md
[jupyter-license]: https://github.com/jupyterlab/jupyterlab/blob/384bff3af6598b3a6348df58fe34450914b49c41/LICENSE
[excal-help]: https://github.com/excalidraw/excalidraw/blob/2df993fb397dd6d64625908c9c10337727617f6f/packages/excalidraw/components/HelpDialog.tsx
[excal-keys]: https://github.com/excalidraw/excalidraw/blob/2df993fb397dd6d64625908c9c10337727617f6f/packages/common/src/keys.ts
[excal-shortcut]: https://github.com/excalidraw/excalidraw/blob/2df993fb397dd6d64625908c9c10337727617f6f/packages/excalidraw/shortcut.ts
[excal-license]: https://github.com/excalidraw/excalidraw/blob/2df993fb397dd6d64625908c9c10337727617f6f/LICENSE
