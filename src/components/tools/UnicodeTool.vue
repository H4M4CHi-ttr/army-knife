<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import CodeInput from "@/components/CodeInput.vue";
import { Button } from "@/components/ui/button";
import { copyText, downloadText } from "@/lib/io";
import { inspectUnicode, ToolError, UNICODE_LIMITS, type UnicodeReport } from "@/lib/tools";

const { t, locale } = useI18n();
const input = ref("");
const includeWhitespace = ref(false);
const result = ref<UnicodeReport | null>(null);
const error = ref("");
const copied = ref(false);
const page = ref(1);
const pageSize = 100;

watch([input, includeWhitespace], () => {
  result.value = null;
  error.value = "";
  copied.value = false;
  page.value = 1;
});

const pages = computed(() =>
  Math.max(1, Math.ceil((result.value?.findings.length ?? 0) / pageSize)),
);
const findings = computed(
  () => result.value?.findings.slice((page.value - 1) * pageSize, page.value * pageSize) ?? [],
);
const count = (value: number): string => new Intl.NumberFormat(locale.value).format(value);

function sample(): void {
  input.value =
    'const user\u200bName = "hamachi";\nconst space = "hello\u00a0world";\nconst emoji = "👩\u200d💻";\n// direction: \u202eabc\u202c';
}

function run(): void {
  error.value = "";
  copied.value = false;
  page.value = 1;
  try {
    result.value = inspectUnicode(input.value, includeWhitespace.value);
  } catch (caught) {
    result.value = null;
    error.value = caught instanceof ToolError ? `errors.${caught.code}` : "states.unknownError";
  }
}

async function copy(): Promise<void> {
  if (!result.value) return;
  try {
    await copyText(JSON.stringify(result.value, null, 2));
    copied.value = true;
    error.value = "";
  } catch {
    error.value = "errors.CLIPBOARD_UNAVAILABLE";
  }
}

function download(): void {
  if (result.value)
    downloadText(
      JSON.stringify(result.value, null, 2),
      "unicode-report.json",
      "application/json;charset=utf-8",
    );
}
</script>

<template>
  <div class="tool-panel">
    <CodeInput
      v-model="input"
      :label="t('labels.input')"
      input-id="unicode-input"
      :max-bytes="UNICODE_LIMITS.inputBytes"
      :rows="9"
    />
    <p class="hint">{{ t("tool.unicode.hint") }}</p>
    <div class="control-row">
      <label class="unicode-option"
        ><input v-model="includeWhitespace" type="checkbox" />{{
          t("unicode.includeWhitespace")
        }}</label
      >
    </div>
    <div class="control-row">
      <Button variant="outline" @click="sample">{{ t("actions.sample") }}</Button>
      <Button variant="ghost" :disabled="!input" @click="input = ''">{{
        t("actions.clear")
      }}</Button>
      <Button :disabled="!input" @click="run">{{ t("actions.run") }}</Button>
    </div>
    <p v-if="error" class="error-panel" role="alert">{{ t(error) }}</p>

    <section v-if="result" class="result-panel" aria-live="polite">
      <div class="result-header">
        <h2>{{ t("labels.result") }}</h2>
        <div class="control-row">
          <Button variant="outline" size="sm" @click="copy">{{
            t(copied ? "actions.copied" : "actions.copy")
          }}</Button>
          <Button variant="outline" size="sm" @click="download">{{ t("actions.download") }}</Button>
        </div>
      </div>
      <div class="metric-grid">
        <div class="metric">
          <span class="metric-label">{{ t("unicode.findings") }}</span
          ><strong class="metric-value">{{ count(result.totalFindings) }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("unicode.codePoints") }}</span
          ><strong class="metric-value">{{ count(result.codePoints) }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("unicode.bytes") }}</span
          ><strong class="metric-value">{{ count(result.utf8Bytes) }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("labels.lines") }}</span
          ><strong class="metric-value">{{ count(result.lineCount) }}</strong>
        </div>
      </div>
      <p class="hint">
        {{ t("unicode.normalization") }} — NFC: {{ t(result.isNfc ? "labels.yes" : "labels.no") }} ·
        NFKC: {{ t(result.isNfkc ? "labels.yes" : "labels.no") }}
      </p>
      <p v-if="result.truncated" class="hint">
        {{ t("unicode.resultCap", { count: count(result.totalFindings) }) }}
      </p>
      <div v-if="result.findings.length" class="table-scroll">
        <table class="data-table unicode-table">
          <thead>
            <tr>
              <th>{{ t("unicode.location") }}</th>
              <th>{{ t("unicode.codePoint") }}</th>
              <th>{{ t("unicode.name") }}</th>
              <th>{{ t("labels.type") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="finding in findings" :key="finding.utf16Offset">
              <td>
                <span>{{
                  t("unicode.lineColumn", { line: finding.line, column: finding.column })
                }}</span
                ><small>{{ t("unicode.offset", { offset: finding.utf16Offset }) }}</small>
              </td>
              <td>
                <code>{{ finding.codePoint }}</code
                ><small
                  ><code>{{ finding.escape }}</code></small
                >
              </td>
              <td>{{ finding.name }}</td>
              <td>{{ t(`unicode.kind.${finding.kind}`) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="hint">{{ t("unicode.none") }}</p>
      <div v-if="pages > 1" class="control-row unicode-pagination">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="page -= 1">{{
          t("unicode.previous")
        }}</Button>
        <span class="hint">{{ t("unicode.page", { current: page, total: pages }) }}</span>
        <Button variant="outline" size="sm" :disabled="page >= pages" @click="page += 1">{{
          t("unicode.next")
        }}</Button>
      </div>
      <p class="hint">{{ t("unicode.positions") }}</p>
      <h3 class="unicode-preview-label">{{ t("labels.preview") }}</h3>
      <pre class="code-output unicode-preview" dir="ltr">{{ result.visualized }}</pre>
      <p v-if="result.previewTruncated" class="hint">{{ t("unicode.previewCap") }}</p>
    </section>
    <div v-else-if="!error" class="empty-result">
      <strong>{{ t("states.ready") }}</strong>
      <p>{{ t("states.emptyResult") }}</p>
    </div>
  </div>
</template>

<style scoped>
.unicode-option {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.875rem;
  cursor: pointer;
}
.unicode-option input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
}
.unicode-table td {
  vertical-align: top;
}
.unicode-table small {
  display: block;
  margin-top: 0.25rem;
  color: var(--muted-foreground);
}
.unicode-preview {
  max-height: 24rem;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  unicode-bidi: isolate;
}
.unicode-pagination {
  justify-content: flex-end;
  margin: 0.75rem 0;
}
.unicode-preview-label {
  margin-top: 1.2rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
