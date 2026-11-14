<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { PG_TEXT_ARRAY_LIMITS, decodePgTextArray, encodePgTextArray } from "@/lib/tools/pg-text-array";
import { PG_TEXT_ARRAY_SAMPLE, PG_TEXT_ARRAY_SAMPLE_JSON } from "@/lib/tools/pg-text-array-sample";

const { t } = useAppI18n();
const mode = ref<"decode" | "encode">("decode");
const input = ref(""), rejected = ref(false), revision = ref(0);
const source = computed(() => ({ input: input.value, mode: mode.value, rejected: rejected.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(input.value) && !rejected.value,
  mode: () => input.value.length <= PG_TEXT_ARRAY_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => mode.value === "decode" ? decodePgTextArray(input.value) : encodePgTextArray(input.value),
});
const outputs = computed(() => {
  if (!result.value) return [];
  const json = { id: "json", label: "pgArray.jsonOutput", value: result.value.json, filename: "army-knife-pg-text-array.json", mime: "application/json;charset=utf-8" };
  const array = { id: "array", label: "pgArray.arrayOutput", value: result.value.array, filename: "army-knife-pg-text-array-value.txt", mime: "text/plain;charset=utf-8" };
  return mode.value === "decode" ? [json, array] : [array, json];
});
const items = computed(() => result.value?.values.slice(0, PG_TEXT_ARRAY_LIMITS.previewItems).map((value, i) => ({ position: i + 1, kind: value === null ? "pgArray.null" : "pgArray.string", value: JSON.stringify(value) })) ?? []);
function replace(example: boolean) {
  revision.value++; rejected.value = false;
  input.value = example ? (mode.value === "decode" ? PG_TEXT_ARRAY_SAMPLE : PG_TEXT_ARRAY_SAMPLE_JSON) : "";
}
function changeMode(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value !== "decode" && value !== "encode") return;
  mode.value = value; replace(false);
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="pg-array-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="pg-array-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div class="pg-array-mode">
      <label for="pg-array-mode">{{ t("pgArray.mode") }}</label>
      <select id="pg-array-mode" class="native-select" :value="mode" @change="changeMode">
        <option value="decode">{{ t("pgArray.decode") }}</option>
        <option value="encode">{{ t("pgArray.encode") }}</option>
      </select>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t(mode === 'decode' ? 'pgArray.arrayInput' : 'pgArray.jsonInput')" input-id="pg-text-array-input" :rows="5" :preserve-bom="true" :preserve-carriage-returns="mode === 'decode'" :max-bytes="PG_TEXT_ARRAY_LIMITS.inputBytes" :placeholder="mode === 'decode' ? PG_TEXT_ARRAY_SAMPLE : PG_TEXT_ARRAY_SAMPLE_JSON" @update:model-value="input = $event; rejected = false" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.pg-text-array.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="pg-array-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice pg-array-scope">{{ t("pgArray.scope") }}</p>
  <p class="hint">{{ t("pgArray.grammar") }}</p>
  <p class="hint">{{ t("pgArray.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("pgArray.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="pg-array-result">
    <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
    <dl class="pg-array-totals">
      <div><dt>{{ t("pgArray.itemCount") }}</dt><dd data-testid="pg-array-count">{{ result.values.length }}</dd></div>
      <div><dt>{{ t("pgArray.nullCount") }}</dt><dd data-testid="pg-array-nulls">{{ result.nullCount }}</dd></div>
      <div><dt>{{ t("pgArray.emptyCount") }}</dt><dd data-testid="pg-array-empty">{{ result.emptyCount }}</dd></div>
    </dl>
    <p v-if="result.dimensions === 0" class="hint" data-testid="pg-array-zero-dim">{{ t("pgArray.zeroDimensions") }}</p>
    <section v-for="output in outputs" :key="output.id" class="pg-array-output" :data-testid="'pg-array-' + output.id">
      <div class="result-header">
        <h3>{{ t(output.label) }}</h3>
        <OutputActions :text="output.value" :filename="output.filename" :type="output.mime" />
      </div>
      <pre><code>{{ output.value }}</code></pre>
    </section>
    <div v-if="items.length" class="table-scroll" tabindex="0" role="region" :aria-label="t('pgArray.preview', { shown: items.length, total: result.values.length })">
      <table class="data-table">
        <caption>{{ t("pgArray.preview", { shown: items.length, total: result.values.length }) }}</caption>
        <thead><tr><th scope="col">{{ t("pgArray.position") }}</th><th scope="col">{{ t("pgArray.kind") }}</th><th scope="col">{{ t("pgArray.value") }}</th></tr></thead>
        <tbody><tr v-for="item in items" :key="item.position" data-testid="pg-array-item"><td>{{ item.position }}</td><td>{{ t(item.kind) }}</td><td><code>{{ item.value }}</code></td></tr></tbody>
      </table>
    </div>
    <p class="hint">{{ t("pgArray.exportHelp") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.pg-array-mode { display: flex; flex-wrap: wrap; align-items: center; gap: .7rem; margin-bottom: 1rem; font-size: .9rem; }
.pg-array-mode select { max-width: 100%; }
.pg-array-scope { margin-top: 1rem; }
.pg-array-totals { display: flex; flex-wrap: wrap; gap: 1rem 2rem; margin-block: 1rem; }
dt { font-size: .8rem; color: var(--muted-foreground); }
dd { margin: .3rem 0 0; font-family: var(--font-mono); font-size: 1.2rem; }
h3 { font-size: .95rem; font-weight: 600; }
.pg-array-output { margin-block: 1.2rem; min-width: 0; }
pre { padding: .8rem; border: 1px solid var(--border); border-radius: .5rem; }
pre, code { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
table { width: 100%; table-layout: fixed; }
caption { text-align: start; padding-block: .6rem; color: var(--muted-foreground); font-size: .85rem; }
th:first-child { width: 22%; }
th:nth-child(2) { width: 23%; }
td { overflow-wrap: anywhere; vertical-align: top; }
</style>
