<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { DNS_TXT_LIMITS, restoreDnsTxt, splitDnsTxt } from "@/lib/tools/dns-txt";
import { DNS_TXT_SAMPLE_RDATA, DNS_TXT_SAMPLE_TEXT } from "@/lib/tools/dns-txt-sample";

const { t } = useAppI18n();
const mode = ref<"split" | "restore">("split");
const input = ref(""), active = ref(false), rejected = ref(false), revision = ref(0);
const source = computed(() => ({ mode: mode.value, input: input.value, active: active.value, rejected: rejected.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => active.value && !rejected.value,
  mode: () => input.value.length <= DNS_TXT_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => mode.value === "split" ? splitDnsTxt(input.value) : restoreDnsTxt(input.value),
});
function replace(sample: boolean) {
  revision.value++; rejected.value = false; active.value = sample;
  input.value = sample ? (mode.value === "split" ? DNS_TXT_SAMPLE_TEXT : DNS_TXT_SAMPLE_RDATA) : "";
}
function changeMode(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value !== "split" && value !== "restore") return;
  mode.value = value; replace(false);
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="dns-txt-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="dns-txt-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div class="dns-txt-mode">
      <label for="dns-txt-mode">{{ t("dnsTxt.mode") }}</label>
      <select id="dns-txt-mode" class="native-select" :value="mode" @change="changeMode">
        <option value="split">{{ t("dnsTxt.split") }}</option>
        <option value="restore">{{ t("dnsTxt.restore") }}</option>
      </select>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t(mode === 'split' ? 'dnsTxt.textInput' : 'dnsTxt.rdataInput')" input-id="dns-txt-input" :rows="5" :file="false" :max-bytes="mode === 'split' ? DNS_TXT_LIMITS.textBytes : DNS_TXT_LIMITS.rdataBytes" :placeholder="mode === 'split' ? DNS_TXT_SAMPLE_TEXT : DNS_TXT_SAMPLE_RDATA" @update:model-value="input = $event; rejected = false; active = true" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.dns-txt.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="dns-txt-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice dns-txt-scope">{{ t("dnsTxt.scope") }}</p>
  <p class="hint">{{ t("dnsTxt.grammar") }}</p>
  <p class="hint">{{ t("dnsTxt.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("dnsTxt.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="dns-txt-result">
    <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
    <dl class="dns-txt-totals">
      <div><dt>{{ t("dnsTxt.dataBytes") }}</dt><dd data-testid="dns-txt-data-bytes">{{ result.dataBytes }}</dd></div>
      <div><dt>{{ t("dnsTxt.wireBytes") }}</dt><dd data-testid="dns-txt-wire-bytes">{{ result.wireBytes }}</dd></div>
      <div><dt>{{ t("dnsTxt.segmentCount") }}</dt><dd>{{ result.segments.length }}</dd></div>
    </dl>
    <section class="dns-txt-output" data-testid="dns-txt-rdata">
      <div class="result-header">
        <h3>{{ t("dnsTxt.rdata") }}</h3>
        <OutputActions :text="result.rdata" filename="army-knife-dns-txt-rdata.txt" />
      </div>
      <pre><code>{{ result.rdata }}</code></pre>
    </section>
    <section class="dns-txt-output" data-testid="dns-txt-text">
      <div class="result-header">
        <h3>{{ t("dnsTxt.text") }}</h3>
        <OutputActions :text="result.text" filename="army-knife-dns-txt-text.txt" />
      </div>
      <p v-if="!result.text" class="hint">{{ t("dnsTxt.emptyText") }}</p>
      <pre><code>{{ result.text }}</code></pre>
    </section>
    <div class="table-scroll" tabindex="0" role="region" :aria-label="t('dnsTxt.segments')">
      <table class="data-table">
        <caption>{{ t("dnsTxt.segments") }}</caption>
        <thead><tr><th scope="col">{{ t("dnsTxt.index") }}</th><th scope="col">{{ t("dnsTxt.bytes") }}</th><th scope="col">{{ t("dnsTxt.literal") }}</th></tr></thead>
        <tbody><tr v-for="segment in result.segments" :key="segment.index" data-testid="dns-txt-segment"><td>{{ segment.index }}</td><td>{{ segment.bytes }}</td><td><code>{{ segment.literal }}</code></td></tr></tbody>
      </table>
    </div>
    <p class="hint">{{ t("dnsTxt.exportHelp") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.dns-txt-mode { display: flex; flex-wrap: wrap; align-items: center; gap: .7rem; margin-bottom: 1rem; font-size: .9rem; }
.dns-txt-mode select { max-width: 100%; }
.dns-txt-scope { margin-top: 1rem; }
.dns-txt-totals { display: flex; flex-wrap: wrap; gap: 1rem 2rem; margin-block: 1rem; }
dt { font-size: .8rem; color: var(--muted-foreground); }
dd { margin: .3rem 0 0; font-family: var(--font-mono); font-size: 1.2rem; }
h3 { font-size: .95rem; font-weight: 600; }
.dns-txt-output { margin-block: 1.2rem; min-width: 0; }
pre { padding: .8rem; border: 1px solid var(--border); border-radius: .5rem; min-height: 2.8rem; }
pre, code { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
table { width: 100%; table-layout: fixed; }
caption { text-align: start; padding-block: .6rem; color: var(--muted-foreground); font-size: .85rem; }
th:first-child, th:nth-child(2) { width: 20%; }
td { overflow-wrap: anywhere; vertical-align: top; }
</style>
