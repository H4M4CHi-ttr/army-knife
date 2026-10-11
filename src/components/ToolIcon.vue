<script setup lang="ts">
import {
  TableProperties,
  Logs,
  Combine,
  Network,
  ScanText,
  GitCompareArrows,
  Braces,
  Contrast,
} from "@lucide/vue";
import type { ToolId } from "@/lib/catalog";
defineProps<{ id: ToolId }>();
const icons = {
  csv: TableProperties,
  logs: Logs,
  sets: Combine,
  cidr: Network,
  unicode: ScanText,
  "json-diff": GitCompareArrows,
  "json-format": Braces,
  contrast: Contrast,
};
</script>
<template><component :is="icons[id]" aria-hidden="true" :stroke-width="1.7" /></template>
