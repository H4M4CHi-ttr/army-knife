<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { TRACE_CONTEXT_LIMITS, inspectTraceContext } from "@/lib/tools/trace-context";
import { TRACE_CONTEXT_SAMPLE } from "@/lib/tools/trace-context-sample";

const { t } = useAppI18n();
const parent = ref(""), state = ref("");
const rejectedParent = ref(false), rejectedState = ref(false), revision = ref(0);
const source = computed(() => ({ parent: parent.value, state: state.value, rejectedParent: rejectedParent.value, rejectedState: rejectedState.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(parent.value) && !rejectedParent.value && !rejectedState.value,
  mode: "instant", execute: () => inspectTraceContext(parent.value, state.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function replace(example: boolean) {
  revision.value++; rejectedParent.value = false; rejectedState.value = false;
  parent.value = example ? TRACE_CONTEXT_SAMPLE.parent : "";
  state.value = example ? TRACE_CONTEXT_SAMPLE.state : "";
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="trace-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="trace-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="'parent-' + revision" :model-value="parent" :label="t('trace.parent')" input-id="trace-parent-input" :rows="2" :file="false" :max-bytes="TRACE_CONTEXT_LIMITS.parentBytes" :placeholder="TRACE_CONTEXT_SAMPLE.parent" @update:model-value="parent = $event; rejectedParent = false" @rejected="rejectedParent = true" />
    <CodeInput :key="'state-' + revision" :model-value="state" :label="t('trace.state')" input-id="trace-state-input" :rows="3" :file="false" :max-bytes="TRACE_CONTEXT_LIMITS.stateBytes" :placeholder="TRACE_CONTEXT_SAMPLE.state" @update:model-value="state = $event; rejectedState = false" @rejected="rejectedState = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.trace-context.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p class="hint trace-scope">{{ t("trace.scope") }}</p>
  <p class="hint">{{ t("trace.limits") }}</p>
  <p v-if="rejectedParent || rejectedState" class="notice" role="status">{{ t("trace.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="trace-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-trace-context.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="trace-summary">
      <dt>{{ t("trace.version") }}</dt><dd><code>{{ result.version }}</code></dd>
      <dt>{{ t("trace.traceId") }}</dt><dd><code data-testid="trace-id">{{ result.traceId }}</code></dd>
      <dt>{{ t("trace.parentId") }}</dt><dd><code data-testid="trace-parent-id">{{ result.parentId }}</code></dd>
      <dt>{{ t("trace.flags") }}</dt><dd><code>{{ result.flags }}</code></dd>
      <dt>{{ t("trace.sampled") }}</dt><dd data-testid="trace-sampled">{{ t(result.sampled ? "trace.set" : "trace.unset") }}</dd>
    </dl>
    <p v-if="result.otherFlags !== '00'" class="notice" data-testid="trace-other">{{ t("trace.other", { flags: result.otherFlags }) }}</p>
    <h3>{{ t("trace.entries") }}</h3>
    <div v-if="result.entries.length" class="table-scroll">
      <table class="data-table" data-testid="trace-entries">
        <thead><tr><th scope="col">{{ t("trace.position") }}</th><th scope="col">{{ t("trace.key") }}</th><th scope="col">{{ t("trace.value") }}</th></tr></thead>
        <tbody><tr v-for="entry in result.entries" :key="entry.key"><td>{{ entry.position }}</td><td><code>{{ entry.key }}</code></td><td><code>{{ entry.value }}</code></td></tr></tbody>
      </table>
    </div>
    <p v-else>{{ t("trace.none") }}</p>
    <p v-if="result.emptyMembers" class="hint" data-testid="trace-empty">{{ t("trace.empty", { count: result.emptyMembers }) }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.trace-scope { margin-top: 1rem; }
.trace-summary { display: grid; grid-template-columns: minmax(10rem, 1fr) minmax(0, 2fr); gap: .6rem 1rem; }
.trace-summary dt { color: var(--muted-foreground); font-size: .85rem; }
.trace-summary dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.trace-summary code, td code { white-space: pre-wrap; overflow-wrap: anywhere; }
table { width: 100%; table-layout: fixed; }
th:first-child { width: 4.5rem; }
td { overflow-wrap: anywhere; vertical-align: top; }
@media (max-width: 700px) {
  .trace-summary { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
  .trace-summary dd { margin-bottom: .5rem; }
}
</style>
