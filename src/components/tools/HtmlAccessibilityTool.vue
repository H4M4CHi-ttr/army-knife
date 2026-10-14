<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import {
  analyzeHtmlAccessibility,
  HTML_ACCESSIBILITY_REPAIRS,
  HTML_ACCESSIBILITY_LIMITS,
} from "@/lib/tools/html-accessibility";

const { t } = useAppI18n();
const input = ref("");
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source: input,
  canRun: () => Boolean(input.value.trim()),
  mode: () => input.value.length < HTML_ACCESSIBILITY_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: (signal) => analyzeHtmlAccessibility(input.value, signal),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
const ruleCounts = computed(() => {
  const counts = new Map<string, number>();
  for (const finding of result.value?.findings ?? [])
    counts.set(finding.rule, (counts.get(finding.rule) ?? 0) + 1);
  return Array.from(counts, ([rule, count]) => ({ rule, count }));
});

function loadSample() {
  input.value = `<main>\n  <h1>Profile</h1>\n  <h3>Contact</h3>\n  <img src="/portrait.png">\n  <label for="email">Email</label><input id="email">\n  <button></button>\n</main>`;
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="html-accessibility-sample" @click="loadSample">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" :disabled="!input" @click="input = ''">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput v-model="input" :label="t('labels.input')" input-id="html-accessibility-input"
      :max-bytes="HTML_ACCESSIBILITY_LIMITS.inputBytes" :rows="8" :file="false" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.html-accessibility.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p class="hint a11y-scope">{{ t("htmlA11y.scope") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="html-accessibility-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-html-accessibility.json" type="application/json;charset=utf-8" />
    </div>
    <div class="a11y-summary">
      <p>{{ t("htmlA11y.findings", { count: result.findings.length }) }}</p>
      <p>{{ t("htmlA11y.scanned", { scanned: result.scannedElements, total: result.totalElements }) }}</p>
      <div v-if="ruleCounts.length" class="a11y-counts">
        <h3>{{ t("htmlA11y.byRule") }}</h3>
        <ul>
          <li v-for="entry in ruleCounts" :key="entry.rule">
            <span>{{ t("htmlA11y.ruleName." + entry.rule) }}</span>
            <strong>{{ entry.count }}</strong>
          </li>
        </ul>
      </div>
      <p v-if="result.findings.length === 0 && !result.incomplete" class="hint">{{ t("htmlA11y.noFindings") }}</p>
      <p v-if="result.incomplete" class="notice" role="status">
        {{ t("htmlA11y.incomplete") }}
        <span v-if="result.omittedFindings">{{ t("htmlA11y.omitted", { count: result.omittedFindings }) }}</span>
      </p>
    </div>
    <div v-if="result.findings.length" class="table-scroll">
      <table class="data-table" data-testid="html-accessibility-output">
        <thead><tr><th>{{ t("htmlA11y.columnRule") }}</th><th>{{ t("htmlA11y.location") }}</th><th>{{ t("htmlA11y.example") }}</th></tr></thead>
        <tbody>
          <tr v-for="(finding, index) in result.findings" :key="index">
            <td>{{ t("htmlA11y.rule." + finding.rule, { count: Number(finding.detail), detail: finding.detail }) }}</td>
            <td><code class="a11y-location">{{ finding.location }}</code></td>
            <td><code class="a11y-repair">{{ HTML_ACCESSIBILITY_REPAIRS[finding.rule] }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.a11y-scope { margin-top: 1rem; }
.a11y-summary { display: grid; gap: .4rem; margin-bottom: 1rem; }
.a11y-summary p { margin: 0; }
.a11y-counts h3 { margin: .4rem 0 .2rem; font-size: .95rem; }
.a11y-counts ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: .25rem .75rem; margin: 0; padding-inline-start: 1.25rem; }
.a11y-counts li { display: flex; justify-content: space-between; gap: .5rem; }
.a11y-summary .notice { margin-top: .35rem; }
.a11y-location, .a11y-repair { overflow-wrap: anywhere; white-space: normal; }
.data-table td:first-child { min-width: 16rem; }
.data-table td:last-child { min-width: 18rem; }
</style>
