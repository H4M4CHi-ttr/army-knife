<script setup vapor lang="ts">
import { computed, ref, shallowRef } from "vue";
import ApplyControl from "@/components/ApplyControl.vue";
import CodeInput from "@/components/CodeInput.vue";
import { Button } from "@/components/ui/button";
import { useToolExecution } from "@/composables/useToolExecution";
import { useAppI18n } from "@/i18n/useAppI18n";
import { downloadText } from "@/lib/io";
import { GITIGNORE_LIMITS, inspectGitignore, isInstantGitignore, type GitignoreInput } from "@/lib/tools/gitignore";
import { GITIGNORE_SAMPLE } from "@/lib/tools/gitignore-sample";
import { runInspectorWorker } from "@/lib/tools/inspector-worker";

const { t } = useAppI18n();
const fields = ["rules", "paths"] as const;
type Field = typeof fields[number];
const blank: GitignoreInput = { rules: "", paths: "", windows: false };
const source = shallowRef({ input: blank, rejected: { rules: false, paths: false } });
const revision = ref(0);
const instant = computed(() => isInstantGitignore(source.value.input));
const rejected = computed(() => fields.some(field => source.value.rejected[field]));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(source.value.input.paths) && !rejected.value,
  mode: () => instant.value ? "instant" : "deferred",
  execute: signal => instant.value
    ? inspectGitignore(source.value.input)
    : runInspectorWorker({ kind: "gitignore", input: source.value.input }, signal).then(reply => reply.data),
});

function edit(field: Field, text: string) {
  // CodeInput checks raw pasted bytes first. Converting CRLF to LF keeps
  // valid pasted text editable, and the parser still sees any malformed CR.
  const normalized = text.replaceAll("\r\n", "\n");
  source.value = {
    input: { ...source.value.input, [field]: normalized.includes("\r") ? text : normalized },
    rejected: { ...source.value.rejected, [field]: false },
  };
}

function reject(field: Field) {
  source.value = { ...source.value, rejected: { ...source.value.rejected, [field]: true } };
}

function setWindows(event: Event) {
  source.value = {
    ...source.value,
    input: { ...source.value.input, windows: (event.target as HTMLInputElement).checked },
  };
}

function replace(input: GitignoreInput) {
  revision.value++;
  source.value = { input, rejected: { rules: false, paths: false } };
}

function save() {
  if (result.value) {
    downloadText(JSON.stringify(result.value, null, 2) + "\n", "gitignore-results.json", "application/json;charset=utf-8");
  }
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label">{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="gitignore-sample" @click="replace(GITIGNORE_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="gitignore-clear" @click="replace(blank)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div class="gitignore-inputs" @drop.capture.stop.prevent>
      <div v-for="field in fields" :key="field" class="min-w-0">
        <CodeInput
          :key="revision"
          :input-id="'gitignore-' + field"
          :model-value="source.input[field]"
          :label="t('gitignore.' + field)"
          :input-hint="t('gitignore.inputLimit')"
          :rows="7"
          :max-bytes="GITIGNORE_LIMITS.bytes"
          :file="false"
          preserve-carriage-returns
          @update:model-value="edit(field, $event)"
          @rejected="reject(field)"
        />
      </div>
    </div>
    <p class="hint">{{ t("tool.gitignore.hint") }}</p>
    <label class="windows-option">
      <input type="checkbox" :checked="source.input.windows" data-testid="gitignore-windows" @change="setWindows" />
      {{ t("gitignore.windows") }}
    </label>
    <div class="run-bar">
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="gitignore-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p v-if="rejected" class="notice" role="status">{{ t("gitignore.rejected") }}</p>
  <p v-else-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <p class="sr-only" role="status" aria-atomic="true">{{ result ? t("gitignore.summary", result.counts) : "" }}</p>

  <section v-if="result" class="result-panel" data-testid="gitignore-result">
    <div class="result-header">
      <h2>{{ t("gitignore.summary", result.counts) }}</h2>
      <Button variant="outline" size="sm" data-testid="gitignore-download" @click="save">{{ t("gitignore.download") }}</Button>
    </div>
    <p v-if="result.invalidRules.length" class="notice gitignore-warning" data-testid="gitignore-invalid-rules">
      {{ t("gitignore.invalidRules", { lines: result.invalidRules.join(", ") }) }}
    </p>
    <p v-if="result.rows.length > GITIGNORE_LIMITS.preview" class="notice" data-testid="gitignore-preview">
      {{ t("gitignore.preview", { shown: GITIGNORE_LIMITS.preview, total: result.rows.length }) }}
    </p>
    <ul class="gitignore-rows">
      <li v-for="row in result.rows.slice(0, GITIGNORE_LIMITS.preview)" :key="row.row"
        data-testid="gitignore-row" :data-status="row.status">
        <h3>
          <span class="row-status">{{ t("gitignore." + row.status) }}</span>
          <code><bdi>{{ row.path }}</bdi></code>
        </h3>
        <p v-if="row.ancestor" class="hint">
          {{ t("gitignore.ancestor") }} <code><bdi>{{ row.ancestor }}</bdi></code>
        </p>
        <p v-if="row.rule" class="hint">
          {{ t("gitignore.line", { line: row.rule.line }) }} <code><bdi>{{ row.rule.pattern }}</bdi></code>
        </p>
        <p v-else class="hint">
          {{ t(row.status === "invalid" ? "gitignore.invalidRow" : "gitignore.noRule", { row: row.row }) }}
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.gitignore-inputs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.gitignore-inputs :deep(.code-editor) { min-height: 0; }
.windows-option { display: flex; align-items: baseline; gap: .55rem; font-size: .875rem; width: fit-content; }
.windows-option input { accent-color: var(--primary); }
.run-bar { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: .65rem; }
.gitignore-rows { display: grid; gap: .5rem; }
.gitignore-rows li { border: 1px solid var(--border); border-radius: .5rem; padding: .65rem .75rem; }
.gitignore-rows h3 { display: flex; flex-wrap: wrap; align-items: baseline; gap: .35rem .6rem; }
.gitignore-rows li p { margin-top: .3rem; }
.row-status { font-weight: 650; }
.gitignore-rows code { white-space: break-spaces; overflow-wrap: anywhere; }
.gitignore-warning { overflow-wrap: anywhere; }
@media (max-width: 650px) {
  .gitignore-inputs { grid-template-columns: minmax(0, 1fr); }
}
</style>
