<script setup vapor lang="ts">
import { computed, ref, shallowRef } from "vue";
import ApplyControl from "@/components/ApplyControl.vue";
import CodeInput from "@/components/CodeInput.vue";
import { Button } from "@/components/ui/button";
import { useToolExecution } from "@/composables/useToolExecution";
import { useAppI18n } from "@/i18n/useAppI18n";
import {
  HREFLANG_LIMITS, HREFLANG_PAGES, inspectHreflangPair, type HreflangPairInput,
} from "@/lib/tools/hreflang";
import { HREFLANG_SAMPLE } from "@/lib/tools/hreflang-sample";
import { runInspectorWorker } from "@/lib/tools/inspector-worker";

const { t } = useAppI18n();
const blank: HreflangPairInput = { a: { url: "", head: "" }, b: { url: "", head: "" } };
type PageId = keyof HreflangPairInput;
type FieldId = keyof HreflangPairInput[PageId];
type Field = `${PageId}-${FieldId}`;
const source = shallowRef({ input: blank, rejected: new Set<Field>(), loading: new Set<Field>() });
const revision = ref(0);
const fields = ["url", "head"] as const;
const incomplete = computed(() => HREFLANG_PAGES.some(page =>
  fields.some(field => !source.value.input[page][field].trim()),
));
const instant = computed(() => HREFLANG_PAGES.reduce(
  (length, page) => length + source.value.input[page].head.length + source.value.input[page].url.length,
  0,
) <= HREFLANG_LIMITS.instantCharacters);
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => !incomplete.value && !source.value.rejected.size && !source.value.loading.size,
  mode: () => instant.value ? "instant" : "deferred",
  execute: signal => instant.value
    ? inspectHreflangPair(source.value.input)
    : runInspectorWorker({ kind: "hreflang", input: source.value.input }, signal).then(reply => reply.data),
});

function edit(page: PageId, field: FieldId, value?: string) {
  const id: Field = `${page}-${field}`;
  const { input, rejected, loading } = source.value;
  const nextRejected = new Set(rejected);
  if (value === undefined) {
    nextRejected.add(id);
    source.value = { input, rejected: nextRejected, loading };
  } else {
    nextRejected.delete(id);
    source.value = { input: { ...input, [page]: { ...input[page], [field]: value } }, rejected: nextRejected, loading };
  }
}

function setLoading(id: Field, active: boolean) {
  const loading = new Set(source.value.loading);
  if (active) loading.add(id);
  else loading.delete(id);
  source.value = { ...source.value, loading };
}

function replace(input: HreflangPairInput) {
  revision.value++;
  source.value = { input, rejected: new Set(), loading: new Set() };
}

function ignoreFileDrop(event: DragEvent) {
  if (!event.dataTransfer?.files.length) return;
  event.preventDefault();
  event.stopPropagation();
}
</script>

<template>
  <div class="tool-panel" @drop.capture="ignoreFileDrop">
    <div class="tool-toolbar">
      <div class="toolbar-label">{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="hreflang-sample" @click="replace(HREFLANG_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="hreflang-clear" @click="replace(blank)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div class="hreflang-grid">
      <fieldset v-for="page in HREFLANG_PAGES" :key="page">
        <legend>{{ t("hreflang.page." + page) }}</legend>
        <CodeInput
          v-for="field in fields"
          :key="field + revision"
          :input-id="'hreflang-' + page + '-' + field"
          :model-value="source.input[page][field]"
          :label="t('hreflang.field.' + field)"
          :input-hint="t('hreflang.limit.' + field, { limit: field === 'url' ? HREFLANG_LIMITS.urlBytes : HREFLANG_LIMITS.headBytes / 1024 })"
          :rows="field === 'url' ? 1 : 5"
          :file="false"
          :preserve-carriage-returns="true"
          :max-bytes="field === 'url' ? HREFLANG_LIMITS.urlBytes : HREFLANG_LIMITS.headBytes"
          @update:model-value="edit(page, field, $event)"
          @rejected="edit(page, field)"
          @loading="setLoading(`${page}-${field}`, $event)"
        />
      </fieldset>
    </div>
    <div class="run-bar">
      <p class="hint">{{ t("tool.hreflang.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="hreflang-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>

  <p v-if="source.rejected.size" class="notice" role="status">{{ t("hreflang.rejected") }}</p>
  <p v-else-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <p v-else-if="incomplete" class="hint" data-testid="hreflang-incomplete">{{ t("hreflang.incomplete") }}</p>

  <p class="sr-only" role="status" aria-atomic="true" data-testid="hreflang-announcement">{{ result ? t(result.hasIssues ? "hreflang.issues" : "hreflang.matched") : "" }}</p>
  <section v-if="result" class="result-panel hreflang-results" data-testid="hreflang-result">
    <div class="result-header">
      <h2 data-testid="hreflang-summary">{{ t(result.hasIssues ? "hreflang.issues" : "hreflang.matched") }}</h2>
    </div>
    <p v-if="result.hasUncheckedTargets" class="notice" data-testid="hreflang-unchecked">{{ t("hreflang.unchecked") }}</p>
    <div class="hreflang-grid">
      <section v-for="page in HREFLANG_PAGES" :key="page" :data-testid="'hreflang-page-' + page">
        <h3>{{ t("hreflang.page." + page) }}</h3>
        <p class="hint"><code><bdi>{{ result.pages[page].url }}</bdi></code></p>
        <ul class="hreflang-findings">
          <li>{{ t("hreflang.self") }} <code v-if="result.pages[page].selfLanguages.length">{{ result.pages[page].selfLanguages.join(", ") }}</code><span v-else>{{ t("hreflang.missingSelf") }}</span></li>
          <li>{{ t("hreflang.peer") }} <code v-if="result.pages[page].peerLanguages.length">{{ result.pages[page].peerLanguages.join(", ") }}</code><span v-else>{{ t("hreflang.missingPeer") }}</span></li>
          <li v-if="result.pages[page].languageMismatch" class="notice">{{ t("hreflang.mismatch") }}</li>
          <li v-if="result.pages[page].parseErrors" class="notice">{{ t("hreflang.htmlErrors", { count: result.pages[page].parseErrors, line: result.pages[page].firstParseErrorLine }) }}</li>
        </ul>
        <h4>{{ t("hreflang.map") }}</h4>
        <p v-if="!result.pages[page].links.length" class="hint">{{ t("hreflang.emptyMap") }}</p>
        <ul v-else class="hreflang-map">
          <li v-for="(link, index) in result.pages[page].links" :key="index" data-testid="hreflang-row">
            <div class="hreflang-row-heading">
              <strong><code><bdi>{{ link.language || "—" }}</bdi></code></strong>
              <span class="hint">{{ t("hreflang.line", { line: link.line }) }}</span>
              <span v-if="link.destination" class="hint">{{ t("hreflang.destination." + link.destination) }}</span>
            </div>
            <code><bdi>{{ link.href || "—" }}</bdi></code>
            <ul v-if="link.issues.length" class="hreflang-row-issues">
              <li v-for="issue in link.issues" :key="issue">{{ t("hreflang.issue." + issue) }}</li>
            </ul>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<style scoped>
.tool-panel :deep(.code-editor) { min-height: 0; }
.hreflang-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.hreflang-grid > * { min-width: 0; }
fieldset { display: grid; gap: .65rem; border: 1px solid var(--border); border-radius: .5rem; padding: .75rem; }
legend { padding-inline: .3rem; font-weight: 600; }
.hreflang-results { overflow-wrap: anywhere; }
.hreflang-results :is(h3, h4) { font-weight: 600; }
.hreflang-findings, .hreflang-map { display: grid; gap: .4rem; margin-block: .6rem; }
.hreflang-map > li { padding: .55rem .7rem; border: 1px solid var(--border); border-radius: .5rem; }
.hreflang-row-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: .25rem .6rem; }
.hreflang-row-issues { list-style: disc; padding-inline-start: 1.2rem; margin-block-start: .35rem; }
@media (max-width: 760px) {
  .hreflang-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
