<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Check, Copy, Download } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { copyText, downloadText } from "@/lib/io";
const props = withDefaults(defineProps<{ text: string; filename?: string; type?: string }>(), {
  filename: "army-knife-result.txt",
});
const { t } = useI18n();
const copied = ref(false);
const error = ref(false);
watch(
  () => props.text,
  () => {
    copied.value = false;
    error.value = false;
  },
);
async function copy() {
  try {
    await copyText(props.text);
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
    <Button variant="outline" size="sm" @click="downloadText(text, filename, type)"
      ><Download class="size-3.5" />{{ t("actions.download") }}</Button
    >
    <span v-if="error" role="status" class="hint error-text">{{
      t("errors.CLIPBOARD_UNAVAILABLE")
    }}</span>
  </div>
</template>
