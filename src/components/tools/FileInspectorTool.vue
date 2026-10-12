<script setup vapor lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import OutputActions from "@/components/OutputActions.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { useAppI18n } from "@/i18n/useAppI18n";
import { ToolError } from "@/lib/tools/errors";
import {
  FILE_INSPECTOR_LIMITS, parseHexBytes,
  type EncodingReport, type MagicReport, type SriAlgorithm, type SriReport,
} from "@/lib/tools/file-inspectors";

type Kind = "sri" | "encoding" | "magic";
type BinaryResult =
  | { kind: "sri"; data: SriReport }
  | { kind: "encoding"; data: EncodingReport }
  | { kind: "magic"; data: MagicReport };
interface WorkerReply { ok: boolean; result?: unknown; code?: string; }
interface Request {
  action: Kind | "convert";
  bytes: ArrayBuffer;
  filename?: string;
  algorithm?: SriAlgorithm;
  lineEnding?: "lf" | "crlf";
}

function inWorker<T>(request: Request, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new ToolError("CANCELLED"));
    const worker = new Worker(new URL("../../workers/file-inspector.worker.ts", import.meta.url), { type: "module" });
    let ended = false;
    let timeout = 0;
    const abort = () => finish(undefined, "CANCELLED");
    function finish(value?: T, code?: string) {
      if (ended) return;
      ended = true;
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      worker.terminate();
      if (code) reject(new ToolError(code));
      else resolve(value as T);
    }
    timeout = window.setTimeout(() => finish(undefined, "TIMEOUT"), 15000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onerror = () => finish(undefined, "INTERNAL_ERROR");
    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      if (event.data?.ok) finish(event.data.result as T);
      else finish(undefined, event.data?.code ?? "INTERNAL_ERROR");
    };
    worker.postMessage(request, [request.bytes]);
  });
}

const props = defineProps<{ kind: Kind }>();
const { t, locale } = useAppI18n();
const picker = ref<HTMLInputElement>();
const file = shallowRef<File | null>(null);
const hex = ref("");
const algorithm = ref<SriAlgorithm>("SHA-256");
const ending = ref<"lf" | "crlf">("lf");
const fileError = ref("");
const converting = ref(false);
let conversionController: AbortController | null = null;
const source = () => [file.value, hex.value, algorithm.value, props.kind];

const { result, error, control, apply, cancel, setAuto } = useToolExecution<BinaryResult>({
  source,
  canRun: () => file.value !== null || (props.kind === "sri" && hex.value.trim().length > 0),
  mode: () => file.value && file.value.size > 128 * 1024 || hex.value.length > 4096 ? "deferred" : "instant",
  execute: async (signal) => {
    const chosen = file.value;
    if (chosen && chosen.size > FILE_INSPECTOR_LIMITS.fileBytes) throw new ToolError("INPUT_TOO_LARGE");
    const buffer = chosen ? await chosen.arrayBuffer() : Uint8Array.from(parseHexBytes(hex.value)).buffer;
    if (signal.aborted) throw new ToolError("CANCELLED");
    const options: Request = { action: props.kind, bytes: buffer, filename: chosen?.name ?? "", algorithm: algorithm.value };
    if (props.kind === "sri")
      return { kind: "sri", data: await inWorker<SriReport>(options, signal) };
    if (props.kind === "encoding")
      return { kind: "encoding", data: await inWorker<EncodingReport>(options, signal) };
    return { kind: "magic", data: await inWorker<MagicReport>(options, signal) };
  },
});
const sri = computed(() => result.value?.kind === "sri" ? result.value.data : null);
const encoding = computed(() => result.value?.kind === "encoding" ? result.value.data : null);
const magic = computed(() => result.value?.kind === "magic" ? result.value.data : null);
const warnings = computed(() => result.value?.data && "warnings" in result.value.data ? result.value.data.warnings : []);
const copy = computed(() => sri.value
  ? sri.value.integrity + "\n" + sri.value.html
  : result.value ? JSON.stringify(result.value.data, null, 2) : "");

function invalidateConversion() {
  conversionController?.abort();
  conversionController = null;
  converting.value = false;
}
function clear() {
  invalidateConversion();
  file.value = null;
  hex.value = "";
  fileError.value = "";
}
function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const candidate = input.files?.[0];
  input.value = "";
  if (!candidate) return;
  invalidateConversion();
  file.value = null;
  if (candidate.size > FILE_INSPECTOR_LIMITS.fileBytes) {
    fileError.value = "INPUT_TOO_LARGE";
    return;
  }
  hex.value = "";
  fileError.value = "";
  file.value = candidate;
}
watch(hex, (value) => {
  if (value.trim() && file.value) {
    invalidateConversion();
    file.value = null;
  }
});
onBeforeUnmount(invalidateConversion);

async function downloadConverted() {
  const chosen = file.value;
  if (!chosen || !encoding.value?.valid || converting.value) return;
  invalidateConversion();
  const controller = new AbortController();
  conversionController = controller;
  converting.value = true;
  fileError.value = "";
  try {
    const buffer = await chosen.arrayBuffer();
    if (controller.signal.aborted) return;
    const data = await inWorker<ArrayBuffer>(
      { action: "convert", bytes: buffer, lineEnding: ending.value }, controller.signal,
    );
    if (controller.signal.aborted || file.value !== chosen) return;
    const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = chosen.name.replace(/[\\/]/g, "_") + ".utf8.txt";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (failure) {
    if (!controller.signal.aborted)
      fileError.value = failure instanceof ToolError ? failure.code : "INTERNAL_ERROR";
  } finally {
    if (conversionController === controller) {
      conversionController = null;
      converting.value = false;
    }
  }
}
function sample() {
  clear();
  if (props.kind === "sri") hex.value = "63 6F 6E 73 6F 6C 65 2E 6C 6F 67 28 31 29 3B 0A";
  else {
    // Synthetic bytes; the same bytes go through the exact binary Worker route.
    const bytes = props.kind === "magic"
      ? new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])
      : new Uint8Array([0xef,0xbb,0xbf,65,13,10,66,10,67,13]);
    file.value = new File([bytes], props.kind === "magic" ? "sample.png" : "sample.txt", { type: "application/octet-stream" });
  }
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" @click="sample">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" @click="clear">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div class="file-inspector-control">
      <label class="field-label" :for="kind + '-file'">{{ t("inspector.file") }}</label>
      <Button variant="outline" size="sm" @click="picker?.click()">{{ t("actions.import") }}</Button>
      <span class="hint" data-testid="selected-file">{{ file ? file.name + " (" + file.size.toLocaleString(locale) + " B)" : t("inspector.fileNone") }}</span>
      <input :id="kind + '-file'" ref="picker" type="file" accept="*/*" hidden :aria-label="t('inspector.file')" @change="onFile" />
    </div>
    <template v-if="kind === 'sri'">
      <div class="file-inspector-control">
        <label class="field-label" for="sri-algorithm">{{ t("inspector.algorithm") }}</label>
        <select id="sri-algorithm" v-model="algorithm" class="native-select" data-testid="sri-algorithm">
          <option value="SHA-256">SHA-256</option><option value="SHA-384">SHA-384</option><option value="SHA-512">SHA-512</option>
        </select>
      </div>
      <CodeInput
        v-model="hex" :label="t('inspector.hex')" input-id="sri-hex"
        :max-bytes="FILE_INSPECTOR_LIMITS.hexCharacters" :rows="4" :file="false"
      />
      <p class="hint">{{ t("inspector.hexHint") }}</p>
    </template>
    <div class="run-bar">
      <p class="hint">{{ t("tool." + kind + ".hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error || fileError" class="error-panel" role="alert">{{ t("errors." + (error || fileError)) }}</p>

  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="copy" :filename="'army-knife-' + kind + '.txt'" />
    </div>
    <template v-if="sri">
      <div class="metric-grid"><div class="metric">
        <span class="metric-label">{{ t("inspector.size") }}</span><strong class="metric-value">{{ sri.bytes.toLocaleString(locale) }}</strong>
      </div><div class="metric">
        <span class="metric-label">{{ t("inspector.algorithm") }}</span><strong class="metric-value">{{ sri.algorithm }}</strong>
      </div></div>
      <h3 class="field-label">{{ t("inspector.integrity") }}</h3>
      <pre class="code-output" data-testid="sri-integrity">{{ sri.integrity }}</pre>
      <h3 class="field-label">{{ t("inspector.htmlExample") }}</h3>
      <pre class="code-output">{{ sri.html }}</pre>
    </template>
    <template v-else-if="encoding">
      <div class="metric-grid">
        <div v-for="row in [
          ['encoding', encoding.encoding], ['bom', encoding.bom],
          ['valid', encoding.valid ? t('inspector.yes') : t('inspector.no')],
          ['crlf', String(encoding.crlf)], ['lf', String(encoding.lf)], ['cr', String(encoding.cr)]
        ]" :key="row[0]" class="metric">
          <span class="metric-label">{{ t("inspector." + row[0]) }}</span><strong class="metric-value">{{ row[1] }}</strong>
        </div>
      </div>
      <h3 class="field-label">{{ t("inspector.preview") }}</h3>
      <pre class="code-output" data-testid="encoding-preview">{{ encoding.preview }}</pre>
      <div class="file-inspector-control">
        <label class="field-label" for="encoding-eol">{{ t("inspector.lineEnding") }}</label>
        <select id="encoding-eol" v-model="ending" class="native-select">
          <option value="lf">LF</option><option value="crlf">CRLF</option>
        </select>
        <Button variant="outline" size="sm" :disabled="!encoding.valid || converting" @click="downloadConverted">
          {{ t("inspector.convert") }}
        </Button>
      </div>
      <p class="hint">{{ t("inspector.convertHint") }}</p>
    </template>
    <template v-else-if="magic">
      <div class="metric-grid">
        <div class="metric"><span class="metric-label">{{ t("inspector.size") }}</span><strong class="metric-value">{{ magic.size.toLocaleString(locale) }}</strong></div>
        <div class="metric"><span class="metric-label">{{ t("inspector.extension") }}</span><strong class="metric-value">{{ magic.extension || t("inspector.none") }}</strong></div>
      </div>
      <h3 class="field-label">{{ t("inspector.candidates") }}</h3>
      <ul v-if="magic.candidates.length" class="inspector-list">
        <li v-for="candidate in magic.candidates" :key="candidate.format">
          <strong>{{ candidate.format }}</strong> — {{ candidate.mime }} ({{ candidate.extensions.join(", ") }})
        </li>
      </ul>
      <p v-else class="hint">{{ t("inspector.noMatches") }}</p>
      <h3 class="field-label">{{ t("inspector.header") }}</h3>
      <pre class="code-output">{{ magic.headerHex }}</pre>
      <h3 class="field-label">{{ t("inspector.trailer") }}</h3>
      <pre class="code-output">{{ magic.trailerHex }}</pre>
    </template>
    <div v-if="warnings.length" class="inspector-warnings">
      <h3 class="field-label">{{ t("inspector.warnings") }}</h3>
      <ul><li v-for="warning in warnings" :key="warning">{{ t("inspector.warning." + warning) }}</li></ul>
    </div>
    <p v-else class="hint">{{ t("inspector.noWarnings") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.file-inspector-control { display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; margin:0 0 1rem; min-width:0; }
.file-inspector-control .hint { overflow-wrap:anywhere; min-width:0; }
.file-inspector-control .native-select { min-width:8rem; }
.code-output { white-space:pre-wrap; overflow-wrap:anywhere; margin-bottom:1rem; }
.inspector-list, .inspector-warnings ul { padding-left:1.5rem; margin:0.5rem 0 1rem; overflow-wrap:anywhere; }
.inspector-warnings { margin-top:1rem; }
</style>
