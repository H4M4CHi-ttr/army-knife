<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";

const emit = defineEmits<{ ready: [] }>();
const AsyncProbe = defineAsyncComponent(() => import("./VaporProbe.vue"));
const visible = ref(true);
const value = ref("initial");
const label = ref("Initial label");
const result = ref("");
const mounts = ref(0);
const disposals = ref(0);

function ready() {
  mounts.value++;
  emit("ready");
}

function update() {
  value.value = "parent update";
  label.value = "Updated label";
}
</script>

<template>
  <main>
    <button data-parent-update @click="update">Update from VDOM parent</button>
    <button data-parent-toggle @click="visible = !visible">Toggle</button>
    <p data-parent-value>{{ value }}</p>
    <p data-applied>{{ result }}</p>
    <p data-mounts>{{ mounts }}</p>
    <p data-disposals>{{ disposals }}</p>
    <AsyncProbe
      v-if="visible"
      v-model="value"
      :label="label"
      :report-disposal="() => disposals++"
      @ready="ready"
      @apply="result = $event"
    >
      <span data-parent-slot>VDOM slot: {{ value }}</span>
    </AsyncProbe>
  </main>
</template>
