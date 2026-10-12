<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import {
  TEXT_CODEC_LIMITS, transformHtmlEntities, transformPercentEncoding,
  type HtmlEscapeMode, type PercentMode, type TextDirection,
} from "@/lib/tools/text-codecs";

const props = defineProps<{ kind: "html-entities" | "url-encode" }>();
const { t } = useAppI18n();
const input = ref("");
const direction = ref<TextDirection>("encode");
const mode = ref<HtmlEscapeMode | PercentMode>(props.kind === "html-entities" ? "minimal" : "component");
const source = computed(() => [input.value, direction.value, mode.value, props.kind]);
const { result, error, control, apply, cancel, setAuto } = useToolExecution<string>({
  source,
  canRun: () => input.value.length > 0,
  mode: () => input.value.length <= TEXT_CODEC_LIMITS.deferredThreshold ? "instant" : "deferred",
  execute: () => props.kind === "html-entities"
    ? transformHtmlEntities(input.value, direction.value, mode.value as HtmlEscapeMode)
    : transformPercentEncoding(input.value, direction.value, mode.value as PercentMode),
});
function example() {
  if (props.kind === "html-entities")
    input.value = direction.value === "encode" ? '<span title="例">Hello & 👋</span>' : "&lt;span&gt;Hello &amp; &#x1F44B;&lt;/span&gt;";
  else
    input.value = direction.value === "encode" ? "Hello World/日本語+&" : "Hello+World%2F%E6%97%A5%E6%9C%AC%E8%AA%9E";
}
function swap() {
  if (result.value === null) return;
  input.value = result.value;
  direction.value = direction.value === "encode" ? "decode" : "encode";
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" @click="example">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" :disabled="!input" @click="input = ''">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div class="control-row codec-options">
      <label for="codec-direction" class="field-label">{{ t("codec.direction") }}</label>
      <select id="codec-direction" v-model="direction" class="native-select" data-testid="codec-direction">
        <option value="encode">{{ t("codec.encode") }}</option>
        <option value="decode">{{ t("codec.decode") }}</option>
      </select>
      <label for="codec-mode" class="field-label">{{ t("codec.mode") }}</label>
      <select id="codec-mode" v-model="mode" class="native-select" data-testid="codec-mode">
        <template v-if="kind === 'html-entities'">
          <option value="minimal">{{ t("codec.minimal") }}</option>
          <option value="full">{{ t("codec.full") }}</option>
        </template>
        <template v-else>
          <option value="component">{{ t("codec.component") }}</option>
          <option value="form">{{ t("codec.form") }}</option>
          <option value="path">{{ t("codec.path") }}</option>
        </template>
      </select>
    </div>
    <CodeInput
      v-model="input" :label="t('labels.input')"
      :input-id="kind + '-input'" :max-bytes="TEXT_CODEC_LIMITS.inputBytes"
      :rows="6" :file="false"
    />
    <div class="run-bar">
      <p class="hint">{{ t("tool." + kind + ".hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result !== null" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="result" :filename="'army-knife-' + kind + '.txt'" type="text/plain;charset=utf-8" />
    </div>
    <pre class="code-output" :data-testid="kind + '-output'">{{ result }}</pre>
    <p class="hint">{{ t("codec.onePass") }}</p>
    <div class="control-row codec-swap">
      <Button variant="outline" size="sm" @click="swap">{{ t("actions.swap") }}</Button>
    </div>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.codec-options { align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.codec-options .native-select { min-width: 135px; max-width: 100%; }
.codec-swap { margin-top: 14px; }
.code-output { overflow-wrap: anywhere; white-space: pre-wrap; }
</style>
