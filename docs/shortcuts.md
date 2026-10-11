# Shortcut investigator

This tool looks up a curated dictionary of documented default bindings. It does not inspect running applications, register global hotkeys, or identify which process intercepted a key on the user's computer. Missing results mean the dictionary has no matching entry under the selected filters; they do not establish that a shortcut is unused or free of conflicts.

The initial publication contains **380 records across 20 applications / categories**, checked on **2026-10-11 UTC**, with **25 official source references**. Of these, 224 cover the previously researched 15 desktop/OS/browser categories and 156 cover eight Web applications. Records count documented alternatives and OS/context variants separately.

| Scope                  | Applications / categories                                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS / desktop / browser | Windows, File Explorer, Chrome, Edge, Firefox, Visual Studio Code, Zed, Warp, Windows Terminal, IntelliJ IDEA, Slack, Discord, Obsidian, Microsoft Excel, Blender |
| Web applications       | Gmail, Google Docs, Google Sheets, GitHub, Notion, Slack, Discord, Microsoft Excel                                                                                |

Windows is the broadest documented platform. macOS and Linux are included only where the selected official source explicitly covers them. Notion's general shortcut section is treated as applicable to its browser editor because the page separates desktop-only shortcuts; this is a scope inference, and each record discloses it. Zed's default Windows keymap is pinned to commit `93d745668805029476e6d7fbb19652116fed51de`; Blender uses the official factory keymap at tag `v4.5.0`. The Blender manual could not be fetched and was not used.

## Using the tool

Focus the capture field, then press a shortcut. A chord replaces the current query in single-stroke mode. In sequence mode, each press appends a stroke, up to four strokes; clear the query before starting another sequence. `Ctrl+K then Ctrl+C` and `Ctrl+K+C` are different inputs. The results match the complete sequence by default, with an explicit option to find a contiguous sequence inside a longer shortcut.

The capture handler is attached only to that field. It ignores repeated keydown events, composition, dead keys, and AltGraph input. Tab moves focus and Escape leaves capture. Nothing is captured after focus moves away. The capture field stops the application's own search shortcut from consuming a captured Ctrl/Command+K.

Operating systems and browsers can consume shortcuts before JavaScript receives them. Use manual notation or the on-screen modifier/key builder in those cases. Modifier-only prefixes such as Excel Web's `Alt+Meta then H` can be specified manually. The tool cannot guarantee capture of reserved combinations.

## Keys, operating systems, and contexts

- Ctrl and Meta/Command remain separate. OS filters select explicitly documented platform records rather than substituting one modifier for another.
- `KeyboardEvent.key` is the logical key affected by the active layout. `code` is the reported physical position. Captured values are shown as observations; the tool does not infer a US/JIS mapping or silently add Shift to punctuation.
- Source notation can differ from an event's character: a documented `Ctrl+Shift+5` can arrive as `Ctrl+Shift+%`. Use manual source notation when necessary; the tool does not turn one into the other by assuming a layout.
- Logical search normally ignores layout-sensitive physical positions. Numpad positions remain distinct when explicitly recorded. Physical search requires a code in both the query and the source record; an undocumented code is never guessed.
- Each record distinguishes OS, browser, desktop application, or Web application. Browser shortcuts are not counted as Web application coverage. Context notes preserve focus, editor mode, optional enabling settings, browser differences, and held/released modifiers for multi-stroke actions.
- The version field describes the reviewed documentation scope. A documentation check is not an execution test in that application. User keymaps, extensions, accessibility tools, and operating-system settings can change behavior.

## Sources and publication

The shipped source registry in [src/data/shortcuts.ts](../src/data/shortcuts.ts) contains official URLs, UTC check dates, and source-specific rights notes. Result cards expose these details without requesting those URLs; the user may open the source link explicitly. The dictionary and search code are bundled with the application and make no runtime data requests. Queries and captured events remain in memory and disappear on tool navigation or reload.

The earlier personal research archive contained 560 records with pending publication clearance. None of those records, descriptions, CSV/JSON files, or accompanying documents is redistributed here. The new dataset is independently selected from official documentation and default-binding sources. It records assignments as short factual entries with original labels, rather than importing tables, original prose, or entire keymaps. This is a curated sample, not an exhaustive shortcut database.

Upstream documentation is not automatically covered by an application's source-code license. Mozilla help, VS Code documentation, Blender's manual, and the other sources retain their own conditions. Source names and links identify the original publishers; the `rights` field records known documentation conditions and uncertainty. The project's MIT license does not relicense those external pages. Contributions that reproduce or adapt protected text or source files must include the applicable attribution, license links, change notices, and any required share-alike terms; a pending or expressly prohibited source must remain excluded.

## Maintaining the dictionary

Add an independently verified record with a unique ID, explicit platforms/surface, a full sequence, concise action/context text, reviewed version scope, and an existing official source ID. Add or update the source's check date and rights note. Do not infer a Web binding from a desktop table or a macOS binding from a Windows table. Preserve Numpad distinctions and do not add physical codes without source evidence.

The unit tests validate normalization, sequences, OS distinctions, layout handling, capture exclusions, and data integrity. Component and browser tests exercise capture focus, manual/builder input, filters, provenance, locales, keyboard navigation, responsive themes, and the site's existing privacy policy. Application bindings themselves are checked in documentation, not executed in every target application.
