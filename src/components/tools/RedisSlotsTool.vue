<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { REDIS_SLOTS_LIMITS, inspectRedisSlots } from "@/lib/tools/redis-slots";
import { REDIS_SLOTS_SAMPLE } from "@/lib/tools/redis-slots-sample";

const { t } = useAppI18n();
const input = ref(""), rejected = ref(false), loading = ref(false), revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value, loading: loading.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(input.value) && !rejected.value && !loading.value,
  mode: () => input.value.length <= REDIS_SLOTS_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectRedisSlots(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
// JSON escapes controls below U+0020; also expose format/line-direction controls
// in the visible table while the report retains the original key bytes.
function visibleJson(value: string): string {
  return JSON.stringify(value).replace(/[\p{Cf}\p{Zl}\p{Zp}\u007f-\u009f]/gu,
    character => character.split("").map(unit => "\\u" + unit.charCodeAt(0).toString(16).padStart(4, "0")).join(""));
}
const rows = computed(() => result.value?.keys.slice(0, REDIS_SLOTS_LIMITS.previewKeys).map((key, i) => ({
  ...key, position: i + 1, keyJson: visibleJson(key.key), hashedJson: visibleJson(key.hashTag ?? key.key),
})) ?? []);
function replace(example: boolean) {
  revision.value++; rejected.value = false; loading.value = false;
  input.value = example ? REDIS_SLOTS_SAMPLE : "";
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="redis-slots-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="redis-slots-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('redis.input')" :input-hint="t('redis.inputLimit')" input-id="redis-slots-input" :rows="5" :preserve-bom="true" :max-bytes="REDIS_SLOTS_LIMITS.inputBytes" :placeholder="REDIS_SLOTS_SAMPLE" @update:model-value="input = $event; rejected = false" @rejected="rejected = true" @loading="loading = $event" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.redis-slots.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="redis-slots-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice redis-scope">{{ t("redis.scope") }}</p>
  <p class="hint">{{ t("redis.grammar") }}</p>
  <p class="hint">{{ t("redis.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("redis.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="redis-slots-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-redis-slots.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="redis-totals">
      <div><dt>{{ t("redis.count") }}</dt><dd data-testid="redis-slots-count">{{ result.keys.length }}</dd></div>
      <div><dt>{{ t("redis.distinct") }}</dt><dd data-testid="redis-slots-distinct">{{ result.distinctSlots }}</dd></div>
    </dl>
    <p class="notice" data-testid="redis-slots-same">{{ t(result.sameSlot ? "redis.same" : "redis.different") }}</p>
    <div class="table-scroll" tabindex="0" role="region" :aria-label="t('redis.preview', { shown: rows.length, total: result.keys.length })">
      <table class="data-table">
        <caption>{{ t("redis.preview", { shown: rows.length, total: result.keys.length }) }}</caption>
        <thead><tr><th scope="col">{{ t("redis.position") }}</th><th scope="col">{{ t("redis.slot") }}</th><th scope="col">{{ t("redis.key") }}</th><th scope="col">{{ t("redis.hashed") }}</th></tr></thead>
        <tbody><tr v-for="row in rows" :key="row.position" data-testid="redis-slots-key">
          <td>{{ row.position }}</td>
          <td><strong data-testid="redis-slots-slot">{{ row.slot }}</strong><p><code>0x{{ row.crc16 }}</code></p></td>
          <td><code dir="ltr">{{ row.keyJson }}</code><p class="hint">{{ t("redis.bytes", { count: row.keyBytes }) }}</p></td>
          <td><code dir="ltr">{{ row.hashedJson }}</code><p class="hint">{{ t(row.hashTag === null ? "redis.wholeKey" : "redis.hashTag") }} · {{ t("redis.bytes", { count: row.hashedBytes }) }}</p></td>
        </tr></tbody>
      </table>
    </div>
    <p class="hint">{{ t("redis.exportHelp") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.redis-scope { margin-top: 1rem; }
.redis-totals { display: flex; flex-wrap: wrap; gap: 1rem 2rem; margin-block: 1rem; }
dt { font-size: .8rem; color: var(--muted-foreground); }
dd { margin: .3rem 0 0; font-family: var(--font-mono); font-size: 1.2rem; }
table { width: 100%; min-width: 40rem; table-layout: fixed; }
caption { text-align: start; padding-block: .6rem; color: var(--muted-foreground); font-size: .85rem; }
th:first-child { width: 11%; }
th:nth-child(2) { width: 16%; }
td { overflow-wrap: anywhere; vertical-align: top; }
code { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; unicode-bidi: isolate; }
</style>
