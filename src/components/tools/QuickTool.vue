<script setup vapor lang="ts">
import { reactive, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import {
  QUICK_LIMITS,
  SIZE_UNITS,
  CSS_UNITS,
  convertDataUnits,
  convertCssUnits,
  normalizeUnicode,
  createSlugs,
  convertUnicodeEscape,
  type QuickToolId,
  type UnicodeForm,
  type CssUnit,
  type CssContext,
  type SlugMode,
  type SlugSeparator,
  type EscapeNotation,
  type QuickResult,
} from "@/lib/tools/quick-converters";

const props = defineProps<{ id: QuickToolId }>();
const { t } = useAppI18n();
const input = ref("");
const sizeUnit = ref("MiB");
const rate = ref(false);
const cssUnit = ref<CssUnit>("px");
const cssContext = reactive<CssContext>({ root: "16", element: "16", width: "1440", height: "900" });
const form = ref<UnicodeForm>("NFC");
const slugMode = ref<SlugMode>("unicode");
const separator = ref<SlugSeparator>("-");
const notation = ref<EscapeNotation>("uplus");
const direction = ref<"encode" | "decode">("encode");
const cssFields: { key: keyof CssContext; label: string }[] = [
  { key: "root", label: "quick.root" },
  { key: "element", label: "quick.element" },
  { key: "width", label: "quick.width" },
  { key: "height", label: "quick.height" },
];
const isNumber = props.id === "data-units" || props.id === "css-units";

const { result, error, control, apply, cancel, setAuto } = useToolExecution<QuickResult>({
  source: () => [
    input.value, props.id, sizeUnit.value, rate.value, cssUnit.value,
    cssContext.root, cssContext.element, cssContext.width, cssContext.height,
    form.value, slugMode.value, separator.value, notation.value, direction.value,
  ],
  canRun: () => input.value.length > 0,
  mode: () => input.value.length < 2048 ? "instant" : "deferred",
  execute: () => {
    switch (props.id) {
      case "data-units":
        return convertDataUnits(
          input.value,
          rate.value ? (sizeUnit.value.endsWith("B") ? sizeUnit.value + "/s" : sizeUnit.value + "ps") : sizeUnit.value,
          rate.value,
        );
      case "css-units":
        return convertCssUnits(input.value, cssUnit.value, cssContext);
      case "unicode-normalize":
        return normalizeUnicode(input.value, form.value);
      case "slug":
        return createSlugs(input.value, slugMode.value, separator.value);
      case "unicode-escape":
        return convertUnicodeEscape(input.value, notation.value, direction.value);
    }
  },
});

function sample() {
  switch (props.id) {
    case "data-units": input.value = "1"; sizeUnit.value = "MiB"; rate.value = false; break;
    case "css-units": input.value = "16"; cssUnit.value = "px"; break;
    case "unicode-normalize": input.value = "Cafe\u0301 ① 👩‍💻"; break;
    case "slug": input.value = "Café Déjà Vu\nCafé Déjà Vu"; break;
    case "unicode-escape":
      input.value = direction.value === "encode" ? "A😀" :
        notation.value === "uplus" ? "U+0041 U+1F600" :
        notation.value === "js-utf16" ? "\\u0041\\uD83D\\uDE00" : "\\u{41}\\u{1F600}";
      break;
  }
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
    <div v-if="id === 'data-units'" class="quick-options">
      <label class="field-label" for="quick-rate">{{ t("quick.mode") }}</label>
      <select id="quick-rate" v-model="rate" class="native-select" data-testid="quick-rate">
        <option :value="false">{{ t("quick.size") }}</option>
        <option :value="true">{{ t("quick.rate") }}</option>
      </select>
      <label class="field-label" for="quick-unit">{{ t("quick.unit") }}</label>
      <select id="quick-unit" v-model="sizeUnit" class="native-select" data-testid="quick-unit">
        <option v-for="unit in SIZE_UNITS" :key="unit.symbol" :value="unit.symbol">
          {{ rate ? (unit.symbol.endsWith("B") ? unit.symbol + "/s" : unit.symbol + "ps") : unit.symbol }}
        </option>
      </select>
    </div>
    <div v-else-if="id === 'css-units'" class="quick-options">
      <label class="field-label" for="quick-css-unit">{{ t("quick.fromUnit") }}</label>
      <select id="quick-css-unit" v-model="cssUnit" class="native-select" data-testid="quick-css-unit">
        <option v-for="unit in CSS_UNITS" :key="unit" :value="unit">{{ unit }}</option>
      </select>
      <div v-for="field in cssFields" :key="field.key" class="quick-context">
        <label class="field-label" :for="'quick-css-' + field.key">{{ t(field.label) }}</label>
        <Input
          :id="'quick-css-' + field.key"
          :model-value="cssContext[field.key]"
          :aria-label="t(field.label)"
          inputmode="decimal"
          maxlength="32"
          @update:model-value="cssContext[field.key] = String($event)"
        />
      </div>
    </div>
    <div v-else-if="id === 'unicode-normalize'" class="quick-options">
      <label class="field-label" for="quick-form">{{ t("quick.form") }}</label>
      <select id="quick-form" v-model="form" class="native-select" data-testid="quick-form">
        <option v-for="choice in (['NFC', 'NFD', 'NFKC', 'NFKD'] as const)" :key="choice" :value="choice">{{ choice }}</option>
      </select>
    </div>
    <div v-else-if="id === 'slug'" class="quick-options">
      <label class="field-label" for="quick-slug-mode">{{ t("quick.slugMode") }}</label>
      <select id="quick-slug-mode" v-model="slugMode" class="native-select" data-testid="quick-slug-mode">
        <option value="unicode">{{ t("quick.unicode") }}</option>
        <option value="ascii">{{ t("quick.ascii") }}</option>
      </select>
      <label class="field-label" for="quick-separator">{{ t("quick.separator") }}</label>
      <select id="quick-separator" v-model="separator" class="native-select" data-testid="quick-separator">
        <option value="-">-</option>
        <option value="_">_</option>
      </select>
    </div>
    <div v-else class="quick-options">
      <label class="field-label" for="quick-direction">{{ t("quick.direction") }}</label>
      <select id="quick-direction" v-model="direction" class="native-select" data-testid="quick-direction">
        <option value="encode">{{ t("quick.encode") }}</option>
        <option value="decode">{{ t("quick.decode") }}</option>
      </select>
      <label class="field-label" for="quick-notation">{{ t("quick.notation") }}</label>
      <select id="quick-notation" v-model="notation" class="native-select" data-testid="quick-notation">
        <option value="uplus">U+XXXX</option>
        <option value="js-utf16">JS \uXXXX (UTF-16)</option>
        <option value="js-codepoint">JS \u{...}</option>
      </select>
    </div>
    <div v-if="isNumber" class="quick-number">
      <label class="field-label" for="quick-input">{{ t("quick.amount") }}</label>
      <Input id="quick-input" v-model="input" inputmode="decimal" maxlength="96"
        data-testid="quick-input" spellcheck="false" />
    </div>
    <CodeInput v-else v-model="input" :label="t('labels.input')" input-id="quick-text"
      :max-bytes="QUICK_LIMITS.inputBytes" :rows="5" :file="false" />
    <div class="run-bar">
      <p class="hint">{{ t("tool." + id + ".hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="result.output" filename="army-knife-converted.txt" type="text/plain;charset=utf-8" />
    </div>
    <pre class="code-output" data-testid="quick-output">{{ result.output }}</pre>
    <p v-if="result.notice" class="hint" data-testid="quick-notice">{{ t("quick.notice." + result.notice) }}</p>
    <div v-if="result.rows.length" class="table-scroll">
      <table class="data-table">
        <thead>
          <tr><th>{{ t("labels.name") }}</th><th>{{ t("labels.value") }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in result.rows" :key="index">
            <th class="quick-label"><code>{{ row.label }}</code></th>
            <td class="quick-value"><code>{{ row.value }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.quick-options { display: flex; flex-wrap: wrap; align-items: end; gap: 0.75rem; margin-bottom: 1rem; }
.quick-options > .field-label { align-self: center; }
.quick-options .native-select { min-width: 7.5rem; max-width: 100%; }
.quick-context { flex: 1 1 9rem; min-width: 9rem; }
.quick-context .field-label { display: block; margin-bottom: 0.25rem; }
.quick-number { max-width: 24rem; margin: 0 0 1rem; }
.quick-number .field-label { display: block; margin-bottom: 0.4rem; }
.quick-value { overflow-wrap: anywhere; white-space: pre-wrap; unicode-bidi: isolate; }
.quick-label { width: 8rem; }
</style>
