<script setup vapor lang="ts">
import { computed, ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { analyzeUrl, editUrlQuery, URL_LIMITS, type UrlQueryItem } from "@/lib/tools/url";
import { ToolError } from "@/lib/tools/errors";

const { t } = useAppI18n();
const input = ref("");
// Binding this value avoids vue-tsc 3.3.12's Vapor virtual-code handling of
// a // sequence inside a static component attribute.
const urlPlaceholder = "https://example.test/path?key=value#fragment";
const entries = ref<(UrlQueryItem & { id: number })[]>([]);
let nextId = 0;
const { result, error, control, apply, cancel, setAuto } = useToolExecution<
  ReturnType<typeof analyzeUrl>
>({
  source: input,
  canRun: () => Boolean(input.value.trim()),
  mode: "instant",
  execute: () => analyzeUrl(input.value),
});
watch(
  result,
  (value) => {
    entries.value = value?.query.map((entry) => ({ ...entry, id: nextId++ })) ?? [];
  },
  { flush: "sync" },
);
const edited = computed(() => {
  if (!result.value) return { href: "", error: "" };
  try {
    return { href: editUrlQuery(input.value, entries.value), error: "" };
  } catch (failure) {
    return { href: "", error: failure instanceof ToolError ? failure.code : "INTERNAL_ERROR" };
  }
});
const rows = computed<[string, string][]>(() =>
  result.value
    ? [
        ["url.scheme", result.value.scheme],
        ["url.origin", result.value.origin ?? "—"],
        ["url.hostname", result.value.hostname],
        ["url.port", result.value.port || "—"],
        ["url.username", result.value.username || "—"],
        ["url.password", result.value.password || "—"],
        ["url.path", result.value.pathname || "—"],
        ["url.fragment", result.value.fragment || "—"],
      ]
    : [],
);
const repeatedKeys = computed(() => {
  const counts = new Map<string, number>();
  for (const entry of entries.value) counts.set(entry.key, (counts.get(entry.key) ?? 0) + 1);
  return [...counts.values()].filter((count) => count > 1).length;
});
function addEntry() {
  if (entries.value.length < URL_LIMITS.queryItems)
    entries.value.push({ id: nextId++, key: "", value: "", hasEquals: true });
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button
          variant="outline"
          size="sm"
          @click="
            input =
              'https://api.example.test:8443/v1/orders?status=open&status=pending&q=hello+world&debug#page-2'
          "
          >{{ t("actions.sample") }}</Button
        >
        <Button variant="ghost" size="sm" @click="input = ''">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput
      v-model="input"
      :label="t('url.input')"
      input-id="url-input"
      :max-bytes="URL_LIMITS.inputBytes"
      :rows="3"
      :file="false"
      :placeholder="urlPlaceholder"
    />
    <div class="run-bar">
      <p class="hint">{{ t("tool.url.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t(`errors.${error}`) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
    </div>
    <p v-if="result.normalized" class="hint">{{ t("url.normalized") }}</p>
    <div class="metric-grid">
      <div class="metric">
        <span class="metric-label">{{ t("url.queryCount") }}</span
        ><strong class="metric-value">{{ entries.length }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t("url.repeatedKeys") }}</span
        ><strong class="metric-value">{{ repeatedKeys }}</strong>
      </div>
    </div>
    <div class="table-scroll">
      <table class="data-table url-structure">
        <tbody>
          <tr v-for="[label, value] in rows" :key="label">
            <th scope="row">{{ t(label) }}</th>
            <td>
              <code>{{ value }}</code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint url-note">{{ t("url.encodedFields") }}</p>
    <div class="result-header url-query-heading">
      <h3>{{ t("url.queryEditor") }}</h3>
      <Button
        variant="outline"
        size="sm"
        data-testid="query-add"
        :disabled="entries.length >= URL_LIMITS.queryItems"
        @click="addEntry"
        >{{ t("url.add") }}</Button
      >
    </div>
    <div v-if="entries.length" class="table-scroll">
      <table class="data-table url-query-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ t("url.key") }}</th>
            <th>{{ t("labels.value") }}</th>
            <th>{{ t("url.hasEquals") }}</th>
            <th>{{ t("url.removeColumn") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(entry, index) in entries" :key="entry.id">
            <th scope="row">{{ index + 1 }}</th>
            <td>
              <textarea
                v-model="entry.key"
                :data-testid="`query-key-${index}`"
                class="native-select url-query-input"
                rows="1"
                :aria-label="t('url.keyLabel', { row: index + 1 })"
                :spellcheck="false"
                autocapitalize="none"
                autocomplete="off"
              />
            </td>
            <td>
              <textarea
                v-model="entry.value"
                :data-testid="`query-value-${index}`"
                class="native-select url-query-input"
                rows="1"
                :aria-label="t('url.valueLabel', { row: index + 1 })"
                :spellcheck="false"
                autocapitalize="none"
                autocomplete="off"
                @input="entry.hasEquals = true"
              />
            </td>
            <td>
              <input
                v-model="entry.hasEquals"
                type="checkbox"
                :disabled="Boolean(entry.value) || !entry.key"
                :aria-label="t('url.equalsLabel', { row: index + 1 })"
              />
            </td>
            <td>
              <Button
                variant="ghost"
                size="sm"
                :data-testid="`query-remove-${index}`"
                :aria-label="t('url.removeLabel', { row: index + 1 })"
                @click="entries.splice(index, 1)"
                >{{ t("url.remove") }}</Button
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="hint">{{ t("url.noQuery") }}</p>
    <p class="hint url-note">{{ t("url.queryHint") }}</p>
    <p v-if="edited.error" class="error-panel" role="alert">{{ t(`errors.${edited.error}`) }}</p>
    <template v-if="edited.href">
      <div class="result-header url-output-heading">
        <h3>{{ t("url.editedUrl") }}</h3>
        <OutputActions :text="edited.href" filename="army-knife-url.txt" type="text/plain" />
      </div>
      <pre class="code-output url-output" data-testid="url-output">{{ edited.href }}</pre>
    </template>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.url-structure {
  table-layout: fixed;
}
.url-structure th {
  width: 135px;
}
.url-structure code {
  overflow-wrap: anywhere;
}
.url-note {
  margin-top: 0.75rem;
}
.url-query-heading,
.url-output-heading {
  margin-top: 1.5rem;
}
.url-query-heading h3,
.url-output-heading h3 {
  font-size: 0.95rem;
}
.url-query-table {
  min-width: 620px;
}
.url-query-input {
  display: block;
  width: 100%;
  min-width: 160px;
  min-height: 2.2rem;
  resize: vertical;
  font-family: var(--font-mono);
}
.url-output {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
