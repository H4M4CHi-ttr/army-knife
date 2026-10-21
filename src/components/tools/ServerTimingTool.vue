<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { SERVER_TIMING_LIMITS, inspectServerTiming } from "@/lib/tools/server-timing";

const { t } = useAppI18n();
const input = ref("");
const rejected = ref(false);
const revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(input.value.trim()) && !rejected.value,
  mode: () => input.value.length <= SERVER_TIMING_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectServerTiming(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function accept(value: string) { rejected.value = false; input.value = value; }
function replace(value: string) { revision.value++; accept(value); }
function sample() { replace('Server-Timing: cache;desc="hit, edge", db;dur=53.25\nServer-Timing: app;dur=47.2;desc="render"'); }
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="server-timing-sample" @click="sample">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="server-timing-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('timing.input')" input-id="server-timing-input" :rows="5" :file="false" :max-bytes="SERVER_TIMING_LIMITS.bytes" placeholder="db;dur=53.25, app;dur=47.2" @update:model-value="accept" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.server-timing.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="server-timing-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="hint timing-scope">{{ t("timing.scope") }}</p>
  <p class="hint">{{ t("timing.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("timing.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="server-timing-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-server-timing.json" type="application/json;charset=utf-8" />
    </div>
    <ol class="timing-metrics">
      <li v-for="(row, index) in result.metrics" :key="index" class="timing-metric" :data-metric="row.name">
        <h3><span class="timing-index">{{ index + 1 }}</span><code>{{ row.name }}</code></h3>
        <div class="timing-detail">
          <p><span class="field-label">{{ t("timing.duration") }}: </span><code v-if="row.duration !== null">{{ row.duration }}</code><span v-else>{{ t("timing.unavailable") }}</span></p>
          <p><span class="field-label">{{ t("timing.description") }}: </span><code v-if="row.description !== null" class="timing-value">{{ row.description === '' ? '""' : row.description }}</code><span v-else>{{ t("timing.absent") }}</span></p>
          <p v-for="note in row.notes" :key="note" class="notice" :data-note="note">{{ t("timing.note." + note) }}</p>
          <details v-if="row.parameters.length">
            <summary>{{ t("timing.parameters") }}</summary>
            <ul class="timing-parameters">
              <li v-for="(parameter, parameterIndex) in row.parameters" :key="parameterIndex"><code>{{ parameter.name }} = {{ parameter.value === '' ? '""' : parameter.value }}</code><span v-if="parameter.ignored"> · {{ t("timing.ignored") }}</span></li>
            </ul>
          </details>
        </div>
      </li>
    </ol>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.timing-scope { margin-top: 1rem; }
.timing-metrics { list-style: none; padding: 0; margin: 0; }
.timing-metric { display: grid; grid-template-columns: minmax(8rem, 1fr) minmax(0, 3fr); gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border); }
.timing-metric:last-child { border-bottom: 0; }
.timing-metric h3 { font-size: .9rem; overflow-wrap: anywhere; }
.timing-index { color: var(--muted-foreground); margin-right: .65rem; }
.timing-detail { min-width: 0; overflow-wrap: anywhere; }
.timing-detail p + p, .timing-detail details { margin-top: .5rem; }
.timing-value, .timing-parameters code { white-space: pre-wrap; }
.timing-parameters { padding-left: 1.25rem; }
summary { cursor: pointer; }
@media (max-width: 700px) {
  .timing-metric { grid-template-columns: minmax(0, 1fr); gap: .5rem; }
}
</style>
