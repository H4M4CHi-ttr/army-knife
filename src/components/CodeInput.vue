<script setup vapor lang="ts">
import { computed, nextTick, onScopeDispose, ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Download, Upload } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import {
  LARGE_TEXT_PREVIEW,
  LARGE_TEXT_THRESHOLD,
  downloadText,
  prepareLargeText,
  readTextFile,
} from "@/lib/io";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    inputId: string;
    placeholder?: string;
    maxBytes?: number;
    rows?: number;
    file?: boolean;
    disabled?: boolean;
  }>(),
  { maxBytes: 16 * 1024 * 1024, rows: 10, file: true },
);
const emit = defineEmits<{ "update:modelValue": [value: string]; rejected: [] }>();
const { t } = useAppI18n();
const picker = ref<HTMLInputElement>();
const editor = ref<HTMLTextAreaElement>();
const fileError = ref("");
// Hosts can invalidate their analysis when an attempted edit was rejected.
watch(fileError, (error) => { if (error) emit("rejected"); }, { flush: "sync" });
const loading = ref(false);
const large = computed(() => props.modelValue.length >= LARGE_TEXT_THRESHOLD);
const visibleText = computed(() =>
  large.value ? props.modelValue.slice(0, LARGE_TEXT_PREVIEW) : props.modelValue,
);
let sequence = 0;
let active: AbortController | undefined;
let validatingText: string | undefined;

function stopLoading() {
  sequence += 1;
  active?.abort();
  active = undefined;
  validatingText = undefined;
  loading.value = false;
}
onScopeDispose(stopLoading);

// Import jobs have no model update until complete. If a parent sample/clear
// changes the value in the meantime, the old import must never overwrite it.
watch(
  () => props.modelValue,
  (value) => {
    if (loading.value && (validatingText === undefined || validatingText !== value))
      stopLoading();
  },
  { flush: "sync" },
);

function codeFor(error: unknown): string {
  const value = error instanceof Error ? error.message : "";
  return value === "INPUT_TOO_LARGE" || value === "INVALID_UTF8"
    ? value
    : "INTERNAL_ERROR";
}

function onInput(event: Event) {
  const field = event.target as HTMLTextAreaElement;
  const text = field.value;
  stopLoading();
  if (text.length > props.maxBytes) {
    field.value = props.modelValue;
    fileError.value = "INPUT_TOO_LARGE";
    return;
  }
  fileError.value = "";
  // Avoid retaining megabytes in the live editor even for autofill or an
  // externally generated input event. Paste is intercepted before insertion.
  if (text.length >= LARGE_TEXT_THRESHOLD) {
    field.value = "";
    acceptLargePaste(text);
    return;
  }
  emit("update:modelValue", text);
}

function acceptLargePaste(text: string) {
  stopLoading();
  fileError.value = "";
  if (text.length > props.maxBytes) {
    fileError.value = "INPUT_TOO_LARGE";
    return;
  }
  const ticket = sequence;
  const controller = new AbortController();
  active = controller;
  validatingText = text;
  loading.value = true;
  // Invalidate old analysis immediately while the worker checks UTF-8 size.
  // The actual large text will only ever appear as a small DOM preview.
  emit("update:modelValue", text);
  void prepareLargeText(text, props.maxBytes, controller.signal)
    .catch((error: unknown) => {
      if (ticket !== sequence || controller.signal.aborted) return;
      fileError.value = codeFor(error);
      // Invalid text must not remain eligible for analysis.
      emit("update:modelValue", "");
    })
    .finally(() => {
      if (ticket !== sequence) return;
      loading.value = false;
      active = undefined;
      validatingText = undefined;
    });
}

function onPaste(event: ClipboardEvent) {
  if (props.disabled) return;
  const pasted = event.clipboardData?.getData("text/plain");
  if (!pasted) return;
  const field = event.target as HTMLTextAreaElement;
  const length = field.value.length - (field.selectionEnd - field.selectionStart) + pasted.length;
  if (length < LARGE_TEXT_THRESHOLD && length <= props.maxBytes) return;
  event.preventDefault();
  if (length > props.maxBytes) {
    fileError.value = "INPUT_TOO_LARGE";
    return;
  }
  const text =
    field.value.slice(0, field.selectionStart) +
    pasted +
    field.value.slice(field.selectionEnd);
  acceptLargePaste(text);
}

async function loadFile(selected: File) {
  stopLoading();
  fileError.value = "";
  if (selected.size > props.maxBytes) {
    fileError.value = "INPUT_TOO_LARGE";
    return;
  }
  const ticket = sequence;
  const controller = new AbortController();
  active = controller;
  loading.value = true;
  try {
    const text =
      selected.size < LARGE_TEXT_THRESHOLD
        ? await readTextFile(selected, props.maxBytes)
        : await prepareLargeText(selected, props.maxBytes, controller.signal);
    if (ticket === sequence && !controller.signal.aborted) {
      loading.value = false;
      emit("update:modelValue", text);
    }
  } catch (error) {
    if (ticket === sequence && !controller.signal.aborted) fileError.value = codeFor(error);
  } finally {
    if (ticket === sequence) {
      loading.value = false;
      active = undefined;
    }
  }
}

async function onFile(event: Event) {
  const field = event.target as HTMLInputElement;
  const file = field.files?.[0];
  field.value = "";
  if (file) await loadFile(file);
}

function onDrop(event: DragEvent) {
  if (props.disabled) return;
  const file = event.dataTransfer?.files?.[0];
  const text = event.dataTransfer?.getData("text/plain");
  if (!file && !text) return;
  event.preventDefault();
  if (file) void loadFile(file);
  else if (text) acceptLargePaste(text);
}

function replace() {
  stopLoading();
  fileError.value = "";
  emit("update:modelValue", "");
  void nextTick(() => editor.value?.focus());
}

function downloadInput() {
  downloadText(props.modelValue, "army-knife-input.txt");
}
</script>
<template>
  <div class="code-field">
    <div class="input-heading">
      <label class="field-label" :for="inputId">{{ label }}</label>
      <Button v-if="file" variant="ghost" size="sm" :disabled="disabled" @click="picker?.click()">
        <Upload class="size-3.5" />{{ t("actions.import") }}
      </Button>
    </div>
    <textarea
      :id="inputId"
      ref="editor"
      data-slot="textarea"
      :value="visibleText"
      :rows="large ? Math.min(rows, 6) : rows"
      :placeholder="placeholder"
      :disabled="disabled || loading"
      :readonly="large"
      :wrap="large ? 'off' : 'soft'"
      class="code-editor w-full border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 outline-none focus-visible:ring-3"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      :aria-describedby="inputId + '-hint'"
      @input="onInput"
      @paste="onPaste"
      @drop="onDrop"
      @dragover.prevent
    />
    <div v-if="large" class="large-input-summary" data-testid="large-input-summary">
      <p>{{ t("largeInput.summary", { characters: modelValue.length, preview: LARGE_TEXT_PREVIEW }) }}</p>
      <div class="control-row">
        <Button variant="outline" size="sm" :disabled="loading" @click="replace">{{
          t("largeInput.replace")
        }}</Button>
        <Button variant="ghost" size="sm" :disabled="loading" @click="downloadInput">
          <Download class="size-3.5" />{{ t("largeInput.download") }}
        </Button>
      </div>
    </div>
    <div :id="inputId + '-hint'" class="input-footnote">
      {{ t("labels.utf8", { size: maxBytes / 1024 / 1024 }) }}
    </div>
    <p v-if="loading" class="hint" role="status" data-testid="large-input-loading">{{
      t("largeInput.loading")
    }}</p>
    <input
      :id="inputId + '-file'"
      ref="picker"
      type="file"
      accept=".csv,.tsv,.txt,.log,.json,.har,.env,text/*,application/json"
      hidden
      :aria-label="label + ': ' + t('actions.import')"
      @change="onFile"
    />
    <p v-if="fileError" class="error-panel" role="alert">{{ t("errors." + fileError) }}</p>
  </div>
</template>
