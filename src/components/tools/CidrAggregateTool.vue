<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { aggregateCidrs, CIDR_AGGREGATE_LIMITS, CidrAggregateEntryError } from "@/lib/tools/cidr-aggregate";
import { CIDR_AGGREGATE_SAMPLE, CIDR_AGGREGATE_IPV6_SAMPLE } from "@/lib/tools/cidr-aggregate-sample";

const { t } = useAppI18n();
const input = ref(""), rejected = ref(false), loading = ref(false), revision = ref(0);
const position = ref<number | null>(null);
const source = computed(() => ({ input: input.value, rejected: rejected.value, loading: loading.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(input.value) && !rejected.value && !loading.value,
  mode: () => input.value.length <= CIDR_AGGREGATE_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => {
    position.value = null;
    try { return aggregateCidrs(input.value); }
    catch (failure) { if (failure instanceof CidrAggregateEntryError) position.value = failure.position; throw failure; }
  },
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
const text = computed(() => result.value ? result.value.prefixes.map(p => p.cidr).join("\n") + "\n" : "");
function replace(example: "ipv4" | "ipv6" | "clear") {
  revision.value++; rejected.value = false; loading.value = false; position.value = null;
  input.value = example === "ipv4" ? CIDR_AGGREGATE_SAMPLE : example === "ipv6" ? CIDR_AGGREGATE_IPV6_SAMPLE : "";
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="cidr-aggregate-sample" @click="replace('ipv4')">{{ t("actions.sample") }}</Button>
        <Button variant="outline" size="sm" data-testid="cidr-aggregate-ipv6-sample" @click="replace('ipv6')">{{ t("cidrAgg.ipv6Sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="cidr-aggregate-clear" @click="replace('clear')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('cidrAgg.input')" :input-hint="t('cidrAgg.inputLimit')" input-id="cidr-aggregate-input" :rows="5" :preserve-bom="true" :preserve-carriage-returns="true" :max-bytes="CIDR_AGGREGATE_LIMITS.inputBytes" :placeholder="CIDR_AGGREGATE_SAMPLE" @update:model-value="input = $event; rejected = false" @rejected="rejected = true" @loading="loading = $event" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.cidr-aggregate.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="cidr-aggregate-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice aggregate-scope">{{ t("cidrAgg.scope") }}</p>
  <p class="hint">{{ t("cidrAgg.grammar") }}</p>
  <p class="hint">{{ t("cidrAgg.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("cidrAgg.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }} <span v-if="position !== null" data-testid="cidr-aggregate-error-position">{{ t("cidrAgg.position", { position }) }}</span></p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="cidr-aggregate-result">
    <div class="result-header" data-testid="cidr-aggregate-json">
      <h2><span class="step-number">02</span>{{ t("cidrAgg.json") }}</h2>
      <OutputActions :text="output" filename="army-knife-cidr-aggregate.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="aggregate-totals">
      <div><dt>{{ t("cidrAgg.family") }}</dt><dd data-testid="cidr-aggregate-version">{{ 'IPv' + result.version }}</dd></div>
      <div><dt>{{ t("cidrAgg.inputs") }}</dt><dd data-testid="cidr-aggregate-input-count">{{ result.inputCount }}</dd></div>
      <div><dt>{{ t("cidrAgg.outputs") }}</dt><dd data-testid="cidr-aggregate-output-count">{{ result.prefixes.length }}</dd></div>
      <div class="aggregate-addresses"><dt>{{ t("cidrAgg.total") }}</dt><dd data-testid="cidr-aggregate-total">{{ result.addressCount }}</dd></div>
    </dl>
    <article class="aggregate-list" data-testid="cidr-aggregate-list">
      <div class="result-header">
        <h3 id="cidr-aggregate-list-heading">{{ t("cidrAgg.list") }}</h3>
        <OutputActions :text="text" filename="army-knife-cidr-aggregate.txt" />
      </div>
      <p class="hint">{{ t("cidrAgg.complete", { count: result.prefixes.length }) }}</p>
      <pre tabindex="0" role="region" aria-labelledby="cidr-aggregate-list-heading" data-testid="cidr-aggregate-prefixes">{{ text }}</pre>
    </article>
    <p class="hint">{{ t("cidrAgg.exportHelp") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.aggregate-scope { margin-top: 1rem; }
.aggregate-totals { display: flex; flex-wrap: wrap; gap: 1rem 2rem; margin-block: 1rem; }
.aggregate-totals > div { min-width: 0; }
dt { font-size: .8rem; color: var(--muted-foreground); }
dd { margin: .3rem 0 0; font-family: var(--font-mono); font-size: 1.1rem; overflow-wrap: anywhere; }
.aggregate-list { margin-block: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: .5rem; min-width: 0; }
h3 { font-size: .95rem; font-weight: 600; margin: 0; }
pre { max-height: 20rem; overflow: auto; padding: .8rem; margin-block: .6rem 0; border: 1px solid var(--border); border-radius: .5rem; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; line-height: 1.8; }
.control-row { flex-wrap: wrap; }
@media (max-width: 640px) { .aggregate-addresses { flex-basis: 100%; } }
</style>
