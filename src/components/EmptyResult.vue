<script setup vapor lang="ts">
import { ArrowDownToLine } from "@lucide/vue";
import { useAppI18n } from "@/i18n/useAppI18n";
const { t } = useAppI18n();
</script>
<template>
  <div class="empty-result">
    <span class="empty-result-icon"><ArrowDownToLine class="size-5" /></span>
    <h3>{{ t("states.ready") }}</h3>
    <p>{{ t("states.emptyResult") }}</p>
  </div>
</template>
