<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { GIT_BRANCH_LIMITS, inspectGitBranches } from "@/lib/tools/git-branch";
import { GIT_BRANCH_SAMPLE } from "@/lib/tools/git-branch-sample";

const { t } = useAppI18n();
const input = ref(""), rejected = ref(false), loading = ref(false), revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value, loading: loading.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(input.value) && !rejected.value && !loading.value,
  mode: () => input.value.length <= GIT_BRANCH_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectGitBranches(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
// Keep original values in exports; expose invisible/direction controls in display.
function visibleJson(value: string): string {
  return JSON.stringify(value).replace(/[\p{Cf}\p{Zl}\p{Zp}\u007f-\u009f]/gu,
    character => character.split("").map(unit => "\\u" + unit.charCodeAt(0).toString(16).padStart(4, "0")).join(""));
}
const rows = computed(() => result.value?.branches.slice(0, GIT_BRANCH_LIMITS.previewNames).map((row, i) => ({
  ...row, position: i + 1, nameJson: visibleJson(row.name), fullRefJson: row.fullRef === null ? null : visibleJson(row.fullRef),
})) ?? []);
function replace(example: boolean) {
  revision.value++; rejected.value = false; loading.value = false;
  input.value = example ? GIT_BRANCH_SAMPLE : "";
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="git-branch-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="git-branch-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('gitBranch.input')" :input-hint="t('gitBranch.inputLimit')" input-id="git-branch-input" :rows="5" :preserve-bom="true" :preserve-carriage-returns="true" :max-bytes="GIT_BRANCH_LIMITS.inputBytes" :placeholder="GIT_BRANCH_SAMPLE" @update:model-value="input = $event; rejected = false" @rejected="rejected = true" @loading="loading = $event" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.git-branch.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="git-branch-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice branch-scope">{{ t("gitBranch.scope") }}</p>
  <p class="hint">{{ t("gitBranch.grammar") }}</p>
  <p class="hint">{{ t("gitBranch.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("gitBranch.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="git-branch-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-git-branch.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="branch-totals">
      <div><dt>{{ t("gitBranch.count") }}</dt><dd data-testid="git-branch-count">{{ result.branches.length }}</dd></div>
      <div><dt>{{ t("gitBranch.validCount") }}</dt><dd data-testid="git-branch-valid-count">{{ result.validCount }}</dd></div>
      <div><dt>{{ t("gitBranch.invalidCount") }}</dt><dd data-testid="git-branch-invalid-count">{{ result.invalidCount }}</dd></div>
    </dl>
    <div class="table-scroll" tabindex="0" role="region" :aria-label="t('gitBranch.preview', { shown: rows.length, total: result.branches.length })">
      <table class="data-table">
        <caption>{{ t("gitBranch.preview", { shown: rows.length, total: result.branches.length }) }}</caption>
        <thead><tr><th scope="col">{{ t("gitBranch.position") }}</th><th scope="col">{{ t("gitBranch.status") }}</th><th scope="col">{{ t("gitBranch.name") }}</th><th scope="col">{{ t("gitBranch.reasons") }}</th></tr></thead>
        <tbody><tr v-for="row in rows" :key="row.position" data-testid="git-branch-row">
          <td>{{ row.position }}</td>
          <td><strong data-testid="git-branch-status">{{ t(row.valid ? "gitBranch.valid" : "gitBranch.invalid") }}</strong></td>
          <td><code dir="ltr">{{ row.nameJson }}</code><p class="hint">{{ t("gitBranch.bytes", { count: row.nameBytes }) }}</p><code v-if="row.fullRefJson !== null" dir="ltr">{{ row.fullRefJson }}</code></td>
          <td><ul v-if="row.issues.length"><li v-for="issue in row.issues" :key="issue">{{ t("gitBranch.issue." + issue) }}</li></ul><span v-else>{{ t("gitBranch.noIssues") }}</span></td>
        </tr></tbody>
      </table>
    </div>
    <p class="hint">{{ t("gitBranch.exportHelp") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.branch-scope { margin-top: 1rem; }
.branch-totals { display: flex; flex-wrap: wrap; gap: 1rem 2rem; margin-block: 1rem; }
dt { font-size: .8rem; color: var(--muted-foreground); }
dd { margin: .3rem 0 0; font-family: var(--font-mono); font-size: 1.2rem; }
table { width: 100%; min-width: 40rem; table-layout: fixed; }
caption { text-align: start; padding-block: .6rem; color: var(--muted-foreground); font-size: .85rem; }
th:first-child { width: 11%; }
th:nth-child(2) { width: 15%; }
th:nth-child(3) { width: 34%; }
td { overflow-wrap: anywhere; vertical-align: top; }
code { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; unicode-bidi: isolate; }
ul { padding-inline-start: 1rem; }
li + li { margin-top: .4rem; }
</style>
