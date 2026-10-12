<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { analyzeCssSpecificity, SPECIFICITY_LIMITS } from "@/lib/tools/css-specificity";

const { t } = useAppI18n();
const input = ref("");
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source: input,
  canRun: () => Boolean(input.value.trim()),
  mode: "instant",
  execute: () => analyzeCssSpecificity(input.value),
});
const output = computed(() => result.value?.map((row) =>
  row.selector + ": (" + row.a + ", " + row.b + ", " + row.c + ")"
).join("\n") ?? "");
</script>
<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" @click="input = 'main#app .card:hover::before, p:where(#preview) > a'">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" :disabled="!input" @click="input = ''">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput v-model="input" :label="t('specificity.selector')" input-id="css-specificity-input"
      :max-bytes="SPECIFICITY_LIMITS.characters" :rows="5" :file="false" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.css-specificity.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-css-specificity.txt" type="text/plain;charset=utf-8" />
    </div>
    <div class="table-scroll">
      <table class="data-table" data-testid="css-specificity-output">
        <thead><tr><th>{{ t("specificity.selector") }}</th><th>ID (a)</th><th>{{ t("specificity.class") }} (b)</th><th>{{ t("specificity.type") }} (c)</th></tr></thead>
        <tbody>
          <tr v-for="(entry,i) in result" :key="i">
            <td><code class="spec-text">{{ entry.selector }}</code></td>
            <td>{{ entry.a }}</td><td>{{ entry.b }}</td><td>{{ entry.c }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-for="(entry,i) in result" :key="i" class="spec-breakdown">
      <h3>{{ t("specificity.breakdown") }} {{ i + 1 }}</h3>
      <div class="spec-parts">
        <code v-for="(part,j) in entry.parts" :key="j" :class="'spec-' + part.kind" :title="'(' + part.a + ', ' + part.b + ', ' + part.c + ')'">
          {{ part.text }} → ({{ part.a }},{{ part.b }},{{ part.c }})
        </code>
      </div>
    </div>
    <p class="hint">{{ t("specificity.note") }}</p>
  </section>
  <EmptyResult v-else />
</template>
<style scoped>
.spec-text { overflow-wrap: anywhere; }
.spec-breakdown { margin-top: 18px; }
.spec-breakdown h3 { font-size: .95rem; margin-bottom: 9px; }
.spec-parts { display: flex; flex-wrap: wrap; gap: 8px; }
.spec-parts code { padding: 5px 8px; border: 1px solid var(--border); border-radius: 6px; overflow-wrap: anywhere; }
.spec-id { font-weight: 700; }
.spec-zero { opacity: .7; }
</style>
