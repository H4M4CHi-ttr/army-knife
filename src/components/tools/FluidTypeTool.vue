<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import OutputActions from "@/components/OutputActions.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { calculateFluidType } from "@/lib/tools/fluid-type";

const { t } = useAppI18n();
const minSize=ref(16), maxSize=ref(24), minViewport=ref(320), maxViewport=ref(1280), rootSize=ref(16);
const previewViewport=ref(800);
const source=computed(() => ({
  minSize:minSize.value, maxSize:maxSize.value, minViewport:minViewport.value,
  maxViewport:maxViewport.value, rootSize:rootSize.value,
}));
const {result,error,control,apply,cancel,setAuto}=useToolExecution({
  source,
  canRun:()=>true,
  mode:"instant",
  execute:()=>calculateFluidType(source.value),
});
</script>
<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("fluid.settings") }}</div>
    </div>
    <div class="fluid-inputs">
      <label class="field-label" for="fluid-type-input">{{ t("fluid.minSize") }}
        <input id="fluid-type-input" v-model.number="minSize" type="number" step="0.1" min="0.5" max="256" class="native-select" />
      </label>
      <label class="field-label" for="fluid-max-size">{{ t("fluid.maxSize") }}
        <input id="fluid-max-size" v-model.number="maxSize" type="number" step="0.1" min="0.5" max="256" class="native-select" />
      </label>
      <label class="field-label" for="fluid-min-viewport">{{ t("fluid.minViewport") }}
        <input id="fluid-min-viewport" v-model.number="minViewport" type="number" step="1" min="240" max="10000" class="native-select" />
      </label>
      <label class="field-label" for="fluid-max-viewport">{{ t("fluid.maxViewport") }}
        <input id="fluid-max-viewport" v-model.number="maxViewport" type="number" step="1" min="240" max="10000" class="native-select" />
      </label>
      <label class="field-label" for="fluid-root-size">{{ t("fluid.rootSize") }}
        <input id="fluid-root-size" v-model.number="rootSize" type="number" step="0.1" min="8" max="32" class="native-select" />
      </label>
    </div>
    <p class="hint">{{ t("tool.fluid-type.hint") }}</p>
    <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
  </div>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="result.css" filename="army-knife-fluid-type.css" type="text/css;charset=utf-8" />
    </div>
    <pre class="code-output" data-testid="fluid-type-output">{{ result.css }}</pre>
    <div class="fluid-preview">
      <label class="field-label" for="fluid-preview-width">{{ t("fluid.previewWidth") }}: {{ previewViewport }} px</label>
      <input id="fluid-preview-width" v-model.number="previewViewport" type="range"
        :min="minViewport" :max="maxViewport" step="1" class="fluid-slider" />
      <p class="hint">{{ t("fluid.calculated") }}: {{ result.previewPx(previewViewport).toFixed(2) }} px</p>
      <div class="fluid-sample">
        <p :style="{ fontSize: result.previewPx(previewViewport) + 'px' }">{{ t("fluid.sample") }}</p>
      </div>
    </div>
    <p class="hint">{{ t("fluid.rounding") }}</p>
  </section>
</template>
<style scoped>
.fluid-inputs { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,168px),1fr)); gap: 14px; margin-bottom: 18px; }
.fluid-inputs .field-label { display: flex; flex-direction: column; gap: 8px; }
.fluid-inputs .native-select { width: 100%; min-width: 0; }
.fluid-preview { margin-top: 22px; }
.fluid-slider { display: block; width: 100%; margin: 12px 0; }
.fluid-sample { margin: 14px 0; padding: 20px; border: 1px solid var(--border); border-radius: 8px; overflow-wrap: anywhere; }
.fluid-sample p { line-height: 1.4; }
</style>
