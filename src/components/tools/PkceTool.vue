<script setup vapor lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { useAppI18n } from "@/i18n/useAppI18n";
import { useToolExecution } from "@/composables/useToolExecution";
import { copyText } from "@/lib/io";
import { createPkce } from "@/lib/tools/pkce";
import { ToolError } from "@/lib/tools/errors";

const { t } = useAppI18n();
const mode = ref<"generate" | "derive">("generate");
const verifierLength = ref(43);
const stateEnabled = ref(true);
const stateLength = ref(32);
const verifier = ref("");
const pasteRejected = ref(false);
const copied = ref("");
const copyError = ref(false);
const { result, error, busy, control, apply, cancel } = useToolExecution({
  source: () => [mode.value, verifierLength.value, stateEnabled.value, stateLength.value, verifier.value, pasteRejected.value],
  canRun: () => mode.value === "generate" || (!pasteRejected.value && verifier.value.length > 0),
  mode: () => mode.value === "generate" ? "deferred" : "instant",
  auto: false,
  execute: (signal) => {
    // Zero is the engine's omission sentinel, reserved for the unchecked option.
    if (mode.value === "generate" && stateEnabled.value && stateLength.value === 0)
      throw new ToolError("PKCE_STATE_LENGTH");
    return createPkce(mode.value === "generate"
    ? { mode: "generate", verifierLength: verifierLength.value, stateLength: stateEnabled.value ? stateLength.value : 0 }
    : { mode: "derive", verifier: verifier.value }, signal);
  },
});
watch(result, () => { copied.value = ""; copyError.value = false; }, { flush: "sync" });
watch([mode, verifier], () => { pasteRejected.value = false; }, { flush: "sync" });
const displayError = computed(() => pasteRejected.value ? "PKCE_VERIFIER" : error.value);
const rows = computed(() => result.value ? [
  { key: "verifier", name: "code_verifier", value: result.value.verifier },
  { key: "challenge", name: "code_challenge", value: result.value.challenge },
  ...(result.value.state === null ? [] : [{ key: "state", name: "state", value: result.value.state }]),
] : []);

function clear() {
  cancel();
  verifier.value = "";
  pasteRejected.value = false;
}
function sample() {
  mode.value = "derive";
  pasteRejected.value = false;
  verifier.value = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
}
function paste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData("text/plain");
  if (text === undefined) return;
  const field = event.target as HTMLTextAreaElement;
  const nextLength = verifier.value.length - (field.selectionEnd - field.selectionStart) + text.length;
  if (nextLength > 128) {
    event.preventDefault();
    clear();
    pasteRejected.value = true;
  }
}
async function copy(key: string, value: string) {
  const current = result.value;
  if (!current) return;
  try {
    await copyText(value);
    if (result.value === current) { copied.value = key; copyError.value = false; }
  } catch {
    if (result.value === current) copyError.value = true;
  }
}
</script>

<template>
  <div class="tool-panel pkce-panel">
    <div class="tool-toolbar">
      <label class="pkce-field" for="pkce-mode">
        <span class="field-label">{{ t("pkce.mode") }}</span>
        <select id="pkce-mode" v-model="mode" class="native-select">
          <option value="generate">{{ t("pkce.generateMode") }}</option>
          <option value="derive">{{ t("pkce.deriveMode") }}</option>
        </select>
      </label>
      <div class="control-row pkce-actions">
        <Button variant="outline" size="sm" data-testid="pkce-sample" @click="sample">{{ t("pkce.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="pkce-clear" @click="clear">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <template v-if="mode === 'generate'">
      <div class="pkce-settings">
        <label class="pkce-field" for="pkce-verifier-length">
          <span class="field-label">{{ t("pkce.verifierLength") }}</span>
          <input id="pkce-verifier-length" v-model.number="verifierLength" type="number" min="43" max="128" step="1" class="native-select" />
        </label>
        <div class="pkce-field">
          <label class="pkce-checkbox" for="pkce-state-enabled">
            <input id="pkce-state-enabled" v-model="stateEnabled" type="checkbox" />{{ t("pkce.includeState") }}
          </label>
          <label v-if="stateEnabled" class="pkce-field" for="pkce-state-length">
            <span class="field-label">{{ t("pkce.stateLength") }}</span>
            <input id="pkce-state-length" v-model.number="stateLength" type="number" min="16" max="128" step="1" class="native-select" />
          </label>
        </div>
      </div>
      <div class="control-row">
        <Button data-testid="pkce-generate" :disabled="busy" @click="apply">{{ t("pkce.generate") }}</Button>
      </div>
    </template>
    <template v-else>
      <label class="pkce-field" for="pkce-verifier-input">
        <span class="field-label">{{ t("pkce.verifierInput") }}</span>
        <textarea id="pkce-verifier-input" v-model="verifier" class="pkce-input font-mono" rows="3"
          maxlength="129" spellcheck="false" autocomplete="off" autocapitalize="off" :aria-invalid="Boolean(displayError)"
          aria-describedby="pkce-hint" @paste="paste" @input="pasteRejected = false" />
      </label>
      <p class="hint">{{ t("pkce.sampleNote") }}</p>
    </template>
    <div v-if="busy" class="control-row" role="status">
      <span>{{ t("pkce.running") }}</span>
      <Button variant="outline" size="sm" data-testid="pkce-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
    <p v-else-if="control.status === 'cancelled'" class="hint" role="status">{{ t("pkce.cancelled") }}</p>
    <p id="pkce-hint" class="hint">{{ t("tool.pkce.hint") }}</p>
    <p class="hint">{{ t("pkce.formula") }}</p>
    <p class="pkce-security">{{ t("pkce.security") }}</p>
  </div>
  <p v-if="displayError" class="error-panel" role="alert">{{ t("errors." + displayError) }}</p>
  <section v-if="result" class="result-panel pkce-results" data-testid="pkce-result" aria-live="polite">
    <div class="result-header"><h2>{{ t("labels.result") }}</h2><code>code_challenge_method=S256</code></div>
    <div v-for="row in rows" :key="row.key" class="pkce-output">
      <div class="pkce-output-header">
        <h3><code>{{ row.name }}</code></h3>
        <Button variant="outline" size="sm" :data-testid="'pkce-copy-' + row.key" @click="copy(row.key, row.value)">
          {{ t(copied === row.key ? "pkce.copied" : "pkce.copy", { field: row.name }) }}
        </Button>
      </div>
      <pre class="code-output" :data-testid="'pkce-' + row.key">{{ row.value }}</pre>
    </div>
    <p v-if="copyError" class="hint error-text" role="status">{{ t("errors.CLIPBOARD_UNAVAILABLE") }}</p>
  </section>
</template>

<style scoped>
.pkce-panel { display: grid; gap: 1rem; }
.pkce-settings { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
.pkce-field { display: grid; gap: 0.5rem; min-width: 0; }
.pkce-field .native-select { width: 100%; min-width: 0; }
.pkce-checkbox { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
.pkce-checkbox input { width: 1rem; height: 1rem; accent-color: var(--primary); }
.pkce-input { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem; background: transparent; color: inherit; resize: vertical; overflow-wrap: anywhere; }
.pkce-input:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.pkce-security { padding: 0.75rem; border-left: 3px solid var(--primary); font-size: 0.875rem; overflow-wrap: anywhere; }
.pkce-results { display: grid; gap: 1rem; }
.pkce-output { min-width: 0; }
.pkce-output-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem; }
.pkce-output-header h3 { font-size: 0.875rem; }
.pkce-results .code-output { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-all; }
.pkce-results .result-header { flex-wrap: wrap; overflow-wrap: anywhere; }
.pkce-results .result-header > code { font-size: 0.75rem; }
.pkce-actions { flex-wrap: wrap; }
</style>
