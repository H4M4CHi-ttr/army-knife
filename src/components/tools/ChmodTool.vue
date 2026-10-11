<script setup vapor lang="ts">
import { computed, ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/io";
import { ToolError } from "@/lib/tools/errors";
import { applySymbolicMode, calculateUmask, describeMode, parseOctalMode } from "@/lib/tools/chmod";

const { t } = useAppI18n();
const octalInput = ref("");
const expression = ref("");
const directory = ref(false);
const umaskInput = ref("");
const copied = ref(false);
const copyError = ref(false);
const groups = [
  { id: "u", label: "chmod.owner", shift: 6 },
  { id: "g", label: "chmod.group", shift: 3 },
  { id: "o", label: "chmod.others", shift: 0 },
] as const;
const permissions = [
  { id: "r", label: "chmod.read", bit: 4 },
  { id: "w", label: "chmod.write", bit: 2 },
  { id: "x", label: "chmod.execute", bit: 1 },
] as const;
const specials = [
  { id: "setuid", bit: 0o4000 },
  { id: "setgid", bit: 0o2000 },
  { id: "sticky", bit: 0o1000 },
] as const;

function errorCode(error: unknown, fallback: string): string {
  return error instanceof ToolError &&
    [
      "CHMOD_INVALID_MODE",
      "CHMOD_INVALID_SYMBOLIC",
      "CHMOD_INVALID_UMASK",
      "CHMOD_SYMBOLIC_LIMIT",
    ].includes(error.code)
    ? error.code
    : fallback;
}

const modeState = computed(() => {
  if (!octalInput.value) return { result: null, error: "" };
  try {
    return { result: describeMode(parseOctalMode(octalInput.value)), error: "" };
  } catch (error) {
    return { result: null, error: errorCode(error, "CHMOD_INVALID_MODE") };
  }
});
const mode = computed(() => modeState.value.result);
const previewState = computed(() => {
  if (!mode.value || !expression.value) return { result: null, error: "" };
  try {
    return {
      result: applySymbolicMode(mode.value.mode, expression.value, directory.value),
      error: "",
    };
  } catch (error) {
    return { result: null, error: errorCode(error, "CHMOD_INVALID_SYMBOLIC") };
  }
});
const umaskState = computed(() => {
  if (!umaskInput.value) return { result: null, error: "" };
  try {
    return { result: calculateUmask(umaskInput.value), error: "" };
  } catch (error) {
    return { result: null, error: errorCode(error, "CHMOD_INVALID_UMASK") };
  }
});
// A fifth leading octal zero makes GNU chmod clear unselected directory set-ID bits.
const command = computed(() => (mode.value ? `chmod 0${mode.value.octal} -- ./path` : ""));

watch(octalInput, () => {
  copied.value = false;
  copyError.value = false;
});

function hasBit(bit: number): boolean {
  return Boolean(mode.value && (mode.value.mode & bit) !== 0);
}

function toggleBit(bit: number, event: Event): void {
  if (!mode.value) return;
  const checked = (event.target as HTMLInputElement).checked;
  const next = checked ? mode.value.mode | bit : mode.value.mode & ~bit;
  octalInput.value = describeMode(next).octal;
}

function usePreview(): void {
  if (!previewState.value.result) return;
  octalInput.value = previewState.value.result.octal;
  expression.value = "";
}

async function copyCommand(): Promise<void> {
  const value = command.value;
  if (!value) return;
  try {
    await copyText(value);
    if (command.value === value) {
      copied.value = true;
      copyError.value = false;
    }
  } catch {
    if (command.value === value) copyError.value = true;
  }
}

function clear(): void {
  octalInput.value = "";
  expression.value = "";
  directory.value = false;
  umaskInput.value = "";
  copied.value = false;
  copyError.value = false;
}
</script>

<template>
  <div class="tool-panel chmod-panel">
    <div class="tool-toolbar">
      <div class="toolbar-label"><span class="step-number">01</span>{{ t("chmod.mode") }}</div>
      <Button variant="ghost" size="sm" data-testid="chmod-clear" @click="clear">{{
        t("actions.clear")
      }}</Button>
    </div>
    <div class="chmod-field">
      <label for="chmod-mode" class="field-label">{{ t("chmod.octalInput") }}</label>
      <input
        id="chmod-mode"
        v-model="octalInput"
        data-testid="chmod-mode"
        class="native-select chmod-input"
        type="text"
        inputmode="numeric"
        placeholder="0644"
        autocomplete="off"
        autocapitalize="none"
        :spellcheck="false"
        :maxlength="17"
        :aria-invalid="Boolean(modeState.error)"
        aria-describedby="chmod-octal-hint chmod-mode-error"
      />
      <p id="chmod-octal-hint" class="hint">{{ t("tool.chmod.hint") }}</p>
      <div class="control-row">
        <span class="hint">{{ t("chmod.examples") }}</span>
        <Button
          v-for="sample in ['0644', '4755', '1777']"
          :key="sample"
          variant="outline"
          size="sm"
          @click="octalInput = sample"
          >{{ sample }}</Button
        >
      </div>
    </div>
    <p v-if="modeState.error" id="chmod-mode-error" class="error-panel" role="alert">
      {{ t(`errors.${modeState.error}`) }}
    </p>
    <fieldset class="chmod-fieldset" :disabled="!mode">
      <legend class="field-label">{{ t("chmod.permissions") }}</legend>
      <p class="hint chmod-matrix-hint">{{ t("chmod.matrixHint") }}</p>
      <table class="data-table chmod-matrix">
        <thead>
          <tr>
            <th scope="col">{{ t("chmod.who") }}</th>
            <th v-for="permission in permissions" :key="permission.id" scope="col">
              <code>{{ permission.id }}</code> {{ t(permission.label) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="group in groups" :key="group.id">
            <th scope="row">
              <code>{{ group.id }}</code> {{ t(group.label) }}
            </th>
            <td v-for="permission in permissions" :key="permission.id">
              <label class="chmod-bit-label" :for="`chmod-bit-${group.id}-${permission.id}`">
                <input
                  :id="`chmod-bit-${group.id}-${permission.id}`"
                  :data-testid="`chmod-bit-${group.id}-${permission.id}`"
                  type="checkbox"
                  :checked="hasBit(permission.bit << group.shift)"
                  :aria-label="
                    t('chmod.bitLabel', { who: t(group.label), permission: t(permission.label) })
                  "
                  @change="toggleBit(permission.bit << group.shift, $event)"
                />
              </label>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="chmod-specials">
        <label v-for="special in specials" :key="special.id" :for="`chmod-bit-${special.id}`">
          <input
            :id="`chmod-bit-${special.id}`"
            :data-testid="`chmod-bit-${special.id}`"
            type="checkbox"
            :checked="hasBit(special.bit)"
            @change="toggleBit(special.bit, $event)"
          />
          {{ t(`chmod.${special.id}`) }}
        </label>
      </div>
    </fieldset>

    <section v-if="mode" class="result-panel" aria-live="polite">
      <div class="result-header">
        <h2>{{ t("chmod.selectedMode") }}</h2>
      </div>
      <dl class="chmod-results">
        <div>
          <dt>{{ t("chmod.octal") }}</dt>
          <dd>
            <code data-testid="chmod-octal">{{ mode.octal }}</code>
          </dd>
        </div>
        <div>
          <dt>{{ t("chmod.symbolic") }}</dt>
          <dd>
            <code data-testid="chmod-symbolic">{{ mode.symbolic }}</code>
          </dd>
        </div>
      </dl>
      <div class="chmod-command">
        <span class="field-label">{{ t("chmod.command") }}</span>
        <code data-testid="chmod-command">{{ command }}</code>
        <Button variant="outline" size="sm" data-testid="chmod-copy-command" @click="copyCommand">{{
          t(copied ? "actions.copied" : "chmod.copyCommand")
        }}</Button>
      </div>
      <p class="hint">{{ t("chmod.commandHint") }}</p>
      <p v-if="copyError" class="error-panel" role="alert">
        {{ t("errors.CLIPBOARD_UNAVAILABLE") }}
      </p>
    </section>

    <section class="chmod-section" aria-labelledby="chmod-preview-heading">
      <h2 id="chmod-preview-heading">{{ t("chmod.preview") }}</h2>
      <div class="chmod-field">
        <label for="chmod-expression" class="field-label">{{ t("chmod.expression") }}</label>
        <input
          id="chmod-expression"
          v-model="expression"
          data-testid="chmod-expression"
          class="native-select chmod-input"
          type="text"
          placeholder="u+x,g-w,o="
          autocomplete="off"
          autocapitalize="none"
          :spellcheck="false"
          :maxlength="257"
          :aria-invalid="Boolean(previewState.error)"
          aria-describedby="chmod-expression-hint chmod-preview-error"
        />
        <p id="chmod-expression-hint" class="hint">{{ t("chmod.expressionHint") }}</p>
        <label class="check-label" for="chmod-directory">
          <input
            id="chmod-directory"
            v-model="directory"
            data-testid="chmod-directory"
            type="checkbox"
          />
          {{ t("chmod.directory") }}
        </label>
        <p class="hint">{{ t("chmod.directoryHint") }}</p>
      </div>
      <p v-if="previewState.error" id="chmod-preview-error" class="error-panel" role="alert">
        {{ t(`errors.${previewState.error}`) }}
      </p>
      <div v-if="previewState.result" class="chmod-preview" aria-live="polite">
        <dl class="chmod-results">
          <div>
            <dt>{{ t("chmod.previewOctal") }}</dt>
            <dd>
              <code data-testid="chmod-preview-octal">{{ previewState.result.octal }}</code>
            </dd>
          </div>
          <div>
            <dt>{{ t("chmod.symbolic") }}</dt>
            <dd>
              <code>{{ previewState.result.symbolic }}</code>
            </dd>
          </div>
        </dl>
        <Button variant="outline" data-testid="chmod-use-preview" @click="usePreview">{{
          t("chmod.usePreview")
        }}</Button>
        <p class="hint">{{ t("chmod.previewHint") }}</p>
      </div>
      <p v-else-if="!previewState.error" class="hint">{{ t("chmod.previewEmpty") }}</p>
    </section>

    <section class="chmod-section" aria-labelledby="chmod-umask-heading">
      <h2 id="chmod-umask-heading">{{ t("chmod.umask") }}</h2>
      <div class="chmod-field">
        <label for="chmod-umask" class="field-label">{{ t("chmod.umaskInput") }}</label>
        <input
          id="chmod-umask"
          v-model="umaskInput"
          data-testid="chmod-umask"
          class="native-select chmod-input"
          type="text"
          inputmode="numeric"
          placeholder="022"
          autocomplete="off"
          autocapitalize="none"
          :spellcheck="false"
          :maxlength="17"
          :aria-invalid="Boolean(umaskState.error)"
          aria-describedby="chmod-umask-hint chmod-umask-error"
        />
        <div class="control-row">
          <Button variant="outline" size="sm" @click="umaskInput = '022'"
            >{{ t("actions.sample") }} 022</Button
          >
        </div>
        <p id="chmod-umask-hint" class="hint">{{ t("chmod.umaskHint") }}</p>
      </div>
      <p v-if="umaskState.error" id="chmod-umask-error" class="error-panel" role="alert">
        {{ t(`errors.${umaskState.error}`) }}
      </p>
      <dl v-if="umaskState.result" class="chmod-results chmod-umask-results" aria-live="polite">
        <div>
          <dt>{{ t("chmod.newFile") }}</dt>
          <dd>
            <code data-testid="chmod-umask-file">{{ umaskState.result.file.octal }}</code>
            <code>{{ umaskState.result.file.symbolic }}</code>
          </dd>
        </div>
        <div>
          <dt>{{ t("chmod.newDirectory") }}</dt>
          <dd>
            <code data-testid="chmod-umask-directory">{{ umaskState.result.directory.octal }}</code>
            <code>{{ umaskState.result.directory.symbolic }}</code>
          </dd>
        </div>
      </dl>
    </section>

    <details class="chmod-notes">
      <summary>{{ t("chmod.notes") }}</summary>
      <ul class="hint">
        <li>{{ t("chmod.executeHint") }}</li>
        <li>{{ t("chmod.setuidHint") }}</li>
        <li>{{ t("chmod.setgidHint") }}</li>
        <li>{{ t("chmod.stickyHint") }}</li>
        <li>{{ t("chmod.accessHint") }}</li>
      </ul>
    </details>
    <p class="hint">{{ t("chmod.privacy") }}</p>
  </div>
</template>

<style scoped>
.chmod-field {
  display: grid;
  gap: 0.65rem;
}
.chmod-input {
  width: 100%;
  font-family: var(--font-mono, monospace);
}
.chmod-fieldset {
  min-width: 0;
  margin-top: 1.5rem;
  border: 0;
  padding: 0;
}
.chmod-matrix-hint {
  margin: 0.5rem 0;
}
.chmod-matrix {
  table-layout: fixed;
}
.chmod-matrix th,
.chmod-matrix td {
  padding: 0.6rem 0.35rem;
  vertical-align: middle;
  overflow-wrap: anywhere;
}
.chmod-matrix th:not(:first-child),
.chmod-matrix td {
  text-align: center;
}
.chmod-bit-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.75rem;
  min-height: 2.75rem;
  cursor: pointer;
}
.chmod-bit-label input,
.chmod-specials input {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
  accent-color: var(--primary);
}
.chmod-fieldset:disabled .chmod-bit-label {
  cursor: default;
}
.chmod-specials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1.25rem;
  margin-top: 0.8rem;
}
.chmod-specials label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  font-size: 0.8rem;
}
.chmod-results {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem 2rem;
  margin: 0;
}
.chmod-results div {
  min-width: 0;
}
.chmod-results dt {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  margin-bottom: 0.4rem;
}
.chmod-results dd {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.1rem;
  overflow-wrap: anywhere;
}
.chmod-command {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem;
  margin: 1.3rem 0 0.5rem;
}
.chmod-command > .field-label {
  flex-basis: 100%;
}
.chmod-command code {
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}
.chmod-section {
  border-top: 1px solid var(--border);
  padding-top: 1.3rem;
  margin-top: 1.5rem;
}
.chmod-section h2 {
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.chmod-preview,
.chmod-umask-results {
  margin-top: 1rem;
}
.chmod-preview > button,
.chmod-preview > .hint {
  margin-top: 0.8rem;
}
.chmod-notes {
  margin-top: 1.5rem;
}
.chmod-notes summary {
  font-size: 0.8rem;
  cursor: pointer;
}
.chmod-notes ul {
  padding-left: 1.2rem;
  margin-top: 0.7rem;
}
.chmod-notes li + li {
  margin-top: 0.35rem;
}
</style>
