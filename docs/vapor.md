# Vue 3.6 RC と Vapor の構成

Army Knife 0.2.0 は、ツール画面と共通の入出力・実行コントロールを実際に Vapor でコンパイルする。アプリの外枠、設定ダイアログ、shadcn-vue の UI 部品には VDOM を使い、Vue 公式の `vaporInteropPlugin` で接続する。

## 固定バージョン

2026-10-11 に npm の公開メタデータと開発元の資料を確認した。

| 依存                    | 採用版        | 確認事項と一次資料                                                                                                                                                                                                                                     |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vue                     | `3.6.0-rc.11` | 2026-10-10 公開の RC。`vue` が同じ版のコンパイラ、VDOM/Vapor runtime を依存として指定する。[リリース](https://github.com/vuejs/core/releases/tag/v3.6.0-rc.11) / [配布メタデータ](https://registry.npmjs.org/vue/3.6.0-rc.11)                          |
| `@vitejs/plugin-vue`    | `6.0.10`      | Vue の peer 範囲に `^3.6.0-rc.10` が含まれる。SFC ごとの `vapor` 属性に対応する。[メタデータ](https://registry.npmjs.org/@vitejs/plugin-vue/6.0.10) / [変更履歴](https://github.com/vitejs/vite-plugin-vue/blob/main/packages/plugin-vue/CHANGELOG.md) |
| Vite+ / Vite core alias | `1.1.0`       | 既存の Vite プラグイン構成を維持する。`vite` は `@voidzero-dev/vite-plus-core` の同じ版へ固定する。[公式 README](https://github.com/voidzero-dev/vite-plus/blob/v1.1.0/README.md)                                                                      |
| VueUse                  | `15.0.0`      | アプリから利用する `@vueuse/core` の現行安定版。Reka UI 自身の依存範囲にある VueUse 14 系は書き換えない。[リリース](https://github.com/vueuse/vueuse/releases/tag/v15.0.0)                                                                             |
| vue-i18n                | `11.4.14`     | アプリ共通の Composer を利用する。Vapor 向けの `useI18n()` 対応は 12 系で実装され、11 系には含まれない。[開発元の説明](https://github.com/intlify/vue-i18n/issues/2234#issuecomment-5558609337)                                                        |
| Reka UI                 | `2.11.0`      | shadcn-vue の基盤。`Primitive` は `h()` で描画する VDOM 部品として利用する。[該当実装](https://github.com/unovue/reka-ui/blob/v2.11.0/packages/core/src/Primitive/Primitive.ts)                                                                        |
| vue-tsc                 | `3.3.12`      | TypeScript 6 と組み合わせる型検査用の固定版。[配布メタデータ](https://registry.npmjs.org/vue-tsc/3.3.12)                                                                                                                                               |
| `@vue/server-renderer`  | `3.6.0-rc.11` | Vue Test Utils の peer も Vue 本体と揃えるための開発依存。アプリに SSR を追加するものではない。                                                                                                                                                        |

shadcn-vue はコピーして管理する UI ソースであり、別のランタイムパッケージを追加しない。元のライセンスと出典は `THIRD_PARTY_NOTICES.md`、`licenses/shadcn-vue-MIT.txt` に保持する。Vue 関連パッケージの実際の解決版は `pnpm-lock.yaml` で固定する。

## 描画モードの境界

`src/main.ts` は次の構成を使う。

```ts
createApp(App).use(vaporInteropPlugin).use(i18n).mount("#app");
```

Vapor を使う SFC に `<script setup vapor lang="ts">` を明記する。対象は `src/components/tools/*.vue` と、`CodeInput.vue`、`OutputActions.vue`、`EmptyResult.vue`、`ApplyControl.vue`。`vite.config.ts` の `features.vapor: false` は一括変換を無効にする指定であり、明示された SFC の Vapor コンパイルは有効になる。

Vue 公式の [RC 導入説明](https://github.com/vuejs/core/releases/tag/v3.6.0-rc.1) は、既存アプリへの部分導入と描画モードの領域分けを推奨している。props・events・slots は相互運用できる一方、VDOM 部品ライブラリとの全組み合わせの互換性は保証されていない。Army Knife で使う組み合わせは本番コンパイル検証と実アプリのテストで確認する。

`createVaporApp()` による VDOM runtime を含まない最小構成は採用していない。現在の構成には shadcn-vue / Reka UI の VDOM 部品があるため、Vapor への移行だけを根拠に bundle の縮小率や性能向上率を主張しない。

## 翻訳と composable

Vapor では `getCurrentInstance()` が `null` になり、`app.config.globalProperties` も利用できない。vue-i18n 11 の `useI18n()` を Vapor SFC で直接呼ばず、`src/i18n/useAppI18n.ts` を使う。

```ts
export function useAppI18n() {
  return { t: i18n.global.t, locale: i18n.global.locale };
}
```

`locale` は ref のまま返す。`t()` が実行される Vapor の描画 effect から Composer の locale を追跡するので、アプリの言語を変更すると既存画面と VDOM の子部品へ渡す slot・属性も更新される。このヘルパーは、このアプリで共通のメッセージ集合を使うためのもの。コンポーネントローカルのメッセージ、親 Composer の自動探索、複数アプリ間の Composer 共有には使わない。

VueUse は関数ごとに依存する Vue API が異なる。例えば 15.0.0 の [`tryOnMounted`](https://github.com/vueuse/vueuse/blob/v15.0.0/packages/shared/tryOnMounted/index.ts) は VDOM instance を前提とする分岐を残している。Vapor の component lifecycle には Vue 標準の `onMounted` / `onScopeDispose` を使い、instance を暗黙に必要とする composable を追加する場合は動作を確認する。実行予約には `useDebounceFn` / `useIntervalFn` を利用し、破棄時に予約と時計を明示的に停止する。

また、Vapor は適用可能な DOM イベントを `document` に委譲する。祖先で `stopPropagation()` すると届かないイベントがあるため、UI 部品の境界に不要な伝播停止を追加しない。slot は実際の描画を発生させるので、`slots.default()` を試しに呼んで中身を調べる実装も避ける。これらの制約は同じ [Vue 公式 RC 説明](https://github.com/vuejs/core/releases/tag/v3.6.0-rc.1) に記載されている。

## 回帰検証

```sh
pnpm typecheck
pnpm verify:vapor
vp test
```

`scripts/verify-vapor.mjs` は、全ツール SFC と共通部品に Vapor の指定があり、本番コンパイラが `defineVaporComponent` を生成することを確認する。その後、`tests/fixtures/vapor/` を Vite+ と本番用 Vue runtime で束ね、happy-dom にマウントする。サーバーを起動せず、`dist` や `public` に検証用ファイルを書き込まない。

検証対象は、VDOM の `defineAsyncComponent` から Vapor 子を開く動作、shadcn-vue の `Input` / `Textarea` との双方向更新、Reka `Primitive` を含む `Button` の slot とクリック、VDOM 親から渡した slot、全 5 言語の切替、VueUse の状態更新、mount・破棄・再マウントである。検証中の入力からネットワークを利用することはなく、WASM の成功結果を作り物で置き換えない。

`vp test` の DOM 統合テストでは、`vite.config.ts` の `test.alias` で Vue 公式の `vue.runtime-with-vapor.esm-browser.js` を共有する。RC.11 の Node / CommonJS 用入口には Vapor renderer がなく、その入口とブラウザ向け runtime を混ぜると `vaporInteropPlugin` や内部 renderer の参照が一致しないためである。Vue Test Utils と Lucide も ESM の入口を明示し、Vue を使う依存を Vitest の module runner で処理することで、アプリ・UI 部品・テストが同じ Vue runtime を使う。これはテスト用の解決設定であり、本番は通常の ESM bundler 入口を使う。上記の本番コンパイル検証は、それとは独立して本番の runtime と最適化後の相互運用を検証する。入口の定義は [Vue の配布設定](https://github.com/vuejs/core/blob/v3.6.0-rc.11/packages/vue/package.json)、依存の inline 処理は [Vitest の設定資料](https://vitest.dev/config/server#deps-inline) を参照できる。

`src/App.test.ts` は実アプリと実際の TypeScript ツールをマウントし、小さい入力の即時反映、大きな JSON 入力の 800 ms 待機、手動実行への切替、古い結果の破棄、画面移動による WASM 実行予約の取消しを確認する。URL は、入力上限内の日本語クエリーがパーセントエンコードで出力上限を超えた後でも、値の短縮・削除で修復できることを確認する。WASM の演算結果そのものは Rust テスト・実 WASM テスト・ブラウザ E2E で検証する。

happy-dom はブラウザの描画・フォント・アクセシビリティの確認を代替しない。GitHub Actions では、実際の Rust/WASM と配布アセットを含むアプリを構築したうえで Chromium / Firefox の E2E テストを実行する。
