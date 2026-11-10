<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { comparePgLsn, PG_LSN_LIMITS, PG_WAL_SEGMENT_MIB } from "@/lib/tools/pg-lsn";
import { PG_LSN_SAMPLE } from "@/lib/tools/pg-lsn-sample";

const { t } = useAppI18n();
const first = ref(""), second = ref(""), segmentMiB = ref(16);
const rejectedFirst = ref(false), rejectedSecond = ref(false), revision = ref(0);
const source = computed(() => ({ first: first.value, second: second.value, segmentMiB: segmentMiB.value,
  rejectedFirst: rejectedFirst.value, rejectedSecond: rejectedSecond.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(first.value && second.value) && !rejectedFirst.value && !rejectedSecond.value,
  mode: "instant", execute: () => comparePgLsn(first.value, second.value, segmentMiB.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
const positions = computed(() => result.value ? [
  { label: "lsn.first", position: result.value.first }, { label: "lsn.second", position: result.value.second },
] : []);
function replace(example: boolean) {
  revision.value++; rejectedFirst.value = false; rejectedSecond.value = false;
  first.value = example ? PG_LSN_SAMPLE.first : "";
  second.value = example ? PG_LSN_SAMPLE.second : "";
  segmentMiB.value = 16;
}
</script>

<template>
  <div class="tool-panel lsn-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="pg-lsn-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="pg-lsn-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="'first-' + revision" :model-value="first" :label="t('lsn.first')" input-id="pg-lsn-first" :rows="1" :file="false" :max-bytes="PG_LSN_LIMITS.inputBytes" :placeholder="PG_LSN_SAMPLE.first" @update:model-value="first = $event; rejectedFirst = false" @rejected="rejectedFirst = true" />
    <CodeInput :key="'second-' + revision" :model-value="second" :label="t('lsn.second')" input-id="pg-lsn-second" :rows="1" :file="false" :max-bytes="PG_LSN_LIMITS.inputBytes" :placeholder="PG_LSN_SAMPLE.second" @update:model-value="second = $event; rejectedSecond = false" @rejected="rejectedSecond = true" />
    <div class="lsn-option">
      <label for="pg-lsn-segment">{{ t("lsn.segmentSize") }}</label>
      <select id="pg-lsn-segment" v-model.number="segmentMiB">
        <option v-for="size in PG_WAL_SEGMENT_MIB" :key="size" :value="size">{{ size }} MiB</option>
      </select>
    </div>
    <div class="run-bar">
      <p class="hint">{{ t("tool.pg-lsn.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p class="hint lsn-scope">{{ t("lsn.scope") }}</p>
  <p class="hint">{{ t("lsn.boundary") }}</p>
  <p class="hint">{{ t("lsn.limits") }}</p>
  <p v-if="rejectedFirst || rejectedSecond" class="notice" role="status">{{ t("lsn.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="pg-lsn-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-pg-lsn.json" type="application/json;charset=utf-8" />
    </div>
    <p class="lsn-direction" data-testid="pg-lsn-direction">{{ t("lsn." + result.direction) }}</p>
    <dl class="lsn-summary">
      <dt>{{ t("lsn.delta") }}</dt><dd><code data-testid="pg-lsn-delta">{{ result.deltaBytes }}</code></dd>
      <dt>{{ t("lsn.distance") }}</dt><dd><code>{{ result.distanceBytes }}</code></dd>
      <dt>{{ t("lsn.mib") }}</dt><dd>{{ t("lsn.mibValue", { whole: result.distanceMiB.whole, bytes: result.distanceMiB.remainderBytes }) }}</dd>
      <dt>{{ t("lsn.segmentSize") }}</dt><dd><code>{{ result.segmentMiB }} MiB</code></dd>
    </dl>
    <div class="lsn-positions">
      <article v-for="item in positions" :key="item.label" class="lsn-position" data-testid="pg-lsn-position">
        <h3>{{ t(item.label) }}</h3>
        <dl class="lsn-summary">
          <dt>{{ t("lsn.canonical") }}</dt><dd><code>{{ item.position.lsn }}</code></dd>
          <dt>{{ t("lsn.bytes") }}</dt><dd><code>{{ item.position.bytePosition }}</code></dd>
          <dt>{{ t("lsn.segment") }}</dt><dd><code>{{ item.position.segmentNumber }}</code></dd>
          <dt>{{ t("lsn.offset") }}</dt><dd><code>{{ item.position.segmentOffsetBytes }}</code></dd>
        </dl>
        <p v-if="item.position.zero" class="notice" data-testid="pg-lsn-zero">{{ t("lsn.zero") }}</p>
      </article>
    </div>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.lsn-panel :deep(.code-editor) { min-height: 3.5rem; height: 3.5rem; }
.lsn-option { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1rem; margin: 1rem 0; }
.lsn-option label { font-size: .85rem; }
.lsn-option select { padding: .4rem; border: 1px solid var(--border); border-radius: .4rem; background: var(--background); color: var(--foreground); }
.lsn-scope { margin-top: 1rem; }
.lsn-direction { font-weight: 600; }
.lsn-summary { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: .6rem 1rem; }
.lsn-summary dt { color: var(--muted-foreground); font-size: .85rem; }
.lsn-summary dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.lsn-summary code { white-space: pre-wrap; overflow-wrap: anywhere; }
.lsn-positions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 1.5rem; }
.lsn-position { min-width: 0; padding: 1rem; border: 1px solid var(--border); border-radius: .5rem; }
.lsn-position h3 { margin: 0 0 1rem; font-size: .9rem; }
@media (max-width: 900px) { .lsn-positions { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 700px) {
  .lsn-summary { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
  .lsn-summary dd { margin-bottom: .5rem; }
}
</style>
