<script setup vapor lang="ts">
import { computed, ref, shallowRef } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import ApplyControl from "@/components/ApplyControl.vue";
import CodeInput from "@/components/CodeInput.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { CACHE_AGE_LIMITS, calculateCacheAge, type CacheAgeInput } from "@/lib/tools/cache-age";
import { CACHE_AGE_SAMPLE, CACHE_AGE_TIMES } from "@/lib/tools/cache-age-sample";

const { t } = useAppI18n();
const blank: CacheAgeInput = { headers: "", request: "", response: "", evaluation: "" };
const source = shallowRef({ input: blank, rejected: new Set<keyof CacheAgeInput>() });
const revision = ref(0);
const incomplete = computed(() => !Object.values(source.value.input).every(Boolean));
const rejected = computed(() => source.value.rejected.size > 0);
const { result, error, control } = useToolExecution({
  source,
  canRun: () => !incomplete.value && !rejected.value,
  mode: "instant",
  execute: () => calculateCacheAge(source.value.input),
});

function edit(field: keyof CacheAgeInput, value?: string) {
  const rejectedFields = new Set(source.value.rejected);
  if (value === undefined) {
    rejectedFields.add(field);
    source.value = { input: source.value.input, rejected: rejectedFields };
  } else {
    rejectedFields.delete(field);
    source.value = { input: { ...source.value.input, [field]: value }, rejected: rejectedFields };
  }
}

function replace(input: CacheAgeInput) {
  revision.value++;
  source.value = { input, rejected: new Set() };
}

function ignoreFileDrop(event: DragEvent) {
  if (!event.dataTransfer?.files.length) return;
  event.preventDefault();
  event.stopPropagation();
}

const stages = ["apparentAge", "responseDelay", "correctedAgeValue", "correctedInitialAge", "residentTime"] as const;
</script>

<template>
  <div class="tool-panel" @drop.capture="ignoreFileDrop">
    <div class="tool-toolbar">
      <div class="toolbar-label">{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="cache-age-sample" @click="replace(CACHE_AGE_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="cache-age-clear" @click="replace(blank)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput
      :key="'headers-' + revision"
      :model-value="source.input.headers"
      :label="t('cacheAge.headers')"
      :input-hint="t('cacheAge.headerLimit')"
      input-id="cache-age-headers"
      :rows="2"
      :file="false"
      :max-bytes="CACHE_AGE_LIMITS.headerBytes"
      placeholder="Date: Mon, 23 Nov 2026 00:00:00 GMT"
      @update:model-value="edit('headers', $event)"
      @rejected="edit('headers')"
    />
    <div class="cache-age-times">
      <CodeInput
        v-for="field in CACHE_AGE_TIMES"
        :key="field + revision"
        :model-value="source.input[field]"
        :label="t('cacheAge.' + field)"
        :input-id="'cache-age-' + field"
        :rows="1"
        :file="false"
        :max-bytes="CACHE_AGE_LIMITS.timeBytes"
        :input-hint="t('cacheAge.timeFormat')"
        @update:model-value="edit(field, $event)"
        @rejected="edit(field)"
      />
    </div>
    <div class="run-bar">
      <p class="hint">{{ t("tool.cache-age.hint") }}</p>
      <ApplyControl :state="control" />
    </div>
  </div>

  <p v-if="rejected" class="notice" role="status">{{ t("cacheAge.rejected") }}</p>
  <p v-else-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <p v-else-if="incomplete" class="hint" data-testid="cache-age-incomplete">{{ t("cacheAge.incomplete") }}</p>

  <p class="sr-only" role="status" aria-atomic="true" data-testid="cache-age-announcement">{{ result ? t("cacheAge.currentAge") + " " + result.currentAge + " s" : "" }}</p>
  <section v-if="result" class="result-panel" data-testid="cache-age-result">
    <div class="result-header">
      <h2>{{ t("cacheAge.currentAge") }}</h2>
      <strong class="cache-age-number" data-testid="cache-age-current"><code>{{ result.currentAge }} s</code></strong>
    </div>
    <p class="hint">{{ t("cacheAge.estimate") }}</p>
    <p class="hint" v-if="result.ageHeaderSeconds === null">{{ t("cacheAge.ageAbsent") }}</p>
    <p class="notice" v-if="result.futureDate">{{ t("cacheAge.futureDate") }}</p>
    <dl class="cache-age-stages">
      <div v-for="stage in stages" :key="stage">
        <dt>{{ t("cacheAge." + stage) }}</dt>
        <dd><code>{{ result[stage] }} s</code></dd>
      </div>
    </dl>
    <p class="hint">{{ t("cacheAge.maximum") }} {{ t("cacheAge.winner." + result.initialAgeSource) }}</p>
  </section>
</template>

<style scoped>
.tool-panel :deep(.code-editor) { min-height: 0; }
.cache-age-times { display: grid; gap: .8rem 1rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.cache-age-stages { display: grid; gap: .6rem 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cache-age-stages dt { color: var(--muted-foreground); font-size: .85rem; }
.cache-age-stages dd { margin: .25rem 0 0; }
.cache-age-number, .cache-age-stages dd { min-width: 0; overflow-wrap: anywhere; }
@media (max-width: 900px) {
  .cache-age-times { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 540px) {
  .cache-age-stages { grid-template-columns: minmax(0, 1fr); }
}
</style>
