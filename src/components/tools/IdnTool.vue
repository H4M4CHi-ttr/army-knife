<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { IDN_LIMITS, IDN_SAMPLE, inspectIdn } from "@/lib/tools/idn";

const { t } = useAppI18n();
const input = ref("");
const rejected = ref(false);
const revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(input.value) && !rejected.value,
  mode: () => input.value.length <= IDN_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectIdn(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function accept(value: string) { rejected.value = false; input.value = value; }
function replace(value: string) { revision.value++; rejected.value = false; input.value = value; }
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="idn-sample" @click="replace(IDN_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="idn-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('idn.input')" input-id="idn-input" :rows="3" :file="false" :max-bytes="IDN_LIMITS.bytes" placeholder="bücher.example / xn--bcher-kva.example" @update:model-value="accept" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.idn.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="idn-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice idn-scope">{{ t("idn.scope") }}</p>
  <p class="hint">{{ t("idn.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("idn.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="idn-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-idn.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="idn-summary">
      <dt>{{ t("idn.ascii") }}</dt><dd><code dir="ltr" data-testid="idn-ascii">{{ result.ascii }}</code></dd>
      <dt>{{ t("idn.unicode") }}</dt><dd><bdi data-testid="idn-unicode">{{ result.unicode }}</bdi></dd>
    </dl>
    <p v-if="result.changed" class="notice">{{ t("idn.mapping") }}</p>
    <p class="hint">{{ t("idn.syntax") }}</p>
    <p class="hint">{{ t("idn.heuristic") }}</p>
    <ol class="idn-labels">
      <li v-for="(label, index) in result.labels" :key="index">
        <h3>{{ t("idn.label") }} {{ index + 1 }} · <bdi>{{ label.unicode }}</bdi></h3>
        <code dir="ltr">{{ label.ascii }}</code>
        <p>{{ t("idn.scripts") }}: {{ label.scripts.length ? label.scripts.map(script => t('idn.script.' + script)).join(' / ') : t('idn.script.Common') }}</p>
        <p v-for="warning in label.warnings" :key="warning" class="notice">{{ t("idn.warning." + warning) }}</p>
        <p class="hint">{{ t("idn.points") }}</p>
        <ul class="idn-points">
          <li v-for="(point, position) in label.codePoints" :key="position"><bdi>{{ point.character }}</bdi> <code>{{ point.point }}</code> <span>{{ t("idn.script." + point.script) }}</span></li>
        </ul>
      </li>
    </ol>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.idn-scope { margin-top: 1rem; }
.idn-summary { display: grid; grid-template-columns: minmax(10rem, 1fr) minmax(0, 2fr); gap: .6rem 1rem; }
.idn-summary dt { color: var(--muted-foreground); font-size: .85rem; }
.idn-summary dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.idn-labels { padding-left: 1.5rem; }
.idn-labels > li { margin-top: 1rem; padding: .75rem; border: 1px solid var(--border); border-radius: .5rem; }
.idn-labels h3 { margin: 0 0 .5rem; }
.idn-labels p { margin: .5rem 0; }
.idn-points { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; padding: 0; }
.idn-points li { display: flex; align-items: center; gap: .35rem; padding: .3rem .5rem; background: var(--muted); border-radius: .25rem; font-size: .8rem; }
.idn-points bdi { min-width: 1em; text-align: center; }
.idn-summary code, .idn-labels code, .idn-labels bdi { white-space: pre-wrap; overflow-wrap: anywhere; unicode-bidi: isolate; }
@media (max-width: 700px) {
  .idn-summary { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
  .idn-summary dd { margin-bottom: .5rem; }
}
</style>
