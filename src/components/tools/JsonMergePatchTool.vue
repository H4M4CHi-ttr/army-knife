<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { MERGE_PATCH_LIMITS, previewJsonMergePatch } from "@/lib/tools/json-merge-patch";
import { MERGE_PATCH_TARGET_SAMPLE, MERGE_PATCH_SAMPLE } from "@/lib/tools/json-merge-patch-sample";

const { t } = useAppI18n();
const target = ref(""), patch = ref(""), targetRejected = ref(false), patchRejected = ref(false), revision = ref(0);
const source = computed(() => ({ target: target.value, patch: patch.value, targetRejected: targetRejected.value, patchRejected: patchRejected.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(target.value) && Boolean(patch.value) && !targetRejected.value && !patchRejected.value,
  mode: () => target.value.length + patch.value.length <= MERGE_PATCH_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => previewJsonMergePatch(target.value, patch.value),
});
function replace(example: boolean) {
  revision.value++; targetRejected.value = false; patchRejected.value = false;
  target.value = example ? MERGE_PATCH_TARGET_SAMPLE : "";
  patch.value = example ? MERGE_PATCH_SAMPLE : "";
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="merge-patch-sample" @click="replace(true)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="merge-patch-clear" @click="replace(false)">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <div class="merge-patch-inputs">
      <CodeInput :key="`target:${revision}`" :model-value="target" :label="t('mergePatch.target')" input-id="merge-patch-target" :rows="9" :file="false" :max-bytes="MERGE_PATCH_LIMITS.inputBytes" :placeholder="MERGE_PATCH_TARGET_SAMPLE" @update:model-value="target = $event; targetRejected = false" @rejected="targetRejected = true" />
      <CodeInput :key="`patch:${revision}`" :model-value="patch" :label="t('mergePatch.patch')" input-id="merge-patch-patch" :rows="9" :file="false" :max-bytes="MERGE_PATCH_LIMITS.inputBytes" :placeholder="MERGE_PATCH_SAMPLE" @update:model-value="patch = $event; patchRejected = false" @rejected="patchRejected = true" />
    </div>
    <div class="run-bar">
      <p class="hint">{{ t("tool.json-merge-patch.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="merge-patch-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="notice merge-patch-rules">{{ t("mergePatch.rules") }}</p>
  <p class="hint">{{ t("mergePatch.scope") }}</p>
  <p class="hint">{{ t("mergePatch.precision") }}</p>
  <p class="hint">{{ t("mergePatch.limits") }}</p>
  <p v-if="targetRejected || patchRejected" class="notice" role="status">{{ t("mergePatch.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="merge-patch-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("mergePatch.output") }}</h2>
      <OutputActions :text="result.json" filename="army-knife-merged.json" type="application/json;charset=utf-8" />
    </div>
    <p class="hint" data-testid="merge-patch-mode">{{ t("mergePatch." + result.mode) }}</p>
    <pre class="merge-patch-output" data-testid="merge-patch-json" tabindex="0" role="region" :aria-label="t('mergePatch.output')"><code>{{ result.json }}</code></pre>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.merge-patch-inputs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.merge-patch-rules { margin-top: 1rem; }
.merge-patch-output { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 32rem; overflow: auto; padding: 1rem; font-size: .85rem; }
@media (max-width: 700px) { .merge-patch-inputs { grid-template-columns: minmax(0, 1fr); } }
</style>
