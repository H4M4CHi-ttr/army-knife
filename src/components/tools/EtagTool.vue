<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { ETAG_LIMITS, ETAG_METHODS, inspectEtags, type EtagMethod, type EtagReport } from "@/lib/tools/etag";
import { ETAG_SAMPLE } from "@/lib/tools/etag-sample";

const { t } = useAppI18n();
const current = ref("");
const ifMatch = ref("");
const ifNoneMatch = ref("");
const exists = ref(true);
const matchEnabled = ref(false);
const noneEnabled = ref(false);
const method = ref<EtagMethod>("GET");
const revision = ref(0);
type Field = "current" | "ifMatch" | "ifNoneMatch";
const rejected = ref<Record<Field, boolean>>({ current: false, ifMatch: false, ifNoneMatch: false });
const activeRejected = computed(() => (exists.value && rejected.value.current) || (matchEnabled.value && rejected.value.ifMatch) || (noneEnabled.value && rejected.value.ifNoneMatch));
const input = computed(() => ({ current: current.value, exists: exists.value, method: method.value, ifMatch: matchEnabled.value ? ifMatch.value : null, ifNoneMatch: noneEnabled.value ? ifNoneMatch.value : null }));
const source = computed(() => ({ ...input.value, rejected: activeRejected.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => !activeRejected.value && (matchEnabled.value || noneEnabled.value || !exists.value || current.value.length > 0),
  mode: () => ((exists.value ? current.value.length : 0) + (matchEnabled.value ? ifMatch.value.length : 0) + (noneEnabled.value ? ifNoneMatch.value.length : 0)) <= ETAG_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectEtags(input.value),
});
function json(value: string | EtagReport, pretty = false): string {
  return Array.from(JSON.stringify(value, null, pretty ? 2 : undefined), character => {
    const code = character.charCodeAt(0);
    return code >= 0x80 && code <= 0x9f ? "\\u" + code.toString(16).padStart(4, "0") : character;
  }).join("");
}
const output = computed(() => result.value ? json(result.value, true) : "");
const conditions = computed(() => result.value ? [
  { key: "ifMatch", name: "If-Match", data: result.value.ifMatch },
  { key: "ifNoneMatch", name: "If-None-Match", data: result.value.ifNoneMatch },
] : []);
function accept(field: Field, value: string) {
  rejected.value[field] = false;
  if (field === "current") current.value = value;
  else if (field === "ifMatch") ifMatch.value = value;
  else ifNoneMatch.value = value;
}
function replace(sample: boolean) {
  revision.value++;
  rejected.value = { current: false, ifMatch: false, ifNoneMatch: false };
  exists.value = true;
  method.value = "GET";
  current.value = sample ? ETAG_SAMPLE.current : "";
  ifMatch.value = sample ? ETAG_SAMPLE.ifMatch : "";
  ifNoneMatch.value = sample ? ETAG_SAMPLE.ifNoneMatch : "";
  matchEnabled.value = noneEnabled.value = sample;
  if (sample) void apply();
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="etag-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="etag-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div class="control-row etag-options">
      <label><input v-model="exists" type="checkbox" data-testid="etag-exists" />{{ t("etag.exists") }}</label>
      <label for="etag-method">{{ t("etag.method") }}</label>
      <select id="etag-method" v-model="method" data-testid="etag-method"><option v-for="value in ETAG_METHODS" :key="value" :value="value">{{ value }}</option></select>
    </div>
    <CodeInput :key="`current:${revision}:${exists}`" :model-value="current" :label="t('etag.current')" input-id="etag-current" :rows="2" :max-bytes="ETAG_LIMITS.bytes" :disabled="!exists" placeholder='"revision-2"' @update:model-value="accept('current', $event)" @rejected="rejected.current = true" />
    <p class="hint">{{ t("etag.currentHint") }}</p>
    <div class="etag-inputs">
      <div>
        <label class="etag-toggle"><input v-model="matchEnabled" type="checkbox" data-testid="etag-enable-match" />{{ t("etag.enableMatch") }}</label>
        <CodeInput :key="`match:${revision}:${matchEnabled}`" :model-value="ifMatch" :label="t('etag.matchInput')" input-id="etag-if-match" :rows="3" :max-bytes="ETAG_LIMITS.bytes" :disabled="!matchEnabled" placeholder='"revision-2"' @update:model-value="accept('ifMatch', $event)" @rejected="rejected.ifMatch = true" />
      </div>
      <div>
        <label class="etag-toggle"><input v-model="noneEnabled" type="checkbox" data-testid="etag-enable-none" />{{ t("etag.enableNone") }}</label>
        <CodeInput :key="`none:${revision}:${noneEnabled}`" :model-value="ifNoneMatch" :label="t('etag.noneInput')" input-id="etag-if-none-match" :rows="3" :max-bytes="ETAG_LIMITS.bytes" :disabled="!noneEnabled" placeholder='W/"revision-2", "revision-1"' @update:model-value="accept('ifNoneMatch', $event)" @rejected="rejected.ifNoneMatch = true" />
      </div>
    </div>
    <p class="hint">{{ t("etag.presence") }}</p>
    <div class="run-bar">
      <p class="hint">{{ t("tool.etag.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending || control.busy" variant="outline" size="sm" data-testid="etag-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice etag-scope">{{ t("etag.scope") }}</p>
  <p class="hint">{{ t("etag.limits") }}</p>
  <p class="hint">{{ t("etag.privacy") }}</p>
  <p v-if="activeRejected" class="notice" role="status">{{ t("etag.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="etag-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("etag.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-etag.json" type="application/json;charset=utf-8" />
    </div>
    <h3 data-testid="etag-decision">{{ t("etag.decision." + result.decision) }}</h3>
    <dl class="etag-summary">
      <dt>{{ t("etag.status") }}</dt><dd data-testid="etag-status">{{ result.usualStatus ?? t("etag.noStatus") }}</dd>
      <dt>{{ t("etag.method") }}</dt><dd>{{ result.method }}</dd>
      <dt>{{ t("etag.current") }}</dt><dd><code dir="ltr">{{ result.current ? json(result.current.raw) : t(result.exists ? "etag.currentUnknown" : "etag.noRepresentation") }}</code></dd>
    </dl>
    <p v-if="!result.complete" class="notice" data-testid="etag-incomplete">{{ t("etag.incomplete") }}</p>
    <p v-if="result.alreadyAppliedException" class="notice" data-testid="etag-applied-exception">{{ t("etag.exception") }}</p>
    <p v-if="result.currentIgnored" class="hint">{{ t("etag.currentIgnored") }}</p>
    <p class="hint">{{ t("etag.exportHelp") }}</p>
    <div class="etag-conditions">
      <article v-for="condition in conditions" :key="condition.key" :data-testid="`etag-header-${condition.key}`">
        <h3>{{ condition.name }} · {{ t("etag.comparison." + condition.data.comparison) }}</h3>
        <p>{{ t("etag.condition." + condition.data.state) }}</p>
        <p v-if="condition.data.kind === 'wildcard'" class="hint">{{ t("etag.wildcard") }}</p>
        <p v-if="condition.data.kind === 'list' && !condition.data.tags.length" class="hint">{{ t("etag.emptyList") }}</p>
        <p v-if="condition.data.ignoredEmptyMembers" class="hint">{{ t("etag.emptyIgnored", { count: condition.data.ignoredEmptyMembers }) }}</p>
        <ol v-if="condition.data.tags.length">
          <li v-for="(tag, index) in condition.data.tags" :key="index" data-testid="etag-tag">
            <code dir="ltr">{{ json(tag.raw) }}</code>
            <p class="hint">{{ t(tag.weak ? "etag.strength.weak" : "etag.strength.strong") }} · {{ t("etag.match." + (tag.matches === null ? "unknown" : String(tag.matches))) }}</p>
          </li>
        </ol>
      </article>
    </div>
    <p class="hint">{{ t("etag.escaped") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.etag-options { margin-bottom: 1rem; }
.etag-options label, .etag-toggle { display: inline-flex; align-items: center; gap: .5rem; }
.etag-options select { padding: .4rem; border: 1px solid var(--border); border-radius: .4rem; background: var(--background); color: var(--foreground); }
.etag-inputs, .etag-conditions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.etag-inputs > div { min-width: 0; }
.etag-toggle { margin: .6rem 0; }
.etag-scope { margin-top: 1rem; }
.result-header { flex-wrap: wrap; gap: .7rem; }
.etag-summary { display: grid; grid-template-columns: minmax(8rem, 1fr) minmax(0, 3fr); gap: .6rem 1rem; }
.etag-summary dt { color: var(--muted-foreground); font-size: .85rem; }
.etag-summary dd { margin: 0; min-width: 0; }
.etag-conditions article { min-width: 0; padding: .8rem; border: 1px solid var(--border); border-radius: .5rem; }
.etag-conditions h3 { font-size: .95rem; margin-top: 0; }
.etag-conditions ol { padding-left: 1.3rem; }
.etag-conditions li { margin-top: .7rem; }
code { white-space: pre-wrap; overflow-wrap: anywhere; unicode-bidi: isolate; }
@media (max-width: 700px) {
  .etag-inputs, .etag-conditions, .etag-summary { grid-template-columns: minmax(0, 1fr); }
  .etag-summary { gap: .3rem; }
  .etag-summary dd { margin-bottom: .5rem; }
}
</style>
