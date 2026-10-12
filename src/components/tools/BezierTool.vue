<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { createBezier } from "@/lib/tools/bezier";
const {t}=useAppI18n();
const x1=ref(.25),y1=ref(.1),x2=ref(.25),y2=ref(1),duration=ref(600),play=ref(false);
const source=computed(()=>({x1:x1.value,y1:y1.value,x2:x2.value,y2:y2.value,duration:duration.value}));
const {result,error,control,apply,cancel,setAuto}=useToolExecution({
  source,canRun:()=>true,mode:"instant",execute:()=>createBezier(source.value),
});
const graphPath=computed(()=>{
  const data=result.value;if(!data)return "";
  const span=data.maxY-data.minY;
  return data.samples.map((p,i)=>(i?"L":"M")+(10+p.x*300).toFixed(2)+","+
    (170-(p.y-data.minY)/span*160).toFixed(2)).join(" ");
});
</script>
<template>
  <section class="tool-panel">
    <div class="tool-toolbar"><div class="toolbar-label"><span class="step-number">01</span>{{ t("design.controls") }}</div></div>
    <div class="design-fields">
      <label v-for="name in ['x1','y1','x2','y2'] as const" :key="name" class="field-label">
        {{ name }}
        <input v-if="name==='x1'" v-model.number="x1" type="number" min="0" max="1" step=".01" class="native-select" :aria-label="name" />
        <input v-else-if="name==='y1'" v-model.number="y1" type="number" min="-5" max="5" step=".01" class="native-select" :aria-label="name" />
        <input v-else-if="name==='x2'" v-model.number="x2" type="number" min="0" max="1" step=".01" class="native-select" :aria-label="name" />
        <input v-else v-model.number="y2" type="number" min="-5" max="5" step=".01" class="native-select" :aria-label="name" />
      </label>
      <label class="field-label" for="bezier-duration">{{ t("design.duration") }}
        <input id="bezier-duration" v-model.number="duration" type="number" min="50" max="20000" step="50" class="native-select" />
      </label>
    </div>
    <p class="hint">{{ t("tool.cubic-bezier.hint") }}</p>
    <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
  </section>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors."+error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header"><h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="result.css" filename="army-knife-easing.css" type="text/css;charset=utf-8" /></div>
    <pre class="code-output" data-testid="cubic-bezier-output">{{ result.css }}</pre>
    <svg class="easing-graph" viewBox="0 0 320 180" role="img" :aria-label="t('design.curve')">
      <path d="M10 10 V170 H310" fill="none" stroke="currentColor" stroke-opacity=".3"/>
      <path :d="graphPath" fill="none" stroke="currentColor" stroke-width="2.5"/>
    </svg>
    <div class="easing-preview"><Button variant="outline" size="sm" @click="play=!play">{{ t("design.preview") }}</Button>
      <div class="easing-track"><div class="easing-dot" :style="{
        transform:play?'translateX(180px)':'translateX(0)',
        transitionDuration:duration+'ms',transitionTimingFunction:result.css
      }"></div></div>
    </div>
    <p class="hint">{{ t("design.bezierNote") }}</p>
  </section>
</template>
<style scoped>
.design-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,125px),1fr));gap:12px;margin:12px 0}
.design-fields .field-label{display:flex;flex-direction:column;gap:7px}
.easing-graph{display:block;width:min(100%,460px);height:auto;margin:16px 0}
.easing-preview{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.easing-track{width:204px;padding:5px;background:var(--muted);border-radius:20px;overflow:hidden}
.easing-dot{width:14px;height:14px;border-radius:50%;background:var(--primary);transition-property:transform}
@media(prefers-reduced-motion:reduce){.easing-dot{transition:none!important}}
</style>
