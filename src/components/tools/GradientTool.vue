<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { createGradient, type GradientStop } from "@/lib/tools/gradient";
const {t}=useAppI18n();
const kind=ref<"linear"|"radial">("linear"),angle=ref(90);
const stops=ref<GradientStop[]>([{color:"#3366FF",position:0},{color:"#FF8C00CC",position:100}]);
function addStop(){if(stops.value.length<8)stops.value.push({color:"#FFFFFF",position:100});}
function removeStop(index:number){if(stops.value.length>2)stops.value.splice(index,1);}
const source=computed(()=>({kind:kind.value,angle:angle.value,stops:stops.value.map(s=>({...s}))}));
const {result,error,control,apply,cancel,setAuto}=useToolExecution({
  source,canRun:()=>true,mode:"instant",execute:()=>createGradient(source.value),
});
</script>
<template>
  <section class="tool-panel">
    <div class="tool-toolbar"><div class="toolbar-label"><span class="step-number">01</span>{{ t("design.controls") }}</div>
      <Button variant="outline" size="sm" :disabled="stops.length>=8" @click="addStop">{{ t("design.addStop") }}</Button></div>
    <div class="design-fields">
      <label class="field-label" for="gradient-kind">{{ t("design.gradientKind") }}
        <select id="gradient-kind" v-model="kind" class="native-select"><option value="linear">{{ t("design.linear") }}</option><option value="radial">{{ t("design.radial") }}</option></select>
      </label>
      <label class="field-label" for="gradient-angle">{{ t("design.angle") }}
        <input id="gradient-angle" v-model.number="angle" type="number" min="-360" max="360" step="1" class="native-select" :disabled="kind==='radial'" />
      </label>
    </div>
    <div v-for="(stop,index) in stops" :key="index" class="stop-row">
      <label class="field-label">{{ t("design.stop") }} {{ index+1 }}
        <input v-model="stop.color" type="text" maxlength="9" class="native-select" :aria-label="t('design.color')+' '+(index+1)" />
      </label>
      <label class="field-label">{{ t("design.position") }}: {{ stop.position }}%
        <input v-model.number="stop.position" type="range" min="0" max="100" step="1" :aria-label="t('design.position')+' '+(index+1)" />
      </label>
      <input v-model.number="stop.position" type="number" min="0" max="100" step="1" class="native-select stop-number" :aria-label="t('design.position')+' '+(index+1)" />
      <Button variant="outline" size="sm" :disabled="stops.length<=2" @click="removeStop(index)">{{ t("design.remove") }}</Button>
    </div>
    <p class="hint">{{ t("tool.css-gradient.hint") }}</p>
    <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
  </section>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors."+error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header"><h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="result" filename="army-knife-gradient.css" type="text/css;charset=utf-8" /></div>
    <pre class="code-output" data-testid="css-gradient-output">{{ result }}</pre>
    <div class="gradient-preview" data-testid="css-gradient-preview" :style="{backgroundImage:result}"></div>
    <p class="hint">{{ t("design.gradientNote") }}</p>
  </section>
</template>
<style scoped>
.design-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:12px;margin:12px 0}
.design-fields .field-label,.stop-row .field-label{display:flex;flex-direction:column;gap:7px}
.stop-row{display:grid;grid-template-columns:minmax(100px,1fr) minmax(120px,2fr) 70px auto;align-items:end;gap:10px;margin:12px 0}
.stop-row input[type=range]{width:100%}
.stop-number{min-width:0}
.gradient-preview{width:100%;height:140px;margin:16px 0;border:1px solid var(--border);border-radius:10px}
@media(max-width:560px){.stop-row{grid-template-columns:1fr 1fr}.stop-row .field-label:nth-child(2){grid-column:1 / -1}.stop-number{width:100%}}
</style>
