<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { BACKLOG_LIMITS, type BacklogKind, type BacklogOptions, type BacklogReport } from "@/lib/tools/backlog-core";
import { inspectBacklog, inspectBacklogWorker } from "@/lib/tools/backlog-runner";

const props = defineProps<{ kind: BacklogKind }>();
const { t } = useAppI18n();
const input = ref("");
const rejected = ref(false);
const revision = ref(0);
const mode = ref<"flatten" | "restore">("flatten");
const dialect = ref<"postgres" | "mysql" | "sqlite">("postgres");
const table = ref("records");
const nullToken = ref("<NULL>");
const groupSize = ref(100);
const field = ref("");
const parser = ref<"auto" | "javascript" | "python" | "java" | "dotnet">("auto");
const agent = ref("ExampleBot");
const path = ref("/private/page");
const reference = ref("2024-01-31T12:00:00Z");
const samples: Record<BacklogKind, string> = {
  "ndjson": '{"id":1,"status":"ok"}\n{"id":2,"status":"error"}\n{broken}',
  "json-pointer": '{"name":"Ada","data":[true,{"a/b":"x"}],"empty":[]}',
  "csv-insert": 'id,name,value\n1,"Ada, Q","O\'Reilly"\n2,<NULL>,42',
  "sqlite-plan": '2|0|0|SCAN orders\n8|2|0|SEARCH orders USING INDEX idx_orders_status (status=?)',
  "jsonl-logs": '{"timestamp":"2024-02-01T00:00:00Z","level":"info","service":"api","requestId":"abc"}\n{"timestamp":"2024-02-01T00:00:02Z","level":"error","service":"api","requestId":"abc"}',
  "stack-trace": 'TypeError: example\n    at handle (/app/index.js:20:5)\n    at run (/app/main.js:10:2)\n\nTypeError: another\n    at handle (/app/index.js:50:1)\n    at run (/app/main.js:11:2)',
  "robots": 'User-agent: *\nDisallow: /private/\nAllow: /private/public/\nUser-agent: ExampleBot\nDisallow: /private/page',
  "sitemap": '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc><lastmod>2024-02-01</lastmod></url></urlset>',
  "iso-duration": "P1M",
  "pg-dsn": "postgresql://demo:example@localhost:5432/app?sslmode=require",
};
const options = computed<BacklogOptions>(() => ({
  mode: mode.value, dialect: dialect.value, table: table.value, nullToken: nullToken.value,
  groupSize: groupSize.value, field: field.value, parser: parser.value,
  agent: agent.value, path: path.value, reference: reference.value,
}));
const source = computed(() => [props.kind, input.value, mode.value, dialect.value, table.value,
  nullToken.value, groupSize.value, field.value, parser.value, agent.value, path.value, reference.value, rejected.value]);
const { result, error, control, apply, cancel, setAuto } = useToolExecution<BacklogReport>({
  source,
  canRun: () => Boolean(input.value.trim()) && !rejected.value,
  mode: () => input.value.length <= 2048 ? "instant" : "deferred",
  execute: signal => {
    const request = { kind: props.kind, input: input.value, options: options.value };
    // DOMParser is a Window API. XML is bounded to 64 KiB and parsed on the UI thread.
    return props.kind !== "sitemap" && input.value.length > 2048
      ? inspectBacklogWorker(request, signal) : inspectBacklog(request);
  },
});
function loadExample() {
  if (props.kind === "json-pointer") mode.value = "flatten";
  revision.value++;
  rejected.value = false;
  input.value = samples[props.kind];
}
function accept(value: string) { rejected.value = false; input.value = value; }
function clear() { revision.value++; rejected.value = false; input.value = ""; }
</script>

<template>
  <section class="tool-panel backlog-tool" :data-testid="'backlog-' + kind">
    <div class="backlog-options">
      <label v-if="kind === 'json-pointer'" class="backlog-field">
        <span class="field-label">{{ t("backlog.direction") }}</span>
        <select v-model="mode" class="native-select" data-testid="backlog-direction">
          <option value="flatten">{{ t("backlog.flatten") }}</option>
          <option value="restore">{{ t("backlog.restore") }}</option>
        </select>
      </label>
      <template v-if="kind === 'csv-insert'">
        <label class="backlog-field"><span class="field-label">{{ t("backlog.table") }}</span>
          <input v-model="table" class="native-select" maxlength="128" data-testid="backlog-table" />
        </label>
        <label class="backlog-field"><span class="field-label">{{ t("backlog.dialect") }}</span>
          <select v-model="dialect" class="native-select">
            <option value="postgres">PostgreSQL</option><option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
          </select>
        </label>
        <label class="backlog-field"><span class="field-label">{{ t("backlog.nullToken") }}</span>
          <input v-model="nullToken" class="native-select" maxlength="60" />
        </label>
        <label class="backlog-field"><span class="field-label">{{ t("backlog.groupSize") }}</span>
          <input v-model.number="groupSize" class="native-select" type="number" min="1" max="500" />
        </label>
      </template>
      <label v-if="kind === 'jsonl-logs'" class="backlog-field">
        <span class="field-label">{{ t("backlog.requestFilter") }}</span>
        <input v-model="field" class="native-select" maxlength="200" autocomplete="off" data-testid="backlog-filter" />
      </label>
      <label v-if="kind === 'stack-trace'" class="backlog-field">
        <span class="field-label">{{ t("backlog.parser") }}</span>
        <select v-model="parser" class="native-select">
          <option value="auto">{{ t("backlog.auto") }}</option><option value="javascript">JavaScript</option>
          <option value="python">Python</option><option value="java">Java</option>
          <option value="dotnet">.NET</option>
        </select>
      </label>
      <template v-if="kind === 'robots'">
        <label class="backlog-field"><span class="field-label">User-Agent</span>
          <input v-model="agent" class="native-select" maxlength="200" data-testid="backlog-agent" />
        </label>
        <label class="backlog-field"><span class="field-label">{{ t("backlog.path") }}</span>
          <input v-model="path" class="native-select" maxlength="2048" data-testid="backlog-path" />
        </label>
      </template>
      <label v-if="kind === 'iso-duration'" class="backlog-field">
        <span class="field-label">{{ t("backlog.reference") }}</span>
        <input v-model="reference" class="native-select" maxlength="64" data-testid="backlog-reference" />
      </label>
    </div>
    <div class="backlog-header">
      <h2>{{ t("backlog.input") }}</h2>
      <div class="backlog-buttons">
        <Button size="sm" variant="outline" data-testid="backlog-sample" @click="loadExample">{{ t("backlog.sample") }}</Button>
        <Button size="sm" variant="ghost" data-testid="backlog-clear" @click="clear">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput
      :key="revision" :model-value="input" :input-id="kind + '-input'"
      :label="t('backlog.sourceLabel')" :max-bytes="kind === 'json-pointer' && mode === 'restore' ? BACKLOG_LIMITS.outputBytes : BACKLOG_LIMITS.inputBytes" :rows="10"
      @update:model-value="accept" @rejected="rejected = true"
    />
    <p class="hint">{{ t("tool." + kind + ".hint") }}</p>
    <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    <Button v-if="control.pending" variant="outline" data-testid="backlog-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    <p v-if="error" role="alert" class="error-panel">{{ t("errors." + error) }}</p>
    <section v-if="result" class="result-panel" aria-live="polite" data-testid="backlog-results">
      <div class="result-header">
        <h2>{{ t("labels.result") }}</h2>
        <OutputActions :text="result.exportText" :filename="kind + '-report.txt'" />
      </div>
      <div v-if="result.metrics.length" class="table-scroll">
        <table class="data-table"><tbody>
          <tr v-for="metric in result.metrics" :key="metric.key">
            <th scope="row">{{ t("backlog.metric." + metric.key) }}</th><td>{{ metric.value }}</td>
          </tr>
        </tbody></table>
      </div>
      <div v-if="result.warnings.length" class="backlog-warning" role="status">
        <p v-for="warning in [...new Set(result.warnings)]" :key="warning">
          {{ t("backlog.warning." + warning) }}
        </p>
      </div>
      <div v-if="result.rows.length" class="table-scroll">
        <table class="data-table">
          <thead><tr><th scope="col">{{ t("backlog.item") }}</th><th scope="col">{{ t("backlog.detail") }}</th></tr></thead>
          <tbody>
            <tr v-for="(row, index) in result.rows" :key="index">
              <td class="backlog-cell">{{ row.label }}</td><td class="backlog-cell">{{ row.detail }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="hint">{{ t("backlog.noRows") }}</p>
    </section>
  </section>
</template>

<style scoped>
.backlog-tool { display: grid; gap: 1rem; min-width: 0; }
.backlog-options { display: grid; gap: .85rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); }
.backlog-field { display: grid; gap: .35rem; min-width: 0; }
.backlog-field input, .backlog-field select { width: 100%; }
.backlog-header, .backlog-buttons { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .6rem; }
.backlog-cell { overflow-wrap: anywhere; white-space: pre-wrap; max-width: 36rem; }
.backlog-warning { border-inline-start: .2rem solid var(--primary); padding: .3rem .9rem; display: grid; gap: .2rem; }
.backlog-warning p { margin: .15rem 0; }
</style>
