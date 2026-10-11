<script setup vapor lang="ts">
import { computed } from "vue";
import { Play, Square, Zap, Check, Clock3 } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { useAppI18n } from "@/i18n/useAppI18n";
import type { ApplyState } from "@/composables/useToolExecution";

const props = defineProps<{ state: ApplyState }>();
const emit = defineEmits<{ apply: []; cancel: []; auto: [value: boolean] }>();
const { t, locale } = useAppI18n();
const seconds = computed(() =>
  new Intl.NumberFormat(locale.value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.ceil(props.state.remainingMs / 100) / 10),
);
</script>

<template>
  <div
    class="apply-control"
    :data-mode="state.mode"
    :data-status="state.status"
    data-testid="apply-control"
  >
    <span v-if="state.mode === 'instant'" class="execution-label instant-label">
      <Zap class="size-3.5" aria-hidden="true" />{{ t("execution.instant") }}
    </span>
    <template v-else>
      <label class="auto-apply-label">
        <input
          type="checkbox"
          :checked="state.auto"
          data-testid="auto-apply-toggle"
          @change="emit('auto', ($event.target as HTMLInputElement).checked)"
        />
        {{ t("execution.auto") }}
      </label>
      <span class="execution-label" role="status" aria-live="polite" data-testid="execution-status">
        <Check v-if="state.status === 'applied'" class="size-3.5" aria-hidden="true" />
        <Clock3 v-else class="size-3.5" aria-hidden="true" />
        {{ t(`execution.${state.status}`) }}
      </span>
      <Button v-if="state.busy" variant="outline" class="apply-button" @click="emit('cancel')">
        <Square class="size-3.5" />{{ t("actions.cancel") }}
      </Button>
      <Button
        v-else
        class="apply-button"
        :class="{ 'apply-button-pending': state.pending }"
        :disabled="!state.valid || state.status === 'applied'"
        :aria-label="t('execution.apply')"
        data-testid="apply-now"
        @click="emit('apply')"
      >
        <span
          v-if="state.pending"
          class="apply-progress"
          aria-hidden="true"
          :style="{ transform: `scaleX(${state.progress})` }"
        />
        <span class="apply-button-content"
          ><Play class="size-3.5" />{{ t("execution.apply") }}
          <span v-if="state.pending" class="apply-countdown" aria-hidden="true"
            >{{ seconds }}s</span
          >
        </span>
      </Button>
    </template>
  </div>
</template>

<style scoped>
.apply-control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.8rem;
  min-width: 0;
}
.execution-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--muted-foreground);
  font-size: 0.75rem;
}
.instant-label {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  padding: 0.45rem 0.65rem;
  border-radius: 0.5rem;
}
.auto-apply-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}
.auto-apply-label input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
}
.apply-button {
  position: relative;
  overflow: hidden;
  min-width: 9rem;
}
.apply-button-pending {
  background: var(--primary);
}
.apply-progress {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.12);
  transform-origin: left;
  pointer-events: none;
  transition: transform 40ms linear;
}
.apply-button-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
}
.apply-countdown {
  display: inline-block;
  min-width: 2.4rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
}
@media (max-width: 540px) {
  .apply-control {
    justify-content: flex-start;
    gap: 0.65rem;
    width: 100%;
  }
  .apply-button {
    margin-left: auto;
  }
}
@media (prefers-reduced-motion: reduce) {
  .apply-progress {
    transition: none;
  }
}
</style>
