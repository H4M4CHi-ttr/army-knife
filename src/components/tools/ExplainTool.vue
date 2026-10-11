<script setup vapor lang="ts">
import { computed, ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { analyzeExplain, EXPLAIN_LIMITS, type ExplainNode } from "@/lib/tools/explain";

const { t, locale } = useAppI18n();
const input = ref("");
const filter = ref("");
const page = ref(1);
const pageSize = 100;
const { result, error, control, apply, cancel, setAuto } = useToolExecution<
  ReturnType<typeof analyzeExplain>
>({
  source: input,
  canRun: () => Boolean(input.value.trim()),
  mode: () => (input.value.length <= 8192 ? "instant" : "deferred"),
  execute: () => analyzeExplain(input.value),
});
const filteredNodes = computed(() => {
  const query = filter.value.trim().toLowerCase();
  return (
    result.value?.nodes.filter(
      (node) =>
        !query ||
        [node.nodeType, node.relation, node.indexName, node.alias, node.schema].some((value) =>
          value?.toLowerCase().includes(query),
        ),
    ) ?? []
  );
});
const pages = computed(() => Math.max(1, Math.ceil(filteredNodes.value.length / pageSize)));
const visibleNodes = computed(() =>
  filteredNodes.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);
const output = computed(() => (result.value ? JSON.stringify(result.value, null, 2) : ""));
watch([result, filter], () => {
  page.value = 1;
});
function number(value: number | null): string {
  return value === null
    ? "—"
    : new Intl.NumberFormat(locale.value, { maximumSignificantDigits: 8 }).format(value);
}
function ratio(node: ExplainNode): string {
  if (node.rowEstimateStatus === "zero-estimate") return t("explain.zeroEstimate");
  return node.rowRatio === null ? "—" : `${number(node.rowRatio)}×`;
}
function sample() {
  input.value = JSON.stringify(
    [
      {
        Plan: {
          "Node Type": "Sort",
          "Startup Cost": 42.2,
          "Total Cost": 42.25,
          "Plan Rows": 20,
          "Actual Rows": 80,
          "Actual Loops": 1,
          "Actual Startup Time": 0.72,
          "Actual Total Time": 0.75,
          "Sort Key": ["created_at DESC"],
          Plans: [
            {
              "Node Type": "Seq Scan",
              "Relation Name": "orders",
              Alias: "orders",
              "Startup Cost": 0,
              "Total Cost": 41.6,
              "Plan Rows": 20,
              "Actual Rows": 80,
              "Actual Loops": 1,
              "Actual Startup Time": 0.02,
              "Actual Total Time": 0.63,
              Filter: "(status = 'open'::text)",
            },
          ],
        },
        "Planning Time": 0.19,
        "Execution Time": 0.81,
      },
    ],
    null,
    2,
  );
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" @click="sample">{{ t("actions.sample") }}</Button
        ><Button variant="ghost" size="sm" @click="input = ''">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput
      v-model="input"
      :label="t('explain.input')"
      input-id="explain-input"
      :max-bytes="EXPLAIN_LIMITS.inputBytes"
      :rows="13"
    />
    <div class="run-bar">
      <p class="hint">{{ t("tool.explain.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t(`errors.${error}`) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-explain.json" type="application/json" />
    </div>
    <div class="metric-grid">
      <div class="metric">
        <span class="metric-label">{{ t("explain.statements") }}</span
        ><strong class="metric-value">{{ result.statements.length }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t("explain.nodes") }}</span
        ><strong class="metric-value">{{ result.nodes.length }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t("explain.nodeTypes") }}</span
        ><strong class="metric-value">{{ result.nodeTypes.length }}</strong>
      </div>
    </div>
    <div class="table-scroll">
      <table class="data-table explain-statements">
        <thead>
          <tr>
            <th>{{ t("explain.statement") }}</th>
            <th>{{ t("explain.planning") }}</th>
            <th>{{ t("explain.execution") }}</th>
            <th>{{ t("explain.nodes") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="statement in result.statements" :key="statement.index">
            <th scope="row">{{ statement.index + 1 }}</th>
            <td>{{ number(statement.planningTimeMs) }}</td>
            <td>{{ number(statement.executionTimeMs) }}</td>
            <td>{{ statement.nodeCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint explain-note">{{ t("explain.timingHint") }}</p>
    <div class="control-row explain-types">
      <span v-for="entry in result.nodeTypes" :key="entry.type" class="type-pill"
        ><code>{{ entry.type }}</code
        ><span> × {{ entry.count }}</span></span
      >
    </div>
    <div class="explain-filter">
      <label for="explain-filter" class="field-label">{{ t("explain.filter") }}</label
      ><input
        id="explain-filter"
        v-model="filter"
        type="search"
        class="native-select"
        autocomplete="off"
        :spellcheck="false"
        :placeholder="t('explain.filterPlaceholder')"
      />
    </div>
    <div v-if="visibleNodes.length" class="table-scroll">
      <table class="data-table explain-nodes">
        <thead>
          <tr>
            <th>{{ t("explain.node") }}</th>
            <th>{{ t("explain.estimatedRows") }}</th>
            <th>{{ t("explain.actualRows") }}</th>
            <th>{{ t("explain.loops") }}</th>
            <th>{{ t("explain.ratio") }}</th>
            <th>{{ t("explain.nodeTime") }}</th>
            <th>{{ t("explain.cost") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="node in visibleNodes" :key="node.id">
            <th scope="row">
              <div
                :style="{ paddingInlineStart: `${Math.min(node.depth, 8) * 12}px` }"
                class="explain-node-label"
              >
                <code>{{ node.nodeType }}</code
                ><small v-if="node.relation"
                  >{{ node.schema ? `${node.schema}.` : "" }}{{ node.relation }}</small
                ><small v-if="node.indexName">{{ node.indexName }}</small
                ><small class="explain-path">{{ node.id }}</small>
              </div>
            </th>
            <td>{{ number(node.estimatedRows) }}</td>
            <td>{{ number(node.actualRows) }}</td>
            <td>{{ number(node.actualLoops) }}</td>
            <td>
              <strong>{{ ratio(node) }}</strong
              ><small>{{ t(`explain.status.${node.rowEstimateStatus}`) }}</small>
            </td>
            <td>{{ number(node.actualTotalTimeMs) }}</td>
            <td>{{ number(node.totalCost) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="hint">{{ t("explain.noNodes") }}</p>
    <nav
      v-if="pages > 1"
      class="control-row explain-pagination"
      :aria-label="t('expansion.pagination')"
    >
      <Button variant="outline" size="sm" :disabled="page === 1" @click="page--">{{
        t("expansion.previous")
      }}</Button
      ><span class="hint">{{ t("expansion.page", { page, pages }) }}</span
      ><Button variant="outline" size="sm" :disabled="page === pages" @click="page++">{{
        t("expansion.next")
      }}</Button>
    </nav>
    <p class="hint explain-note">{{ t("explain.estimateHint") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.explain-note {
  margin-top: 0.85rem;
}
.explain-types {
  margin-top: 1rem;
}
.explain-filter {
  display: grid;
  gap: 0.4rem;
  margin: 1.25rem 0 0.75rem;
}
.explain-filter input {
  width: 100%;
}
.explain-statements {
  min-width: 500px;
}
.explain-nodes {
  min-width: 900px;
  font-variant-numeric: tabular-nums;
}
.explain-nodes th {
  min-width: 190px;
  max-width: 320px;
}
.explain-nodes td {
  min-width: 95px;
}
.explain-node-label {
  display: grid;
  gap: 0.35rem;
  overflow-wrap: anywhere;
}
.explain-nodes small {
  display: block;
  margin-top: 0.25rem;
  color: var(--muted-foreground);
  font-weight: 400;
  font-size: 0.7rem;
}
.explain-path {
  font-family: var(--font-mono);
}
.explain-pagination {
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
