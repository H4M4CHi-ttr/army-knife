<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { CACHE_CONTROL_LIMITS, inspectCacheControl } from "@/lib/tools/cache-control";

const { t } = useAppI18n();
const input = ref("");
const rejected = ref(false);
const revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(input.value.trim()) && !rejected.value,
  mode: () => input.value.length <= CACHE_CONTROL_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectCacheControl(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function accept(value: string) { rejected.value = false; input.value = value; }
function replace(value: string) { revision.value++; accept(value); }
function sample() { replace("Cache-Control: public, max-age=60, s-maxage=300\nCache-Control: stale-while-revalidate=30, immutable"); }
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="cache-control-sample" @click="sample">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="cache-control-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('cache.input')" input-id="cache-control-input" :rows="6" :file="false" :max-bytes="CACHE_CONTROL_LIMITS.bytes" placeholder="public, max-age=60, s-maxage=300" @update:model-value="accept" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.cache-control.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="cache-control-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="hint cache-scope">{{ t("cache.scope") }}</p>
  <p class="hint">{{ t("cache.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("cache.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="cache-control-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-cache-control.json" type="application/json;charset=utf-8" />
    </div>
    <p v-for="warning in result.warnings" :key="warning" class="notice">{{ t("cache.warning." + warning) }}</p>
    <ol class="cache-directives">
      <li v-for="(row, index) in result.directives" :key="index" class="cache-directive" :data-directive="row.name">
        <h3><span class="cache-index">{{ index + 1 }}</span><code>{{ row.name }}</code></h3>
        <div class="cache-detail">
          <p><span class="field-label">{{ t("cache.value") }}: </span><code v-if="row.value !== null" class="cache-value">{{ row.value === '' ? '""' : row.value }}</code><span v-else>{{ t("cache.none") }}</span></p>
          <p v-if="row.seconds !== null" class="cache-seconds">{{ t("cache.seconds", { seconds: row.seconds }) }}</p>
          <p v-if="row.known && !row.notes.includes('invalid-argument') && !row.notes.includes('unexpected-argument')">{{ t("cache.meaning." + row.name) }}</p>
          <p v-else-if="row.known" class="hint">{{ t("cache.uninterpreted") }}</p>
          <p v-for="note in row.notes" :key="note" class="notice" :data-note="note">{{ t("cache.note." + note) }}</p>
        </div>
      </li>
    </ol>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.cache-scope { margin-top: 1rem; }
.cache-directives { list-style: none; padding: 0; margin: 0; }
.cache-directive { display: grid; grid-template-columns: minmax(9rem, 1fr) minmax(0, 3fr); gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border); }
.cache-directive:last-child { border-bottom: 0; }
.cache-directive h3 { font-size: .9rem; overflow-wrap: anywhere; }
.cache-index { color: var(--muted-foreground); margin-right: .65rem; }
.cache-detail { min-width: 0; overflow-wrap: anywhere; }
.cache-detail p + p { margin-top: .5rem; }
.cache-value { white-space: pre-wrap; }
.cache-seconds { font-variant-numeric: tabular-nums; }
@media (max-width: 700px) {
  .cache-directive { grid-template-columns: minmax(0, 1fr); gap: .5rem; }
}
</style>
