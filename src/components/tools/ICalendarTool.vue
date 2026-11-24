<script setup vapor lang="ts">
import { computed, ref } from "vue";
import ApplyControl from "@/components/ApplyControl.vue";
import CodeInput from "@/components/CodeInput.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import OutputActions from "@/components/OutputActions.vue";
import { Button } from "@/components/ui/button";
import { useToolExecution } from "@/composables/useToolExecution";
import { useAppI18n } from "@/i18n/useAppI18n";
import { ICALENDAR_LIMITS, inspectICalendar } from "@/lib/tools/icalendar";
import { ICALENDAR_SAMPLE } from "@/lib/tools/icalendar-sample";
import { runInspectorWorker } from "@/lib/tools/inspector-worker";

const { t } = useAppI18n();
const input = ref("");
const loading = ref(false);
const rejected = ref(false);
const revision = ref(0);
const source = computed(() => [input.value, loading.value, rejected.value, revision.value]);
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(input.value) && !loading.value && !rejected.value,
  mode: () => input.value.length <= ICALENDAR_LIMITS.instantCharacters ? "instant" : "deferred",
  execute: (signal) => {
    if (input.value.length <= ICALENDAR_LIMITS.instantCharacters) return inspectICalendar(input.value);
    return runInspectorWorker({ kind: "icalendar", input: input.value }, signal).then(report => report.data);
  },
});
const preview = computed(() => {
  let remainingEvents: number = ICALENDAR_LIMITS.preview;
  let remainingZones: number = ICALENDAR_LIMITS.preview;
  return result.value?.calendars.slice(0, ICALENDAR_LIMITS.preview).map(calendar => {
    const events = calendar.events.slice(0, remainingEvents);
    const timezones = calendar.timezones.slice(0, remainingZones);
    remainingEvents -= events.length;
    remainingZones -= timezones.length;
    return { ...calendar, allEvents: calendar.events.length, allZones: calendar.timezones.length, events, timezones };
  }) ?? [];
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function replace(value: string) {
  revision.value++;
  loading.value = false;
  rejected.value = false;
  input.value = value;
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="icalendar-sample" @click="replace(ICALENDAR_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="icalendar-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('icalendar.input')" :input-hint="t('icalendar.inputLimit')" input-id="icalendar-input" :rows="8" accept=".ics,text/calendar,text/plain" :max-bytes="ICALENDAR_LIMITS.inputBytes" :placeholder="ICALENDAR_SAMPLE" @update:model-value="input = $event; rejected = false" @loading="loading = $event" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.icalendar.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="icalendar-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice icalendar-scope">{{ t("icalendar.scope") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("icalendar.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" data-testid="icalendar-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-icalendar.json" type="application/json;charset=utf-8" />
    </div>
    <p class="hint" role="status">{{ t("icalendar.calendars", { shown: preview.length, total: result.calendars.length }) }}</p>
    <div v-if="result.diagnosticCount" class="notice" data-testid="icalendar-diagnostics">
      <p role="status">{{ t("icalendar.diagnostics", { shown: Math.min(ICALENDAR_LIMITS.preview, result.diagnostics.length), total: result.diagnosticCount, exported: result.diagnostics.length }) }}</p>
      <ul>
        <li v-for="(diagnostic, i) in result.diagnostics.slice(0, ICALENDAR_LIMITS.preview)" :key="i">
          {{ t("icalendar.line", { line: diagnostic.line }) }} · {{ t("icalendar.issue." + diagnostic.code) }}
          <code v-if="diagnostic.property">{{ diagnostic.property }}</code>
        </li>
      </ul>
    </div>
    <section v-for="calendar in preview" :key="calendar.line" class="calendar-preview">
      <h3>VCALENDAR · {{ t("icalendar.line", { line: calendar.line }) }}</h3>
      <p v-if="calendar.version"><code>VERSION</code> <bdi>{{ calendar.version }}</bdi></p>
      <p v-if="calendar.method"><code>METHOD</code> <bdi>{{ calendar.method }}</bdi></p>
      <p class="hint">{{ t("icalendar.zones", { shown: calendar.timezones.length, total: calendar.allZones }) }}</p>
      <ul v-if="calendar.timezones.length">
        <li v-for="zone in calendar.timezones" :key="zone.line" data-testid="icalendar-timezone">
          {{ t("icalendar.line", { line: zone.line }) }} · <code><bdi>{{ zone.tzid || "—" }}</bdi></code>
        </li>
      </ul>
      <p class="hint">{{ t("icalendar.events", { shown: calendar.events.length, total: calendar.allEvents }) }}</p>
      <details v-for="event in calendar.events" :key="event.line" class="calendar-event" data-testid="icalendar-event">
        <summary>
          <bdi>{{ event.summary || event.uid || "VEVENT" }}</bdi> · {{ t("icalendar.line", { line: event.line }) }}
          <span v-if="event.recurrenceId" class="hint"> · {{ t("icalendar.exception") }}</span>
          <span v-if="event.start" class="hint calendar-start">
            <code><bdi>{{ event.start.value }}</bdi></code> · {{ t("icalendar.date." + event.start.kind) }}
            <code v-if="event.start.tzid"><bdi>{{ event.start.tzid }}</bdi></code>
          </span>
        </summary>
        <dl>
          <div v-if="event.uid"><dt>UID</dt><dd><bdi>{{ event.uid }}</bdi></dd></div>
          <div v-for="item in [
            { name: 'DTSTART', date: event.start }, { name: 'DTEND', date: event.end },
            { name: 'DTSTAMP', date: event.stamp }, { name: 'RECURRENCE-ID', date: event.recurrenceId },
          ]" :key="item.name">
            <template v-if="item.date">
              <dt>{{ item.name }}</dt>
              <dd><bdi>{{ item.date.value }}</bdi> · {{ t("icalendar.date." + item.date.kind) }} <bdi v-if="item.date.tzid">{{ item.date.tzid }}</bdi></dd>
            </template>
          </div>
          <div v-if="event.recurrenceId?.range"><dt>RANGE</dt><dd><bdi>{{ event.recurrenceId.range }}</bdi></dd></div>
          <div v-if="event.duration"><dt>DURATION</dt><dd><bdi>{{ event.duration }}</bdi></dd></div>
          <div v-if="event.sequence"><dt>SEQUENCE</dt><dd><bdi>{{ event.sequence }}</bdi></dd></div>
          <div v-for="rule in event.recurrence.slice(0, ICALENDAR_LIMITS.preview)" :key="rule.line">
            <dt>{{ rule.name }} · {{ t("icalendar.line", { line: rule.line }) }}</dt>
            <dd>
              <bdi v-if="Object.keys(rule.parameters).length">{{ JSON.stringify(rule.parameters) }} · </bdi>
              <bdi>{{ rule.value }}</bdi>
            </dd>
          </div>
        </dl>
        <p v-if="event.recurrence.length > ICALENDAR_LIMITS.preview" class="hint">
          {{ t("icalendar.rules", { shown: ICALENDAR_LIMITS.preview, total: event.recurrence.length }) }}
        </p>
      </details>
    </section>
    <p class="hint">{{ t("icalendar.export") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.icalendar-scope, .calendar-preview { margin-top: 1rem; }
.calendar-preview, .calendar-event, .notice { overflow-wrap: anywhere; }
.calendar-preview h3 { font-weight: 600; }
.calendar-preview ul, .notice ul { list-style: disc; padding-inline-start: 1.4rem; }
.calendar-event { padding: .5rem .75rem; border: 1px solid var(--border); border-radius: .5rem; margin-block: .4rem; }
.calendar-event summary { cursor: pointer; white-space: pre-wrap; }
.calendar-start { display: block; margin: .2rem 0 0 1rem; }
.calendar-event dl div { margin-top: .3rem; }
dt { font-family: var(--font-mono); font-size: .8rem; }
dd { white-space: pre-wrap; }
</style>
