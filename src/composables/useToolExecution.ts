import {
  computed,
  onScopeDispose,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type WatchSource,
} from "vue";
import { useDebounceFn, useIntervalFn } from "@vueuse/core";
import { settings } from "@/lib/preferences";

export type ExecutionMode = "instant" | "deferred";
export type ExecutionStatus =
  | "empty"
  | "pending"
  | "running"
  | "manual"
  | "applied"
  | "error"
  | "cancelled";
export interface ApplyState {
  mode: ExecutionMode;
  status: ExecutionStatus;
  auto: boolean;
  valid: boolean;
  busy: boolean;
  pending: boolean;
  remainingMs: number;
  progress: number;
}
export interface ToolExecutionOptions<T> {
  source: WatchSource<unknown>;
  canRun: () => boolean;
  mode?: MaybeRefOrGetter<ExecutionMode>;
  delay?: number;
  execute: (signal: AbortSignal) => T | Promise<T>;
  /** Override only for isolated hosts/tests; the app shares its saved setting. */
  auto?: MaybeRefOrGetter<boolean>;
}

/**
 * One owner for automatic/manual execution. Editing immediately invalidates the
 * old result and aborts its worker. A generation guard also rejects late results
 * from tasks that do not cooperate with AbortSignal.
 */
export function useToolExecution<T>(options: ToolExecutionOptions<T>) {
  const result = shallowRef<T | null>(null);
  const error = ref("");
  const busy = ref(false);
  const pending = ref(false);
  const remainingMs = ref(0);
  const cancelled = ref(false);
  const mode = computed(() => toValue(options.mode ?? "deferred"));
  const auto = computed(() =>
    options.auto === undefined ? settings.preferences.autoApply : toValue(options.auto),
  );
  const valid = computed(options.canRun);
  const delay = Math.max(1, options.delay ?? 800);
  let deadline = 0;
  let generation = 0;
  let disposed = false;
  let controller: AbortController | undefined;

  const clock = useIntervalFn(
    () => {
      remainingMs.value = Math.max(0, deadline - Date.now());
    },
    40,
    { immediate: false },
  );
  const scheduled = useDebounceFn(() => {
    if (!disposed && pending.value && valid.value && auto.value) void apply();
  }, delay);

  function stopSchedule() {
    scheduled.cancel();
    clock.pause();
    pending.value = false;
    remainingMs.value = 0;
  }

  function invalidate() {
    generation += 1;
    controller?.abort();
    controller = undefined;
    stopSchedule();
    busy.value = false;
    result.value = null;
    error.value = "";
    cancelled.value = false;
  }

  async function apply() {
    if (disposed || !valid.value) return;
    invalidate();
    const current = generation;
    const task = new AbortController();
    controller = task;
    busy.value = true;
    try {
      const value = options.execute(task.signal);
      // Keep genuinely synchronous tools synchronous, including the first edit.
      const next = value instanceof Promise ? await value : value;
      if (!disposed && generation === current && !task.signal.aborted) result.value = next;
    } catch (failure) {
      if (!disposed && generation === current && !task.signal.aborted) {
        error.value =
          failure &&
          typeof failure === "object" &&
          "code" in failure &&
          typeof failure.code === "string"
            ? failure.code
            : "INTERNAL_ERROR";
      }
    } finally {
      if (generation === current) {
        busy.value = false;
        controller = undefined;
      }
    }
  }

  function queue() {
    invalidate();
    if (!valid.value || disposed) return;
    if (mode.value === "instant") {
      void apply();
    } else if (auto.value) {
      pending.value = true;
      remainingMs.value = delay;
      deadline = Date.now() + delay;
      clock.resume();
      void scheduled();
    }
  }

  function cancel() {
    invalidate();
    cancelled.value = valid.value;
  }

  function setAuto(value: boolean) {
    settings.preferences.autoApply = value;
  }

  watch(options.source, queue, { flush: "sync", immediate: true });
  watch(
    auto,
    () => {
      // Changing a preference never discards an already applied result.
      if (mode.value === "instant" || result.value !== null || busy.value) return;
      if (auto.value) queue();
      else stopSchedule();
    },
    { flush: "sync" },
  );
  onScopeDispose(() => {
    disposed = true;
    invalidate();
  });

  const control = computed<ApplyState>(() => ({
    mode: mode.value,
    auto: auto.value,
    valid: valid.value,
    busy: busy.value,
    pending: pending.value,
    remainingMs: remainingMs.value,
    progress: pending.value ? Math.max(0, Math.min(1, 1 - remainingMs.value / delay)) : 0,
    status: !valid.value
      ? "empty"
      : busy.value
        ? "running"
        : pending.value
          ? "pending"
          : error.value
            ? "error"
            : result.value !== null
              ? "applied"
              : cancelled.value
                ? "cancelled"
                : "manual",
  }));

  return { result, error, busy, control, apply, cancel, setAuto };
}
