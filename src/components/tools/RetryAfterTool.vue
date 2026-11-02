<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { RETRY_AFTER_LIMITS, inspectRetryAfter } from "@/lib/tools/retry-after";
import { RETRY_AFTER_SAMPLE } from "@/lib/tools/retry-after-sample";

const { t } = useAppI18n();
const input = ref("");
const reference = ref("");
const inputRejected = ref(false);
const referenceRejected = ref(false);
const rejected = computed(() => inputRejected.value || referenceRejected.value);
const revision = ref(0);
const source = computed(() => ({ input: input.value, reference: reference.value, rejected: rejected.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(input.value) && Boolean(reference.value) && !rejected.value,
  mode: () => input.value.length + reference.value.length <= RETRY_AFTER_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectRetryAfter(input.value, reference.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function acceptInput(value: string) { inputRejected.value = false; input.value = value; }
function acceptReference(value: string) { referenceRejected.value = false; reference.value = value; }
function replace(value: string, at: string) {
  revision.value++; inputRejected.value = false; referenceRejected.value = false;
  input.value = value; reference.value = at;
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="retry-sample" @click="replace(RETRY_AFTER_SAMPLE.input, RETRY_AFTER_SAMPLE.reference)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="retry-clear" @click="replace('', '')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="'retry-' + revision" :model-value="input" :label="t('retry.input')" input-id="retry-after-input" :rows="3" :file="false" :max-bytes="RETRY_AFTER_LIMITS.bytes" placeholder="Retry-After: 120" @update:model-value="acceptInput" @rejected="inputRejected = true" />
    <CodeInput :key="'receipt-' + revision" :model-value="reference" :label="t('retry.reference')" input-id="retry-after-reference" :rows="2" :file="false" :max-bytes="RETRY_AFTER_LIMITS.referenceBytes" placeholder="2026-11-03T00:00:00.250Z" @update:model-value="acceptReference" @rejected="referenceRejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.retry-after.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="retry-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="hint retry-scope">{{ t("retry.scope") }}</p>
  <p class="hint">{{ t("retry.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("retry.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="retry-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-retry-after.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="retry-summary">
      <dt>{{ t("retry.format") }}</dt><dd>{{ t("retry.kind." + result.kind) }}</dd>
      <dt>{{ t("retry.value") }}</dt><dd><code>{{ result.value }}</code></dd>
      <dt>{{ t("retry.reference") }}</dt><dd><code>{{ result.referenceUtc }}</code></dd>
      <dt>{{ t("retry.target") }}</dt><dd><code v-if="result.targetUtc" data-testid="retry-target">{{ result.targetUtc }}</code><span v-else data-testid="retry-target-unavailable">{{ t("retry.outOfRange") }}</span></dd>
      <dt>{{ t("retry.milliseconds") }}</dt><dd><code data-testid="retry-milliseconds">{{ result.waitMilliseconds }}</code></dd>
      <dt>{{ t("retry.seconds") }}</dt><dd><code data-testid="retry-seconds">{{ result.minimumWholeSeconds }}</code></dd>
    </dl>
    <p v-if="result.past" class="notice" data-testid="retry-past">{{ t("retry.past") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.retry-scope { margin-top: 1rem; }
.retry-summary { display: grid; grid-template-columns: minmax(10rem, 1fr) minmax(0, 2fr); gap: .6rem 1rem; }
.retry-summary dt { color: var(--muted-foreground); font-size: .85rem; }
.retry-summary dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.retry-summary code { white-space: pre-wrap; overflow-wrap: anywhere; }
@media (max-width: 700px) {
  .retry-summary { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
  .retry-summary dd { margin-bottom: .5rem; }
}
</style>
