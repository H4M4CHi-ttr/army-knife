import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/army-knife/",
  plugins: [
    vue(),
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
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    target: "es2022",
    sourcemap: true,
    license: { fileName: "licenses/javascript-dependencies.md" },
  },
  worker: { format: "es" },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "happy-dom",
    restoreMocks: true,
    clearMocks: true,
  },
});
