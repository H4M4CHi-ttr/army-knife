<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { FlaskConical, Trash2, CircleCheck } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { compareJson, formatJson, type JsonDiffResult } from "@/lib/tools";

const props = defineProps<{ id: "json-diff" | "json-format" }>();
const { t } = useAppI18n();
const left = ref("");
const right = ref("");
const indent = ref(2);
const { result, error, control, apply, cancel, setAuto } = useToolExecution<{
  diff: JsonDiffResult | null;
  formatted: string | null;
}>({
  source: () => [left.value, right.value, indent.value],
  canRun: () =>
    Boolean(left.value.trim()) && (props.id !== "json-diff" || Boolean(right.value.trim())),
  mode: () => (left.value.length + right.value.length <= 8192 ? "instant" : "deferred"),
  execute: () =>
    props.id === "json-diff"
      ? { diff: compareJson(left.value, right.value), formatted: null }
      : { diff: null, formatted: formatJson(left.value, indent.value) },
});
const diff = computed(() => result.value?.diff ?? null);
const formatted = computed(() => result.value?.formatted ?? null);
const output = computed(() =>
  props.id === "json-diff" ? JSON.stringify(diff.value, null, 2) : (formatted.value ?? ""),
);
function sample() {
  left.value =
    '{"service":"army-knife","version":1,"features":{"wasm":true,"cloud":false},"languages":["en","ja"]}';
  right.value =
    '{"languages":["en","ja","ko"],"service":"army-knife","version":2,"features":{"wasm":true},"theme":"system"}';
}
function preview(value: unknown): string {
  const text = JSON.stringify(value);
  return text === undefined ? "—" : text.length > 500 ? `${text.slice(0, 500)}…` : text;
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
            left = '';
            right = '';
          "
          ><Trash2 class="size-3.5" />{{ t("actions.clear") }}</Button
        >
      </div>
    </div>
    <div :class="['editor-grid', { 'two-editors': id === 'json-diff' }]">
      <CodeInput
        v-model="left"
        :label="t(id === 'json-diff' ? 'labels.before' : 'labels.input')"
        input-id="json-left"
        :max-bytes="512 * 1024"
        :rows="12"
      />
      <CodeInput
        v-if="id === 'json-diff'"
        v-model="right"
        :label="t('labels.after')"
        input-id="json-right"
        :max-bytes="512 * 1024"
        :rows="12"
      />
    </div>
    <div v-if="id === 'json-format'" class="options-bar">
      <label class="inline-field"
        >{{ t("json.indent")
        }}<select v-model="indent" class="native-select">
          <option :value="0">{{ t("json.minify") }}</option>
          <option :value="2">2</option>
          <option :value="4">4</option>
          <option :value="8">8</option>
        </select></label
      >
    </div>
    <div class="run-bar">
      <p class="hint">{{ t(`tool.${id}.hint`) }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t(`errors.${error}`) }}</p>
  <section v-if="diff || formatted !== null" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" :filename="`army-knife-${id}.json`" type="application/json" />
    </div>
    <template v-if="diff">
      <div class="metric-grid">
        <div class="metric">
          <span class="metric-label">{{ t("json.added") }}</span
          ><strong class="metric-value positive">{{ diff.summary.added }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("json.removed") }}</span
          ><strong class="metric-value negative">{{ diff.summary.removed }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("json.replaced") }}</span
          ><strong class="metric-value">{{ diff.summary.replaced }}</strong>
        </div>
      </div>
      <div v-if="diff.equal" class="equal-state">
        <CircleCheck class="size-8" />
        <h3>{{ t("json.equal") }}</h3>
        <p class="hint">{{ t("json.equalHint") }}</p>
      </div>
      <p v-if="diff.truncated" class="notice">{{ t("json.truncated") }}</p>
      <div v-if="diff.changes.length" class="table-scroll">
        <table class="data-table diff-table">
          <thead>
            <tr>
              <th>{{ t("labels.type") }}</th>
              <th>{{ t("json.path") }}</th>
              <th>{{ t("labels.before") }}</th>
              <th>{{ t("labels.after") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(change, index) in diff.changes" :key="index">
              <td>
                <span class="type-pill" :class="`diff-${change.kind}`">{{
                  t(
                    `json.${change.kind === "add" ? "added" : change.kind === "remove" ? "removed" : "replaced"}`,
                  )
                }}</span>
              </td>
              <th class="font-mono">{{ change.path || t("json.root") }}</th>
              <td class="font-mono">{{ preview(change.before) }}</td>
              <td class="font-mono">{{ preview(change.after) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <pre v-else class="code-output">{{ formatted }}</pre>
  </section>
  <EmptyResult v-else />
</template>
