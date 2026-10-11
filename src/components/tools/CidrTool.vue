<script setup vapor lang="ts">
import { computed, ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import { copyText, downloadText } from "@/lib/io";
import { analyzeCidr, type CidrResult } from "@/lib/tools";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";

const { t, locale } = useAppI18n();
const input = ref("");
const {
  result,
  error: executionError,
  control,
  apply,
  cancel,
  setAuto,
} = useToolExecution<CidrResult>({
  source: input,
  canRun: () => Boolean(input.value.trim()),
  mode: "instant",
  execute: () => analyzeCidr(input.value),
});
const copyError = ref("");
const error = computed(
  () => copyError.value || (executionError.value ? `errors.${executionError.value}` : ""),
);
const copied = ref(false);

watch(input, () => {
  copyError.value = "";
  copied.value = false;
});

const rows = computed(() => {
  const value = result.value;
  if (!value) return [];
  const all: [string, string | null][] = [
    ["cidr.address", value.address],
    ["cidr.network", value.network],
    ["cidr.lastAddress", value.lastAddress],
    ["cidr.subnetMask", value.subnetMask],
    ["cidr.wildcardMask", value.wildcardMask],
    ["cidr.broadcast", value.broadcast],
    ["cidr.firstHost", value.firstHost],
    ["cidr.lastHost", value.lastHost],
  ];
  return all.filter((entry): entry is [string, string] => entry[1] !== null);
});

function count(value: string): string {
  return new Intl.NumberFormat(locale.value).format(BigInt(value));
}

async function copy(): Promise<void> {
  if (!result.value) return;
  try {
    await copyText(JSON.stringify(result.value, null, 2));
    copied.value = true;
    copyError.value = "";
  } catch {
    copyError.value = "errors.CLIPBOARD_UNAVAILABLE";
  }
}

function download(): void {
  if (result.value)
    downloadText(
      JSON.stringify(result.value, null, 2),
      "subnet.json",
      "application/json;charset=utf-8",
    );
}
</script>

<template>
  <div class="tool-panel">
    <form class="cidr-form" @submit.prevent="apply">
      <label for="cidr-input" class="field-label">{{ t("cidr.input") }}</label>
      <input
        id="cidr-input"
        v-model="input"
        class="native-select cidr-input"
        type="text"
        placeholder="192.168.1.130/26"
        autocomplete="off"
        autocapitalize="none"
        :spellcheck="false"
        :maxlength="100"
        :aria-invalid="Boolean(error) && !result"
        aria-describedby="cidr-hint"
      />
      <p id="cidr-hint" class="hint">{{ t("tool.cidr.hint") }}</p>
      <div class="control-row">
        <Button type="button" variant="outline" @click="input = '192.168.1.130/26'">{{
          t("actions.sample")
        }}</Button>
        <Button type="button" variant="outline" @click="input = '2001:db8:1234:5678::1234/64'">{{
          t("cidr.ipv6Example")
        }}</Button>
        <Button type="button" variant="ghost" :disabled="!input" @click="input = ''">{{
          t("actions.clear")
        }}</Button>
        <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      </div>
    </form>

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
      <div class="cidr-network">
        <span class="metric-label">{{ t("cidr.canonical") }}</span>
        <code>{{ result.cidr }}</code>
      </div>
      <p v-if="result.hostBitsSet" class="hint">{{ t("cidr.normalized") }}</p>
      <div class="metric-grid">
        <div class="metric cidr-wide-metric">
          <span class="metric-label">{{ t("cidr.addressCount") }}</span>
          <strong class="metric-value cidr-count">{{ count(result.addressCount) }}</strong>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t("cidr.family") }}</span>
          <strong class="metric-value">IPv{{ result.version }}</strong>
        </div>
        <div v-if="result.usableHostCount !== null" class="metric">
          <span class="metric-label">{{ t("cidr.usableHosts") }}</span>
          <strong class="metric-value cidr-count">{{ count(result.usableHostCount) }}</strong>
        </div>
      </div>
      <div class="table-scroll">
        <table class="data-table">
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
      <p class="hint">
        {{
          t(
            result.version === 6
              ? "cidr.ipv6Note"
              : result.prefix === 31
                ? "cidr.pointToPoint"
                : "cidr.hostNote",
          )
        }}
      </p>
    </section>
    <div v-else-if="!error" class="empty-result">
      <strong>{{ t("states.ready") }}</strong>
      <p>{{ t("states.emptyResult") }}</p>
    </div>
  </div>
</template>

<style scoped>
.cidr-form {
  display: grid;
  gap: 0.75rem;
}
.cidr-input {
  width: 100%;
  font-family: var(--font-mono, monospace);
}
.cidr-network {
  display: grid;
  gap: 0.55rem;
  margin-bottom: 1rem;
}
.cidr-network code {
  font-size: clamp(1.15rem, 2.2vw, 1.8rem);
  overflow-wrap: anywhere;
}
.cidr-count {
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}
.cidr-wide-metric {
  min-width: 0;
}
</style>
