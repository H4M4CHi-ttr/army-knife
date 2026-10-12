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
  Keyboard,
  FileLock2,
  Binary,
} from "@lucide/vue";
import type { ToolId } from "@/lib/catalog";
defineProps<{ id: ToolId }>();
const icons = {
  chmod: FileLock2,
  base64: Binary,
  shortcuts: Keyboard,
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
  "html-entities": Braces,
  "url-encode": Link2,
  "dummy-text": ScanText,
  "css-specificity": Contrast,
  "fluid-type": TableProperties,
  "cubic-bezier": Workflow,
  "css-gradient": Contrast,
  "svg-placeholder": Braces,
  "path-batch": TableProperties,
  "color-palette": Contrast,
};
</script>
<template><component :is="icons[id]" aria-hidden="true" :stroke-width="1.7" /></template>
