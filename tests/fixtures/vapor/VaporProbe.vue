<script setup vapor lang="ts">
import { onMounted, onScopeDispose, ref } from "vue";
import { useCounter } from "@vueuse/core";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const props = defineProps<{
  label: string;
  reportDisposal: () => void;
}>();
const emit = defineEmits<{
  ready: [];
  apply: [value: string];
}>();
const value = defineModel<string>({ required: true });
const notes = ref("");
const { count, inc } = useCounter();
const { t, locale } = useAppI18n();

function apply() {
  inc();
  emit("apply", `${value.value}|${notes.value}|${count.value}`);
}

onMounted(() => emit("ready"));
onScopeDispose(() => props.reportDisposal());
</script>

<template>
  <section data-vapor-probe :data-locale="locale">
    <h2 data-translation>{{ t("actions.copy") }}</h2>
    <p data-parent-label>{{ label }}</p>
    <Input data-probe-input v-model="value" :aria-label="t('actions.copy')" />
    <Textarea data-probe-textarea v-model="notes" aria-label="Notes" />
    <output data-probe-value>{{ value }}</output>
    <output data-probe-notes>{{ notes }}</output>
    <Button data-probe-apply @click="apply">
      <span data-button-slot>{{ t("actions.copy") }} {{ count }}</span>
    </Button>
    <slot />
  </section>
</template>
