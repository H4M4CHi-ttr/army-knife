<script setup vapor lang="ts">
import { ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import OutputActions from "@/components/OutputActions.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { DUMMY_LIMITS, generateDummyText, type DummyLocale, type DummyUnit } from "@/lib/tools/dummy-text";

const { t } = useAppI18n();
const language = ref<DummyLocale>("la");
const unit = ref<DummyUnit>("paragraphs");
const count = ref(3);
const seed = ref(42);
function reset() { language.value = "la"; unit.value = "paragraphs"; count.value = 3; seed.value = 42; }
const { result, error, control, apply, cancel, setAuto } = useToolExecution<string>({
  source: () => [language.value,unit.value,count.value,seed.value],
  canRun: () => true,
  mode: "instant",
  execute: () => generateDummyText({ locale:language.value,unit:unit.value,count:count.value,seed:seed.value }),
});
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("dummy.options") }}</div>
      <div class="control-row"><Button variant="outline" size="sm" @click="reset">{{ t("actions.reset") }}</Button></div>
    </div>
    <div class="dummy-controls">
      <label class="field-label" for="dummy-language">{{ t("dummy.language") }}
        <select id="dummy-language" v-model="language" class="native-select" data-testid="dummy-language">
          <option value="la">Lorem ipsum</option><option value="en">English</option>
          <option value="ja">日本語</option><option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁體中文</option><option value="ko">한국어</option>
        </select>
      </label>
      <label class="field-label" for="dummy-unit">{{ t("dummy.unit") }}
        <select id="dummy-unit" v-model="unit" class="native-select" data-testid="dummy-unit">
          <option value="paragraphs">{{ t("dummy.paragraphs") }}</option>
          <option value="sentences">{{ t("dummy.sentences") }}</option>
          <option value="characters">{{ t("dummy.characters") }}</option>
        </select>
      </label>
      <label class="field-label" for="dummy-text-input">{{ t("dummy.count") }}
        <input id="dummy-text-input" v-model.number="count" type="number" min="0" :max="DUMMY_LIMITS[unit]" step="1" class="native-select" />
      </label>
      <label class="field-label" for="dummy-seed">{{ t("dummy.seed") }}
        <input id="dummy-seed" v-model.number="seed" type="number" min="0" max="4294967295" step="1" class="native-select" />
      </label>
    </div>
    <p class="hint">{{ t("tool.dummy-text.hint") }}</p>
    <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result !== null" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="result" filename="army-knife-dummy-text.txt" type="text/plain;charset=utf-8" />
    </div>
    <pre class="code-output dummy-output" data-testid="dummy-text-output">{{ result }}</pre>
    <p class="hint">{{ t("dummy.seedHint") }}</p>
  </section>
</template>
<style scoped>
.dummy-controls { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,180px),1fr)); gap: 14px; margin-bottom: 18px; }
.dummy-controls .field-label { display: flex; flex-direction: column; gap: 8px; }
.dummy-controls .native-select { width: 100%; min-width: 0; }
.dummy-output { white-space: pre-wrap; overflow-wrap: anywhere; min-height: 2rem; }
</style>
