<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import {
  analyzeText, transformLiteral, TEXT_ADVANCED_LIMITS,
  type CaseStyle, type LiteralFormat, type LiteralDirection,
} from "@/lib/tools/text-advanced";
import {
  convertColor, inspectConflicts, lookupReference, INSPECTOR_LIMITS,
  type ReferenceKind,
} from "@/lib/tools/inspectors";

type Kind = "text-stats" | "string-literals" | "http-reference" | "git-conflicts" | "color-converter";
type Result =
  | { kind: "text-stats"; data: ReturnType<typeof analyzeText> }
  | { kind: "string-literals"; data: string }
  | { kind: "http-reference"; data: ReturnType<typeof lookupReference> }
  | { kind: "git-conflicts"; data: ReturnType<typeof inspectConflicts> }
  | { kind: "color-converter"; data: ReturnType<typeof convertColor> };

const props = defineProps<{ kind: Kind }>();
const { t, locale } = useAppI18n();
const input = ref("");
const caseStyle = ref<CaseStyle>("upper");
const literalFormat = ref<LiteralFormat>("json");
const literalDirection = ref<LiteralDirection>("encode");
const referenceKind = ref<ReferenceKind>("status");
const source = computed(() => [
  props.kind, input.value, caseStyle.value, literalFormat.value,
  literalDirection.value, referenceKind.value, locale.value,
]);
const { result, error, control, apply, cancel, setAuto } = useToolExecution<Result>({
  source,
  canRun: () => props.kind === "text-stats" || input.value.length > 0,
  mode: () => input.value.length <= TEXT_ADVANCED_LIMITS.deferredChars ? "instant" : "deferred",
  execute: () => {
    switch (props.kind) {
      case "text-stats":
        return { kind: props.kind, data: analyzeText(input.value, locale.value, caseStyle.value) };
      case "string-literals":
        return { kind: props.kind, data: transformLiteral(input.value, literalFormat.value, literalDirection.value) };
      case "http-reference":
        return { kind: props.kind, data: lookupReference(input.value, referenceKind.value) };
      case "git-conflicts":
        return { kind: props.kind, data: inspectConflicts(input.value) };
      case "color-converter":
        return { kind: props.kind, data: convertColor(input.value) };
    }
  },
});

const stats = computed(() => result.value?.kind === "text-stats" ? result.value.data : null);
const literal = computed(() => result.value?.kind === "string-literals" ? result.value.data : null);
const reference = computed(() => result.value?.kind === "http-reference" ? result.value.data : null);
const conflicts = computed(() => result.value?.kind === "git-conflicts" ? result.value.data : null);
const color = computed(() => result.value?.kind === "color-converter" ? result.value.data : null);
const metrics = computed(() => stats.value ? [
  ["utf16", stats.value.utf16],
  ["codePoints", stats.value.codePoints],
  ["graphemes", stats.value.graphemes],
  ["words", stats.value.words],
  ["lines", stats.value.lines],
  ["bytes", stats.value.bytes],
] as const : []);
const inputBytes = computed(() => props.kind === "text-stats"
  ? TEXT_ADVANCED_LIMITS.statsBytes
  : props.kind === "string-literals"
    ? TEXT_ADVANCED_LIMITS.literalBytes
    : INSPECTOR_LIMITS.conflictBytes);
function example() {
  switch (props.kind) {
    case "text-stats": input.value = "Hello 👩‍💻\n日本語 İstanbul"; break;
    case "string-literals": {
      input.value = literalDirection.value === "encode" ? "Hello \"world\"\n日本語" :
        literalFormat.value === "sql" ? "'It''s safe'" :
        literalFormat.value === "xml" ? "&lt;Hello&gt;" :
        literalFormat.value === "csv" ? '"Hello, world"' :
        '"Hello\nworld"';
      break;
    }
    case "http-reference": input.value = referenceKind.value === "status" ? "404" : "application/json; charset=utf-8"; break;
    case "git-conflicts":
      input.value = "start\n<<<<<<< HEAD\nours\n||||||| base\nancestor\n=======\ntheirs\n>>>>>>> topic\nend";
      break;
    case "color-converter": input.value = "#33669980"; break;
  }
}
function pickColor(event: Event) {
  const target = event.target as HTMLInputElement;
  input.value = target.value + (color.value?.hex.slice(-2) || "FF");
}
function preview(value: string): string {
  return value.length > 4096 ? value.slice(0, 4096) + "\n…" : value;
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" @click="example">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" :disabled="!input" @click="input = ''">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div v-if="kind === 'text-stats'" class="control-row inspect-options">
      <label for="inspect-case" class="field-label">{{ t("inspector.caseMode") }}</label>
      <select id="inspect-case" v-model="caseStyle" class="native-select" data-testid="inspect-case">
        <option v-for="style in ['original','upper','lower','title','camel','snake'] as const" :key="style" :value="style">
          {{ t("inspector.case." + style) }}
        </option>
      </select>
    </div>
    <div v-if="kind === 'string-literals'" class="control-row inspect-options">
      <label for="inspect-format" class="field-label">{{ t("inspector.literalFormat") }}</label>
      <select id="inspect-format" v-model="literalFormat" class="native-select" data-testid="inspect-format">
        <option v-for="format in ['json','js','c','xml','csv','sql'] as const" :key="format" :value="format">
          {{ t("inspector.format." + format) }}
        </option>
      </select>
      <label for="inspect-direction" class="field-label">{{ t("inspector.direction") }}</label>
      <select id="inspect-direction" v-model="literalDirection" class="native-select" data-testid="inspect-direction">
        <option value="encode">{{ t("inspector.encode") }}</option>
        <option value="decode">{{ t("inspector.decode") }}</option>
      </select>
    </div>
    <div v-if="kind === 'http-reference'" class="control-row inspect-options">
      <label for="inspect-reference-kind" class="field-label">{{ t("inspector.referenceKind") }}</label>
      <select id="inspect-reference-kind" v-model="referenceKind" class="native-select" data-testid="inspect-reference-kind">
        <option value="status">{{ t("inspector.status") }}</option>
        <option value="mime">{{ t("inspector.mime") }}</option>
      </select>
    </div>
    <div v-if="kind === 'color-converter'" class="control-row inspect-options">
      <label for="inspect-color-picker" class="field-label">{{ t("inspector.colorPicker") }}</label>
      <input id="inspect-color-picker" type="color" :value="color?.hex.slice(0,7) || '#336699'"
        data-testid="inspect-color-picker" @input="pickColor" />
    </div>
    <CodeInput v-if="kind === 'text-stats' || kind === 'string-literals' || kind === 'git-conflicts'"
      v-model="input" :input-id="kind + '-input'" :label="t('labels.input')"
      :rows="kind === 'git-conflicts' ? 10 : 6" :max-bytes="inputBytes" :file="false" />
    <div v-else class="inspect-single-row">
      <label class="field-label" :for="kind + '-input'">{{ t("labels.input") }}</label>
      <input :id="kind + '-input'" v-model="input" type="text" class="native-select inspect-single"
        spellcheck="false" autocomplete="off" />
    </div>
    <div class="run-bar">
      <p class="hint">{{ t("tool." + kind + ".hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result !== null" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
    </div>
    <template v-if="stats">
      <div class="metric-grid" data-testid="text-stats-metrics">
        <div v-for="metric in metrics" :key="metric[0]" class="metric">
          <span class="metric-label">{{ t("inspector.stat." + metric[0]) }}</span>
          <strong class="metric-value">{{ metric[1] }}</strong>
        </div>
      </div>
      <div class="result-header inspect-result-title">
        <h3>{{ t("inspector.transformed") }}</h3>
        <OutputActions :text="stats.transformed" filename="army-knife-text-transformed.txt" />
      </div>
      <pre class="code-output inspect-code" data-testid="text-stats-output">{{ stats.transformed }}</pre>
      <p class="hint">{{ t("inspector.caseNote") }}</p>
    </template>
    <template v-if="literal !== null">
      <div class="control-row inspect-copy">
        <OutputActions :text="literal" filename="army-knife-literal.txt" />
      </div>
      <pre class="code-output inspect-code" data-testid="string-literals-output">{{ literal }}</pre>
      <p class="hint">{{ literalFormat === 'sql' ? t("inspector.sqlWarning") : t("inspector.literalNote") }}</p>
    </template>
    <template v-if="reference">
      <p class="hint">{{ t("inspector.matchCount", { count: reference.total }) }}</p>
      <p v-if="reference.truncated" class="notice">{{ t("inspector.truncated") }}</p>
      <div v-if="reference.entries.length" class="table-scroll">
        <table class="data-table" data-testid="http-reference-output">
          <thead><tr><th>{{ t("labels.value") }}</th><th>{{ t("labels.name") }}</th><th>{{ t("labels.type") }}</th><th>{{ t("inspector.extensions") }}</th><th>{{ t("inspector.usage") }}</th></tr></thead>
          <tbody><tr v-for="entry in reference.entries" :key="entry.value">
            <th scope="row"><code>{{ entry.value }}</code></th><td>{{ entry.title }}</td>
            <td>{{ entry.category }}</td><td>{{ entry.extensions || "—" }}</td><td>{{ entry.usage }}</td>
          </tr></tbody>
        </table>
      </div>
      <p v-else class="hint">{{ t("states.noMatches") }}</p>
      <p class="hint">{{ t("inspector.referenceNote") }}</p>
    </template>
    <template v-if="conflicts">
      <p data-testid="git-conflicts-count">{{ t("inspector.conflictCount", { count: conflicts.conflicts.length }) }}</p>
      <ul v-if="conflicts.diagnostics.length" class="inspect-diagnostics" data-testid="git-conflicts-diagnostics">
        <li v-for="(diagnostic,index) in conflicts.diagnostics" :key="index">
          {{ t("inspector.conflict." + diagnostic.code, { line: diagnostic.line }) }}
        </li>
      </ul>
      <p v-if="!conflicts.conflicts.length && !conflicts.diagnostics.length" class="hint">{{ t("inspector.noConflicts") }}</p>
      <article v-for="(entry,index) in conflicts.conflicts" :key="entry.start" class="inspect-conflict"
        data-testid="git-conflicts-output">
        <h3>{{ t("inspector.conflictTitle", { number: index + 1, start: entry.start, end: entry.end }) }}</h3>
        <p v-if="entry.before" class="hint inspect-context">{{ entry.before }}</p>
        <div class="editor-grid two-editors">
          <div><div class="inspect-side"><strong>{{ t("inspector.ours") }}</strong><OutputActions :text="entry.ours" /></div>
            <pre class="code-output inspect-code">{{ preview(entry.ours) }}</pre></div>
          <div><div class="inspect-side"><strong>{{ t("inspector.theirs") }}</strong><OutputActions :text="entry.theirs" /></div>
            <pre class="code-output inspect-code">{{ preview(entry.theirs) }}</pre></div>
        </div>
        <details v-if="entry.base !== null">
          <summary>{{ t("inspector.base") }}</summary>
          <OutputActions :text="entry.base" /><pre class="code-output inspect-code">{{ preview(entry.base) }}</pre>
        </details>
        <p v-if="entry.after" class="hint inspect-context">{{ entry.after }}</p>
      </article>
      <p class="hint">{{ t("inspector.conflictNote") }}</p>
    </template>
    <template v-if="color">
      <div class="inspect-color-preview" :style="{ backgroundColor: color.rgb }" data-testid="color-converter-preview" />
      <div class="table-scroll">
        <table class="data-table" data-testid="color-converter-output">
          <tbody>
            <tr v-for="format in ['hex','rgb','hsl','hsv'] as const" :key="format">
              <th scope="row">{{ format.toUpperCase() }}</th>
              <td class="inspect-color-value"><code>{{ color[format] }}</code></td>
              <td><OutputActions :text="color[format]" :filename="'army-knife-color-' + format + '.txt'" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint">{{ t("inspector.colorNote") }}</p>
    </template>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.inspect-options { align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.inspect-options .native-select { min-width: 125px; max-width: 100%; }
.inspect-single-row { display: grid; gap: 7px; min-width: 0; }
.inspect-single { width: 100%; min-width: 0; }
.inspect-code { max-height: 280px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; }
.inspect-result-title { margin-top: 16px; }
.inspect-result-title h3 { font-size: .9rem; }
.inspect-copy { justify-content: flex-end; margin-bottom: 10px; }
.inspect-conflict { margin-top: 20px; border-top: 1px solid var(--border); padding-top: 14px; min-width: 0; }
.inspect-conflict h3 { font-size: .95rem; margin-bottom: 12px; }
.inspect-side { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.inspect-context { white-space: pre-wrap; overflow-wrap: anywhere; margin: 10px 0; }
.inspect-diagnostics { padding-left: 20px; color: var(--negative); }
.inspect-color-preview { height: 96px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 15px; }
.inspect-color-value { overflow-wrap: anywhere; word-break: break-word; }
.inspect-color-value code { white-space: pre-wrap; }
.data-table { min-width: 480px; }
</style>
