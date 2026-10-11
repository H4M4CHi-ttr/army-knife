<script setup vapor lang="ts">
import { computed, ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { ArrowLeftRight, Check, X, Zap } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OutputActions from "@/components/OutputActions.vue";
import { analyzeContrast } from "@/lib/tools";
const { t } = useAppI18n();
const foreground = ref("#334155");
const background = ref("#FFFFFF");
const result = computed(() => {
  try {
    return analyzeContrast(foreground.value, background.value);
  } catch {
    return null;
  }
});
const checks = computed(() =>
  !result.value
    ? []
    : [
        { label: "contrast.normal", grade: "AA", minimum: 4.5, pass: result.value.aaNormal },
        { label: "contrast.normal", grade: "AAA", minimum: 7, pass: result.value.aaaNormal },
        { label: "contrast.large", grade: "AA", minimum: 3, pass: result.value.aaLarge },
        { label: "contrast.large", grade: "AAA", minimum: 4.5, pass: result.value.aaaLarge },
        { label: "contrast.graphics", grade: "AA", minimum: 3, pass: result.value.nonText },
      ],
);
</script>
<template>
  <div class="tool-panel">
    <div class="color-controls">
      <label class="color-control"
        ><span class="field-label">{{ t("contrast.foreground") }}</span>
        <div class="color-input-row">
          <input
            type="color"
            :value="result?.foreground ?? '#334155'"
            :aria-label="t('contrast.foreground')"
            @input="foreground = ($event.target as HTMLInputElement).value"
          /><Input
            v-model="foreground"
            class="font-mono"
            :aria-label="`${t('contrast.foreground')} HEX`"
            :maxlength="7"
            spellcheck="false"
          /></div
      ></label>
      <Button
        variant="outline"
        size="icon"
        :aria-label="t('actions.swap')"
        @click="[foreground, background] = [background, foreground]"
        ><ArrowLeftRight class="size-4"
      /></Button>
      <label class="color-control"
        ><span class="field-label">{{ t("contrast.background") }}</span>
        <div class="color-input-row">
          <input
            type="color"
            :value="result?.background ?? '#FFFFFF'"
            :aria-label="t('contrast.background')"
            @input="background = ($event.target as HTMLInputElement).value"
          /><Input
            v-model="background"
            class="font-mono"
            :aria-label="`${t('contrast.background')} HEX`"
            :maxlength="7"
            spellcheck="false"
          /></div
      ></label>
    </div>
    <p class="hint">{{ t("tool.contrast.hint") }}</p>
    <span class="execution-label" data-testid="instant-updates"
      ><Zap class="size-3.5" />{{ t("execution.instant") }}</span
    >
  </div>
  <p v-if="!result" class="error-panel" role="alert">{{ t("errors.COLOR_INVALID") }}</p>
  <section v-else class="result-panel" aria-live="polite">
    <div class="result-header">
      <h2>{{ t("labels.result") }}</h2>
      <OutputActions
        :text="JSON.stringify(result, null, 2)"
        filename="army-knife-contrast.json"
        type="application/json"
      />
    </div>
    <div
      class="contrast-preview"
      :style="{ color: result.foreground, backgroundColor: result.background }"
    >
      <span class="preview-eyebrow">Aa</span>
      <p>{{ t("contrast.preview") }}</p>
      <small>{{ result.foreground }} / {{ result.background }}</small>
    </div>
    <div class="contrast-ratio">
      <span class="metric-label">{{ t("contrast.ratio") }}</span
      ><strong>{{ result.ratio.toFixed(2) }}<span>: 1</span></strong>
    </div>
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>WCAG 2.x</th>
            <th>{{ t("labels.type") }}</th>
            <th>{{ t("contrast.ratio") }}</th>
            <th>{{ t("labels.result") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(check, index) in checks" :key="index">
            <td>{{ check.grade }}</td>
            <th>{{ t(check.label) }}</th>
            <td>≥ {{ check.minimum }} : 1</td>
            <td>
              <span :class="['contrast-status', check.pass ? 'positive' : 'negative']"
                ><component :is="check.pass ? Check : X" class="size-4" />{{
                  t(check.pass ? "contrast.pass" : "contrast.fail")
                }}</span
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint panel-note">{{ t("contrast.largeHint") }}</p>
  </section>
</template>
