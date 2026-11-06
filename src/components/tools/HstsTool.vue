<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { HSTS_LIMITS, inspectHsts } from "@/lib/tools/hsts";
import { HSTS_SAMPLE } from "@/lib/tools/hsts-sample";

const { t } = useAppI18n();
const input = ref(""), rejected = ref(false), revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(input.value) && !rejected.value,
  mode: () => input.value.length <= HSTS_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectHsts(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function replace(value: string) { revision.value++; rejected.value = false; input.value = value; }
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="hsts-sample" @click="replace(HSTS_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="hsts-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('hsts.input')" input-id="hsts-input" :rows="4" :file="false" :max-bytes="HSTS_LIMITS.bytes" :placeholder="HSTS_SAMPLE" @update:model-value="input = $event; rejected = false" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.hsts.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="hsts-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="hint hsts-scope">{{ t("hsts.scope") }}</p>
  <p class="hint">{{ t("hsts.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("hsts.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="hsts-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-hsts.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="hsts-summary">
      <dt>{{ t("hsts.seconds") }}</dt><dd><code data-testid="hsts-seconds">{{ result.maxAgeSeconds }}</code></dd>
      <dt>{{ t("hsts.duration") }}</dt><dd>{{ t("hsts.durationValue", result.duration) }}</dd>
      <dt>{{ t("hsts.operation") }}</dt><dd>{{ t("hsts." + result.operation) }}</dd>
      <dt>{{ t("hsts.subdomains") }}</dt><dd>{{ t(result.includeSubDomains ? "hsts.yes" : "hsts.no") }}</dd>
      <dt>{{ t("hsts.preload") }}</dt><dd>{{ t(result.preload ? "hsts.yes" : "hsts.no") }}</dd>
    </dl>
    <p v-if="result.operation === 'remove'" class="notice" data-testid="hsts-removal">{{ t("hsts.zero") }}</p>
    <p class="hint">{{ t("hsts.preloadHelp") }}</p>
    <p v-if="result.emptySlots" class="hint">{{ t("hsts.empty", { count: result.emptySlots }) }}</p>
    <div class="table-scroll">
      <table class="data-table">
        <caption>{{ t("hsts.directives") }}</caption>
        <thead><tr><th scope="col">{{ t("hsts.name") }}</th><th scope="col">{{ t("hsts.value") }}</th><th scope="col">{{ t("hsts.kind") }}</th></tr></thead>
        <tbody><tr v-for="(directive, index) in result.directives" :key="index"><td><code>{{ directive.name }}</code></td><td><span v-if="directive.value === null" class="hint">{{ t("hsts.valueless") }}</span><code v-else>{{ JSON.stringify(directive.value) }}</code></td><td>{{ t(directive.recognized ? "hsts.recognized" : "hsts.extension") }}</td></tr></tbody>
      </table>
    </div>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.hsts-scope { margin-top: 1rem; }
.hsts-summary { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr); gap: .7rem 1rem; }
.hsts-summary dt { color: var(--muted-foreground); }
.hsts-summary dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
code { white-space: pre-wrap; overflow-wrap: anywhere; }
table { width: 100%; table-layout: fixed; }
caption { text-align: start; padding-block: .6rem; color: var(--muted-foreground); font-size: .85rem; }
th:first-child { width: 28%; }
th:last-child { width: 24%; }
td { overflow-wrap: anywhere; vertical-align: top; }
@media (max-width: 700px) {
  .hsts-summary { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
  .hsts-summary dd { margin-bottom: .5rem; }
}
</style>
