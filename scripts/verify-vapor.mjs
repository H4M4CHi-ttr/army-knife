/** Production compiler and DOM interop regression gate; no server or browser. */
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import { parse, compileScript } from "vue/compiler-sfc";
import { Window } from "happy-dom";
import { LOCALES } from "../src/lib/locales.ts";
import { messages } from "../src/i18n/messages.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = (relative) => fileURLToPath(new URL(`../${relative}`, import.meta.url));
const vaporSources = [
  ...(await readdir(sourcePath("src/components/tools")))
    .filter((filename) => filename.endsWith(".vue"))
    .sort()
    .map((filename) => `src/components/tools/${filename}`),
  "src/components/ApplyControl.vue",
  "src/components/CodeInput.vue",
  "src/components/OutputActions.vue",
  "src/components/EmptyResult.vue",
];

// Keep real application views opted in, not just an isolated demonstration.
for (const filename of vaporSources) {
  const { descriptor, errors } = parse(await readFile(sourcePath(filename), "utf8"), {
    filename: sourcePath(filename),
  });
  assert.deepEqual(errors, [], `${filename}: SFC parsing failed`);
  assert.equal(descriptor.vapor, true, `${filename} must opt into Vapor`);
  const result = compileScript(descriptor, {
    id: filename,
    isProd: true,
    inlineTemplate: true,
    vapor: true,
  });
  assert.match(result.content, /defineVaporComponent/, `${filename}: missing Vapor output`);
}

let transformedProbe = "";
const result = await build({
  configFile: false,
  root,
  publicDir: false,
  logLevel: "error",
  resolve: { alias: { "@": sourcePath("src") }, dedupe: ["vue"] },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  plugins: [
    vue({ features: { vapor: false } }),
    {
      name: "inspect-vapor-fixture",
      enforce: "post",
      transform(code, id) {
        // Vite normalizes module IDs to forward slashes, including on Windows.
        if (
          id.split("?")[0].replaceAll("\\", "/") ===
          sourcePath("tests/fixtures/vapor/VaporProbe.vue").replaceAll("\\", "/")
        ) {
          transformedProbe += `${code}\n`;
        }
      },
    },
  ],
  build: {
    target: "es2022",
    write: false,
    minify: false,
    lib: {
      entry: sourcePath("tests/fixtures/vapor/main.ts"),
      name: "ArmyKnifeVaporFixture",
      formats: ["iife"],
    },
  },
});

assert.match(transformedProbe, /defineVaporComponent/, "Vite+ did not compile the Vapor fixture");
assert.doesNotMatch(transformedProbe, /createElementVNode|createElementBlock|openBlock/);
const outputs = (Array.isArray(result) ? result : [result]).flatMap((entry) => entry.output);
const bundle = outputs.find((entry) => entry.type === "chunk" && entry.isEntry);
assert.ok(bundle, "The fixture must produce a runnable production bundle");

const window = new Window({
  url: "https://h4m4chi-ttr.github.io/army-knife/",
  settings: {
    // This evaluates only the checked-in fixture bundle, never application input.
    enableJavaScriptEvaluation: true,
    suppressInsecureJavaScriptEnvironmentWarning: true,
    disableCSSFileLoading: true,
    disableJavaScriptFileLoading: true,
    disableIframePageLoading: true,
  },
});
const diagnostics = [];
window.console.warn = (...args) => diagnostics.push(args.join(" "));
window.console.error = (...args) => diagnostics.push(args.join(" "));
window.fetch = () => Promise.reject(new Error("The Vapor fixture must not access the network"));
window.document.body.innerHTML = '<div id="fixture"></div>';

try {
  window.eval(bundle.code);
  const probe = window.__armyKnifeVaporProbe;
  assert.ok(probe, "The production runtime did not initialize");
  assert.equal(probe.version, "3.6.0-rc.11");
  const element = (selector) => {
    const value = window.document.querySelector(selector);
    assert.ok(value, `Missing fixture element: ${selector}`);
    return value;
  };
  const text = (selector) => element(selector).textContent;
  const flush = async () => {
    await probe.tick();
    await probe.tick();
  };
  // Bound the asynchronous loader without relying on a development server.
  let timer;
  try {
    await Promise.race([
      probe.ready,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Async Vapor mount failed: ${probe.errors}`)),
          5000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
  await flush();
  assert.equal(text("[data-mounts]"), "1");
  assert.equal(text("[data-parent-slot]"), "VDOM slot: initial");

  element("[data-parent-update]").click();
  await flush();
  assert.equal(element("[data-probe-input]").value, "parent update");
  assert.equal(text("[data-parent-label]"), "Updated label");

  for (const [selector, value] of [
    ["[data-probe-input]", "input edit"],
    ["[data-probe-textarea]", "textarea edit"],
  ]) {
    const input = element(selector);
    input.value = value;
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    await flush();
  }
  assert.equal(text("[data-parent-value]"), "input edit");
  assert.equal(text("[data-probe-value]"), "input edit");
  assert.equal(text("[data-probe-notes]"), "textarea edit");
  assert.equal(text("[data-parent-slot]"), "VDOM slot: input edit");

  for (const locale of LOCALES) {
    const label = messages[locale]["actions.copy"];
    probe.setLocale(locale);
    await flush();
    assert.equal(element("[data-vapor-probe]").getAttribute("data-locale"), locale);
    assert.equal(text("[data-translation]"), label);
    assert.equal(text("[data-button-slot]"), `${label} 0`);
    assert.equal(element("[data-probe-input]").getAttribute("aria-label"), label);
  }

  // Keep the remaining state/disposal assertions in their original Korean locale.
  probe.setLocale("ko");
  await flush();

  element("[data-probe-apply]").click();
  await flush();
  assert.equal(text("[data-applied]"), "input edit|textarea edit|1");
  assert.equal(text("[data-button-slot]"), "복사 1");

  element("[data-parent-toggle]").click();
  await flush();
  assert.equal(window.document.querySelector("[data-vapor-probe]"), null);
  assert.equal(text("[data-disposals]"), "1");
  element("[data-parent-toggle]").click();
  await flush();
  assert.equal(text("[data-mounts]"), "2");
  assert.equal(element("[data-probe-input]").value, "input edit");
  assert.equal(element("[data-probe-textarea]").value, "");
  assert.equal(text("[data-button-slot]"), "복사 0");

  probe.unmount();
  await flush();
  assert.equal(element("#fixture").childElementCount, 0);
  assert.deepEqual([...probe.errors, ...diagnostics], []);
  console.log(
    `Vapor verified: ${vaporSources.length} application SFCs; production async interop, shadcn/Reka slots and events, Input/Textarea v-model, ${LOCALES.length} locales, VueUse state, mount/dispose/remount.`,
  );
} finally {
  await window.happyDOM.close();
}
