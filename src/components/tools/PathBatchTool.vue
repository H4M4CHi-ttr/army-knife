<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { transformPaths, type PathCase } from "@/lib/tools/path-batch";
const {t}=useAppI18n();
const paths=ref("src/Report.txt\nsrc/report.txt\nC:\\temp\\.env");
const prefix=ref(""),suffix=ref("-new"),caseMode=ref<PathCase>("keep"),
  separator=ref<"/"|"\\">("/"),numbering=ref(false),start=ref(1),pad=ref(2),nfc=ref(false);
const options=computed(()=>({
  prefix:prefix.value,suffix:suffix.value,caseMode:caseMode.value,separator:separator.value,
  numbering:numbering.value,start:start.value,pad:pad.value,nfc:nfc.value,
}));
const {result,error,control,apply,cancel,setAuto}=useToolExecution({
  source:()=>[paths.value,options.value],canRun:()=>Boolean(paths.value),
  mode:computed(()=>paths.value.length>8192?"deferred":"instant"),
  execute:()=>transformPaths(paths.value,options.value),
});
const displayed=computed(()=>result.value?.rows.slice(0,100)??[]);
</script>
<template>
  <section class="tool-panel">
    <div class="tool-toolbar"><div class="toolbar-label"><span class="step-number">01</span>{{ t("design.controls") }}</div></div>
    <label class="field-label" for="path-batch-input">{{ t("design.paths") }}</label>
    <textarea id="path-batch-input" v-model="paths" rows="7" maxlength="65536" spellcheck="false" class="path-input" />
    <div class="design-fields">
      <label class="field-label">{{ t("design.prefix") }}<input v-model="prefix" maxlength="128" class="native-select" /></label>
      <label class="field-label">{{ t("design.suffix") }}<input v-model="suffix" maxlength="128" class="native-select" /></label>
      <label class="field-label">{{ t("design.case") }}
        <select v-model="caseMode" class="native-select"><option value="keep">{{ t("design.keep") }}</option>
          <option value="lower">{{ t("design.lower") }}</option><option value="upper">{{ t("design.upper") }}</option></select></label>
      <label class="field-label">{{ t("design.separator") }}
        <select v-model="separator" class="native-select"><option value="/">/</option><option value="\">\</option></select></label>
      <label class="field-label">{{ t("design.start") }}
        <input v-model.number="start" :disabled="!numbering" type="number" min="0" max="99999" step="1" class="native-select" /></label>
      <label class="field-label">{{ t("design.pad") }}
        <input v-model.number="pad" :disabled="!numbering" type="number" min="0" max="6" step="1" class="native-select" /></label>
    </div>
    <div class="path-checks">
      <label><input v-model="numbering" type="checkbox" /> {{ t("design.numbering") }}</label>
      <label><input v-model="nfc" type="checkbox" /> {{ t("design.nfc") }}</label>
    </div>
    <p class="hint">{{ t("tool.path-batch.hint") }}</p>
    <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
  </section>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors."+error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite">
    <div class="result-header"><h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="result.csv" filename="army-knife-paths.csv" type="text/csv;charset=utf-8" /></div>
    <p class="hint">{{ t("design.pathSummary", {count:result.rows.length,collisions:result.conflicts,warnings:result.warnings}) }}</p>
    <div class="path-table-scroll" data-testid="path-batch-output"><table class="path-table">
      <thead><tr><th>{{ t("design.before") }}</th><th>{{ t("design.after") }}</th><th>{{ t("design.stem") }}</th><th>{{ t("design.ext") }}</th><th>{{ t("design.warning") }}</th></tr></thead>
      <tbody><tr v-for="(row,index) in displayed" :key="index">
        <td>{{ row.before }}</td><td>{{ row.after }}</td><td>{{ row.stem }}</td><td>{{ row.ext }}</td>
        <td>{{ [row.duplicate?t("design.duplicate"):"",row.windowsUnsafe?t("design.unsafe"):""].filter(Boolean).join(", ") }}</td>
      </tr></tbody></table></div>
    <p v-if="result.rows.length>displayed.length" class="hint">{{ t("design.pathTruncated") }}</p>
  </section>
</template>
<style scoped>
.path-input{display:block;width:100%;max-width:100%;min-height:120px;resize:vertical;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--background);font-family:monospace;overflow-wrap:anywhere}
.design-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,140px),1fr));gap:12px;margin:12px 0}
.design-fields .field-label{display:flex;flex-direction:column;gap:7px}
.path-checks{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0}
.path-table-scroll{overflow-x:auto;max-height:460px;overflow-y:auto}
.path-table{width:100%;border-collapse:collapse;font-size:.8rem}
.path-table th,.path-table td{padding:9px;text-align:left;border-bottom:1px solid var(--border);overflow-wrap:anywhere;max-width:240px}
</style>
