import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/army-knife/",
  plugins: [
    // Opt in per SFC with <script setup vapor>. The app shell and shadcn-vue
    // components retain their VDOM runtime and cross via vaporInteropPlugin.
    vue({ features: { vapor: false } }),
    tailwindcss(),
    {
      name: "army-knife-project-notices",
      apply: "build",
      generateBundle() {
        for (const [source, fileName] of [
          ["LICENSE", "LICENSE.txt"],
          ["THIRD_PARTY_NOTICES.md", "THIRD_PARTY_NOTICES.md"],
          ["licenses/shadcn-vue-MIT.txt", "licenses/shadcn-vue-MIT.txt"],
          ["node_modules/tailwindcss/LICENSE", "licenses/tailwindcss-MIT.txt"],
        ]) {
          this.emitFile({
            type: "asset",
            fileName,
            source: readFileSync(new URL(source, import.meta.url), "utf8"),
          });
        }
      },
    },
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["vue"],
  },
  build: {
    target: "es2022",
    sourcemap: true,
    license: { fileName: "licenses/javascript-dependencies.md" },
  },
  worker: { format: "es" },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "happy-dom",
    // Vue's Node/CJS entry omits Vapor. Share its complete browser runtime
    // with Test Utils and every Vue consumer for these DOM integration tests.
    alias: [
      {
        find: /^vue$/,
        replacement: fileURLToPath(
          import.meta.resolve("vue/dist/vue.runtime-with-vapor.esm-browser.js"),
        ),
      },
      {
        find: /^@vue\/test-utils$/,
        replacement: fileURLToPath(
          new URL(
            "./dist/vue-test-utils.esm-bundler.mjs",
            import.meta.resolve("@vue/test-utils/package.json"),
          ),
        ),
      },
      {
        find: /^@lucide\/vue$/,
        replacement: fileURLToPath(
          new URL("./dist/esm/lucide-vue.mjs", import.meta.resolve("@lucide/vue/package.json")),
        ),
      },
    ],
    server: {
      deps: {
        inline: [
          "vue",
          "@vue/test-utils",
          "vue-i18n",
          "@vueuse/core",
          "@vueuse/shared",
          "@lucide/vue",
          "reka-ui",
          "@floating-ui/vue",
          "@tanstack/vue-virtual",
        ],
      },
    },
    restoreMocks: true,
    clearMocks: true,
  },
});
