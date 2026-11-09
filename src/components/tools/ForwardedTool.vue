<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { FORWARDED_LIMITS, inspectForwarded } from "@/lib/tools/forwarded";
import { FORWARDED_SAMPLE } from "@/lib/tools/forwarded-sample";

const { t } = useAppI18n();
const input = ref(""), rejected = ref(false), revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(input.value) && !rejected.value,
  mode: () => input.value.length <= FORWARDED_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectForwarded(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function replace(value: string) { revision.value++; rejected.value = false; input.value = value; }
function meaning(name: string) {
  const key = name.toLowerCase();
  return t("forwarded.meaning." + (["for", "by", "host", "proto"].includes(key) ? key : "extension"));
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="forwarded-sample" @click="replace(FORWARDED_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="forwarded-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('forwarded.input')" input-id="forwarded-input" :rows="4" :file="false" :max-bytes="FORWARDED_LIMITS.bytes" :placeholder="FORWARDED_SAMPLE" @update:model-value="input = $event; rejected = false" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.forwarded.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="forwarded-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice forwarded-scope">{{ t("forwarded.scope") }}</p>
  <p class="hint">{{ t("forwarded.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("forwarded.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="forwarded-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-forwarded.json" type="application/json;charset=utf-8" />
    </div>
    <p class="hint">{{ t("forwarded.order") }}</p>
    <p v-if="result.emptyElements" class="hint">{{ t("forwarded.emptyElements", { count: result.emptyElements }) }}</p>
    <section v-for="element in result.elements" :key="element.index" class="forwarded-element" data-testid="forwarded-element">
      <h3>{{ t("forwarded.position", { index: element.index }) }}</h3>
      <p v-if="element.emptyParameterSlots" class="hint">{{ t("forwarded.emptyParameters", { count: element.emptyParameterSlots }) }}</p>
      <div class="table-scroll">
        <table class="data-table">
          <caption>{{ t("forwarded.parameters") }}</caption>
          <thead><tr><th scope="col">{{ t("forwarded.name") }}</th><th scope="col">{{ t("forwarded.value") }}</th><th scope="col">{{ t("forwarded.meaningLabel") }}</th></tr></thead>
          <tbody><tr v-for="(parameter, index) in element.parameters" :key="index"><td><code>{{ parameter.name }}</code></td><td><code>{{ JSON.stringify(parameter.value) }}</code></td><td>{{ meaning(parameter.name) }}</td></tr></tbody>
        </table>
      </div>
    </section>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.forwarded-scope { margin-top: 1rem; }
.forwarded-element + .forwarded-element { margin-top: 1.5rem; }
h3 { font-size: 1rem; font-weight: 600; }
code { white-space: pre-wrap; overflow-wrap: anywhere; }
table { width: 100%; table-layout: fixed; }
caption { text-align: start; padding-block: .6rem; color: var(--muted-foreground); font-size: .85rem; }
th:first-child { width: 22%; }
th:last-child { width: 30%; }
td { overflow-wrap: anywhere; vertical-align: top; }
</style>
