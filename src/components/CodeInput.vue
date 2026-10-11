<script setup vapor lang="ts">
import { ref } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Upload } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { readTextFile } from "@/lib/io";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    inputId: string;
    placeholder?: string;
    maxBytes?: number;
    rows?: number;
    file?: boolean;
    disabled?: boolean;
  }>(),
  { maxBytes: 16 * 1024 * 1024, rows: 10, file: true },
);
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const { t } = useAppI18n();
const picker = ref<HTMLInputElement>();
const fileError = ref("");
async function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const selected = input.files?.[0];
  if (!selected) return;
  try {
    emit("update:modelValue", await readTextFile(selected, props.maxBytes));
    fileError.value = "";
  } catch (error) {
    fileError.value = error instanceof Error ? error.message : "INTERNAL_ERROR";
  } finally {
    input.value = "";
  }
}
</script>
<template>
  <div class="code-field">
    <div class="input-heading">
      <label class="field-label" :for="inputId">{{ label }}</label>
      <Button v-if="file" variant="ghost" size="sm" :disabled="disabled" @click="picker?.click()"
        ><Upload class="size-3.5" />{{ t("actions.import") }}</Button
      >
    </div>
    <Textarea
      :id="inputId"
      :model-value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      class="code-editor"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      :aria-describedby="`${inputId}-hint`"
      @update:model-value="emit('update:modelValue', String($event))"
    />
    <div :id="`${inputId}-hint`" class="input-footnote">
      {{ t("labels.utf8", { size: maxBytes / 1024 / 1024 }) }}
    </div>
    <input
      :id="`${inputId}-file`"
      ref="picker"
      type="file"
      accept=".csv,.tsv,.txt,.log,.json,.har,.env,text/*,application/json"
      hidden
      :aria-label="`${label}: ${t('actions.import')}`"
      @change="onFile"
    />
    <p v-if="fileError" class="error-panel" role="alert">{{ t(`errors.${fileError}`) }}</p>
  </div>
</template>
