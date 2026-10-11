<script setup lang="ts">
import { ArrowDownToLine } from "@lucide/vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>
<template>
  <div class="empty-result">
    <span class="empty-result-icon"><ArrowDownToLine class="size-5" /></span>
    <h3>{{ t("states.ready") }}</h3>
    <p>{{ t("states.emptyResult") }}</p>
  </div>
</template>
