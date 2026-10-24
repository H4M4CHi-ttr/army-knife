<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { HTTP_RANGE_LIMITS, HTTP_RANGE_SAMPLE, inspectHttpRanges } from "@/lib/tools/http-range";

const { t } = useAppI18n();
const input = ref("");
const length = ref("");
const rejected = ref(false);
const revision = ref(0);
const source = computed(() => ({ input: input.value, length: length.value, rejected: rejected.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(input.value.trim()) && Boolean(length.value.trim()) && !rejected.value,
  mode: () => input.value.length + length.value.length <= HTTP_RANGE_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectHttpRanges(input.value, length.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function acceptInput(value: string) { rejected.value = false; input.value = value; }
function acceptLength(value: string) { rejected.value = false; length.value = value; }
function replace(value: string, size: string) { revision.value++; rejected.value = false; input.value = value; length.value = size; }
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="range-sample" @click="replace(HTTP_RANGE_SAMPLE.input, HTTP_RANGE_SAMPLE.length)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="range-clear" @click="replace('', '')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="'range-' + revision" :model-value="input" :label="t('range.input')" input-id="http-range-input" :rows="4" :file="false" :max-bytes="HTTP_RANGE_LIMITS.bytes" placeholder="bytes=0-99, -50" @update:model-value="acceptInput" @rejected="rejected = true" />
    <CodeInput :key="'length-' + revision" :model-value="length" :label="t('range.length')" input-id="http-range-length" :rows="2" :file="false" :max-bytes="56" placeholder="1000" @update:model-value="acceptLength" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.http-range.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="range-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="hint range-scope">{{ t("range.scope") }}</p>
  <p class="hint">{{ t("range.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("range.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="range-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-http-range.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="range-summary">
      <dt>{{ t("range.length") }}</dt><dd><code>{{ result.length }}</code></dd>
      <dt>{{ t("range.set") }}</dt><dd data-testid="range-set">{{ t(result.satisfiable ? "range.satisfiable" : "range.unsatisfiable") }}</dd>
      <dt>{{ t("range.memberBytes") }}</dt><dd><code>{{ result.memberBytes }}</code></dd>
      <dt>{{ t("range.coveredBytes") }}</dt><dd><code data-testid="range-covered">{{ result.coveredBytes }}</code></dd>
    </dl>
    <p v-if="result.overlaps" class="notice">{{ t("range.overlap") }}</p>
    <p class="hint">{{ t("range.reference") }}</p>
    <ol class="range-members">
      <li v-for="(member, index) in result.members" :key="index">
        <code>{{ member.source }}</code> · {{ t("range.kind." + member.kind) }}
        <p>{{ t("range.status." + member.status) }}</p>
        <p v-if="member.contentRange"><span>{{ t("range.contentRange") }}: </span><code>{{ member.contentRange }}</code></p>
        <p>{{ t("range.byteCount") }}: <code>{{ member.bytes }}</code></p>
      </li>
    </ol>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.range-scope { margin-top: 1rem; }
.range-summary { display: grid; grid-template-columns: minmax(10rem, 1fr) minmax(0, 2fr); gap: .6rem 1rem; }
.range-summary dt { color: var(--muted-foreground); font-size: .85rem; }
.range-summary dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.range-members { padding-left: 1.5rem; }
.range-members li { margin-top: 1rem; padding: .75rem; border: 1px solid var(--border); border-radius: .5rem; }
.range-members p { margin: .35rem 0 0; }
.range-summary code, .range-members code { white-space: pre-wrap; overflow-wrap: anywhere; }
@media (max-width: 700px) {
  .range-summary { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
  .range-summary dd { margin-bottom: .5rem; }
}
</style>
