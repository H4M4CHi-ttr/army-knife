<script setup vapor lang="ts">
import { computed, ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { compareEnv, ENV_LIMITS } from "@/lib/tools/env";

const { t } = useAppI18n();
const left = ref("");
const right = ref("");
const revealValues = ref(false);
const includeEqual = ref(false);
const page = ref(1);
const pageSize = 100;
const { result, error, control, apply, cancel, setAuto } = useToolExecution<
  ReturnType<typeof compareEnv>
>({
  source: () => [left.value, right.value],
  canRun: () => Boolean(left.value.trim() || right.value.trim()),
  mode: () => (left.value.length + right.value.length <= 8192 ? "instant" : "deferred"),
  execute: () => compareEnv(left.value, right.value),
});
const changes = computed(
  () =>
    result.value?.changes.filter((change) => includeEqual.value || change.kind !== "equal") ?? [],
);
const pages = computed(() => Math.max(1, Math.ceil(changes.value.length / pageSize)));
const visibleChanges = computed(() =>
  changes.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);
const reports = computed(() =>
  result.value
    ? [
        { label: "env.left", value: result.value.left },
        { label: "env.right", value: result.value.right },
      ]
    : [],
);
const output = computed(() => (result.value ? JSON.stringify(result.value, null, 2) : ""));
watch([result, includeEqual], () => {
  page.value = 1;
});

function sample() {
  left.value =
    "# development\nAPP_NAME=army-knife\nDB_HOST=localhost\nDB_PORT=5432\nLOG_LEVEL=debug\nLEGACY_FLAG=true\nEMPTY=\nDB_HOST=127.0.0.1\n";
  right.value =
    '# staging\nAPP_NAME="army-knife"\nDB_HOST=db.example.test\nDB_PORT=5432\nLOG_LEVEL=info\nFEATURE_CACHE=true\nEMPTY=\n';
}
function preview(value: string | undefined): string {
  if (value === undefined) return "—";
  if (!revealValues.value) return t("env.hidden");
  const rendered = JSON.stringify(value);
  return rendered.length > 180 ? `${rendered.slice(0, 180)}…` : rendered;
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" @click="sample">{{ t("actions.sample") }}</Button>
        <Button
          variant="ghost"
          size="sm"
          @click="
            left = '';
            right = '';
          "
          >{{ t("actions.clear") }}</Button
        >
      </div>
    </div>
    <div class="editor-grid two-editors">
      <CodeInput
        v-model="left"
        :label="t('env.left')"
        input-id="env-left"
        :max-bytes="ENV_LIMITS.inputBytes"
        :rows="10"
      />
      <CodeInput
        v-model="right"
        :label="t('env.right')"
        input-id="env-right"
        :max-bytes="ENV_LIMITS.inputBytes"
        :rows="10"
      />
    </div>
    <div class="run-bar">
      <p class="hint">{{ t("tool.env.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
    <details class="env-profile">
      <summary>{{ t("env.profileTitle") }}</summary>
      <p class="hint">{{ t("env.profile") }}</p>
    </details>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t(`errors.${error}`) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-env.json" type="application/json" />
    </div>
    <p class="hint">{{ t("env.exportHint") }}</p>
    <div class="metric-grid">
      <div
        v-for="kind in ['changed', 'left-only', 'right-only', 'equal'] as const"
        :key="kind"
        class="metric"
      >
        <span class="metric-label">{{ t(`env.kind.${kind}`) }}</span
        ><strong class="metric-value">{{ result.summary[kind] }}</strong>
      </div>
    </div>
    <p v-if="!result.complete" class="notice">{{ t("env.incomplete") }}</p>
    <div class="options-bar env-options">
      <label
        ><input v-model="revealValues" type="checkbox" data-testid="env-reveal-values" />{{
          t("env.reveal")
        }}</label
      >
      <label
        ><input v-model="includeEqual" type="checkbox" data-testid="env-include-equal" />{{
          t("env.includeEqual")
        }}</label
      >
    </div>
    <div v-if="visibleChanges.length" class="table-scroll">
      <table class="data-table env-table">
        <thead>
          <tr>
            <th>{{ t("env.key") }}</th>
            <th>{{ t("labels.type") }}</th>
            <th>{{ t("env.left") }}</th>
            <th>{{ t("env.right") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="change in visibleChanges" :key="change.key">
            <th scope="row">
              <code>{{ change.key }}</code>
            </th>
            <td>
              <span class="type-pill">{{ t(`env.kind.${change.kind}`) }}</span>
            </td>
            <td>
              <code>{{ preview(change.left?.value) }}</code
              ><small v-if="change.left">{{ t("env.line", { line: change.left.line }) }}</small>
            </td>
            <td>
              <code>{{ preview(change.right?.value) }}</code
              ><small v-if="change.right">{{ t("env.line", { line: change.right.line }) }}</small>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="hint">{{ t("env.noChanges") }}</p>
    <nav
      v-if="pages > 1"
      class="control-row env-pagination"
      :aria-label="t('expansion.pagination')"
    >
      <Button variant="outline" size="sm" :disabled="page === 1" @click="page--">{{
        t("expansion.previous")
      }}</Button>
      <span class="hint">{{ t("expansion.page", { page, pages }) }}</span>
      <Button variant="outline" size="sm" :disabled="page === pages" @click="page++">{{
        t("expansion.next")
      }}</Button>
    </nav>
    <div class="editor-grid two-editors env-diagnostics">
      <section v-for="report in reports" :key="report.label">
        <h3>{{ t(report.label) }}</h3>
        <p class="hint">
          {{
            t("env.stats", {
              keys: report.value.variables.length,
              duplicates: report.value.duplicateKeys,
              empty: report.value.emptyValues,
              invalid: report.value.invalidDefinitions,
            })
          }}
        </p>
        <details v-if="report.value.issues.length">
          <summary>{{ t("env.diagnostics") }}</summary>
          <ul class="env-issues">
            <li v-for="(issue, index) in report.value.issues" :key="index">
              <strong>{{ t("env.line", { line: issue.line }) }}</strong
              ><code v-if="issue.key">{{ issue.key }}</code
              ><span>{{ t(`errors.${issue.code}`) }}</span>
            </li>
          </ul>
          <p v-if="report.value.issuesTruncated" class="hint">{{ t("env.issuesTruncated") }}</p>
        </details>
      </section>
    </div>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.env-profile,
.env-diagnostics {
  margin-top: 1rem;
}
.env-profile summary,
.env-diagnostics summary {
  cursor: pointer;
  font-size: 0.8rem;
}
.env-profile p {
  margin-top: 0.65rem;
}
.env-options {
  justify-content: flex-start;
  gap: 1.25rem;
  margin-bottom: 1rem;
}
.env-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}
.env-table {
  min-width: 600px;
  table-layout: fixed;
}
.env-table code {
  overflow-wrap: anywhere;
}
.env-table small {
  display: block;
  margin-top: 0.35rem;
  color: var(--muted-foreground);
}
.env-pagination {
  justify-content: flex-end;
  margin-top: 1rem;
}
.env-diagnostics section {
  min-width: 0;
}
.env-diagnostics h3 {
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
}
.env-diagnostics details {
  margin-top: 0.65rem;
}
.env-issues {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.65rem;
  margin-top: 0.65rem;
}
.env-issues li {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  overflow-wrap: anywhere;
}
</style>
