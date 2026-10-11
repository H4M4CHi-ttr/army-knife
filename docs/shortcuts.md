# Shortcut investigator

This tool looks up a curated dictionary of documented default bindings. It does not inspect running applications, register global hotkeys, or identify which process intercepted a key on the user's computer. Missing results mean the dictionary has no matching entry under the selected filters; they do not establish that a shortcut is unused or free of conflicts.

The current **preparation candidate contains 82 records across 5 applications**, checked on **2026-10-11 UTC**, with **6 source references**. Alternatives and OS/context variants count separately. **Merge and site publication remain held pending review.** A candidate status is preparation metadata, not legal clearance.

| Application        | Surface | Records | Source-derived data license     |
| ------------------ | ------- | ------: | ------------------------------- |
| Visual Studio Code | Desktop |      18 | CC BY 3.0 United States         |
| Windows Terminal   | Desktop |      15 | CC BY 4.0                       |
| Warp               | Desktop |      15 | MIT, Denver Technologies notice |
| Mozilla Firefox    | Browser |      16 | CC BY-SA 3.0                    |
| GitHub             | Web     |      18 | CC BY 4.0                       |

Totals: desktop 48, browser 16, actual Web application 18; CC BY 4.0 33, CC BY 3.0 US 18, CC BY-SA 3.0 16, MIT 15. Browser coverage does not count as Web application coverage. OS mappings are included only where individually documented. GitHub's platform-neutral documentation describes documentation scope, not execution verification on every OS/browser.

The initial branch had 380 freshly researched entries. **298 are held and excluded from the current source dictionary and generated bundle**: Microsoft Support 70, Zed 15, Blender 15, IntelliJ IDEA 15, and other sources 183. This includes 138 Web entries. Attribution alone does not resolve a use restriction or uncertain documentation license. Held rows are excluded statically, not shipped behind a runtime filter. Removal from the current tree does not delete the initial commit from PR history; no history rewrite was performed. See the [per-record source review](shortcut-source-review.md) for pinned sources, evidence and remaining conditions.

## Using the tool

Focus the capture field, then press a shortcut. A chord replaces the current query in single-stroke mode. In sequence mode, each press appends a stroke, up to four strokes; clear the query before starting another sequence. `Ctrl+K then Ctrl+C` and `Ctrl+K+C` are different inputs. The results match the complete sequence by default, with an explicit option to find a contiguous sequence inside a longer shortcut.

The capture handler is attached only to that field. It ignores repeated keydown events, composition, dead keys, and AltGraph input. Tab moves focus and Escape leaves capture. Nothing is captured after focus moves away. The capture field stops the application's own search shortcut from consuming a captured Ctrl/Command+K.

Operating systems and browsers can consume shortcuts before JavaScript receives them. Use manual notation or the on-screen modifier/key builder in those cases. Modifier-only prefixes can be specified manually even where no candidate record matches. The tool cannot guarantee capture of reserved combinations.

## Keys, operating systems, and contexts

- Ctrl and Meta/Command remain separate. OS filters select explicitly documented platform records rather than substituting one modifier for another.
- `KeyboardEvent.key` is the logical key affected by the active layout. `code` is the reported physical position. Captured values are shown as observations; the tool does not infer a US/JIS mapping or silently add Shift to punctuation.
- Source notation can differ from an event's character: a documented `Ctrl+Shift+5` can arrive as `Ctrl+Shift+%`. Use manual source notation when necessary; the tool does not turn one into the other by assuming a layout.
- Logical search normally ignores layout-sensitive physical positions. Numpad positions remain distinct when explicitly recorded. Physical search requires a code in both the query and the source record; an undocumented code is never guessed. The current 82 candidates have no sourced physical codes; parser/search fixtures verify those capabilities for future evidenced records.
- Each record distinguishes OS, browser, desktop application, or Web application. Browser shortcuts are not counted as Web application coverage. Context notes preserve focus, editor mode, optional enabling settings, browser differences, and held/released modifiers for multi-stroke actions.
- The version field describes the reviewed documentation scope. A documentation check is not an execution test in that application. User keymaps, extensions, accessibility tools, and operating-system settings can change behavior.

## Sources and publication

The source registry in [src/data/shortcuts.ts](../src/data/shortcuts.ts) includes titles, exact primary-source URLs, UTC check dates, publisher credit, data license, upstream license, change notice, candidate status and same-site notice/full-license paths. Result cards expose these without requesting external URLs. The dictionary and search are bundled with no new dependency or runtime data service. Queries/events stay in memory and disappear on navigation or reload.

The earlier 560-record personal archive was not an input to this implementation; its rights review is separate work. We did not compare every archive byte or description against this independently researched dictionary, and do not claim every factual assignment is unique to it. This is a curated sample, not an exhaustive shortcut database.

[The bundled attribution page](../public/licenses/shortcut-sources/notices.html) identifies every candidate ID, creator/copyright, original article and contributor links, explicit selection/normalization/translation changes, license and warranty disclaimers. All supplied Firefox article contributor names are preserved. The page has no scripts, images or automatic external requests. Complete CC BY 4.0, CC BY-SA 3.0 and CC BY 3.0 US legal texts, VS Code's upstream copyright/license/trademark notice and Warp's complete MIT copyright/permission/warranty text are served with the build. CC BY 3.0 US HTML retains its entire legal body and CC notice, omitting only navigation and a flag image.

**The independent application/search/UI code is MIT; that license does not relicense source-derived data.** The data and our described adaptations retain their source-specific licenses. Firefox-derived records, including adapted labels/context notes and Japanese translations, are explicitly offered under **CC BY-SA 3.0** in [shortcuts-firefox.ts](../src/data/shortcuts-firefox.ts). Preserve attribution, changes, disclaimers and ShareAlike terms when adapting them. Separating a file alone does not determine the legal extent of an adaptation or collection. Facts not subject to copyright are not made exclusive by this declaration. Patent, trademark, privacy and other rights are not granted; no publisher endorsement is asserted.

## Web expansion proposal

GitHub 18 currently covers navigation and editing, but the candidate does not yet supply the broad Web coverage requested. A useful next scope is **GitHub 18 + JupyterLab about 10 + Excalidraw about 10**, covering navigation, notebook command/edit modes and drawing/editor focus. The [source review](shortcut-source-review.md) identifies exact official source/license paths. These additions are proposals, not imported or shipped rows. Match modes, browser, read-only and typing conditions per row before inclusion. A product's software license does not license unrelated external help pages.

## Maintaining the dictionary

Each addition needs a unique ID, exact sequence, explicit OS/surface, concise labels/context, reviewed version and a primary source actually containing that mapping. Verify the precise file/document license and preserve creators/copyright, changes and complete notices. Do not infer Web bindings from desktop tables, expand source macros without evidence or invent physical codes. Held/unresolved rows stay outside the static dictionary. `validateShortcutPublication` checks metadata consistency; it cannot determine permission or clear rights.

Unit tests cover normalization, sequences, OS/layout distinctions, capture exclusions, candidate scope and complete same-site license/credit files. Component/browser tests cover capture focus, manual/builder input, search/filters, provenance/licenses, locales, keyboard navigation, responsive themes and privacy. Build verification must retain the same-site notices and full texts. Target bindings were checked in documentation, not executed in all applications or on physical US/JIS hardware. See [testing](testing.md).
