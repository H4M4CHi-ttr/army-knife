<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { createPalette, type Harmony } from "@/lib/tools/palette";
const {t}=useAppI18n();
const base=ref("#3366FF"),count=ref(5),harmony=ref<Harmony>("analogous");
const source=computed(()=>({base:base.value,count:count.value,harmony:harmony.value}));
const {result,error,control,apply,cancel,setAuto}=useToolExecution({
  source,canRun:()=>true,mode:"instant",execute:()=>createPalette(source.value),
});
</script>
<template>
  <section class="tool-panel">
    <div class="tool-toolbar"><div class="toolbar-label"><span class="step-number">01</span>{{ t("design.controls") }}</div></div>
    <div class="design-fields">
      <label class="field-label" for="palette-base">{{ t("design.baseColor") }}
        <input id="palette-base" v-model="base" maxlength="9" class="native-select" /></label>
      <label class="field-label" for="palette-count">{{ t("design.count") }}
        <input id="palette-count" v-model.number="count" type="number" min="2" max="8" step="1" class="native-select" /></label>
      <label class="field-label" for="palette-harmony">{{ t("design.harmony") }}
        <select id="palette-harmony" v-model="harmony" class="native-select">
          <option value="analogous">{{ t("design.analogous") }}</option>
          <option value="complementary">{{ t("design.complementary") }}</option>
          <option value="triadic">{{ t("design.triadic") }}</option></select></label>
    </div>
    <p class="hint">{{ t("tool.color-palette.hint") }}</p>
    <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
  </section>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors."+error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header"><h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="result.css" filename="army-knife-palette.css" type="text/css;charset=utf-8" /></div>
    <div class="swatches" data-testid="color-palette-output">
      <div v-for="(color,index) in result.colors" :key="index" class="swatch">
        <div class="swatch-color" :style="{backgroundColor:color.hex}" />
        <code>{{ color.hex }}</code>
        <span class="hint">{{ t("design.hueOffset") }} {{ Number(color.offset.toFixed(1)) }}°</span>
      </div>
    </div>
    <pre class="code-output">{{ result.css }}</pre>
    <p class="hint">{{ t("design.paletteNote") }}</p>
  </section>
</template>
<style scoped>
.design-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,165px),1fr));gap:12px;margin:12px 0}
.design-fields .field-label{display:flex;flex-direction:column;gap:7px}
.swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,110px),1fr));gap:12px;margin:16px 0}
.swatch{min-width:0;display:flex;flex-direction:column;gap:5px}
.swatch-color{height:76px;border:1px solid var(--border);border-radius:8px}
.swatch code{overflow-wrap:anywhere}
</style>
