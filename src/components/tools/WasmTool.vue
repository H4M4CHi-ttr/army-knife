<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { FlaskConical, Trash2, LoaderCircle } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { runEngine } from "@/lib/wasm/client";
import type { EngineRequest, EngineResult, CsvRequest, SetOperation } from "@/lib/wasm/types";

const props = defineProps<{ id: "csv" | "logs" | "sets" }>();
const { t } = useAppI18n();
const input = ref("");
const right = ref("");
const delimiter = ref<CsvRequest["delimiter"]>(",");
const header = ref(true);
const trim = ref(false);
const pattern = ref("");
const caseInsensitive = ref(false);
const ignoreEmpty = ref(true);
const mode = ref<SetOperation>("intersection");
const { result, error, busy, control, apply, cancel, setAuto } = useToolExecution<
  Exclude<EngineResult, { operation: "har" }>
>({
  source: () => [
    input.value,
    right.value,
    delimiter.value,
    header.value,
    trim.value,
    pattern.value,
    caseInsensitive.value,
    ignoreEmpty.value,
    mode.value,
  ],
  canRun: () => Boolean(input.value || (props.id === "sets" && right.value)),
  execute: (signal) => runEngine(request(), { signal }),
});
const modes: SetOperation[] = [
  "intersection",
  "union",
  "leftOnly",
  "rightOnly",
  "symmetricDifference",
];
const levels = ["trace", "debug", "info", "warn", "error", "fatal", "other"] as const;
/** Full exports are assembled only when the user clicks Copy or Download. */
function outputText(): string {
  const value = result.value;
  return !value
    ? ""
    : value.operation === "sets"
      ? value.items.join("\n")
      : JSON.stringify(value, null, 2);
}

/** Never put an arbitrarily long result line into the DOM. */
const setPreview = computed(() => {
  const value = result.value;
  if (!value || value.operation !== "sets") return { text: "", truncated: false };
  const limit = 8_192;
  let text = "";
  let count = 0;
  let truncated = false;
  for (const item of value.items) {
    if (count >= 1_000) {
      truncated = true;
      break;
    }
    const prefix = count ? "\n" : "";
    const available = limit - text.length - prefix.length;
    if (item.length > available) {
      text += prefix + item.slice(0, Math.max(0, available)) + "…";
      truncated = true;
      break;
    }
    text += prefix + item;
    count++;
  }
  return { text, truncated };
});
const filename = computed(() => `army-knife-${props.id}.${props.id === "sets" ? "txt" : "json"}`);

function sample() {
  if (props.id === "csv") {
    delimiter.value = ",";
    header.value = true;
    trim.value = false;
    input.value =
      "id,name,team,score\n1001,Ada,Platform,98\n1002,Linus,Infrastructure,95\n1003,Grace,,99\n1004,Ken,Platform,\n1005,Margaret,Research,97";
  } else if (props.id === "logs") {
    pattern.value = "";
    input.value =
      "2026-10-11 10:42:01 INFO server ready\n2026-10-11 10:42:02 DEBUG cache warmed\nERROR database connection timed out\n2026-10-11 10:42:03 WARN queue depth exceeded 100\nERROR database connection timed out\n2026-10-11 10:42:04 INFO retry succeeded\nERROR database connection timed out\n2026-10-11 10:42:05 INFO request completed";
  } else {
    input.value = "Vue\nRust\nTypeScript\nPostgreSQL\nRedis\nVue";
    right.value = "Rust\nGo\nPostgreSQL\nSQLite\nTypeScript";
  }
}

function request(): Exclude<EngineRequest, { operation: "har" }> {
  return props.id === "csv"
    ? {
        operation: "csv",
        text: input.value,
        delimiter: delimiter.value,
        header: header.value,
        trim: trim.value,
      }
    : props.id === "logs"
      ? {
          operation: "logs",
          text: input.value,
          pattern: pattern.value,
          caseInsensitive: caseInsensitive.value,
        }
      : {
          operation: "sets",
          left: input.value,
          right: right.value,
          mode: mode.value,
          trim: trim.value,
          caseInsensitive: caseInsensitive.value,
          ignoreEmpty: ignoreEmpty.value,
        };
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" @click="sample"
          ><FlaskConical class="size-3.5" />{{ t("actions.sample") }}</Button
        ><Button
          variant="ghost"
          size="sm"
          @click="
            input = '';
            right = '';
          "
          ><Trash2 class="size-3.5" />{{ t("actions.clear") }}</Button
        >
      </div>
    </div>
    <div :class="['editor-grid', { 'two-editors': id === 'sets' }]">
      <CodeInput
        v-model="input"
        :label="t(id === 'sets' ? 'labels.left' : 'labels.input')"
        :input-id="id === 'sets' ? 'sets-left' : `${id}-input`"
        :rows="11"
      />
      <CodeInput
        v-if="id === 'sets'"
        v-model="right"
        :label="t('labels.right')"
        input-id="sets-right"
        :rows="11"
      />
    </div>
    <div class="options-bar">
      <template v-if="id === 'csv'">
        <label class="inline-field"
          >{{ t("csv.delimiter")
          }}<select v-model="delimiter" class="native-select">
            <option value=",">{{ t("csv.comma") }}</option>
            <option :value="'\t'">{{ t("csv.tab") }}</option>
            <option value=";">{{ t("csv.semicolon") }}</option>
            <option value="|">{{ t("csv.pipe") }}</option>
          </select></label
        >
        <label class="check-label"
          ><input v-model="header" type="checkbox" />{{ t("csv.header") }}</label
        >
        <label class="check-label"
          ><input v-model="trim" type="checkbox" />{{ t("csv.trim") }}</label
        >
      </template>
      <template v-else-if="id === 'logs'">
        <label class="filter-field"
          ><span>{{ t("logs.filter") }}</span
          ><Input
            id="logs-pattern"
            v-model="pattern"
            class="font-mono"
            placeholder="ERROR|WARN"
            spellcheck="false"
        /></label>
        <label class="check-label"
          ><input v-model="caseInsensitive" type="checkbox" />{{ t("logs.case") }}</label
        >
      </template>
      <template v-else>
        <label class="inline-field"
          >{{ t("sets.mode")
          }}<select v-model="mode" class="native-select">
            <option v-for="value in modes" :key="value" :value="value">
              {{ t(`sets.${value}`) }}
            </option>
          </select></label
        >
        <label class="check-label"
          ><input v-model="trim" type="checkbox" />{{ t("sets.trim") }}</label
        >
        <label class="check-label"
          ><input v-model="caseInsensitive" type="checkbox" />{{ t("sets.case") }}</label
        >
        <label class="check-label"
          ><input v-model="ignoreEmpty" type="checkbox" />{{ t("sets.ignoreEmpty") }}</label
        >
      </template>
    </div>
    <div class="run-bar">
      <p class="hint">{{ t(`tool.${id}.hint`) }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <div v-if="error" class="error-panel" role="alert">{{ t(`errors.${error}`) }}</div>
  <div v-if="busy" class="processing-state" role="status">
    <LoaderCircle class="size-5 animate-spin" />{{ t("states.working") }}
  </div>
  <section v-else-if="result" class="result-panel" aria-live="polite" data-testid="tool-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions
        :text="outputText"
        :filename="filename"
        :type="id === 'sets' ? undefined : 'application/json'"
      />
    </div>
    <template v-if="result.operation === 'csv'">
      <div class="metric-grid">
        <div class="metric">
          <span class="metric-label">{{ t("labels.rows") }}</span
          ><strong class="metric-value">{{ result.rows.toLocaleString() }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("labels.columns") }}</span
          ><strong class="metric-value">{{ result.columns }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("csv.ragged") }}</span
          ><strong class="metric-value">{{ result.raggedRows }}</strong>
        </div>
      </div>
      <p v-if="result.duplicateHeaders.length" class="notice">
        {{ t("csv.duplicates", { names: result.duplicateHeaders.join(", ") }) }}
      </p>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t("labels.column") }}</th>
              <th>{{ t("labels.type") }}</th>
              <th>{{ t("labels.empty") }}</th>
              <th>{{ t("labels.unique") }}</th>
              <th>{{ t("labels.samples") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="column in result.profiles" :key="column.index">
              <th class="font-mono">{{ column.name }}</th>
              <td>
                <span
                  class="type-pill"
                  :class="{ 'type-mixed': column.inferredType === 'mixed' }"
                  >{{ t(`types.${column.inferredType}`) }}</span
                >
              </td>
              <td>{{ column.empty.toLocaleString() }}</td>
              <td>{{ column.uniqueCapped ? "≥ " : "" }}{{ column.unique.toLocaleString() }}</td>
              <td class="font-mono sample-cell">{{ column.samples.join(" · ") }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3 class="section-label">{{ t("labels.preview") }}</h3>
      <div class="table-scroll">
        <table class="data-table preview-table">
          <thead>
            <tr>
              <th v-for="column in result.profiles" :key="column.index">{{ column.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in result.preview" :key="index">
              <td v-for="(cell, j) in row" :key="j">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint panel-note">{{ t("csv.previewHint") }}</p>
    </template>
    <template v-else-if="result.operation === 'logs'">
      <div class="metric-grid">
        <div class="metric">
          <span class="metric-label">{{ t("labels.lines") }}</span
          ><strong class="metric-value">{{ result.totalLines.toLocaleString() }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("logs.matched") }}</span
          ><strong class="metric-value">{{ result.matchedLines.toLocaleString() }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("labels.unique") }}</span
          ><strong class="metric-value">{{ result.uniqueLines.toLocaleString() }}</strong>
        </div>
      </div>
      <div class="level-grid">
        <div v-for="level in levels" :key="level" class="level-item">
          <div class="level-header">
            <span :class="`level-${level}`">{{ level.toUpperCase() }}</span
            ><strong>{{ result.levels[level].toLocaleString() }}</strong>
          </div>
          <div class="level-track">
            <span
              :class="`level-bar-${level}`"
              :style="{
                width: `${result.matchedLines ? (result.levels[level] / result.matchedLines) * 100 : 0}%`,
              }"
            ></span>
          </div>
        </div>
      </div>
      <h3 class="section-label">{{ t("logs.frequencies") }}</h3>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t("labels.count") }}</th>
              <th>{{ t("labels.value") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, index) in result.topLines" :key="index">
              <td>{{ line.count.toLocaleString() }}</td>
              <td class="font-mono log-line">{{ line.text }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3 class="section-label">{{ t("labels.preview") }}</h3>
      <pre class="code-output log-preview">{{
        result.preview.join("\n") || t("states.noMatches")
      }}</pre>
      <p class="hint panel-note">{{ t("logs.previewHint") }}</p>
    </template>
    <template v-else>
      <div class="metric-grid">
        <div class="metric">
          <span class="metric-label">{{ t("sets.matches") }}</span
          ><strong class="metric-value">{{ result.count.toLocaleString() }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("sets.uniqueA") }}</span
          ><strong class="metric-value">{{ result.leftUnique.toLocaleString() }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("sets.uniqueB") }}</span
          ><strong class="metric-value">{{ result.rightUnique.toLocaleString() }}</strong>
        </div>
      </div>
      <pre class="code-output">{{
        setPreview.text || t("states.noMatches")
      }}</pre>
      <p v-if="setPreview.truncated" class="hint panel-note">{{ t("largeInput.outputPreview") }}</p>
    </template>
  </section>
  <EmptyResult v-else-if="!busy" />
</template>
