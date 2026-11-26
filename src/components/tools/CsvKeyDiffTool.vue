<script setup vapor lang="ts">
import { computed, ref, shallowRef } from "vue";
import ApplyControl from "@/components/ApplyControl.vue";
import CodeInput from "@/components/CodeInput.vue";
import { Button } from "@/components/ui/button";
import { useToolExecution } from "@/composables/useToolExecution";
import { useAppI18n } from "@/i18n/useAppI18n";
import { downloadText } from "@/lib/io";
import {
  compareCsvKeys, csvDiffHeadings, CSV_DIFF_LIMITS, CSV_DIFF_SIDES,
  type CsvDiffInput, type CsvDiffSide, type CsvDiffTable,
} from "@/lib/tools/csv-key-diff";
import { CSV_KEY_DIFF_SAMPLE } from "@/lib/tools/csv-key-diff-sample";
import { ToolError } from "@/lib/tools/errors";
import { runInspectorWorker } from "@/lib/tools/inspector-worker";

const { t } = useAppI18n();
const blank: CsvDiffInput = {
  before: { text: "", format: "csv" },
  after: { text: "", format: "csv" },
  keys: [],
};
const source = shallowRef({ input: blank, rejected: new Set<CsvDiffSide>(), loading: new Set<CsvDiffSide>() });
const revision = ref(0);
const incomplete = computed(() => CSV_DIFF_SIDES.some(side => !source.value.input[side].text));
const available = computed<{ keys: string[]; error: string; side?: CsvDiffSide }>(() => {
  if (!incomplete.value && !source.value.rejected.size && !source.value.loading.size) {
    const headings: Record<CsvDiffSide, string[]> = { before: [], after: [] };
    for (const side of CSV_DIFF_SIDES) {
      try {
        headings[side] = csvDiffHeadings(source.value.input[side]);
      } catch (error) {
        return { keys: [], error: error instanceof ToolError ? error.code : "INTERNAL_ERROR", side };
      }
    }
    const right = new Set(headings.after);
    return { keys: headings.before.filter(key => right.has(key)), error: "" };
  }
  return { keys: [], error: "" };
});
const missing = computed(() => source.value.input.keys.filter(key => !available.value.keys.includes(key)));
const instant = computed(() => source.value.input.before.text.length + source.value.input.after.text.length
  <= CSV_DIFF_LIMITS.instantCharacters);
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => !incomplete.value && !source.value.rejected.size && !source.value.loading.size &&
    !available.value.error && !!source.value.input.keys.length && !missing.value.length,
  mode: () => instant.value ? "instant" : "deferred",
  execute: signal => instant.value
    ? compareCsvKeys(source.value.input)
    : runInspectorWorker({ kind: "csv-key-diff", input: source.value.input }, signal).then(reply => reply.data),
});

function edit(side: CsvDiffSide, patch: Partial<CsvDiffTable>) {
  const { input, rejected, loading } = source.value;
  const nextRejected = new Set(rejected);
  if (patch.text !== undefined) nextRejected.delete(side);
  source.value = { input: { ...input, [side]: { ...input[side], ...patch } }, rejected: nextRejected, loading };
}

function mark(side: CsvDiffSide, type: "rejected" | "loading", active: boolean) {
  const next = new Set(source.value[type]);
  if (active) next.add(side);
  else next.delete(side);
  source.value = { ...source.value, [type]: next };
}

function toggle(key: string, checked: boolean) {
  const { input } = source.value;
  source.value = {
    ...source.value,
    input: { ...input, keys: checked ? [...input.keys, key] : input.keys.filter(item => item !== key) },
  };
}

function replace(input: CsvDiffInput) {
  revision.value++;
  source.value = { input, rejected: new Set(), loading: new Set() };
}

function save() {
  if (result.value) downloadText(result.value.exportText, "csv-key-diff.csv", "text/csv;charset=utf-8");
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label">{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="csv-key-diff-sample" @click="replace(CSV_KEY_DIFF_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="csv-key-diff-clear" @click="replace(blank)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div class="table-inputs">
      <fieldset v-for="side in CSV_DIFF_SIDES" :key="side">
        <legend>{{ t("csvDiff." + side) }}</legend>
        <label class="format">
          {{ t("csvDiff.format") }}
          <select
            :id="'csv-key-diff-' + side + '-format'"
            :value="source.input[side].format"
            @change="edit(side, { format: ($event.target as HTMLSelectElement).value === 'tsv' ? 'tsv' : 'csv' })"
          >
            <option value="csv">CSV</option>
            <option value="tsv">TSV</option>
          </select>
        </label>
        <CodeInput
          :key="revision"
          :input-id="'csv-key-diff-' + side"
          :model-value="source.input[side].text"
          :label="t('csvDiff.' + side)"
          :input-hint="t('csvDiff.byteLimit')"
          :rows="6"
          :max-bytes="CSV_DIFF_LIMITS.bytes"
          accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
          preserve-bom
          preserve-carriage-returns
          @update:model-value="edit(side, { text: $event })"
          @rejected="mark(side, 'rejected', true)"
          @loading="mark(side, 'loading', $event)"
        />
      </fieldset>
    </div>
    <p class="hint">{{ t("tool.csv-key-diff.hint") }}</p>
    <fieldset v-if="!incomplete && !source.rejected.size && !source.loading.size && !available.error">
      <legend>{{ t("csvDiff.keys") }}</legend>
      <p v-if="!available.keys.length" class="hint">{{ t("csvDiff.noSharedKeys") }}</p>
      <div v-if="available.keys.length || missing.length" class="key-options">
        <label v-for="key in [...available.keys, ...missing]" :key="key">
          <input
            type="checkbox"
            data-testid="csv-key-diff-key"
            :checked="source.input.keys.includes(key)"
            @change="toggle(key, ($event.target as HTMLInputElement).checked)"
          />
          <code><bdi>{{ key }}</bdi></code>
          <span v-if="missing.includes(key)" class="hint">{{ t("csvDiff.unavailable") }}</span>
        </label>
      </div>
    </fieldset>
    <div class="run-bar">
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="csv-key-diff-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>

  <p v-if="source.rejected.size" class="notice" role="status">{{ t("csvDiff.rejected") }}</p>
  <p v-else-if="available.error" class="error-panel" role="alert">
    {{ t("csvDiff.inputError", { side: t("csvDiff." + (available.side ?? "before")), error: t("errors." + available.error) }) }}
  </p>
  <p v-else-if="error || (!incomplete && !source.loading.size && missing.length)" class="error-panel" role="alert">
    {{ t("errors." + (error || "CSV_DIFF_MISSING_KEY")) }}
  </p>
  <p class="sr-only" role="status" aria-atomic="true">{{ result ? t("csvDiff.summary", result.counts) : "" }}</p>

  <section v-if="result" class="result-panel diff-results" data-testid="csv-key-diff-result">
    <div class="result-header">
      <h2 data-testid="csv-key-diff-summary">{{ t("csvDiff.summary", result.counts) }}</h2>
      <Button variant="outline" size="sm" data-testid="csv-key-diff-download" @click="save">{{ t("csvDiff.download") }}</Button>
    </div>
    <p class="hint">{{ t("csvDiff.exportHint") }}</p>
    <p v-if="result.previewLimited" class="notice">{{ t("csvDiff.previewLimited") }}</p>
    <div v-if="result.columns.added.length || result.columns.removed.length" class="schema-changes" data-testid="csv-key-diff-columns">
      <template v-for="change in ['removed', 'added'] as const" :key="change">
        <p v-if="result.columns[change].length" :data-change="change">
          {{ t("csvDiff.columns." + change) }}
          <code v-for="name in result.columns[change]" :key="name"><bdi>{{ name }}</bdi></code>
        </p>
      </template>
    </div>
    <ul v-if="result.preview.length" class="diff-rows">
      <li v-for="(row, index) in result.preview" :key="index" data-testid="csv-key-diff-row" :data-change="row.change">
        <h3>{{ t("csvDiff." + row.change) }}</h3>
        <dl class="row-keys">
          <div v-for="(key, keyIndex) in result.keys" :key="key">
            <dt><bdi>{{ key }}</bdi></dt>
            <dd><code><bdi>{{ row.key[keyIndex] }}</bdi></code></dd>
          </div>
        </dl>
        <ul v-if="row.cells.length" class="cell-changes">
          <li v-for="cell in row.cells" :key="cell.column">
            <strong><bdi>{{ cell.column }}</bdi></strong>
            <div v-if="cell.before !== undefined" class="cell-before">
              <span>{{ t("csvDiff.before") }}</span>
              <code v-if="cell.before"><bdi>{{ cell.before }}</bdi></code>
              <i v-else>{{ t("csvDiff.empty") }}</i>
            </div>
            <div v-if="cell.after !== undefined" class="cell-after">
              <span>{{ t("csvDiff.after") }}</span>
              <code v-if="cell.after"><bdi>{{ cell.after }}</bdi></code>
              <i v-else>{{ t("csvDiff.empty") }}</i>
            </div>
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.tool-panel :deep(.code-editor) { min-height: 0; }
.table-inputs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
fieldset { min-width: 0; display: grid; gap: .55rem; border: 1px solid var(--border); border-radius: .5rem; padding: .7rem; }
legend { padding-inline: .3rem; font-weight: 600; }
.format { display: flex; align-items: center; gap: .5rem; }
select { border: 1px solid var(--border); border-radius: .35rem; padding: .2rem .4rem; background: var(--background); color: var(--foreground); }
.key-options, .row-keys { display: flex; flex-wrap: wrap; gap: .5rem; }
.key-options label, .row-keys div { display: inline-flex; min-width: 0; align-items: baseline; gap: .4rem; border: 1px solid var(--border); border-radius: .35rem; padding: .25rem .45rem; }
.key-options input { flex: none; accent-color: var(--primary); }
.diff-results, .key-options { overflow-wrap: anywhere; }
.diff-results code, .key-options code { white-space: break-spaces; }
.key-options code { border-radius: .2rem; padding-inline: .15rem; background: var(--muted); }
.schema-changes p { display: flex; flex-wrap: wrap; gap: .45rem; padding: .35rem .5rem; }
.diff-rows, .cell-changes { margin-top: .5rem; display: grid; gap: .5rem; }
.diff-rows > li { border: 1px solid var(--border); border-radius: .5rem; padding: .6rem; }
.diff-rows h3 { font-weight: 650; margin-bottom: .35rem; }
.row-keys dt { color: var(--muted-foreground); }
.row-keys dd { min-width: 0; }
.cell-changes li { display: grid; grid-template-columns: minmax(0, .7fr) repeat(2, minmax(0, 1fr)); gap: .3rem; align-items: start; }
.cell-changes strong, .cell-before, .cell-after { padding: .25rem .4rem; }
.cell-before, .cell-after { border-radius: .25rem; }
.cell-after { grid-column: 3; }
.cell-before span, .cell-after span { display: block; font-size: .75rem; }
[data-change="removed"], .cell-before { background: color-mix(in srgb, #d33838 12%, var(--background)); }
[data-change="added"], .cell-after { background: color-mix(in srgb, #18915c 13%, var(--background)); }
[data-change="updated"] { background: color-mix(in srgb, #b68515 9%, var(--background)); }
@media (max-width: 760px) {
  .table-inputs { grid-template-columns: minmax(0, 1fr); }
  .cell-changes li { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cell-changes strong { grid-column: 1 / -1; }
  .cell-after { grid-column: 2; }
}
</style>
