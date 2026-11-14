<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { SSH_KEY_LIMITS, SSH_KEY_SAMPLE, SSH_KEY_SAMPLE_FINGERPRINT, inspectSshKey } from "@/lib/tools/ssh-key";

const { t } = useAppI18n();
const input = ref({ key: "", expected: "", rejectedKey: false, rejectedExpected: false });
const revision = ref(0);
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source: input,
  canRun: () => Boolean(input.value.key) && !input.value.rejectedKey && !input.value.rejectedExpected,
  mode: () => input.value.key.length + input.value.expected.length <= SSH_KEY_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: signal => inspectSshKey(input.value.key, input.value.expected, signal),
});
function escapeVisible(value: string): string {
  return value.replace(/[\u061c\u007f-\u009f\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/g,
    c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}
const output = computed(() => result.value ? escapeVisible(JSON.stringify(result.value, null, 2)) : "");
function accept(field: "key" | "expected", value: string) {
  input.value = field === "key"
    ? { ...input.value, key: value, rejectedKey: false }
    : { ...input.value, expected: value, rejectedExpected: false };
}
function reject(field: "key" | "expected") {
  input.value = field === "key" ? { ...input.value, rejectedKey: true } : { ...input.value, rejectedExpected: true };
}
function replace(sample: boolean) {
  revision.value++;
  input.value = { key: sample ? SSH_KEY_SAMPLE : "", expected: sample ? SSH_KEY_SAMPLE_FINGERPRINT : "",
    rejectedKey: false, rejectedExpected: false };
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="ssh-key-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="ssh-key-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="'key-' + revision" :model-value="input.key" :label="t('ssh.input')" input-id="ssh-key-input"
      :rows="5" :max-bytes="SSH_KEY_LIMITS.inputBytes" :preserve-bom="true" :placeholder="SSH_KEY_SAMPLE"
      @update:model-value="accept('key', $event)" @rejected="reject('key')" />
    <div class="ssh-key-reference">
      <CodeInput :key="'reference-' + revision" :model-value="input.expected" :label="t('ssh.expected')" input-id="ssh-key-expected"
        :rows="2" :file="false" :max-bytes="SSH_KEY_LIMITS.referenceBytes" :placeholder="SSH_KEY_SAMPLE_FINGERPRINT"
        @update:model-value="accept('expected', $event)" @rejected="reject('expected')" />
      <p class="hint">{{ t("ssh.referenceHint") }}</p>
    </div>
    <div class="run-bar">
      <p class="hint">{{ t("tool.ssh-key.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending || control.busy" variant="outline" size="sm" data-testid="ssh-key-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice ssh-key-scope">{{ t("ssh.scope") }}</p>
  <p class="hint">{{ t("ssh.limits") }}</p>
  <p class="hint">{{ t("ssh.privacy") }}</p>
  <p v-if="input.rejectedKey || input.rejectedExpected" class="notice" role="status">{{ t("ssh.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel ssh-key-result" aria-live="polite" data-testid="ssh-key-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-ssh-key.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="ssh-key-summary">
      <div><dt>{{ t("ssh.type") }}</dt><dd><code>{{ result.type }}</code></dd></div>
      <div><dt>{{ t("ssh.bits") }}</dt><dd>{{ result.keyBits }}</dd></div>
      <div><dt>{{ t("ssh.blobBytes") }}</dt><dd>{{ result.blobBytes }}</dd></div>
    </dl>
    <div class="ssh-key-fingerprint" data-testid="ssh-key-fingerprint">
      <div class="result-header">
        <h3>{{ t("ssh.fingerprint") }}</h3>
        <OutputActions :text="result.fingerprint" filename="army-knife-ssh-fingerprint.txt" />
      </div>
      <pre dir="ltr"><code>{{ result.fingerprint }}</code></pre>
    </div>
    <p class="notice" data-testid="ssh-key-match">{{ t(result.matches === null ? "ssh.noReference" : result.matches ? "ssh.match" : "ssh.mismatch") }}</p>
    <dl class="ssh-key-metadata">
      <template v-if="result.curve"><dt>{{ t("ssh.curve") }}</dt><dd><code>{{ result.curve }}</code></dd></template>
      <template v-if="result.exponent"><dt>{{ t("ssh.exponent") }}</dt><dd><code>{{ result.exponent }}</code></dd></template>
      <dt>{{ t("ssh.comment") }}</dt><dd><code dir="ltr" data-testid="ssh-key-comment">{{ escapeVisible(JSON.stringify(result.comment)) }}</code></dd>
    </dl>
    <p v-if="result.type === 'ssh-rsa'" class="hint">{{ t("ssh.rsaNote") }}</p>
    <p class="hint">{{ t("ssh.exportHelp") }}</p>
    <details>
      <summary>{{ t("ssh.json") }}</summary>
      <pre dir="ltr" data-testid="ssh-key-json"><code>{{ output }}</code></pre>
    </details>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.ssh-key-reference, .ssh-key-scope, .ssh-key-fingerprint { margin-top: 1rem; }
.ssh-key-summary { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.ssh-key-summary > div, .ssh-key-metadata dd { min-width: 0; }
.ssh-key-result dt { color: var(--muted-foreground); font-size: .85rem; }
.ssh-key-result dd { margin: .4rem 0 0; }
.ssh-key-result h3 { margin: 0; font-size: 1rem; }
.ssh-key-result code, .ssh-key-result pre { white-space: pre-wrap; overflow-wrap: anywhere; unicode-bidi: isolate; }
.ssh-key-result pre { padding: .8rem; background: var(--muted); border: 1px solid var(--border); border-radius: .4rem; max-height: 20rem; overflow-y: auto; }
.ssh-key-metadata { display: grid; grid-template-columns: minmax(8rem, 1fr) minmax(0, 3fr); gap: .6rem 1rem; margin-top: 1rem; }
.ssh-key-result summary { cursor: pointer; margin-top: 1rem; }
@media (max-width: 700px) {
  .ssh-key-summary, .ssh-key-metadata { grid-template-columns: minmax(0, 1fr); gap: .5rem; }
  .ssh-key-metadata dd { margin-bottom: .5rem; }
}
</style>
