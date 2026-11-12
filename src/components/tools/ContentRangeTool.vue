<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { CONTENT_RANGE_LIMITS, inspectContentRange } from "@/lib/tools/content-range";
import { CONTENT_RANGE_SAMPLE } from "@/lib/tools/content-range-sample";

const { t } = useAppI18n();
const input = ref(""), rejected = ref(false), revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(input.value) && !rejected.value,
  mode: "instant", execute: () => inspectContentRange(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function show(value: string | null) {
  return value ?? t(result.value?.kind === "unsatisfied" ? "contentRange.notApplicable" : "contentRange.unknown");
}
const metrics = computed(() => {
  const r = result.value;
  if (!r) return [];
  return [
    { id: "first", label: "contentRange.first", value: show(r.first) },
    { id: "last", label: "contentRange.last", value: show(r.last) },
    { id: "range-bytes", label: "contentRange.rangeBytes", value: show(r.rangeBytes) },
    { id: "total", label: "contentRange.total", value: show(r.completeLength) },
    { id: "before", label: "contentRange.before", value: show(r.bytesBefore) },
    { id: "after", label: "contentRange.after", value: show(r.bytesAfter) },
    { id: "whole", label: "contentRange.whole", value: r.coversWholeRepresentation === null
      ? show(null) : t(r.coversWholeRepresentation ? "contentRange.yes" : "contentRange.no") },
  ];
});
function replace(example: boolean) {
  revision.value++; rejected.value = false; input.value = example ? CONTENT_RANGE_SAMPLE : "";
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="content-range-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="content-range-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('contentRange.input')" input-id="content-range-input" :rows="3" :file="false" :preserve-bom="true" :max-bytes="CONTENT_RANGE_LIMITS.inputBytes" :placeholder="CONTENT_RANGE_SAMPLE" @update:model-value="input = $event; rejected = false" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.content-range.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p class="notice content-range-scope">{{ t("contentRange.scope") }}</p>
  <p class="hint">{{ t("contentRange.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("contentRange.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="content-range-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-content-range.json" type="application/json;charset=utf-8" />
    </div>
    <p class="content-range-kind"><strong>{{ t("contentRange.kind") }}</strong> {{ t('contentRange.' + result.kind) }}</p>
    <h3>{{ t("contentRange.canonical") }}</h3>
    <pre data-testid="content-range-canonical"><code>{{ result.canonical }}</code></pre>
    <p v-if="result.kind === 'unsatisfied'" class="notice">{{ t("contentRange.unsatisfiedHelp") }}</p>
    <dl class="content-range-values">
      <div v-for="field in metrics" :key="field.id">
        <dt>{{ t(field.label) }}</dt>
        <dd><code :data-testid="'content-range-' + field.id">{{ field.value }}</code></dd>
      </div>
    </dl>
    <p class="hint">{{ t("contentRange.exportHelp") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.content-range-scope { margin-top: 1rem; }
.content-range-kind { margin-block: .8rem; }
.content-range-kind strong { margin-inline-end: .5rem; }
h3 { font-size: .9rem; font-weight: 600; }
pre { padding: .8rem; border: 1px solid var(--border); border-radius: .5rem; margin-block: .6rem 1rem; }
pre, code { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
.content-range-values { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-block: 1rem; }
.content-range-values > div { min-width: 0; padding: .8rem; border: 1px solid var(--border); border-radius: .5rem; }
dt { font-size: .8rem; color: var(--muted-foreground); }
dd { margin: .4rem 0 0; font-size: 1rem; }
@media (max-width: 640px) { .content-range-values { grid-template-columns: minmax(0, 1fr); } }
</style>
