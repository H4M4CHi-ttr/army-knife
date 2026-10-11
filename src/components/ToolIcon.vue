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
  Activity,
  FileKey2,
  Link2,
  Workflow,
} from "@lucide/vue";
import type { ToolId } from "@/lib/catalog";
defineProps<{ id: ToolId }>();
const icons = {
  har: Activity,
  env: FileKey2,
  url: Link2,
  explain: Workflow,
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
