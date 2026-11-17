<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { inspectWebSocketAccept, WEBSOCKET_ACCEPT_LIMITS, WEBSOCKET_GUID } from "@/lib/tools/websocket-accept";
import { WEBSOCKET_ACCEPT_SAMPLE } from "@/lib/tools/websocket-accept-sample";

const { t } = useAppI18n();
const key = ref(""), response = ref(""), revision = ref(0);
const rejectedKey = ref(false), rejectedResponse = ref(false);
const loadingKey = ref(false), loadingResponse = ref(false);
const source = computed(() => ({ key: key.value, response: response.value, rejectedKey: rejectedKey.value, rejectedResponse: rejectedResponse.value, loadingKey: loadingKey.value, loadingResponse: loadingResponse.value, revision: revision.value }));
const { result, error, busy, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(key.value) && !rejectedKey.value && !rejectedResponse.value && !loadingKey.value && !loadingResponse.value,
  mode: "instant", execute: signal => inspectWebSocketAccept(key.value, response.value, signal),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
const comparison = computed(() => result.value?.matches === true ? "match" : result.value?.matches === false ? "mismatch" : "notCompared");
function replace(example: boolean) {
  revision.value++; rejectedKey.value = false; rejectedResponse.value = false;
  loadingKey.value = false; loadingResponse.value = false;
  key.value = example ? WEBSOCKET_ACCEPT_SAMPLE.key : "";
  response.value = example ? WEBSOCKET_ACCEPT_SAMPLE.accept : "";
}
</script>

<template>
  <div class="tool-panel websocket-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="websocket-accept-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="websocket-accept-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="'key-' + revision" :model-value="key" :label="t('wsAccept.key')" input-id="websocket-accept-key" :rows="1" :file="false" preserve-bom :max-bytes="WEBSOCKET_ACCEPT_LIMITS.inputBytes" :input-hint="t('wsAccept.inputLimit')" :placeholder="WEBSOCKET_ACCEPT_SAMPLE.key" @update:model-value="key = $event; rejectedKey = false" @rejected="rejectedKey = true" @loading="loadingKey = $event" />
    <CodeInput :key="'response-' + revision" :model-value="response" :label="t('wsAccept.response')" input-id="websocket-accept-response" :rows="1" :file="false" preserve-bom :max-bytes="WEBSOCKET_ACCEPT_LIMITS.inputBytes" :input-hint="t('wsAccept.inputLimit')" :placeholder="WEBSOCKET_ACCEPT_SAMPLE.accept" @update:model-value="response = $event; rejectedResponse = false" @rejected="rejectedResponse = true" @loading="loadingResponse = $event" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.websocket-accept.hint") }}</p>
      <div class="control-row">
        <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
        <template v-if="busy">
          <span role="status" data-testid="websocket-accept-running">{{ t("wsAccept.running") }}</span>
          <Button variant="outline" size="sm" data-testid="websocket-accept-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
        </template>
        <Button v-else-if="control.valid && (control.status === 'cancelled' || control.status === 'error')" variant="outline" size="sm" data-testid="websocket-accept-retry" @click="apply">{{ t("execution.apply") }}</Button>
      </div>
    </div>
  </div>
  <p class="hint websocket-formula">{{ t("wsAccept.formula") }}</p>
  <p class="hint">{{ t("wsAccept.scope") }}</p>
  <p class="hint">{{ t("wsAccept.limits") }}</p>
  <p class="hint">{{ t("wsAccept.cancelHelp") }}</p>
  <p v-if="rejectedKey || rejectedResponse" class="notice" role="status">{{ t("wsAccept.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="websocket-accept-result">
    <div class="result-header" data-testid="websocket-accept-json">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-websocket-accept.json" type="application/json;charset=utf-8" />
    </div>
    <p class="websocket-comparison" :class="{ notice: result.matches === false }" data-testid="websocket-accept-status">{{ t("wsAccept." + comparison) }}</p>
    <dl class="websocket-summary">
      <dt>{{ t("wsAccept.expected") }}</dt><dd><code data-testid="websocket-accept-expected">{{ result.expectedAccept }}</code></dd>
      <template v-if="result.recordedAccept !== null">
        <dt>{{ t("wsAccept.response") }}</dt><dd><code>{{ result.recordedAccept }}</code></dd>
      </template>
      <dt>{{ t("wsAccept.normalizedKey") }}</dt><dd><code>{{ result.key }}</code></dd>
      <dt>{{ t("wsAccept.nonce") }}</dt><dd><code>{{ result.nonceHex }}</code></dd>
      <dt>{{ t("wsAccept.guid") }}</dt><dd><code>{{ WEBSOCKET_GUID }}</code></dd>
      <dt>{{ t("wsAccept.hash") }}</dt><dd><code>{{ result.sha1Hex }}</code></dd>
    </dl>
    <article class="websocket-header" data-testid="websocket-accept-header">
      <div class="result-header">
        <h3>{{ t("wsAccept.header") }}</h3>
        <OutputActions :text="result.responseHeader" filename="army-knife-websocket-accept.txt" />
      </div>
      <pre>{{ result.responseHeader }}</pre>
    </article>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.websocket-panel :deep(.code-editor) { min-height: 3.5rem; height: 3.5rem; }
.websocket-formula { margin-top: 1rem; }
.websocket-comparison { font-weight: 600; }
.websocket-summary { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: .7rem 1rem; }
.websocket-summary dt { color: var(--muted-foreground); font-size: .85rem; }
.websocket-summary dd { margin: 0; min-width: 0; }
.websocket-summary code, .websocket-header pre { white-space: pre-wrap; overflow-wrap: anywhere; }
.websocket-header { margin-top: 1.5rem; padding: 1rem; border: 1px solid var(--border); border-radius: .5rem; min-width: 0; }
.websocket-header h3 { margin: 0; font-size: .9rem; }
.websocket-header pre { margin-bottom: 0; }
.run-bar [role="status"] { font-size: .8rem; color: var(--muted-foreground); }
@media (max-width: 700px) {
  .websocket-summary { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
  .websocket-summary dd { margin-bottom: .5rem; }
}
</style>
