<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { FlaskConical, Trash2, LoaderCircle } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { useAppI18n } from "@/i18n/useAppI18n";
import { runEngine } from "@/lib/wasm/client";
import { ENGINE_LIMITS, type HarResult } from "@/lib/wasm/types";
import { HAR_SAMPLE } from "@/lib/samples";

const { t, locale } = useAppI18n();
const input = ref("");
const grouping = ref<"hosts" | "mimeTypes">("hosts");
const { result, error, busy, control, apply, cancel, setAuto } = useToolExecution<HarResult>({
  source: input,
  canRun: () => input.value.length > 0,
  execute: (signal) => runEngine({ operation: "har", text: input.value }, { signal }),
});
const output = computed(() => (result.value ? JSON.stringify(result.value, null, 2) : ""));
const groups = computed(() => result.value?.[grouping.value] ?? []);
const omitted = computed(() =>
  grouping.value === "hosts" ? result.value?.omittedHosts : result.value?.omittedMimeTypes,
);
const count = (value: number | string) =>
  new Intl.NumberFormat(locale.value).format(typeof value === "string" ? BigInt(value) : value);
const milliseconds = (value: number | null) =>
  value === null
    ? t("har.unknown")
    : `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(value)} ms`;
const bytes = (value: string | null) => (value === null ? t("har.unknown") : `${count(value)} B`);
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>HAR</div>
      <div class="control-row">
        <Button variant="outline" size="sm" @click="input = HAR_SAMPLE"
          ><FlaskConical class="size-3.5" />{{ t("actions.sample") }}</Button
        >
        <Button variant="ghost" size="sm" @click="input = ''"
          ><Trash2 class="size-3.5" />{{ t("actions.clear") }}</Button
        >
      </div>
    </div>
    <CodeInput
      v-model="input"
      :label="t('har.input')"
      input-id="har-input"
      :rows="9"
      :max-bytes="ENGINE_LIMITS.inputBytes"
    />
    <div class="run-bar">
      <p class="hint">{{ t("tool.har.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t(`errors.${error}`) }}</p>
  <div v-if="busy" class="processing-state" role="status">
    <LoaderCircle class="size-5 animate-spin" />{{ t("states.working") }}
  </div>
  <section v-else-if="result" class="result-panel" aria-live="polite" data-testid="har-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-har.json" type="application/json" />
    </div>
    <div class="metric-grid har-metrics">
      <div class="metric">
        <span class="metric-label">{{ t("har.requests") }}</span
        ><strong class="metric-value">{{ count(result.requests) }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t("har.httpErrors") }}</span
        ><strong class="metric-value" :class="{ negative: result.httpErrors > 0 }">{{
          count(result.httpErrors)
        }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t("har.transfer") }}</span
        ><strong class="metric-value har-bytes">{{
          bytes(result.responseTransfer.knownBytes)
        }}</strong>
      </div>
      <div class="metric">
        <span class="metric-label">{{ t("har.average") }}</span
        ><strong class="metric-value">{{ milliseconds(result.timing.averageMs) }}</strong>
      </div>
    </div>
    <p v-if="result.responseTransfer.unknownEntries" class="notice">
      {{
        t("har.unknownSizes", {
          known: result.responseTransfer.knownEntries,
          unknown: result.responseTransfer.unknownEntries,
        })
      }}
    </p>
    <p class="hint">{{ t("har.sizeNote") }}</p>
    <h3 class="har-heading">{{ t("har.statuses") }}</h3>
    <div class="har-statuses">
      <span
        v-for="entry in result.statuses"
        :key="entry.status ?? 'unknown'"
        class="type-pill"
        :class="{ 'type-mixed': entry.status !== null && entry.status >= 400 }"
      >
        {{ entry.status ?? t("har.unknown") }} <strong>{{ count(entry.requests) }}</strong>
      </span>
    </div>
    <div class="result-header har-section-header">
      <h3>{{ t("har.groups") }}</h3>
      <select v-model="grouping" class="native-select" :aria-label="t('har.groups')">
        <option value="hosts">{{ t("har.hosts") }}</option>
        <option value="mimeTypes">{{ t("har.mimeTypes") }}</option>
      </select>
    </div>
    <div class="table-scroll">
      <table class="data-table har-table har-groups-table">
        <thead>
          <tr>
            <th>{{ t(grouping === "hosts" ? "har.host" : "har.mime") }}</th>
            <th>{{ t("har.requests") }}</th>
            <th>{{ t("har.httpErrors") }}</th>
            <th>{{ t("har.transfer") }}</th>
            <th>{{ t("har.average") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in groups" :key="group.key ?? ''">
            <th scope="row">
              <code>{{ group.key ?? t("har.unknown") }}</code>
            </th>
            <td>{{ count(group.requests) }}</td>
            <td>{{ count(group.httpErrors) }}</td>
            <td>
              {{ bytes(group.responseTransfer.knownBytes)
              }}<small v-if="group.responseTransfer.unknownEntries">{{ t("har.partial") }}</small>
            </td>
            <td>{{ milliseconds(group.timing.averageMs) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="omitted" class="hint">{{ t("har.omitted", { count: omitted }) }}</p>
    <h3 class="har-heading">{{ t("har.slowest") }}</h3>
    <div class="table-scroll">
      <table class="data-table har-table har-slow-table">
        <thead>
          <tr>
            <th>URL</th>
            <th>{{ t("har.duration") }}</th>
            <th>{{ t("har.status") }}</th>
            <th>{{ t("har.transfer") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in result.slowest" :key="request.entryIndex">
            <td>
              <span class="type-pill">{{ request.method }}</span
              ><code class="har-request-url" dir="ltr"
                >{{ request.url }}{{ request.urlShortened ? "…" : "" }}</code
              >
            </td>
            <td class="har-duration">
              <strong>{{ milliseconds(request.timeMs) }}</strong
              ><span class="har-time-track" aria-hidden="true"
                ><span
                  :style="{
                    width: `${result.timing.maxMs ? (request.timeMs / result.timing.maxMs) * 100 : 0}%`,
                  }"
              /></span>
            </td>
            <td>{{ request.status ?? t("har.unknown") }}</td>
            <td>{{ bytes(request.transferBytes) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint panel-note">{{ t("har.timeNote") }}</p>
    <p v-if="result.timing.unknownRequests" class="hint">
      {{ t("har.unknownTimings", { count: result.timing.unknownRequests }) }}
    </p>
  </section>
  <EmptyResult v-else-if="!error" />
</template>

<style scoped>
.har-heading {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 1.5rem 0 0.8rem;
}
.har-section-header {
  margin-top: 1.5rem;
}
.har-section-header h3 {
  font-size: 0.95rem;
  font-weight: 600;
}
.har-statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.har-statuses .type-pill {
  gap: 0.8rem;
}
.har-bytes {
  font-size: clamp(1rem, 1.8vw, 1.6rem);
  overflow-wrap: anywhere;
}
.har-table td,
.har-table th {
  vertical-align: top;
}
.har-table small {
  display: block;
  color: var(--muted-foreground);
  font-size: 0.7rem;
}
.har-table code {
  overflow-wrap: anywhere;
  white-space: normal;
}
.har-slow-table {
  min-width: 620px;
}
.har-groups-table {
  min-width: 640px;
}
.har-groups-table th:first-child {
  width: 210px;
  min-width: 180px;
}
.har-request-url {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.72rem;
  max-width: 36rem;
}
.har-duration {
  min-width: 8rem;
}
.har-time-track {
  display: block;
  height: 0.35rem;
  border-radius: 99px;
  background: var(--muted);
  margin-top: 0.5rem;
  overflow: hidden;
}
.har-time-track span {
  display: block;
  height: 100%;
  background: var(--primary);
}
@media (max-width: 540px) {
  .har-metrics {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
