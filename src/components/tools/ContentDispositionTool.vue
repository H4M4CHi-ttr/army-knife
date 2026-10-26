<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { DISPOSITION_LIMITS, dispositionDisplay, inspectContentDisposition } from "@/lib/tools/content-disposition";

const { t } = useAppI18n();
const input = ref("");
const rejected = ref(false);
const revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(input.value.trim()) && !rejected.value,
  mode: () => input.value.length <= DISPOSITION_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectContentDisposition(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function accept(value: string) { rejected.value = false; input.value = value; }
function replace(value: string) { revision.value++; accept(value); }
function sample() { replace('Content-Disposition: attachment; filename="EURO rates.csv"; filename*=UTF-8\'en\'%E2%82%AC%20rates.csv'); }
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="disposition-sample" @click="sample">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="disposition-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('disposition.input')" input-id="content-disposition-input" :rows="5" :file="false" :max-bytes="DISPOSITION_LIMITS.bytes" placeholder="attachment; filename=report.csv" @update:model-value="accept" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.content-disposition.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="disposition-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="hint disposition-scope">{{ t("disposition.scope") }}</p>
  <p class="hint">{{ t("disposition.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("disposition.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="disposition-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-content-disposition.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="disposition-summary">
      <dt>{{ t("disposition.type") }}</dt><dd><code>{{ result.disposition }}</code></dd>
      <dt>{{ t("disposition.selected") }}</dt>
      <dd data-testid="disposition-selected"><code v-if="result.preferredFilename !== null">{{ dispositionDisplay(result.preferredFilename) }}</code><span v-else>{{ t(result.parameters.some(p => p.name === 'filename*') ? "disposition.unresolved" : "disposition.missing") }}</span><span v-if="result.preferredSource" class="hint"> · {{ result.preferredSource }}</span></dd>
      <dt>{{ t("disposition.fallback") }}</dt><dd><code v-if="result.filename !== null">{{ dispositionDisplay(result.filename) }}</code><span v-else>{{ t("disposition.missing") }}</span></dd>
    </dl>
    <p v-for="note in result.notes" :key="note" class="notice disposition-note" :data-note="note">{{ t("disposition.note." + note) }}</p>
    <p v-for="note in result.filenameNotes" :key="note" class="notice disposition-note" :data-filename-note="note">{{ t("disposition.filename." + note) }}</p>
    <details v-if="result.parameters.length" class="disposition-parameters">
      <summary>{{ t("disposition.parameters") }}</summary>
      <ul>
        <li v-for="(parameter, index) in result.parameters" :key="index">
          <code>{{ parameter.name }} = {{ dispositionDisplay(parameter.value) }}</code>
          <p v-if="parameter.charset !== null"><span class="field-label">{{ t("disposition.encoding") }}: </span><code>{{ dispositionDisplay(parameter.charset) }} / {{ dispositionDisplay(parameter.language ?? '') }} / {{ parameter.decoded === null ? '—' : dispositionDisplay(parameter.decoded) }}</code></p>
        </li>
      </ul>
    </details>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.disposition-scope { margin-top: 1rem; }
.disposition-summary { display: grid; grid-template-columns: minmax(9rem, 1fr) minmax(0, 2fr); gap: .75rem 1rem; }
.disposition-summary dt { color: var(--muted-foreground); font-size: .85rem; }
.disposition-summary dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.disposition-summary code, .disposition-parameters code { white-space: pre-wrap; overflow-wrap: anywhere; }
.disposition-note, .disposition-parameters { margin-top: .75rem; }
.disposition-parameters ul { padding-left: 1.25rem; }
.disposition-parameters li { margin-top: .75rem; min-width: 0; }
.disposition-parameters summary { cursor: pointer; }
@media (max-width: 700px) {
  .disposition-summary { grid-template-columns: minmax(0, 1fr); gap: .35rem; }
  .disposition-summary dd { margin-bottom: .65rem; }
}
</style>
