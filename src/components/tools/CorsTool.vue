<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { CORS_LIMITS, inspectCors } from "@/lib/tools/cors";

const { t } = useAppI18n();
const origin = ref("");
const method = ref("GET");
const credentials = ref(false);
const unsafeHeaders = ref("");
const forcePreflight = ref(false);
const actualHeaders = ref("");
const preflightHeaders = ref("");
const preflightStatus = ref("204");
const revision = ref(0);
const rejected = ref<Record<string, string>>({});
const rejectionErrors = computed(() => Object.values(rejected.value).filter(Boolean));
const fields = {
  origin: { value: origin, limit: CORS_LIMITS.originBytes, error: "CORS_ORIGIN" },
  method: { value: method, limit: CORS_LIMITS.methodCharacters, error: "CORS_METHOD" },
  unsafe: { value: unsafeHeaders, limit: CORS_LIMITS.unsafeBytes, error: "CORS_LIST_LIMIT" },
  status: { value: preflightStatus, limit: 3, error: "CORS_STATUS" },
};
function updateField(event: Event, key: keyof typeof fields) {
  const element = event.target as HTMLInputElement;
  const field = fields[key];
  if (element.value.length > field.limit) {
    element.value = field.value.value;
    rejected.value[key] = field.error;
  } else {
    rejected.value[key] = "";
    field.value.value = element.value;
  }
}
function pasteField(event: ClipboardEvent, key: keyof typeof fields) {
  const pasted = event.clipboardData?.getData("text/plain");
  if (!pasted) return;
  const element = event.target as HTMLInputElement;
  const length = element.value.length - ((element.selectionEnd ?? 0) - (element.selectionStart ?? 0)) + pasted.length;
  if (length > fields[key].limit) {
    event.preventDefault();
    rejected.value[key] = fields[key].error;
  }
}
function acceptBlock(key: "actual" | "preflight", value: string) {
  rejected.value[key] = "";
  (key === "actual" ? actualHeaders : preflightHeaders).value = value;
}
function rejectBlock(key: "actual" | "preflight") {
  // CodeInput displays the rejection reason; the attempted edit invalidates exports.
  rejected.value[key] = "blocked-input";
}
const source = computed(() => ({
  origin: origin.value, method: method.value, credentials: credentials.value,
  unsafeHeaders: unsafeHeaders.value, forcePreflight: forcePreflight.value,
  actualHeaders: actualHeaders.value, preflightHeaders: preflightHeaders.value,
  preflightStatus: preflightStatus.value,
  rejected: rejectionErrors.value.length > 0,
}));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(origin.value) && rejectionErrors.value.length === 0,
  mode: () => actualHeaders.value.length + preflightHeaders.value.length <= CORS_LIMITS.deferredCharacters
    ? "instant" : "deferred",
  execute: () => inspectCors(source.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function loadSample() {
  rejected.value = {};
  revision.value += 1;
  origin.value = "https://app.example";
  method.value = "PUT";
  credentials.value = true;
  unsafeHeaders.value = "authorization, content-type";
  forcePreflight.value = false;
  preflightStatus.value = "204";
  actualHeaders.value = "Access-Control-Allow-Origin: https://app.example\nAccess-Control-Allow-Credentials: true\nVary: Origin";
  preflightHeaders.value = actualHeaders.value + "\nAccess-Control-Allow-Methods: PUT\nAccess-Control-Allow-Headers: Authorization, Content-Type";
}
function clear() {
  rejected.value = {};
  revision.value += 1;
  origin.value = "";
  method.value = "GET";
  credentials.value = false;
  unsafeHeaders.value = "";
  forcePreflight.value = false;
  actualHeaders.value = "";
  preflightHeaders.value = "";
  preflightStatus.value = "204";
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="cors-sample" @click="loadSample">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" @click="clear">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div class="cors-fields">
      <label class="field-label" for="cors-origin">{{ t("cors.origin") }}
        <input id="cors-origin" :value="origin" class="native-select" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="https://app.example" @input="updateField($event, 'origin')" @paste="pasteField($event, 'origin')" />
      </label>
      <label class="field-label" for="cors-method">{{ t("cors.method") }}
        <input id="cors-method" :value="method" class="native-select" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" @input="updateField($event, 'method')" @paste="pasteField($event, 'method')" />
      </label>
      <label class="check-label"><input id="cors-credentials" v-model="credentials" type="checkbox" />{{ t("cors.credentials") }}</label>
      <label class="check-label"><input id="cors-force" v-model="forcePreflight" type="checkbox" />{{ t("cors.force") }}</label>
    </div>
    <label class="field-label cors-unsafe" for="cors-unsafe">{{ t("cors.unsafe") }}
      <input id="cors-unsafe" :value="unsafeHeaders" class="native-select" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="cors-unsafe-hint" placeholder="authorization, content-type" @input="updateField($event, 'unsafe')" @paste="pasteField($event, 'unsafe')" />
    </label>
    <p id="cors-unsafe-hint" class="hint">{{ t("cors.unsafeHint") }}</p>
    <div class="cors-blocks">
      <CodeInput :key="`actual:${revision}`" :model-value="actualHeaders" :label="t('cors.actual')" input-id="cors-actual" :max-bytes="CORS_LIMITS.blockBytes" :rows="7" :file="false" @update:model-value="acceptBlock('actual', $event)" @rejected="rejectBlock('actual')" />
      <div>
        <CodeInput :key="`preflight:${revision}`" :model-value="preflightHeaders" :label="t('cors.preflight')" input-id="cors-preflight" :max-bytes="CORS_LIMITS.blockBytes" :rows="7" :file="false" @update:model-value="acceptBlock('preflight', $event)" @rejected="rejectBlock('preflight')" />
        <label class="field-label cors-status" for="cors-status">{{ t("cors.status") }}
          <input id="cors-status" :value="preflightStatus" class="native-select" inputmode="numeric" type="text" autocomplete="off" @input="updateField($event, 'status')" @paste="pasteField($event, 'status')" />
        </label>
      </div>
    </div>
    <div class="run-bar">
      <p class="hint">{{ t("tool.cors.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="cors-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="hint cors-scope">{{ t("cors.scope") }}</p>
  <p v-if="rejectionErrors.length" class="notice" role="status">{{ t("cors.rejected") }}</p>
  <template v-for="(code, index) in rejectionErrors" :key="index">
    <p v-if="code !== 'blocked-input'" class="error-panel" role="alert">{{ t("errors." + code) }}</p>
  </template>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="cors-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-cors.json" type="application/json;charset=utf-8" />
    </div>
    <h3 data-testid="cors-outcome" :data-outcome="result.outcome">{{ t("cors." + result.outcome) }}</h3>
    <p>{{ t(result.preflightRequired ? "cors.required" : "cors.notRequired") }} · <code>{{ result.method }}</code></p>
    <p v-if="result.nullOrigin" class="notice">{{ t("cors.null") }}</p>
    <div class="table-scroll">
      <table class="data-table">
        <thead><tr><th>{{ t("cors.columnPhase") }}</th><th>{{ t("cors.condition") }}</th><th>{{ t("cors.columnState") }}</th><th>{{ t("cors.columnReason") }}</th></tr></thead>
        <tbody><tr v-for="(check, index) in result.checks" :key="index" :data-testid="`cors-check-${check.phase}-${check.rule}`" :data-state="check.state">
          <td>{{ t("cors.phase." + check.phase) }}</td>
          <td><code>{{ t("cors.rule." + check.rule) }}</code></td>
          <td>{{ t("cors.state." + check.state) }}</td>
          <td>{{ t("cors.reason." + check.reason) }} <code v-if="check.detail">{{ check.detail }}</code></td>
        </tr></tbody>
      </table>
    </div>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.cors-fields, .cors-blocks { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1rem; padding: 1rem; }
.cors-fields .field-label, .cors-unsafe, .cors-status { display: grid; gap: .4rem; }
.cors-unsafe { margin: 0 1rem; }
#cors-unsafe-hint { padding: 0 1rem; }
.cors-status { margin-top: .75rem; max-width: 18rem; }
.cors-fields input[type="text"], .cors-unsafe input, .cors-status input { width: 100%; min-width: 0; }
.check-label { display: flex; align-items: start; gap: .5rem; overflow-wrap: anywhere; }
.check-label input { margin-top: .25rem; flex-shrink: 0; }
.cors-scope { margin-top: 1rem; }
.data-table td { white-space: normal; overflow-wrap: anywhere; }
.data-table td:last-child { min-width: 16rem; }
@media (max-width: 700px) { .cors-fields, .cors-blocks { grid-template-columns: minmax(0, 1fr); } }
</style>
