<script setup vapor lang="ts">
import { computed, ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import CodeInput from "@/components/CodeInput.vue";
import ApplyControl from "@/components/ApplyControl.vue";
import OutputActions from "@/components/OutputActions.vue";
import EmptyResult from "@/components/EmptyResult.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { PATCH_LIMITS, PATCH_SAMPLE, inspectGitPatch } from "@/lib/tools/git-patch";
const { t } = useAppI18n();
const input = ref("");
const rejected = ref(false);
const revision = ref(0);
const selected = ref("0");
const source = computed(() => ({ input: input.value, rejected: rejected.value }));
const { result, error, control, apply, cancel, setAuto } = useToolExecution({
  source,
  canRun: () => Boolean(input.value.trim()) && !rejected.value,
  mode: () => input.value.length <= PATCH_LIMITS.deferredCharacters ? "instant" : "deferred",
  execute: () => inspectGitPatch(input.value),
});
watch(result, () => { selected.value = "0"; }, { flush: "sync" });
const file = computed(() => result.value?.files[Number(selected.value)]);
const output = computed(() => result.value ? JSON.stringify(result.value, null, 2) : "");
function accept(value: string) { rejected.value = false; input.value = value; }
function replace(value: string) { revision.value++; accept(value); }
</script>

<template>
  <div class="tool-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("labels.input") }}</div>
      <div class="control-row">
        <Button variant="outline" size="sm" data-testid="patch-sample" @click="replace(PATCH_SAMPLE)">{{ t("actions.sample") }}</Button>
        <Button variant="ghost" size="sm" data-testid="patch-clear" @click="replace('')">{{ t("actions.clear") }}</Button>
      </div>
    </div>
    <CodeInput :key="revision" :model-value="input" :label="t('patch.input')" input-id="git-patch-input" :rows="9" :file="false" :max-bytes="PATCH_LIMITS.bytes" placeholder="diff --git a/file.txt b/file.txt" @update:model-value="accept" @rejected="rejected = true" />
    <div class="run-bar">
      <p class="hint">{{ t("tool.git-patch.hint") }}</p>
      <ApplyControl :state="control" @apply="apply" @cancel="cancel" @auto="setAuto" />
      <Button v-if="control.pending" variant="outline" size="sm" data-testid="patch-cancel" @click="cancel">{{ t("actions.cancel") }}</Button>
    </div>
  </div>
  <p class="hint patch-scope">{{ t("patch.scope") }}</p>
  <p class="hint">{{ t("patch.limits") }}</p>
  <p v-if="rejected" class="notice" role="status">{{ t("patch.rejected") }}</p>
  <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
  <section v-if="result" class="result-panel" aria-live="polite" data-testid="patch-result">
    <div class="result-header">
      <h2><span class="step-number">02</span>{{ t("labels.result") }}</h2>
      <OutputActions :text="output" filename="army-knife-git-patch.json" type="application/json;charset=utf-8" />
    </div>
    <p class="patch-totals" data-testid="patch-totals">{{ t("patch.files") }}: {{ result.files.length }} · {{ t("patch.hunks") }}: {{ result.hunks }} · <span>+{{ result.additions }} / −{{ result.deletions }}</span></p>
    <label for="patch-file" class="field-label">{{ t("patch.file") }}</label>
    <select id="patch-file" v-model="selected" class="patch-select">
      <option v-for="(entry, index) in result.files" :key="index" :value="String(index)">{{ index + 1 }}. {{ entry.newPath ?? entry.header }}</option>
    </select>
    <template v-if="file">
      <p class="patch-path"><code>{{ file.header }}</code></p>
      <p v-if="file.oldPath !== null" class="patch-path"><span class="field-label">{{ t("patch.old") }}: </span><code>{{ file.oldPath }}</code></p>
      <p v-if="file.newPath !== null" class="patch-path"><span class="field-label">{{ t("patch.new") }}: </span><code>{{ file.newPath }}</code></p>
      <ul v-if="file.metadata.length" class="patch-metadata"><li v-for="record in file.metadata" :key="record"><code>{{ record }}</code></li></ul>
      <p class="hint">{{ t("patch.additions") }}: +{{ file.additions }} · {{ t("patch.deletions") }}: −{{ file.deletions }}</p>
      <p v-if="!file.hunks.length" class="notice">{{ t("patch.metadataOnly") }}</p>
      <details v-for="(hunk, index) in file.hunks" :key="`${selected}:${index}`" class="patch-hunk">
        <summary><code>@@ −{{ hunk.oldStart }},{{ hunk.oldCount }} +{{ hunk.newStart }},{{ hunk.newCount }} @@ {{ hunk.heading }}</code></summary>
        <p class="hint">{{ t("patch.columns") }}</p>
        <div class="patch-lines" role="list">
          <div v-for="(line, row) in hunk.lines" :key="row" role="listitem" :class="['patch-line', 'patch-' + line.kind]">
            <span class="patch-number">{{ line.oldLine ?? '·' }}</span><span class="patch-number">{{ line.newLine ?? '·' }}</span><span class="patch-prefix">{{ line.kind === 'addition' ? '+' : line.kind === 'deletion' ? '−' : ' ' }}</span><code>{{ line.text }}</code>
          </div>
        </div>
      </details>
    </template>
  </section>
  <EmptyResult v-else />
</template>
<style scoped>
.patch-scope { margin-top: 1rem; }
.patch-totals { margin: .8rem 0; font-variant-numeric: tabular-nums; }
.patch-select { display: block; width: 100%; max-width: 100%; margin: .4rem 0 1rem; padding: .6rem; border: 1px solid var(--border); border-radius: .4rem; background: var(--background); color: var(--foreground); }
.patch-path, .patch-metadata code, .patch-hunk summary code { overflow-wrap: anywhere; white-space: pre-wrap; unicode-bidi: plaintext; }
.patch-metadata { padding-left: 1.25rem; font-size: .85rem; }
.patch-hunk { margin-top: 1rem; min-width: 0; }
.patch-hunk summary { cursor: pointer; padding: .65rem; border: 1px solid var(--border); border-radius: .4rem; }
.patch-lines { font-size: .8rem; }
.patch-line { display: grid; grid-template-columns: minmax(1rem, max-content) minmax(1rem, max-content) 1rem minmax(0, 1fr); gap: .5rem; padding: .25rem .4rem; }
.patch-line code { white-space: pre-wrap; overflow-wrap: anywhere; unicode-bidi: plaintext; }
.patch-number { color: var(--muted-foreground); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; max-width: 6rem; font-size: .75rem; }
.patch-addition { background: color-mix(in srgb, #16a34a 12%, transparent); }
.patch-deletion { background: color-mix(in srgb, #dc2626 12%, transparent); }
.patch-marker { color: var(--muted-foreground); }
@media (max-width: 700px) { .patch-line { gap: .25rem; padding-inline: .1rem; } .patch-number { max-width: 3rem; font-size: .65rem; } }
</style>
