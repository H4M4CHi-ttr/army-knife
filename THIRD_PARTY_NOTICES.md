# 第三者ソフトウェアとフォントの帰属

## ショートカット調査の出典

ショートカット辞書は、固定した公式一次資料に照合した公開準備候補82件です。マージ・サイト公開は確認待ちです。提供者、対象版、UTC確認日、データライセンス、帰属、変更通知は `src/data/shortcuts.ts`、`src/data/shortcuts-firefox.ts` と結果画面に保持します。以前の560件アーカイブを実装の入力には使っていません。現行380件からの保留298件は現在の辞書・bundleに含めませんが、既存PR履歴の削除を意味しません。

**アプリコードのMITは出典由来データを再許諾しません。** VS Code18件はCC BY 3.0 US、Terminal15件とGitHub18件はCC BY 4.0、Warp15件はDenver TechnologiesのMIT、Firefox16件とその翻案（機能名・条件説明・日本語訳を含む）はCC BY-SA 3.0です。Firefox由来部分のShareAlikeはファイル分割だけで解消されるものではありません。作者・著作権・原記事/帰属リンク、選択・正規化・翻訳の変更通知、免責、全ライセンス原文を [同梱の帰属ページ](public/licenses/shortcut-sources/notices.html) に保持します。各原文と [公開方針](docs/shortcuts.md) を確認してください。

Army Knife の独自コードは [MIT License](LICENSE)、Copyright (c) 2026 H4M4CHi-ttr で提供します。第三者のコード、アイコン、フォントには、それぞれのライセンスが適用されます。本書によって第三者の権利表示やライセンスを変更することはありません。

以下はロック済みの依存、同梱された原文、ソースの来歴に基づく案内です。完全な条件は各原文を参照してください。

## 公開成果物に含める原文

production build は次のファイルを同じサイトから配信する構成です。ソースリポジトリでは生成物をコミットせず、依存のインストールとビルドから生成します。

| 公開ディレクトリ内のパス                           | 内容・生成元                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `LICENSE.txt`                                      | Army Knife の MIT 原文（ソースの `LICENSE` をコピー）                                                             |
| `THIRD_PARTY_NOTICES.md`                           | 本書                                                                                                              |
| `licenses/shadcn-vue-MIT.txt`                      | コピー・調整した shadcn-vue コンポーネントの MIT 原文                                                             |
| `licenses/tailwindcss-MIT.txt`                     | Tailwind CSS の MIT 原文                                                                                          |
| `licenses/javascript-dependencies.md`              | Vite+ のビルドが実際に bundle する JavaScript 依存のライセンス原文                                                |
| `licenses/rust-dependencies.txt`                   | Rust のロック済み依存情報と `LICENSE*` / `COPYING*` / `NOTICE*` / `UNLICENSE*` 原文を WASM ビルド時に集約したもの |
| `fonts/licenses/`                                  | Sarasa と Noto 5 系列、計 6 本の未変更の OFL 原文                                                                 |
| `licenses/shortcut-sources/notices.html`           | 候補82件の出典・作者・著作権・変更通知・データ適用範囲                                                            |
| `licenses/shortcut-sources/CC-BY-4.0.txt`          | CC BY 4.0 の全原文と免責                                                                                          |
| `licenses/shortcut-sources/CC-BY-SA-3.0.txt`       | CC BY-SA 3.0 の全原文と免責                                                                                       |
| `licenses/shortcut-sources/CC-BY-3.0-US.html`      | CC BY 3.0 US の全法的本文・CC通知（ナビゲーション・旗画像を除去）                                                 |
| `licenses/shortcut-sources/vscode-docs-LICENSE.md` | VS Code文書の原著作権・文書/コードのライセンス区別・商標留保                                                      |
| `licenses/shortcut-sources/warp-docs-MIT.txt`      | Warp文書の全著作権・許諾・免責原文                                                                                |

JavaScript のバージョンと依存グラフは [package.json](package.json) と [pnpm-lock.yaml](pnpm-lock.yaml)、Rust は [Cargo.toml](crates/army-knife-core/Cargo.toml) と [Cargo.lock](crates/army-knife-core/Cargo.lock) で管理します。間接依存を含む原文は上記の生成ファイルで確認できます。ビルドやテストのためだけにインストールされるツールもあり、依存として列挙されているすべてのコードがブラウザへ配信されるわけではありません。

## shadcn-vue

`src/components/ui/` のコンポーネントは [unovue/shadcn-vue](https://github.com/unovue/shadcn-vue) のコンポーネントソースをもとに、このアプリ向けに調整しています。

- 取得元の commit: [`b251d9fd92aa496495e127137a7734704fb34a29`](https://github.com/unovue/shadcn-vue/tree/b251d9fd92aa496495e127137a7734704fb34a29)
- ライセンス: **MIT**
- 著作権: **Copyright (c) 2023 unovue**
- 保存した原文: [licenses/shadcn-vue-MIT.txt](licenses/shadcn-vue-MIT.txt)

コンポーネントのコピーや変更後も、この原文を同梱します。

## JavaScript・UI の主な依存

下表のライセンスは、固定バージョンの配布パッケージにある `package.json` とライセンスファイルで確認しています。完全な著作権表記と、追加部分に適用される条件は生成される `licenses/javascript-dependencies.md` に保持します。

| プロジェクト / パッケージ                                        | バージョン         | ライセンス                                        |
| ---------------------------------------------------------------- | ------------------ | ------------------------------------------------- |
| [Vue](https://github.com/vuejs/core)                             | 3.6.0-rc.11        | MIT                                               |
| [Vue I18n](https://github.com/intlify/vue-i18n)                  | 11.4.14            | MIT                                               |
| [VueUse](https://github.com/vueuse/vueuse) / `@vueuse/core`      | 15.0.0（直接依存） | MIT                                               |
| [Reka UI](https://github.com/unovue/reka-ui)                     | 2.11.0             | MIT                                               |
| [Lucide](https://github.com/lucide-icons/lucide) / `@lucide/vue` | 1.55.0             | ISC。Feather 由来部分には同梱の MIT notice も適用 |
| [Class Variance Authority](https://github.com/joe-bell/cva)      | 0.7.1              | Apache-2.0                                        |
| [clsx](https://github.com/lukeed/clsx)                           | 2.1.1              | MIT                                               |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge)      | 3.7.0              | MIT                                               |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)      | 4.3.3              | MIT                                               |

Lucide の配布ライセンスには **Copyright (c) 2026 Lucide Icons and Contributors** と、Feather 由来アイコンに関する追加の権利表示が含まれています。アプリの MIT 表記だけで置き換えないでください。

開発環境には [Vite+](https://github.com/voidzero-dev/vite-plus) 1.1.0（MIT）、TypeScript 6.0.3（Apache-2.0）、Playwright 1.64.0（Apache-2.0）、Vue Test Utils、happy-dom などを使用しています。これらのツール自体と同梱依存のライセンスは、インストールされる各パッケージの原文に従います。

### Tailwind CSS の原文

生成される CSS に関する原文をここに同梱します。JavaScript bundle のライセンス集約とは別に保持します。

```text
MIT License

Copyright (c) Tailwind Labs, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Rust / WebAssembly

以下の直接依存を [army-knife-core](crates/army-knife-core/Cargo.toml) から使用します。Rust の依存グラフにはビルド時のマクロなども含まれ、原文集約はそれらも対象にします。

| crate                                                        | バージョン | 上流のライセンス表記 |
| ------------------------------------------------------------ | ---------- | -------------------- |
| [csv](https://github.com/BurntSushi/rust-csv)                | 1.4.0      | Unlicense / MIT      |
| [regex](https://github.com/rust-lang/regex)                  | 1.13.1     | MIT OR Apache-2.0    |
| [serde](https://github.com/serde-rs/serde)                   | 1.0.229    | MIT OR Apache-2.0    |
| [serde_json](https://github.com/serde-rs/json)               | 1.0.152    | MIT OR Apache-2.0    |
| [url](https://github.com/servo/rust-url)                     | 2.5.8      | MIT OR Apache-2.0    |
| [wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen) | 0.2.129    | MIT OR Apache-2.0    |

間接依存には追加の条件があるものもあります。例えば `unicode-ident` 1.0.26 の表記は **(MIT OR Apache-2.0) AND Unicode-3.0**、`ryu` 1.0.23 は **Apache-2.0 OR BSL-1.0** です。集約処理はこれらのライセンス原文も保持します。

## Noto Sans・Sarasa Mono

フォントはすべて **SIL Open Font License 1.1（OFL-1.1）** で配布します。アプリケーションの MIT ライセンスはフォントには適用しません。

| 配布元                                                                 | 固定した取得物                            | このプロジェクトでの扱い                                  | 原文                                                             |
| ---------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| [Sarasa Gothic](https://github.com/be5invis/Sarasa-Gothic)             | SarasaMono-TTF 1.0.42                     | J / SC / TC / K の Regular を分割、WOFF2 化、内部名を変更 | [Sarasa-Gothic-OFL.txt](third-party/fonts/Sarasa-Gothic-OFL.txt) |
| [Fontsource / Noto Sans](https://fontsource.org/fonts/noto-sans)       | `@fontsource-variable/noto-sans` 5.3.0    | 通常スタイルの可変フォントを自己配信                      | [noto-sans-OFL.txt](third-party/fonts/noto-sans-OFL.txt)         |
| [Fontsource / Noto Sans JP](https://fontsource.org/fonts/noto-sans-jp) | `@fontsource-variable/noto-sans-jp` 5.3.1 | 同上                                                      | [noto-sans-jp-OFL.txt](third-party/fonts/noto-sans-jp-OFL.txt)   |
| [Fontsource / Noto Sans SC](https://fontsource.org/fonts/noto-sans-sc) | `@fontsource-variable/noto-sans-sc` 5.3.1 | 同上                                                      | [noto-sans-sc-OFL.txt](third-party/fonts/noto-sans-sc-OFL.txt)   |
| [Fontsource / Noto Sans TC](https://fontsource.org/fonts/noto-sans-tc) | `@fontsource-variable/noto-sans-tc` 5.3.1 | 同上                                                      | [noto-sans-tc-OFL.txt](third-party/fonts/noto-sans-tc-OFL.txt)   |
| [Fontsource / Noto Sans KR](https://fontsource.org/fonts/noto-sans-kr) | `@fontsource-variable/noto-sans-kr` 5.3.1 | 同上                                                      | [noto-sans-kr-OFL.txt](third-party/fonts/noto-sans-kr-OFL.txt)   |

Noto のフォントバイナリは改変せず、必要な通常スタイルの WOFF2 と CSS を固定した Fontsource パッケージから取得します。Sarasa の改変後の書体名は **Army Knife Mono J / SC / TC / K** です。内部の family、full name、unique identifier、PostScript name を変更し、原著作権と OFL の表示を保持します。

Sarasa の原文には、次の帰属と Reserved Font Name が含まれます。

- Copyright (c) 2015–2025, Renzhi Li（Belleve Invis）
- Portions Copyright (c) 2016 The Inter Project Authors
- Portions Copyright (c) 2014–2021 Adobe Systems Incorporated、Reserved Font Name **Source**
- Portions Copyright (c) 2012 Google Inc.

Noto Sans の原文は The Noto Project Authors、Noto CJK 各系列の原文は Google Inc. の権利表示を含みます。各ファイルの表記をそのまま同梱し、改変フォントへの原著作者の推薦・承認を示唆しません。

ソースの URL、バージョン、アーカイブと原文の SHA-256 は [font-sources.lock.json](scripts/font-sources.lock.json) に記録しています。原文は [third-party/fonts/](third-party/fonts/) に保存し、生成時に `fonts/licenses/` へコピーします。改名、文字範囲、variation sequence、生成ファイルと原文の整合性検査は [フォント設計](docs/fonts.md) を参照してください。

OFL の条件には、フォント単体での販売に関する制限、著作権・ライセンスの同梱、Reserved Font Name の尊重、改変フォントにも OFL を維持することが含まれます。フォントを利用して作る文書やアプリ全体に OFL を適用する条件ではありません。条件の正式な記述は同梱の英語原文と [SIL OFL 公式原文](https://openfontlicense.org/open-font-license-official-text/) にあります。

## 更新時

依存バージョン、コピーしたコンポーネント、フォントのソースを更新したときは、対応するロック、来歴、本書も更新してください。公開時は production build に生成されたライセンスファイルとフォント原文を含め、アセット検査を通してください。
