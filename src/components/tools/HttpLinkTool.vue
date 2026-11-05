<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { HTTP_LINK_LIMITS, inspectHttpLink } from "@/lib/tools/http-link";
import { HTTP_LINK_SAMPLE } from "@/lib/tools/http-link-sample";

const { t } = useAppI18n();
const input = ref(""), rejected = ref(false), revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(input.value) && !rejected.value,
  mode: () => input.value.length <= HTTP_LINK_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectHttpLink(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function replace(value: string) { revision.value++; rejected.value = false; input.value = value; }
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="link-sample" @click="replace(HTTP_LINK_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="link-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('link.input')" input-id="http-link-input" :rows="5" :file="false" :max-bytes="HTTP_LINK_LIMITS.bytes" :placeholder="HTTP_LINK_SAMPLE" @update:model-value="input = $event; rejected = false" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.http-link.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="link-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="hint link-scope">{{ t("link.scope") }}</p>
  <p class="hint">{{ t("link.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("link.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="link-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-http-link.json" type="application/json;charset=utf-8" />
    </div>
    <p v-if="result.emptyMembers" class="hint" data-testid="link-empty">{{ t("link.empty", { count: result.emptyMembers }) }}</p>
    <p v-if="!result.links.length">{{ t("link.noLinks") }}</p>
    <article v-for="link in result.links" :key="link.position" class="link-entry" data-testid="link-entry">
      <h3>{{ link.position }}. {{ t("link.target") }}</h3>
      <code class="link-target" data-testid="link-target">&lt;{{ link.target }}&gt;</code>
      <p v-if="link.missingRel" class="notice">{{ t("link.missing") }}</p>
      <p v-else class="link-rel"><span>{{ t("link.relations") }}</span><code data-testid="link-relations">{{ link.relations.join(' · ') }}</code></p>
      <p v-if="link.duplicateParameters.length" class="notice">{{ t("link.duplicates", { names: link.duplicateParameters.join(', ') }) }}</p>
      <div v-if="link.parameters.length" class="table-scroll">
        <table class="data-table">
          <caption>{{ t("link.parameters") }}</caption>
          <thead><tr><th scope="col">{{ t("link.name") }}</th><th scope="col">{{ t("link.value") }}</th></tr></thead>
          <tbody><tr v-for="(parameter, index) in link.parameters" :key="index"><td><code>{{ parameter.name }}</code></td><td><span v-if="parameter.value === null" class="hint">{{ t("link.valueless") }}</span><code v-else>{{ JSON.stringify(parameter.value) }}</code></td></tr></tbody>
        </table>
      </div>
    </article>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.link-scope { margin-top: 1rem; }
.link-entry { min-width: 0; padding-block: 1rem; border-top: 1px solid var(--border); }
.link-target { display: block; padding: .65rem; background: var(--muted); border-radius: .4rem; }
.link-rel { display: flex; flex-wrap: wrap; gap: .5rem 1rem; }
.link-rel span { color: var(--muted-foreground); }
code { white-space: pre-wrap; overflow-wrap: anywhere; }
table { width: 100%; table-layout: fixed; }
caption { text-align: start; padding-block: .6rem; color: var(--muted-foreground); font-size: .85rem; }
th:first-child { width: 30%; }
td { overflow-wrap: anywhere; vertical-align: top; }
</style>
