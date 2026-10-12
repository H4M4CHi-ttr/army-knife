<script setup vapor lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { createPlaceholder } from "@/lib/tools/placeholder";
const {t}=useAppI18n();
const width=ref(640),height=ref(360),background=ref("#2D5B8A"),
  label=ref("640 × 360"),alignment=ref<"top"|"center"|"bottom">("center");
const source=computed(()=>({width:width.value,height:height.value,background:background.value,label:label.value,alignment:alignment.value}));
const {result,error,control,apply,cancel,setAuto}=useToolExecution({
  source,canRun:()=>true,mode:"instant",execute:()=>createPlaceholder(source.value),
});
const previewUrl=ref(""),pngError=ref(false);
function revoke(){if(previewUrl.value)URL.revokeObjectURL(previewUrl.value);previewUrl.value="";}
watch(result,value=>{revoke();pngError.value=false;
  if(value)previewUrl.value=URL.createObjectURL(new Blob([value.svg],{type:"image/svg+xml"}));
});
onScopeDispose(revoke);
async function savePng(){
  const value=result.value;if(!value)return;
  pngError.value=false;
  try{
    const bitmap=await createImageBitmap(new Blob([value.svg],{type:"image/svg+xml"}));
    const canvas=document.createElement("canvas");canvas.width=width.value;canvas.height=height.value;
    const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas unavailable");
    ctx.drawImage(bitmap,0,0);bitmap.close();
    const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("PNG unavailable")),"image/png"));
    const url=URL.createObjectURL(png),link=document.createElement("a");
    link.href=url;link.download="army-knife-placeholder.png";link.click();
    requestAnimationFrame(()=>URL.revokeObjectURL(url));
  }catch{pngError.value=true;}
}
</script>
<template>
  <section class="tool-panel">
    <div class="tool-toolbar"><div class="toolbar-label"><span class="step-number">01</span>{{ t("design.controls") }}</div></div>
    <div class="design-fields">
      <label class="field-label" for="placeholder-width">{{ t("design.width") }}
        <input id="placeholder-width" v-model.number="width" type="number" min="1" max="4096" step="1" class="native-select" /></label>
      <label class="field-label" for="placeholder-height">{{ t("design.height") }}
        <input id="placeholder-height" v-model.number="height" type="number" min="1" max="4096" step="1" class="native-select" /></label>
      <label class="field-label" for="placeholder-bg">{{ t("design.color") }}
        <input id="placeholder-bg" v-model="background" maxlength="9" class="native-select" /></label>
      <label class="field-label" for="placeholder-alignment">{{ t("design.alignment") }}
        <select id="placeholder-alignment" v-model="alignment" class="native-select">
          <option value="top">{{ t("design.top") }}</option><option value="center">{{ t("design.center") }}</option><option value="bottom">{{ t("design.bottom") }}</option>
        </select></label>
    </div>
    <label class="field-label" for="placeholder-label">{{ t("design.label") }}
      <input id="placeholder-label" v-model="label" maxlength="160" class="native-select" /></label>
    <p class="hint">{{ t("tool.svg-placeholder.hint") }}</p>
    <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
  </section>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors."+error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header"><h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="result.svg" filename="army-knife-placeholder.svg" type="image/svg+xml;charset=utf-8" />
      <Button size="sm" variant="outline" @click="savePng">{{ t("design.savePng") }}</Button></div>
    <img v-if="previewUrl" :src="previewUrl" class="placeholder-preview" :alt="t('design.preview')" data-testid="svg-placeholder-preview" />
    <pre class="code-output" data-testid="svg-placeholder-output">{{ result.svg }}</pre>
    <p v-if="pngError" role="alert" class="error-panel">{{ t("errors.PNG_EXPORT_FAILED") }}</p>
    <p class="hint">{{ t("design.placeholderNote") }}</p>
  </section>
</template>
<style scoped>
.design-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:12px;margin:12px 0}
.design-fields .field-label,.tool-panel>.field-label{display:flex;flex-direction:column;gap:7px;margin-bottom:12px}
.placeholder-preview{display:block;max-width:100%;max-height:320px;object-fit:contain;margin:12px auto;border:1px solid var(--border);background:var(--muted)}
.code-output{overflow-wrap:anywhere;white-space:pre-wrap}
</style>
