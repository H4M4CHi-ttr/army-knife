<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { IMAGE_REFERENCE_LIMITS, inspectImageReference } from "@/lib/tools/image-reference";
import { IMAGE_REFERENCE_SAMPLE } from "@/lib/tools/image-reference-sample";

const { t } = useAppI18n();
const input = ref("");
const rejected = ref(false);
const revision = ref(0);
const source = computed(() => ({ input: input.value, rejected: rejected.value, revision: revision.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source, canRun: () => Boolean(input.value) && !rejected.value, mode: "instant",
  execute: () => inspectImageReference(input.value),
});
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
const defaults = computed(() => result.value ? (["registry", "library", "tag"] as const).filter(key => result.value!.defaults[key]) : []);
function accept(value: string) { rejected.value = false; input.value = value; }
function replace(value: string) { revision.value++; rejected.value = false; input.value = value; }
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="image-sample" @click="replace(IMAGE_REFERENCE_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="image-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('image.input')" input-id="image-reference-input" :rows="3" :file="false" :max-bytes="IMAGE_REFERENCE_LIMITS.bytes" placeholder="alpine:3.21" @update:model-value="accept" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.image-reference.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
    </div>
  </div>
  <p class="hint image-scope">{{ t("image.scope") }}</p>
  <p class="hint">{{ t("image.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("image.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="image-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-image-reference.json" type="application/json;charset=utf-8" />
    </div>
    <dl class="image-summary">
      <dt>{{ t("image.normalized") }}</dt><dd><code data-testid="image-normalized">{{ result.normalized }}</code></dd>
      <dt>{{ t("image.pull") }}</dt><dd><code data-testid="image-pull">{{ result.pullReference }}</code></dd>
      <dt>{{ t("image.registry") }}</dt><dd><code>{{ result.registry }}</code></dd>
      <dt>{{ t("image.host") }}</dt><dd><code>{{ result.host }}</code></dd>
      <dt>{{ t("image.port") }}</dt><dd><code v-if="result.port !== null">{{ result.port }}</code><span v-else>{{ t("image.absent") }}</span></dd>
      <dt>{{ t("image.repository") }}</dt><dd><code>{{ result.repository }}</code></dd>
      <dt>{{ t("image.tag") }}</dt><dd><code v-if="result.tag !== null">{{ result.tag }}</code><span v-else>{{ t("image.absent") }}</span></dd>
      <dt>{{ t("image.digest") }}</dt><dd><code v-if="result.digest !== null">{{ result.digest }}</code><span v-else>{{ t("image.absent") }}</span></dd>
      <dt>{{ t("image.selection") }}</dt><dd>{{ t("image.kind." + result.selection) }}</dd>
      <dt>{{ t("image.appliedDefaults") }}</dt>
      <dd data-testid="image-defaults"><ul v-if="defaults.length"><li v-for="key in defaults" :key="key">{{ t("image.default." + key) }}</li></ul><span v-else>{{ t("image.none") }}</span></dd>
    </dl>
    <p v-if="result.legacyRegistry" class="notice">{{ t("image.alias") }}</p>
    <p v-if="result.tagIgnored" class="notice" data-testid="image-ignored">{{ t("image.ignored") }}</p>
    <p class="notice">{{ t(result.selection === 'tag' ? "image.mutable" : "image.declared") }}</p>
  </section>
  <EmptyResult v-else />
</template>

<style scoped>
.image-scope { margin-top: 1rem; }
.image-summary { display: grid; grid-template-columns: minmax(10rem, 1fr) minmax(0, 2fr); gap: .6rem 1rem; }
.image-summary dt { color: var(--muted-foreground); font-size: .85rem; }
.image-summary dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.image-summary code { white-space: pre-wrap; overflow-wrap: anywhere; }
.image-summary ul { margin: 0; padding-left: 1.1rem; }
@media (max-width: 700px) {
  .image-summary { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
  .image-summary dd { margin-bottom: .5rem; }
}
</style>
