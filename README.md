# Army Knife

DevToys を補完する、ブラウザ内で動く開発者向けツール集です。入力したテキストやファイルをサーバーに送信せず、GitHub Pages の静的ファイルだけで処理します。

**Vite+ / Vue 3 / shadcn-vue / Rust → WebAssembly** を使用。ライト・ダーク・システムテーマと、日本語・English・简体中文・繁體中文・한국어に対応しています。

公開先は [H4M4CHi-ttr.github.io/army-knife/](https://h4m4chi-ttr.github.io/army-knife/) です。初回は [Pages の設定](#github-pages-への公開) とデプロイの完了が必要です。

## ツール

| ツール                 | 主な機能                                                           | 処理                | 初期状態 |
| ---------------------- | ------------------------------------------------------------------ | ------------------- | -------- |
| CSV プロファイラー     | CSV / TSV の列型、空欄、ユニーク値、サンプル、列数の不揃いを確認   | Rust / WASM         | オン     |
| ログエクスプローラー   | 正規表現で絞り込み、ログレベルと同一行の出現回数を集計             | Rust / WASM         | オン     |
| CIDR 計算              | IPv4 / IPv6 のネットワーク、マスク、範囲、正確なアドレス数を表示   | TypeScript / BigInt | オン     |
| Unicode インスペクター | 不可視文字、双方向制御文字、結合子などの位置とコードポイントを確認 | TypeScript          | オン     |
| JSON 構造比較          | オブジェクトのキー順を無視し、配列順を保って追加・削除・変更を表示 | TypeScript          | オン     |
| リスト集合演算         | 共通、和、片側のみ、対称差。重複・空行・大文字小文字の扱いを指定   | Rust / WASM         | オフ     |
| JSON フォーマッター    | 整形、圧縮、構文検証                                               | TypeScript          | オフ     |
| コントラストチェック   | 不透明な sRGB 2 色の WCAG 2.x AA / AAA 達成判定                    | TypeScript          | オフ     |

DevToys と重なる機能は **設定から明示的に有効にするまで表示・起動されません**。以前の DevToys に含まれていたコントラスト機能も保守的にオフにしています。比較対象と判断根拠は [DevToys overlap policy](docs/devtoys-coverage.md) に記載しています。

入力欄への貼り付け、UTF-8 ファイルの読み込み、用意されたサンプルを利用できます。結果のコピーとダウンロードはボタンを押したときに行います。CSV・ログは解析レポートの JSON、集合演算は全結果のテキストをダウンロードします。

### 計算の扱いと上限

- CSV・ログ・集合演算は **Web Worker 内の Rust / WASM** で実行し、キャンセルと最大 30 秒の処理制限を設けています。入力は合計最大 16 MiB、最大 100,000 行。CSV は最大 256 列です。プレビューやユニーク値の保持上限に達した場合は、その旨を表示します。
- CIDR は BigInt で計算し、`::/0` の `2^128` 個も正確な十進文字列で表示します。IPv4 `/31` はポイントツーポイント、`/32` は単一アドレスとして扱います。IPv6 にブロードキャストや一律の「使用可能ホスト数」は設定しません。
- JSON は各入力最大 **512 KiB / 深さ 64**、結果は最大 2,000 変更です。重複キーと、JavaScript の数値へ変換すると精度が失われる値を拒否します。大きな ID は文字列として扱ってください。差分のパスは JSON Pointer 形式です。
- Unicode は最大 **512 KiB**。全入力を集計し、検出行は最大 1,000 件、可視化プレビューは最大 20,000 文字です。検出された文字は言語や絵文字に必要な場合があり、自動削除はしません。
- コントラスト判定は `#RGB` / `#RRGGBB` を受け付け、丸める前の比率で判定します。

詳細な数値の意味、切り詰め条件、対応しない入力は [計算仕様](docs/devtoys-coverage.md#calculation-semantics-and-limits) と実装内の型定義を参照してください。ログの正規表現には Rust の `regex` 構文を使い、先読み・後読み・後方参照は対応しません。

## データと通信

入力と処理結果はメモリ内に保持します。ツールを切り替えるかページを再読み込みすると破棄されます。入力を URL、リクエスト本文、Cookie、localStorage、sessionStorage に書き込みません。アクセス解析、外部 API、実行時のフォント CDN は使用しません。

一方、サイトを表示するための **HTML・JavaScript・CSS・WASM・画像・フォントの通常の GET** は GitHub Pages に発生します。フォントは言語と表示文字の範囲に応じて、あらかじめ生成した固定 URL のファイルを読み込みます。入力文面を送るサブセット API はありません。サイトと未取得の追加アセットを読み込むには接続が必要です。ソースやライセンスのリンクは、利用者が選んだときに開きます。

ブラウザへの保存は `army-knife:preferences:v1` という localStorage キーの次の項目だけです。

| 項目           | 内容                         |
| -------------- | ---------------------------- |
| `version`      | 設定データの形式。現在は `1` |
| `locale`       | UI 言語                      |
| `theme`        | `light` / `dark` / `system`  |
| `enabledTools` | 有効な既知のツール ID        |
| `favorites`    | お気に入りの既知のツール ID  |

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
pnpm build
pnpm verify:dist
```

`pnpm test` は Vite+ のテストランナーで、計算処理、設定保存、Vue アプリの統合、Worker 制御などを確認します。`test:wasm` は実際にコンパイルされた WASM を読み込んで実行します。`verify:dist` は公開ディレクトリのアセット参照、CSP、WASM、フォント、ライセンスを検査します。

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

Pages 用のベースパスは `/army-knife/`、ツールのルーティングは `#/tool/cidr` のような hash 形式です。[GitHub の公式手順](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) と [CI の詳細](docs/testing.md#pages-deployment-and-permissions) を参照してください。

## ドキュメントとライセンス

- [DevToys との重複方針・計算仕様](docs/devtoys-coverage.md)
- [多言語フォントの生成・配信・ライセンス](docs/fonts.md)
- [テスト・レビュー用 artifact・Pages デプロイ](docs/testing.md)
- [アプリケーションの MIT ライセンス](LICENSE)
- [第三者ソフトウェアとフォントの帰属](THIRD_PARTY_NOTICES.md)

本プロジェクトは DevToys の独立した補完ツールで、DevToys の公式配布物ではありません。
