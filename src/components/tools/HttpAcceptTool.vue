<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { ACCEPT_LIMITS, previewHttpAccept, formatAcceptQuality } from "@/lib/tools/http-accept";
import { ACCEPT_SAMPLE, ACCEPT_OFFERS_SAMPLE } from "@/lib/tools/http-accept-sample";

const { t } = useAppI18n();
const accept = ref(""), offered = ref(""), absent = ref(false);
const acceptRejected = ref(false), offersRejected = ref(false), revision = ref(0);
const source = computed(() => ({ accept: accept.value, offered: offered.value, absent: absent.value,
  acceptRejected: acceptRejected.value, offersRejected: offersRejected.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(offered.value.trim()) && (absent.value || !acceptRejected.value) && !offersRejected.value,
  mode: () => (absent.value ? 0 : accept.value.length) + offered.value.length <= ACCEPT_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => previewHttpAccept(accept.value, offered.value, absent.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
const selected = computed(() => result.value?.offers.find(offer => offer.index === result.value?.selectedOfferIndex));
function replace(example: boolean) {
  revision.value++; acceptRejected.value = false; offersRejected.value = false; absent.value = false;
  accept.value = example ? ACCEPT_SAMPLE : ""; offered.value = example ? ACCEPT_OFFERS_SAMPLE : "";
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="accept-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="accept-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <label class="accept-absent"><input v-model="absent" type="checkbox" data-testid="accept-absent" />{{ t("accept.absent") }}</label>
    <div class="accept-inputs">
      <CodeInput :key="`accept:${revision}`" :model-value="accept" :label="t('accept.input')" input-id="http-accept-input" :rows="6" :file="false" :disabled="absent" :max-bytes="ACCEPT_LIMITS.bytes" :placeholder="ACCEPT_SAMPLE" @update:model-value="accept = $event; acceptRejected = false" @rejected="acceptRejected = true" />
      <CodeInput :key="`offers:${revision}`" :model-value="offered" :label="t('accept.offers')" input-id="accept-offers" :rows="6" :file="false" :max-bytes="ACCEPT_LIMITS.bytes" :placeholder="ACCEPT_OFFERS_SAMPLE" @update:model-value="offered = $event; offersRejected = false" @rejected="offersRejected = true" />
    </div>
    <div class="run-bar">
      <p class="hint">{{ t("tool.http-accept.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="accept-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice accept-rules">{{ t("accept.rules") }}</p>
  <p class="hint">{{ t("accept.scope") }}</p>
  <p class="hint">{{ t("accept.limits") }}</p>
  <p v-if="(!absent && acceptRejected) || offersRejected" class="notice" role="status">{{ t("accept.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="accept-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-http-accept.json" type="application/json;charset=utf-8" />
    </div>
    <p class="accept-selection"><strong>{{ t("accept.selected") }}</strong> <code v-if="selected" data-testid="accept-selected">{{ selected.source }}</code><span v-else data-testid="accept-none">{{ t("accept.none") }}</span></p>
    <p class="hint">{{ t("accept.tie") }}</p>
    <p v-if="!selected" class="notice">{{ t("accept.no406") }}</p>
    <div class="table-scroll" tabindex="0" role="region" :aria-label="t('accept.evaluated')">
      <table class="data-table">
        <caption>{{ t("accept.evaluated") }}</caption>
        <thead><tr><th scope="col">{{ t("accept.offeredType") }}</th><th scope="col">q</th><th scope="col">{{ t("accept.governing") }}</th><th scope="col">{{ t("accept.reason") }}</th></tr></thead>
        <tbody><tr v-for="offer in result.offers" :key="offer.index" :data-testid="`accept-offer-${offer.index}`"><td><code>{{ offer.index }}. {{ offer.source }}</code></td><td><code>{{ formatAcceptQuality(offer.quality) }}</code></td><td><code>{{ offer.governingRanges.join(', ') || '—' }}</code></td><td>{{ t('accept.' + offer.reason) }}</td></tr></tbody>
      </table>
    </div>
    <div v-if="result.ranges.length" class="table-scroll" tabindex="0" role="region" :aria-label="t('accept.ranges')">
      <table class="data-table accept-ranges">
        <caption>{{ t("accept.ranges") }}</caption>
        <thead><tr><th scope="col">{{ t("accept.range") }}</th><th scope="col">q</th></tr></thead>
        <tbody><tr v-for="range in result.ranges" :key="range.index"><td><code>{{ range.index }}. {{ range.source }}</code></td><td><code>{{ formatAcceptQuality(range.quality) }}</code></td></tr></tbody>
      </table>
    </div>
    <p class="hint">{{ t("accept.empty", { ranges: result.emptyAcceptSlots, lines: result.emptyOfferLines }) }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.accept-inputs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.accept-absent { display: flex; align-items: center; gap: .5rem; margin-bottom: .8rem; font-size: .9rem; }
.accept-rules { margin-top: 1rem; }
.accept-selection { display: flex; flex-wrap: wrap; gap: .6rem; }
code { white-space: pre-wrap; overflow-wrap: anywhere; }
table { width: 100%; table-layout: fixed; }
caption { text-align: start; padding-block: .6rem; color: var(--muted-foreground); font-size: .85rem; }
th:first-child { width: 40%; } th:nth-child(2) { width: 20%; }
th:nth-child(3) { width: 18%; }
td:nth-child(2) code { white-space: nowrap; overflow-wrap: normal; }
.accept-ranges th:first-child { width: 80%; }
td { overflow-wrap: anywhere; vertical-align: top; }
@media (max-width: 700px) { .accept-inputs { grid-template-columns: minmax(0, 1fr); } }
</style>
