<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Input } from "@/components/ui/input";
import OutputActions from "@/components/OutputActions.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { generateOgTags, type OgFields } from "@/lib/tools/five-tools";

const { t } = useAppI18n();
const title = ref("");
const description = ref("");
const url = ref("");
const image = ref("");
const locale = ref("ja_JP");
const type = ref<OgFields["type"]>("website");
const fields = computed<OgFields>(() => ({
  title: title.value, description: description.value,
  url: url.value, image: image.value, locale: locale.value, type: type.value,
}));
const { result, error } = useToolExecution<ReturnType<typeof generateOgTags>>({
  source: fields,
  canRun: () => Boolean(title.value || url.value),
  mode: "instant",
  execute: () => generateOgTags(fields.value),
});
</script>
<template>
  <div class="tool-panel og-tool">
    <div class="og-grid">
      <label class="og-field"><span class="field-label">{{ t("five.title") }} *</span>
        <Input v-model="title" maxlength="200" data-testid="og-title" /></label>
      <label class="og-field"><span class="field-label">URL *</span>
        <input v-model="url" class="native-select" maxlength="2048" data-testid="og-url" type="text" spellcheck="false" autocomplete="off" /></label>
      <label class="og-field"><span class="field-label">{{ t("five.imageUrl") }}</span>
        <Input v-model="image" maxlength="2048" placeholder="HTTPS image URL" /></label>
      <label class="og-field"><span class="field-label">{{ t("five.locale") }}</span>
        <Input v-model="locale" maxlength="40" placeholder="ja_JP" /></label>
      <label class="og-field"><span class="field-label">{{ t("five.type") }}</span>
        <select v-model="type" class="native-select"><option value="website">website</option><option value="article">article</option></select></label>
    </div>
    <label class="og-field"><span class="field-label">{{ t("five.description") }}</span>
      <textarea v-model="description" maxlength="1000" class="og-textarea" rows="3" /></label>
    <p class="hint">{{ t("tool.og-tags.hint") }}</p>
    <p v-if="error" class="error-panel" role="alert">{{ t("errors." + error) }}</p>
    <section v-if="result" class="result-panel" aria-live="polite">
      <div class="result-header"><h2>{{ t("labels.result") }}</h2>
        <OutputActions :text="result.html" filename="metadata.html" type="text/html" /></div>
      <div class="og-preview"><span>{{ result.host }}</span>
        <strong>{{ title }}</strong><p>{{ description }}</p>
        <small>{{ t("five.previewNoFetch") }}</small></div>
      <pre class="og-code" data-testid="og-result">{{ result.html }}</pre>
    </section>
  </div>
</template>
<style scoped>
.og-tool { display: grid; gap: 1rem; }
.og-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); }
.og-field { display: grid; gap: 0.4rem; min-width: 0; }
.og-field input, .og-field select { width: 100%; }
.og-textarea { display: block; width: 100%; min-height: 5rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.6rem; background: transparent; color: inherit; resize: vertical; overflow-wrap: anywhere; }
.og-preview { border: 1px solid var(--border); border-radius: 0.65rem; padding: 0.85rem; display: grid; gap: 0.3rem; overflow-wrap: anywhere; }
.og-preview span, .og-preview small { opacity: 0.7; }
.og-preview strong { font-size: 1.1rem; }
.og-code { overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 22rem; border-radius: 0.5rem; padding: 0.85rem; background: var(--muted); font-family: var(--font-mono, monospace); }
</style>
