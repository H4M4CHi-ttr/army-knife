<script setup vapor lang="ts">
import { ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Check, Copy, Download } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { copyText, downloadText } from "@/lib/io";
const props = withDefaults(defineProps<{ text: string | (() => string); filename?: string; type?: string }>(), {
  filename: "army-knife-result.txt",
});
const { t } = useAppI18n();
const copied = ref(false);
const error = ref(false);
watch(
  () => props.text,
  () => {
    copied.value = false;
    error.value = false;
  },
);
function resolveText(): string {
  return typeof props.text === "function" ? props.text() : props.text;
}
async function copy() {
  try {
    await copyText(resolveText());
    copied.value = true;
    error.value = false;
  } catch {
    error.value = true;
  }
}
</script>
<template>
  <div class="output-actions">
    <Button variant="outline" size="sm" @click="copy"
      ><component :is="copied ? Check : Copy" class="size-3.5" />{{
        t(copied ? "actions.copied" : "actions.copy")
      }}</Button
    >
    <Button variant="outline" size="sm" @click="downloadText(resolveText(), filename, type)"
      ><Download class="size-3.5" />{{ t("actions.download") }}</Button
    >
    <span v-if="error" role="status" class="hint error-text">{{
      t("errors.CLIPBOARD_UNAVAILABLE")
    }}</span>
  </div>
</template>
