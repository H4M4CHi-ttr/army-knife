<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { JWK_LIMITS, JWK_SAMPLE, inspectJwk } from "@/lib/tools/jwk";

const { t } = useAppI18n();
const input = ref("");
const rejected = ref(false);
const revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(input.value) && !rejected.value,
  mode: () => input.value.length <= JWK_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: signal => inspectJwk(input.value, signal),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function accept(value: string) { rejected.value = false; input.value = value; }
function replace(value: string) {
  const restart = value === input.value && !rejected.value;
  revision.value++;
  rejected.value = false;
  input.value = value;
  if (restart) void apply();
}
function visible(value: string | string[] | null): string {
  if (value === null) return t("jwk.absent");
  return JSON.stringify(value).replace(/[\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="jwk-sample" @click="replace(JWK_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="jwk-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('jwk.input')" input-id="jwk-input" :rows="9" :max-bytes="JWK_LIMITS.bytes" placeholder='{"keys":[...]}' @update:model-value="accept" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.jwk.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending || control.busy" variant="outline" size="sm" data-testid="jwk-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice jwk-scope">{{ t("jwk.scope") }}</p>
  <p class="hint">{{ t("jwk.limits") }}</p>
  <p class="hint">{{ t("jwk.privacy") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("jwk.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="jwk-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ result.kind }} · {{ t("jwk.count", { count: result.keys.length }) }}</h2>
      <OutputActions :text="output" filename="army-knife-jwk.json" type="application/json;charset=utf-8" />
    </div>
    <p class="hint">{{ t("jwk.exportHelp") }}</p>
    <p v-if="result.ignoredTopLevelMembers" class="notice">{{ t("jwk.ignoredTop", { count: result.ignoredTopLevelMembers }) }}</p>
    <p v-if="!result.keys.length">{{ t("jwk.empty") }}</p>
    <ol class="jwk-keys">
      <li v-for="key in result.keys" :key="key.index" data-testid="jwk-key">
        <h3>{{ t("jwk.key", { index: key.index }) }} · {{ key.kty }}</h3>
        <dl>
          <dt>kid</dt><dd><code dir="ltr">{{ visible(key.kid) }}</code></dd>
          <dt>alg</dt><dd><code dir="ltr">{{ visible(key.alg) }}</code><p :class="key.algorithmAssessment === 'mismatch' ? 'notice' : 'hint'">{{ t("jwk.assessment." + key.algorithmAssessment) }}</p></dd>
          <dt>use / key_ops</dt><dd><code dir="ltr">{{ visible(key.use) }} / {{ visible(key.keyOps) }}</code></dd>
          <template v-if="key.curve"><dt>{{ t("jwk.curve") }}</dt><dd><code>{{ key.curve }}</code></dd></template>
          <template v-if="key.modulusBits !== null"><dt>{{ t("jwk.bits") }}</dt><dd>{{ key.modulusBits }}</dd></template>
          <template v-if="key.exponent !== null"><dt>{{ t("jwk.exponent") }}</dt><dd><code>{{ key.exponent }}</code></dd></template>
          <dt>SHA-256 thumbprint</dt><dd><code dir="ltr" data-testid="jwk-thumbprint">{{ key.thumbprint }}</code></dd>
        </dl>
        <ul v-if="key.warnings.length" class="jwk-warnings">
          <li v-for="warning in key.warnings" :key="warning" class="notice">{{ t("jwk.warning." + warning) }}</li>
        </ul>
        <details>
          <summary>{{ t("jwk.canonical") }}</summary>
          <pre dir="ltr"><code>{{ key.canonical }}</code></pre>
        </details>
      </li>
    </ol>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.jwk-scope { margin-top: 1rem; }
.jwk-keys { list-style: none; padding: 0; }
.jwk-keys > li { margin-top: 1rem; padding: .8rem; border: 1px solid var(--border); border-radius: .5rem; min-width: 0; }
.jwk-keys h3 { margin: 0 0 .8rem; }
.jwk-keys dl { display: grid; grid-template-columns: minmax(8rem, 1fr) minmax(0, 3fr); gap: .6rem 1rem; }
.jwk-keys dt { color: var(--muted-foreground); font-size: .85rem; }
.jwk-keys dd { margin: 0; min-width: 0; }
.jwk-keys dd p { margin: .4rem 0 0; }
.jwk-keys code, .jwk-keys pre { white-space: pre-wrap; overflow-wrap: anywhere; unicode-bidi: isolate; }
.jwk-keys pre { max-height: 16rem; overflow-y: auto; padding: .7rem; background: var(--muted); }
.jwk-keys summary { cursor: pointer; margin-top: .7rem; }
.jwk-warnings { padding-left: 1.2rem; }
.jwk-warnings li { margin-top: .4rem; }
@media (max-width: 700px) {
  .jwk-keys dl { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
  .jwk-keys dd { margin-bottom: .5rem; }
}
</style>
