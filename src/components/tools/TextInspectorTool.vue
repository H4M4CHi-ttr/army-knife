<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import OutputActions from "@/components/OutputActions.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { useAppI18n } from "@/i18n/useAppI18n";
import {
  inspectUserAgent, inspectSetCookie, TEXT_INSPECTOR_LIMITS,
  type UserAgentReport, type CookieReport,
} from "@/lib/tools/text-inspectors";

const props = defineProps<{ kind: "user-agent" | "set-cookie" }>();
const { t, locale } = useAppI18n();
const input = ref("");
const { result, error, control, apply, cancel, setAuto } = useToolExecution<UserAgentReport | CookieReport>({
  source: () => [props.kind, input.value],
  canRun: () => input.value.trim().length > 0,
  mode: () => input.value.length <= 4096 ? "instant" : "deferred",
  execute: () => props.kind === "user-agent" ? inspectUserAgent(input.value) : inspectSetCookie(input.value),
});
const ua = computed(() => result.value && "browser" in result.value ? result.value : null);
const cookies = computed(() => result.value && "cookies" in result.value ? result.value : null);
const report = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function sample() {
  input.value = props.kind === "user-agent"
    ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
    : "Set-Cookie: __Host-session=synthetic; Secure; HttpOnly; Path=/; SameSite=Lax\nSet-Cookie: preview=synthetic; Path=/; SameSite=None";
}
function warningText(code: string): string {
  return t("inspector.warning." + code);
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" @click="sample">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" :disabled="!input" @click="input = ''">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput v-model="input" :label="t('labels.input')" :input-id="kind + '-input'"
      :max-bytes="kind === 'user-agent' ? TEXT_INSPECTOR_LIMITS.userAgentBytes : TEXT_INSPECTOR_LIMITS.cookieBytes"
      :rows="kind === 'user-agent' ? 4 : 8" :file="false" />
    <div class="run-bar">
      <p class="hint">{{ t("tool." + kind + ".hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="report" :filename="'army-knife-' + kind + '.json'" type="application/json" />
    </div>
    <template v-if="ua">
      <div class="metric-grid">
        <div v-for="row in [
          ['browser', ua.browser], ['engine', ua.engine], ['os', ua.os],
          ['device', ua.device], ['bot', ua.bot]
        ]" :key="row[0]" class="metric">
          <span class="metric-label">{{ t("inspector." + row[0]) }}</span>
          <strong class="metric-value inspector-wrap">{{ row[1] }}</strong>
        </div>
      </div>
      <h3 class="field-label">{{ t("inspector.evidence") }}</h3>
      <ul v-if="ua.evidence.length" class="inspector-list">
        <li v-for="(token, index) in ua.evidence" :key="index"><code>{{ token }}</code></li>
      </ul>
      <p v-else class="hint">{{ t("inspector.none") }}</p>
      <h3 class="field-label">{{ t("inspector.warnings") }}</h3>
      <ul class="inspector-list">
        <li v-for="code in ua.warnings" :key="code">{{ warningText(code) }}</li>
      </ul>
    </template>
    <template v-else-if="cookies">
      <div class="metric-grid">
        <div class="metric"><span class="metric-label">{{ t("inspector.cookies") }}</span>
          <strong class="metric-value">{{ cookies.cookies.length.toLocaleString(locale) }}</strong></div>
        <div class="metric"><span class="metric-label">{{ t("inspector.skipped") }}</span>
          <strong class="metric-value">{{ cookies.skipped.toLocaleString(locale) }}</strong></div>
      </div>
      <div class="inspector-table-scroll">
        <table class="inspector-summary-table" data-testid="cookie-table">
          <thead><tr>
            <th scope="col">{{ t("inspector.name") }}</th>
            <th scope="col">{{ t("inspector.sameSite") }}</th>
            <th scope="col">{{ t("inspector.flags") }}</th>
            <th scope="col">{{ t("inspector.warnings") }}</th>
          </tr></thead>
          <tbody><tr v-for="(cookie, index) in cookies.cookies" :key="index">
            <th scope="row">{{ cookie.name }}</th>
            <td>{{ cookie.sameSite }}</td>
            <td>{{ [cookie.secure && 'Secure', cookie.httpOnly && 'HttpOnly', cookie.partitioned && 'Partitioned'].filter(Boolean).join(', ') || t("inspector.none") }}</td>
            <td>{{ cookie.warnings.length }}</td>
          </tr></tbody>
        </table>
      </div>
      <div v-for="(cookie, index) in cookies.cookies" :key="index" class="inspector-cookie">
        <h3 class="inspector-wrap">{{ cookie.name }}</h3>
        <dl class="cookie-details">
          <div><dt>{{ t("inspector.sameSite") }}</dt><dd>{{ cookie.sameSite }}</dd></div>
          <div><dt>{{ t("inspector.flags") }}</dt><dd>
            {{ [cookie.secure && 'Secure', cookie.httpOnly && 'HttpOnly', cookie.partitioned && 'Partitioned'].filter(Boolean).join(', ') || t("inspector.none") }}
          </dd></div>
          <div><dt>{{ t("inspector.path") }}</dt><dd>{{ cookie.path || t("inspector.none") }}</dd></div>
          <div><dt>{{ t("inspector.domain") }}</dt><dd>{{ cookie.domain || t("inspector.none") }}</dd></div>
          <div><dt>{{ t("inspector.expires") }}</dt><dd>{{ cookie.maxAge || cookie.expires || t("inspector.none") }}</dd></div>
        </dl>
        <ul v-if="cookie.warnings.length" class="inspector-list">
          <li v-for="code in cookie.warnings" :key="code">{{ warningText(code) }}</li>
        </ul>
        <p v-else class="hint">{{ t("inspector.noWarnings") }}</p>
      </div>
    </template>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.inspector-table-scroll { overflow-x:auto; max-width:100%; margin:1rem 0; }
.inspector-summary-table { width:100%; border-collapse:collapse; font-size:0.85rem; }
.inspector-summary-table th, .inspector-summary-table td { border-bottom:1px solid var(--border); padding:0.55rem; text-align:left; min-width:5rem; overflow-wrap:anywhere; }
.inspector-cookie { border-top:1px solid var(--border); padding:1rem 0; }
.inspector-wrap { overflow-wrap:anywhere; }
.inspector-list { padding-left:1.5rem; margin:0.5rem 0 1rem; overflow-wrap:anywhere; }
.cookie-details { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:0.5rem 1rem; margin:0.8rem 0; }
.cookie-details dt { font-size:0.75rem; color:var(--muted-foreground); }
.cookie-details dd { margin:0.15rem 0 0; overflow-wrap:anywhere; }
</style>
