<script setup vapor lang="ts">
import { ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import {
  BASE64_LIMITS,
  transformBase64,
  type Base64Alphabet,
  type Base64Direction,
  type Base64Result,
} from "@/lib/tools/base64";
import { ToolError } from "@/lib/tools/errors";

interface WorkerReply {
  ok: boolean;
  result?: Base64Result;
  code?: string;
}

function processInWorker(
  text: string,
  direction: Base64Direction,
  alphabet: Base64Alphabet,
  signal: AbortSignal,
): Promise<Base64Result> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new ToolError("CANCELLED"));
      return;
    }
    const worker = new Worker(new URL("../../workers/base64.worker.ts", import.meta.url), {
      type: "module",
    });
    let done = false;
    const finish = (result?: Base64Result, error?: string) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      worker.terminate();
      if (error) reject(new ToolError(error));
      else if (result) resolve(result);
      else reject(new ToolError("INTERNAL_ERROR"));
    };
    const abort = () => finish(undefined, "CANCELLED");
    const timeout = setTimeout(() => finish(undefined, "TIMEOUT"), 5000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply?.ok && reply.result) finish(reply.result);
      else finish(undefined, reply?.code ?? "INTERNAL_ERROR");
    };
    worker.onerror = () => finish(undefined, "INTERNAL_ERROR");
    worker.postMessage({ input: text, direction, alphabet });
  });
}

const { t, locale } = useAppI18n();
const input = ref("");
const direction = ref<Base64Direction>("encode");
const alphabet = ref<Base64Alphabet>("standard");
const { result, error, control, apply, cancel, setAuto } = useToolExecution<Base64Result>({
  source: () => [input.value, direction.value, alphabet.value],
  canRun: () => input.value.length > 0,
  mode: () => (input.value.length <= BASE64_LIMITS.workerThreshold ? "instant" : "deferred"),
  execute: (signal) =>
    input.value.length <= BASE64_LIMITS.workerThreshold
      ? transformBase64(input.value, direction.value, alphabet.value)
      : processInWorker(input.value, direction.value, alphabet.value, signal),
});

function example() {
  input.value = direction.value === "encode" ? "こんにちは 👋" : "44GT44KT44Gr44Gh44GvIPCfkYs=";
}
function swap() {
  if (!result.value) return;
  const nextInput = result.value.output;
  direction.value = direction.value === "encode" ? "decode" : "encode";
  input.value = nextInput;
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" @click="example">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" :disabled="!input" @click="input = ''">{{
          t("actions.clear")
        }}</Button>
      </div>
    </div>
    <div class="control-row base64-controls">
      <label class="field-label" for="base64-direction">{{ t("base64.direction") }}</label>
      <select id="base64-direction" v-model="direction" class="native-select" data-testid="base64-direction">
        <option value="encode">{{ t("base64.encode") }}</option>
        <option value="decode">{{ t("base64.decode") }}</option>
      </select>
      <label class="field-label" for="base64-alphabet">{{ t("base64.alphabet") }}</label>
      <select id="base64-alphabet" v-model="alphabet" class="native-select" data-testid="base64-alphabet">
        <option value="standard">{{ t("base64.standard") }}</option>
        <option value="url">{{ t("base64.url") }}</option>
      </select>
    </div>
    <CodeInput
      v-model="input"
      :label="t('labels.input')"
      input-id="base64-input"
      :max-bytes="BASE64_LIMITS.inputBytes"
      :rows="6"
      :file="false"
    />
    <div class="run-bar">
      <p class="hint">{{ t("tool.base64.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="result.output" filename="army-knife-base64.txt" type="text/plain;charset=utf-8" />
    </div>
    <div class="metric-grid">
      <div class="metric">
        <span class="metric-label">{{ t("base64.inputBytes") }}</span>
        <strong class="metric-value">{{ result.inputBytes.toLocaleString(locale) }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t("base64.outputBytes") }}</span>
        <strong class="metric-value">{{ result.outputBytes.toLocaleString(locale) }}</strong>
      </div>
    </div>
    <pre class="code-output" data-testid="base64-output">{{ result.output }}</pre>
    <div class="control-row base64-swap">
      <Button variant="outline" size="sm" @click="swap">{{ t("actions.swap") }}</Button>
    </div>
    <p class="hint">{{ t("base64.resultHint") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.base64-controls {
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 16px;
}
.base64-controls .native-select {
  min-width: 145px;
  max-width: 100%;
}
.base64-swap {
  margin-top: 16px;
}
</style>
