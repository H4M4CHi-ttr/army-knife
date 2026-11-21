<script setup vapor lang="ts">
import { computed, ref } from "vue";
import ApplyControl from "@/components/ApplyControl.vue";
import CodeInput from "@/components/CodeInput.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import OutputActions from "@/components/OutputActions.vue";
import { Button } from "@/components/ui/button";
import { useToolExecution } from "@/composables/useToolExecution";
import { useAppI18n } from "@/i18n/useAppI18n";
import { CACHE_STATUS_LIMITS, inspectCacheStatus } from "@/lib/tools/cache-status";
import { CACHE_STATUS_EXAMPLE } from "@/lib/tools/cache-status-sample";

const { t } = useAppI18n();
const explainedReasons = new Set(["bypass", "method", "uri-miss", "vary-miss", "miss", "request", "stale", "partial"]);
const input = ref("");
const rejected = ref(false);
const revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => /[^ \t\n]/.test(input.value) && !rejected.value,
  mode: () => input.value.length <= CACHE_STATUS_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectCacheStatus(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");

function accept(value: string) {
  rejected.value = false;
  input.value = value;
}
function replace(value: string) {
  revision.value++;
  accept(value);
}
function showValue(parameter: ReturnType<typeof inspectCacheStatus>["caches"][number]["parameters"][number]) {
  switch (parameter.kind) {
    case "string": return JSON.stringify(parameter.value);
    case "boolean": return parameter.value ? "?1" : "?0";
    case "bytes": return `:${parameter.value}:`;
    default: return parameter.value;
  }
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label">{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="cache-status-sample" @click="replace(CACHE_STATUS_EXAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="cache-status-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput
      :key="revision"
      :model-value="input"
      :label="t('cacheStatus.input')"
      :input-hint="t('cacheStatus.inputLimit')"
      input-id="cache-status-input"
      :rows="4"
      :file="false"
      :preserve-carriage-returns="true"
      :max-bytes="CACHE_STATUS_LIMITS.bytes"
      placeholder="shield; hit; ttl=60, edge; fwd=uri-miss"
      @update:model-value="accept"
      @rejected="rejected = true"
    />
    <div class="run-bar">
      <p class="hint">{{ t("tool.cache-status.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="cache-status-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p v-if="rejected" class="notice" role="status">{{ t("cacheStatus.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="cache-status-result">
    <div class="result-header">
      <h2>{{ t("cacheStatus.order") }}</h2>
      <OutputActions :text="output" filename="army-knife-cache-status.json" type="application/json;charset=utf-8" />
    </div>
    <ol class="cache-chain">
      <li v-for="(cache, index) in result.caches" :key="index" class="cache-row" data-testid="cache-status-row">
        <h3><code>{{ cache.name === '' ? '""' : cache.name }}</code></h3>
        <p>
          <strong>{{ t("cacheStatus." + cache.outcome) }}</strong>
          <code v-if="cache.forwarded !== null"> · {{ cache.forwarded }}</code>
        </p>
        <p v-if="cache.forwarded !== null && explainedReasons.has(cache.forwarded)" class="hint">
          {{ t("cacheStatus.reason." + cache.forwarded) }}
        </p>
        <dl class="cache-fields">
          <dt>{{ t("cacheStatus.ttl") }}</dt>
          <dd v-if="cache.ttl !== null"><code>{{ cache.ttl }}</code></dd>
          <dd v-else>{{ t("cacheStatus.absent") }}</dd>
          <dt v-if="cache.forwarded !== null">{{ t("cacheStatus.status") }}</dt>
          <dd v-if="cache.forwarded !== null && cache.forwardedStatus !== null"><code>{{ cache.forwardedStatus }}</code></dd>
          <dd v-else-if="cache.forwarded !== null">{{ t("cacheStatus.statusAbsent") }}</dd>
        </dl>
        <details v-if="cache.parameters.length">
          <summary>{{ t("cacheStatus.parameters") }}</summary>
          <ul>
            <li v-for="parameter in cache.parameters" :key="parameter.name">
              <code>{{ parameter.name }}={{ showValue(parameter) }}</code>
            </li>
          </ul>
        </details>
      </li>
    </ol>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.cache-chain { list-style: decimal; padding-inline-start: 1.5rem; margin: 0; }
.cache-row { padding: .75rem 0; overflow-wrap: anywhere; border-block-end: 1px solid var(--border); }
.cache-row:last-child { border-block-end: 0; }
.cache-row h3 { font-size: 1rem; }
.cache-row h3 code { white-space: pre-wrap; }
.cache-fields { display: grid; grid-template-columns: fit-content(65%) minmax(0, 1fr); gap: .2rem .75rem; margin: .4rem 0; }
.cache-row details { margin-block-start: .35rem; }
.cache-row summary { cursor: pointer; }
.cache-row details ul { list-style: disc; padding-inline-start: 1rem; }
</style>
