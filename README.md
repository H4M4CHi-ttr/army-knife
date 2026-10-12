# Army Knife

DevToys を補完する、ブラウザ内で動く開発者向けツール集です。入力したテキストやファイルをサーバーに送信せず、GitHub Pages の静的ファイルだけで処理します。

**Vite+ / Vue 3.6 RC・Vapor Mode / shadcn-vue / Rust → WebAssembly** を使用。ライト・ダーク・システムテーマと、日本語・English・简体中文・繁體中文・한국어に対応しています。

公開先は [H4M4CHi-ttr.github.io/army-knife/](https://h4m4chi-ttr.github.io/army-knife/) です。自分のリポジトリで公開する場合は [Pages の設定](#github-pages-への公開) を行ってください。

## ツール

| ツール                  | 主な機能                                                                    | 処理                | 初期状態 |
| ----------------------- | --------------------------------------------------------------------------- | ------------------- | -------- |
| SRI integrity生成       | ローカルJS/CSSの生バイト列からSHA-256/384/512 integrity属性・HTML例を生成       | Web Crypto / Worker | オフ     |
| BOM・改行コード検査     | UTF-8/UTF-16とBOM、CRLF/LF/CRを厳密に解析し、任意でUTF-8へ変換              | TypeScript / Worker | オフ     |
| Magic Bytes検査        | バイナリ先頭・末尾の既知署名と拡張子・宣言MIMEの不一致を調査                            | TypeScript / Worker | オン     |
| User-Agent解析         | UAからブラウザ・エンジン・OS・デバイス・Bot候補をヒューリスティックに表示     | TypeScript          | オン     |
| Set-Cookie属性解析      | SameSite/Secure/HttpOnly/Partitionedと接頭辞の条件・不整合を確認             | TypeScript          | オン     |
| Linux 権限計算          | 八進数・rwx・特殊ビットを相互変換し、symbolic chmod と作成時 umask を確認   | TypeScript          | オン     |
| ショートカット調査      | キーを押して既定の割り当てを検索。OS・アプリ・Web／デスクトップと出典を確認 | TypeScript          | オン     |
| HAR 解析                | 通信記録の遅いリクエスト、HTTP エラー、応答サイズ、ホスト・MIME 別集計      | Rust / WASM         | オン     |
| .env 比較・検査         | キーの不足、値の違い、重複定義と不正な行を確認                              | TypeScript          | オン     |
| URL 構造・クエリ編集    | URL の構造と重複クエリを確認し、項目順を保ってクエリを編集                  | TypeScript          | オン     |
| PostgreSQL EXPLAIN 解析 | JSON 実行計画のノード、推定行数と実績の差、計画・実行時間を確認             | TypeScript          | オン     |
| CSV プロファイラー      | CSV / TSV の列型、空欄、ユニーク値、サンプル、列数の不揃いを確認            | Rust / WASM         | オン     |
| ログエクスプローラー    | 正規表現で絞り込み、ログレベルと同一行の出現回数を集計                      | Rust / WASM         | オン     |
| CIDR 計算               | IPv4 / IPv6 のネットワーク、マスク、範囲、正確なアドレス数を表示            | TypeScript / BigInt | オン     |
| Unicode インスペクター  | 不可視文字、双方向制御文字、結合子などの位置とコードポイントを確認          | TypeScript          | オン     |
| JSON 構造比較           | オブジェクトのキー順を無視し、配列順を保って追加・削除・変更を表示          | TypeScript          | オン     |
| リスト集合演算          | 共通、和、片側のみ、対称差。重複・空行・大文字小文字の扱いを指定            | Rust / WASM         | オフ     |
| JSON フォーマッター     | 整形、圧縮、構文検証                                                        | TypeScript          | オフ     |
| コントラストチェック    | 不透明な sRGB 2 色の WCAG 2.x AA / AAA 達成判定                             | TypeScript          | オフ     |
| Base64 テキスト変換     | UTF-8 テキストと Base64 / Base64URL を相互変換                                | TypeScript / Worker | オフ     |
| HTML エンティティ変換    | 安全な文字列エスケープと名前付き・数値実体の復元                             | TypeScript          | オフ     |
| URL文字列エンコード     | component / form / path 別パーセント変換                                     | TypeScript          | オフ     |
| ダミーテキスト生成      | 多言語・固定seedで再現できる段落/文/文字数のプレースホルダー生成             | TypeScript          | オフ     |
| CSS セレクター詳細度    | Selectors 4 の対応範囲で (a,b,c) と構成要素別スコアを比較                    | TypeScript          | オフ     |
| CSS fluid typography  | ビューポートとフォントサイズの2点から clamp() 式とプレビューを生成           | TypeScript          | オフ     |

Base64 テキスト変換は RFC 4648 の標準 Base64（パディングあり）・URL-safe（パディングなし）に対応。デコードでは正規のパディングの有無を許容しますが、空白・不正な文字・未使用ビット・壊れた UTF-8 を拒否します。入力上限は 256 KiB。長い入力は 800ms 後に中断可能な専用 Worker で処理し、最大 5 秒でタイムアウトします。外部依存ライブラリは追加していません。

### 追加した文字列・CSSツール（Issues #15, #16, #23, #98, #99）

- **HTMLエンティティ**: エンコードは特殊な5文字 `& < > " '` を対象とし、完全モードでは非ASCIIをUnicode数値実体化します。デコードは有効な10進・16進数値実体と、`amp`/`lt`/`gt`/`quot`/`apos`/`nbsp`/`copy`/`reg`/`trade`/`euro`/`hellip`/`mdash`/`ndash`/`times`/`divide` のみ。知らない実体はそのまま保持します。HTMLとして描画・実行しません。
- **URL文字列のパーセント変換**: `component` は `encodeURIComponent`、`form` は `application/x-www-form-urlencoded`（空白と`+`の相互変換）、`path` はパス区切り`/`を保持します。デコードは不正な%エスケープ・UTF-8をエラーとして拒否します。いずれもURLへ接続せず文字列として処理します。
- **ダミーテキスト**: 固定された架空のフレーズから、Latin/English/日本語/簡体字/繁体字/韓国語の6種類をseed付き擬似乱数で生成。0〜30段落、0〜120文、0〜10,000 Unicodeコードポイントまで、出力上限64KiB。実在人物の住所やプロフィールを生成しません。
- **CSSセレクター詳細度**: CSS Selectors Level 4の**明示した限定サブセット**を解析。ID・クラス・属性・要素・疑似クラス・疑似要素、`:is()`/`:not()`/`:has()`の最大引数、`:where()`のゼロ、`:nth-child(... of ...)`などを扱います。文字4096、セレクター32件、ネスト8階層、トークン256件まで。未対応の関数や親セレクター文脈のない`&`ネストは推定せずエラーにします。
- **fluid typography**: 最小/最大フォントサイズ 0.5〜256px、画面幅240〜10000px、ルート基準8〜32pxを指定し、線形補間から`clamp(..., calc(...vw + ...rem), ...)`を生成。CSS係数を小数6桁に丸めるため、極小の誤差があります。remの実表示はサイト側のルートフォントに依存します。

文字列エンコードは入力最大64KiB、結果最大512Ki UTF-16コード単位で、長い入力だけ自動800ms遅延適用・手動適用に切り替わります。入力と出力はメモリだけで保持し、通信、保存、HTML実行をしません。すべてVapor Modeのツール画面・5言語辞書・各言語固有の説明ページから利用できます。

DevToys と重なる機能は **設定から明示的に有効にするまで表示・起動されません**。以前の DevToys に含まれていたコントラスト機能も保守的にオフにしています。比較対象と判断根拠は [DevToys overlap policy](docs/devtoys-coverage.md) に記載しています。

入力欄への貼り付け、UTF-8 ファイルの読み込み、用意されたサンプルを利用できます。結果のコピーとダウンロードはボタンを押したときに行います。CSV・ログ・HAR は解析レポートの JSON、集合演算は全結果のテキストをダウンロードします。

ショートカット調査は専用欄にフォーカスしてキーを押すと、公式資料で確認した既定の割り当てを検索します。予約キーは手動・画面上のキーで指定でき、順次押す操作も扱います。PC 上でキーを横取りしているプロセスの検出ではなく、掲載がないキーを未使用と断定しません。現在の収録辞書は権利表示を整えた82件（WebはGitHub18件）です。この82件版の公開は了承済みで、残り298件は別途確認のため収録を保留しています。データ範囲・保留分・Web拡張案・キー配列の扱い・出典と権利の方針は [ショートカット調査](docs/shortcuts.md) に記載しています。

### ファイル・HTTPセキュリティのローカル診断（Issues #128, #90, #88, #65, #54）

- **SRI integrity**: ネットワーク取得は行わず、ローカルファイル（空ファイルも可）または厳密な16進バイト列から SHA-256/384/512 の Base64 ダイジェストとHTMLの利用例を生成。バイト列の違い（改行を含む）は出力に反映。HTML内のリソースURLはダミーなので手動置換が必要です。重複を保守的に見て既定オフ。
- **BOM・改行コード**: UTF-8/UTF-16LE/UTF-16BEを厳密にデコードし、BOMと CRLF/LF/CR を個別に数え、改行全体に占める比率を表示します。BOMなしUTF-16は一部のNUL配置パターンのみ推定（その旨警告）。不明な旧文字コードは推測変換しません。変換を明示操作した場合だけ、BOMなしUTF-8と指定改行へダウンロードします。既定オフ。
- **Magic Bytes**: PNG/JPEG/GIF/PDF/ZIP/GZIP/7z/RAR/SQLite/ELF/MZ/WebP/WAVEとZIP終端候補を静的検査。拡張子・ファイルが宣言するMIME（参考値）と照合します。署名は完全なパーサーや安全性検査ではなく、Polyglotや偽装・不完全なファイルを見逃す可能性があります。
- **User-Agent**: 既知の部分文字列から端末・エンジン・ブラウザ・OS・botを推定します。UA偽装、Windowsの凍結UA、Client Hints未取得などにより真の環境は確定できません。
- **Set-Cookie**: 1行ごとのヘッダーをローカル静的解析し、Cookie一覧表と詳細を表示。Expiresの日付中のカンマを分割せず、SameSite=None/PartitionedのSecure条件、__Host- / __Secure-接頭辞を確認します。Cookie値は直ちに破棄して一覧・JSONコピーに含めません。Cookieは保存・送信しません。

ファイル入力は **8 MiB上限**で8 MiBまでを一度だけ読み込み、処理は中止・タイムアウト可能な同一オリジンWorkerに分離します。UAは8 KiB、Set-Cookieは64 KiB・最大64ヘッダー、SRIの16進入力は64Ki文字までに制限します。いずれも入力・結果をURL/Storageへ格納せず、利用者の操作なしに外部へ送信しません。ライブラリ追加なし、5言語のVapor UIと静的ガイドに対応します。

### 即時・自動・手動の反映

Linux 権限計算は入力に即時反映します。八進モードと権限チェックを相互変換し、setuid・setgid・sticky、明示した対象への symbolic 式、作成時の umask を別々に確認できます。GNU/Linux 用の例示 chmod をコピーできますが実行はしません。対応記法・ディレクトリの特殊ビット・上限は [権限計算の仕様](docs/chmod.md) を参照してください。

| 処理                                | 反映方法                                                           |
| ----------------------------------- | ------------------------------------------------------------------ |
| Linux 権限・CIDR・URL・コントラスト | 入力に即時反映                                                     |
| JSON・Unicode・.env・EXPLAIN・Base64 | 入力合計 8,192 UTF-16 コード単位以下は即時、それを超えると遅延適用 |
| CSV・ログ・集合演算・HAR            | Worker 起動を含むため遅延適用                                      |

遅延適用は、入力や処理オプションの変更が止まってから **800ms 後**に実行します。「今すぐ適用」ボタンのバーと残り秒数で待ち時間が分かり、ボタンを押せば待たずに処理します。「自動適用」をオフにすると遅延処理は手動のみになります。この設定は画面共通でブラウザに保存します。即時反映の軽い処理には影響しません。

入力変更時は古い結果をすぐに破棄し、実行中の Worker を中止します。手動適用は予約済みの自動実行を取り消すため二重実行されません。中止後は次の編集または手動適用まで再実行せず、画面移動時には予約タイマーも破棄します。バーは**自動適用までの待ち時間**を示し、解析処理の進捗率ではありません。

VueUse 15 の `useDebounceFn` と `useIntervalFn` を [共通実行処理](src/composables/useToolExecution.ts) で使用しています。入力途中の JSON や正規表現を繰り返し解析しないよう、一定間隔で実行する throttle ではなく、最後の入力から待つ debounce を採用しました。

### 計算の扱いと上限

- CSV・ログ・集合演算・HAR は **Web Worker 内の Rust / WASM** で実行し、キャンセルと最大 30 秒の処理制限を設けています。入力は合計最大 16 MiB、最大 100,000 行または HAR エントリー。CSV は最大 256 列です。プレビューやユニーク値の保持上限に達した場合は、その旨を表示します。
- HAR は **1.2** の `log.entries` を解析します。応答サイズは `headersSize + bodySize` の両方が判明する分だけ合計し、不明件数を別に表示します。ホスト・メディアタイプ別は件数上位 20 グループ、遅いリクエストは上位 20 件です。並行通信の所要時間をページ読み込み時間とみなさず、記録された URL へアクセスしません。
- .env は各入力 **256 KiB / 10,000 行 / 2,000 定義**まで。コメント、任意の `export`、単一・二重引用符の複数行値に対応する限定的な dotenv 形式です。変数展開やシェル実行は行いません。重複は最後の有効な定義を使い、不正な行がある場合は比較が不完全であることを示します。
- URL は **16 KiB / クエリ 200 項目**まで。ホストを持つ絶対 URL を WHATWG URL パーサーで解析し、クエリの順序・重複・`=` のないフラグを保って編集します。相対・opaque URL、制御文字、不正なクエリエンコードは拒否します。URL を開く処理はありません。
- EXPLAIN は PostgreSQL の **FORMAT JSON** を受け付け、**512 KiB / JSON 深さ 64 / 計画ノード 1,000 / 20 文**までです。SQL は実行しません。actual rows と actual time はループあたりの値として表示し、親の時間に含まれる子の時間を合算しません。未知フィールドの大きな数値は字句のまま読み、表示・計算対象の指標で精度を確認します。
- CIDR は BigInt で計算し、`::/0` の `2^128` 個も正確な十進文字列で表示します。IPv4 `/31` はポイントツーポイント、`/32` は単一アドレスとして扱います。IPv6 にブロードキャストや一律の「使用可能ホスト数」は設定しません。
- JSON は各入力最大 **512 KiB / 深さ 64**、結果は最大 2,000 変更です。重複キーと、JavaScript の数値へ変換すると精度が失われる値を拒否します。大きな ID は文字列として扱ってください。差分のパスは JSON Pointer 形式です。
- Unicode は最大 **512 KiB**。全入力を集計し、検出行は最大 1,000 件、可視化プレビューは最大 20,000 文字です。検出された文字は言語や絵文字に必要な場合があり、自動削除はしません。
- コントラスト判定は `#RGB` / `#RRGGBB` を受け付け、丸める前の比率で判定します。
- Base64 は UTF-8 テキストに限定した RFC 4648 変換で、入力上限 **256 KiB**。標準形式と URL-safe 形式のアルファベットを区別し、不正な UTF-8 や孤立した UTF-16 サロゲートを拒否します。長い入力は専用 Worker で処理します。

詳細な数値の意味、切り詰め条件、対応しない入力は [計算仕様](docs/devtoys-coverage.md#calculation-semantics-and-limits) と実装内の型定義を参照してください。ログの正規表現には Rust の `regex` 構文を使い、先読み・後読み・後方参照は対応しません。

## データと通信

入力と処理結果はメモリ内に保持します。ツールを切り替えるかページを再読み込みすると破棄されます。入力を URL、リクエスト本文、Cookie、localStorage、sessionStorage に書き込みません。アクセス解析、外部 API、実行時のフォント CDN は使用しません。

一方、サイトを表示するための **HTML・JavaScript・CSS・WASM・画像・フォントの通常の GET** は GitHub Pages に発生します。フォントは言語と表示文字の範囲に応じて、あらかじめ生成した固定 URL のファイルを読み込みます。入力文面を送るサブセット API はありません。サイトと未取得の追加アセットを読み込むには接続が必要です。ソースやライセンスのリンクは、利用者が選んだときに開きます。

ブラウザへの保存は `army-knife:preferences:v1` という localStorage キーの次の項目だけです。

| 項目           | 内容                                                        |
| -------------- | ----------------------------------------------------------- |
| `version`      | 設定データの形式。現在は `1`                                |
| `locale`       | UI 言語                                                     |
| `theme`        | `light` / `dark` / `system`                                 |
| `enabledTools` | 有効な既知のツール ID                                       |
| `favorites`    | お気に入りの既知のツール ID                                 |
| `knownTools`   | その版で利用可能だったツール ID。追加ツールの設定移行に使用 |
| `autoApply`    | 遅延処理を自動で適用するか。初期値は `true`                 |

以前の設定を読み込むと、新しい補完ツールを有効にし、既存ツールの無効設定・お気に入り・テーマ・言語を維持します。意図的に全ツールをオフにした設定はそのまま維持します。新しい DevToys 重複ツールを自動で有効にすることはありません。

ストレージが使えない場合も、設定をメモリ内で扱って動作します。アプリには同一オリジンのアセットだけを許す CSP を設定し、CI では入力マーカーの通信への混入、外部リクエスト、WebSocket、入力のストレージ保存を検査します。具体的な検査範囲は [Testing and deployment](docs/testing.md) に記載しています。

## 言語とフォント

| UI 言語  | UI フォント           | 配信するコードフォント |
| -------- | --------------------- | ---------------------- |
| 日本語   | Noto Sans JP Variable | Army Knife Mono J      |
| English  | Noto Sans Variable    | Army Knife Mono J      |
| 简体中文 | Noto Sans SC Variable | Army Knife Mono SC     |
| 繁體中文 | Noto Sans TC Variable | Army Knife Mono TC     |
| 한국어   | Noto Sans KR Variable | Army Knife Mono K      |

コードフォントは Sarasa Mono の地域別書体をもとに、**Army Knife Mono** という別の内部名へ変更した WOFF2 サブセットです。英語は J のラテン文字部分を共有します。元の文字範囲を保つよう分割し、CSS の `unicode-range` で必要なファイルを配信します。各言語向けのシステムフォントと汎用フォントもフォールバックに指定しています。

フォントはアプリの MIT ライセンスとは別に **SIL Open Font License 1.1** で配布します。原文の著作権・ライセンス、Reserved Font Name、改変後の命名を扱い、チェックサムを固定したソースから生成・検証します。方式、制約、配信ファイルの検査は [フォント設計](docs/fonts.md)、帰属は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。

## 開発環境のセットアップ

### Vue 3.6 RC と Vapor

Vue と関連コンパイラー・テスト用 server renderer は **3.6.0-rc.11** にそろえて固定しています。アプリのシェルと設定ダイアログは VDOM、すべてのツール画面と共通入出力部品は `<script setup vapor>` です。`vaporInteropPlugin` で既存 shadcn-vue / Reka UI と相互運用します。

vue-i18n 11 の `useI18n()` は VDOM のコンポーネントインスタンスを前提とするため、Vapor 内では [useAppI18n](src/i18n/useAppI18n.ts) からアプリ共通のリアクティブな Composer を利用します。ローカルスコープの翻訳や `$t` への依存はありません。

`pnpm verify:vapor` は実際のツール SFC が Vapor にコンパイルされることを検査し、本番コンパイルしたフィクスチャを DOM 環境で実行して、非同期コンポーネント、props・events・slots、入力、5 言語、破棄・再マウントを確認します。RC の更新時にもこの検査とブラウザテストを通してください。設計上 VDOM と相互運用ランタイムも配信するため、アプリ全体が Vapor 単独の最小ランタイムになる構成ではありません。

一次資料: [Vue 3.6 RC / Vapor の相互運用](https://github.com/vuejs/core/releases/tag/v3.6.0-rc.1)、[採用 RC](https://github.com/vuejs/core/releases/tag/v3.6.0-rc.11)、[vue-i18n の Vapor 対応状況](https://github.com/intlify/vue-i18n/issues/2234)。

CI と同じ基準は Node.js **24.19.0**、pnpm **11.25.0**、Rust **1.99.0**、Python **3.12.12** です。Git、rustup、Python の venv を利用できる環境を用意してください。

Vite+ **1.1.0** はプロジェクトの依存に固定されています。以下の `pnpm` スクリプトはローカルの `vp` を呼ぶため、グローバル CLI のインストールは必須ではありません。[Vite+ の公式説明](https://viteplus.dev/guide/local-cli) も参照できます。

以下は Linux / macOS 向けのコマンドです。

```sh
git clone https://github.com/H4M4CHi-ttr/army-knife.git
cd army-knife
pnpm install --frozen-lockfile

rustup toolchain install 1.99.0 --profile minimal --component clippy --target wasm32-unknown-unknown
export RUSTUP_TOOLCHAIN=1.99.0
cargo install wasm-bindgen-cli --version 0.2.129 --locked
pnpm build:wasm

python3.12 -m venv .cache/font-venv
. .cache/font-venv/bin/activate
python -m pip install --requirement scripts/requirements-fonts.txt
pnpm build:fonts
python scripts/build-fonts.py --check

pnpm dev
```

開発サーバーに表示された URL の `/army-knife/` を開きます。通常は `http://localhost:5173/army-knife/` です。Windows のフォント生成手順は [フォント設計](docs/fonts.md#building) にあります。

初回のフォント生成では大きなソースアーカイブを取得します。以後は `.cache/fonts/` と `public/fonts/` を検証して再利用します。これらのダウンロードはビルド時に行われ、利用者の入力を含みません。Rust を変更したら `pnpm build:wasm`、フォントのロックや生成処理を変更したら `pnpm build:fonts` を再実行してください。生成した WASM・フォントは Git にコミットせず、CI でも生成します。

## ビルドと品質検証

WASM とフォントを生成した状態で、以下を実行します。

```sh
cargo test --manifest-path crates/army-knife-core/Cargo.toml --locked
cargo clippy --manifest-path crates/army-knife-core/Cargo.toml --all-targets --locked -- -D warnings
pnpm test:wasm
pnpm typecheck
pnpm test
pnpm verify:vapor
pnpm build
pnpm verify:dist
```

`pnpm test` は Vite+ のテストランナーで、計算処理、設定保存・移行、自動・手動適用、Vue アプリの統合、Worker 制御などを確認します。`test:wasm` は実際にコンパイルされた WASM を読み込んで実行します。`verify:vapor` は Vapor の実コンパイルと相互運用、`verify:dist` は公開ディレクトリのアセット参照、CSP、WASM、フォント、ライセンスを検査します。

production build のブラウザ検査は次のコマンドです。

```sh
pnpm exec playwright install --with-deps chromium firefox
pnpm test:e2e
```

Chromium / Firefox × desktop / small の 4 プロジェクトが、`127.0.0.1:4173/army-knife/` の専用プレビューを起動して検査します。実 WASM、各言語の実フォント、設定、キーボード操作、モバイル幅、データを送信しないことを対象にしています。通常のプレビューは `pnpm preview` で起動できます。

GitHub Actions でも同じ品質ゲートを実行し、ブラウザ検査を実行した run は成功時も HTML レポートとレビュー用スクリーンショットを artifact に保存します。失敗時は trace も保存します。現在の実行結果はリポジトリの **Actions** で確認してください。

## GitHub Pages への公開

1. リポジトリの **Settings → Pages** を開きます。
2. **Build and deployment → Source** を **GitHub Actions** に設定します。
3. `main` に変更を push するか、**Actions → Test and deploy Pages → Run workflow** で `main` を選択します。
4. quality と deploy の両ジョブが成功したら、deployment の出力 URL を開きます。

[ワークフロー](.github/workflows/ci.yml) は pull request・`main` への push・手動実行でテストします。**成功した `main` の production build だけを Pages に渡します。** PR や他のブランチからは公開しません。Pages が未設定の場合は設定を自動変更せず、デプロイ段階で失敗します。

Pages 用のベースパスは `/army-knife/` です。各ツールは `/army-knife/ja/tools/cidr/` のような通常 URL で直接開けます。5 言語それぞれの実 HTML に説明・使い方・例があり、同じページでツールを操作できます。旧 `#/tool/cidr` リンクも対応する通常ページへ移動します。無効にしたツールは説明だけ閲覧でき、操作には設定での有効化が必要です。[URL・静的生成の設計](docs/static-pages.md)、[GitHub の公式手順](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) と [CI の詳細](docs/testing.md#pages-deployment-and-permissions) を参照してください。

## ドキュメントとライセンス

- [DevToys との重複方針・計算仕様](docs/devtoys-coverage.md)
- [多言語フォントの生成・配信・ライセンス](docs/fonts.md)
- [Vue 3.6 RC・Vapor の構成と互換性](docs/vapor.md)
- [テスト・レビュー用 artifact・Pages デプロイ](docs/testing.md)
- [ショートカット調査のデータ・入力・出典](docs/shortcuts.md)
- [アプリケーションの MIT ライセンス](LICENSE)
- [第三者ソフトウェアとフォントの帰属](THIRD_PARTY_NOTICES.md)

本プロジェクトは DevToys の独立した補完ツールで、DevToys の公式配布物ではありません。
