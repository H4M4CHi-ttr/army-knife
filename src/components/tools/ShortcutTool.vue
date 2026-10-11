<script setup vapor lang="ts">
import { computed, ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import { shortcutRecords, shortcutSources } from "@/data/shortcuts";
import {
  eventToStroke,
  formatShortcut,
  parseShortcut,
  searchShortcuts,
  type Modifier,
  type ShortcutPlatform,
  type ShortcutRecord,
  type ShortcutStroke,
  type ShortcutSurface,
} from "@/lib/tools/shortcuts";

const { t, locale } = useAppI18n();
const manualShortcut = ref("");
// Keep the actual event codes independently of the editable logical-key text.
// A KeyboardEvent.code describes a physical position, not a JIS/US mapping.
const sequence = ref<ShortcutStroke[] | null>([]);
const sequential = ref(false);
const focused = ref(false);
const sequenceLimit = ref(false);
const observed = ref<{ key: string; code: string; location: number } | null>(null);
const platform = ref<ShortcutPlatform | "">("");
const surface = ref<ShortcutSurface | "">("");
const appId = ref("");
const text = ref("");
const matchMode = ref<"exact" | "contains">("exact");
const keyMode = ref<"logical" | "physical">("logical");
const builderModifiers = ref<Modifier[]>([]);
const builderKey = ref("K");
const modifiers: Modifier[] = ["Ctrl", "Alt", "Shift", "Meta"];
const platforms: ShortcutPlatform[] = ["windows", "macos", "linux"];
const surfaces: ShortcutSurface[] = ["desktop", "web", "browser", "os"];
const letterKeys = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
const digitKeys = Array.from({ length: 10 }, (_, index) => String(index));
const functionKeys = Array.from({ length: 24 }, (_, index) => `F${index + 1}`);
const namedKeys = [
  "Space",
  "Enter",
  "Tab",
  "Escape",
  "Backspace",
  "Delete",
  "Insert",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PrintScreen",
  "Pause",
  "ContextMenu",
  "CapsLock",
  "NumLock",
  "ScrollLock",
];
const punctuationKeys = [
  "+",
  "-",
  "=",
  ",",
  ".",
  "/",
  ";",
  "'",
  "[",
  "]",
  "\\",
  "`",
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "(",
  ")",
  "_",
  ":",
  '"',
  "{",
  "}",
  "|",
  "<",
  ">",
  "?",
  "~",
];
const numpadKeys = [
  ...digitKeys.map((key) => `Numpad${key}`),
  "NumpadAdd",
  "NumpadSubtract",
  "NumpadMultiply",
  "NumpadDivide",
  "NumpadDecimal",
  "NumpadComma",
  "NumpadEqual",
  "NumpadEnter",
];
const page = ref(1);
const pageSize = 24;
const sourceById = new Map(shortcutSources.map((source) => [source.id, source]));
const apps = [...new Map(shortcutRecords.map((record) => [record.appId, record.app])).entries()]
  .map(([id, name]) => ({ id, name }))
  .sort((left, right) => left.name.localeCompare(right.name));
const invalidShortcut = computed(() => Boolean(manualShortcut.value.trim()) && !sequence.value);
const queryDisplay = computed(() =>
  sequence.value?.length ? formatShortcut(sequence.value) : manualShortcut.value,
);
const results = computed(() =>
  invalidShortcut.value
    ? []
    : searchShortcuts(shortcutRecords, {
        sequence: sequence.value?.length ? sequence.value : undefined,
        platform: platform.value,
        surface: surface.value,
        appId: appId.value,
        text: text.value,
        matchMode: matchMode.value,
        keyMode: keyMode.value,
      }),
);
const pages = computed(() => Math.max(1, Math.ceil(results.value.length / pageSize)));
const visibleResults = computed(() =>
  results.value
    .slice((page.value - 1) * pageSize, page.value * pageSize)
    .map((record) => ({ ...record, source: sourceById.get(record.sourceId) })),
);
const canAdd = computed(() => Boolean(builderKey.value || builderModifiers.value.length));
watch([sequence, platform, surface, appId, text, matchMode, keyMode], () => {
  page.value = 1;
});

function setSequence(value: ShortcutStroke[]) {
  sequence.value = value;
  manualShortcut.value = formatShortcut(value);
  sequenceLimit.value = false;
  observed.value = null;
}
function addStroke(stroke: ShortcutStroke): boolean {
  const previous = sequence.value ?? [];
  if (sequential.value && previous.length >= 4) {
    sequenceLimit.value = true;
    return false;
  }
  setSequence(sequential.value ? [...previous, stroke] : [stroke]);
  return true;
}
function capture(event: KeyboardEvent) {
  const input = event.currentTarget;
  if (!(input instanceof HTMLInputElement) || document.activeElement !== input) return;
  // The app shell offers Ctrl+K search. A focused capture field owns its keys.
  event.stopPropagation();
  if (event.repeat || event.isComposing || event.getModifierState("AltGraph")) return;
  if (event.key === "Escape") {
    input.blur();
    return;
  }
  if (event.key === "Tab") return;
  const stroke = eventToStroke(event);
  if (!stroke) return;
  event.preventDefault();
  if (addStroke(stroke))
    observed.value = { key: event.key, code: event.code, location: event.location };
}
function editManual(event: Event) {
  manualShortcut.value = (event.target as HTMLInputElement).value;
  sequence.value = manualShortcut.value.trim() ? parseShortcut(manualShortcut.value) : [];
  sequenceLimit.value = false;
  observed.value = null;
}
function toggleModifier(modifier: Modifier) {
  builderModifiers.value = builderModifiers.value.includes(modifier)
    ? builderModifiers.value.filter((value) => value !== modifier)
    : modifiers.filter((value) => value === modifier || builderModifiers.value.includes(value));
}
function addManualStroke() {
  if (!canAdd.value) return;
  const modifierText = builderModifiers.value.join("+");
  const parsed = parseShortcut(
    builderKey.value
      ? `${modifierText ? `${modifierText}+` : ""}${builderKey.value}`
      : modifierText,
  );
  if (parsed?.length === 1) addStroke(parsed[0]!);
}
function clear() {
  setSequence([]);
}
function undo() {
  setSequence(sequence.value?.slice(0, -1) ?? []);
}
function action(record: ShortcutRecord) {
  return locale.value === "ja" && record.actionJa ? record.actionJa : record.action;
}
function context(record: ShortcutRecord) {
  return locale.value === "ja" && record.contextJa ? record.contextJa : record.context;
}
function localSourceHref(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
</script>

<template>
  <section class="tool-panel shortcut-tool" aria-labelledby="shortcut-input-heading">
    <div class="tool-toolbar">
      <h2 id="shortcut-input-heading" class="toolbar-label">
        <span class="step-number">01</span>{{ t("shortcuts.pressTitle") }}
      </h2>
      <div class="control-row">
        <Button
          variant="outline"
          size="sm"
          data-testid="shortcut-undo"
          :disabled="!sequence?.length"
          @click="undo"
        >
          {{ t("shortcuts.undo") }}
        </Button>
        <Button variant="ghost" size="sm" data-testid="shortcut-clear" @click="clear">
          {{ t("actions.clear") }}
        </Button>
      </div>
    </div>
    <p class="hint shortcut-purpose">{{ t("shortcuts.dictionary") }}</p>
    <label class="shortcut-field" for="shortcut-capture">
      <span>{{ t("shortcuts.captureLabel") }}</span>
      <input
        id="shortcut-capture"
        data-testid="shortcut-capture"
        class="shortcut-capture"
        type="text"
        readonly
        :value="queryDisplay"
        :placeholder="t('shortcuts.capturePlaceholder')"
        aria-describedby="shortcut-capture-hint shortcut-layout-hint"
        autocomplete="off"
        spellcheck="false"
        @focus="focused = true"
        @blur="focused = false"
        @keydown="capture"
      />
    </label>
    <p id="shortcut-capture-hint" class="hint">{{ t("shortcuts.captureHint") }}</p>
    <div class="shortcut-capture-options">
      <label class="check-label">
        <input v-model="sequential" type="checkbox" data-testid="shortcut-sequential" />
        {{ t("shortcuts.sequential") }}
      </label>
      <span class="shortcut-focus-state" :class="{ listening: focused }" role="status">
        <span aria-hidden="true"></span>{{ t(focused ? "shortcuts.listening" : "shortcuts.idle") }}
      </span>
    </div>
    <p class="hint">{{ t(sequential ? "shortcuts.sequenceHint" : "shortcuts.singleHint") }}</p>
    <p v-if="sequenceLimit" class="notice" role="status" data-testid="shortcut-sequence-limit">
      {{ t("shortcuts.sequenceLimit") }}
    </p>
    <dl v-if="observed" class="shortcut-observed" data-testid="shortcut-observed">
      <div>
        <dt>{{ t("shortcuts.observedKey") }}</dt>
        <dd>
          <code>{{ observed.key }}</code>
        </dd>
      </div>
      <div>
        <dt>{{ t("shortcuts.observedCode") }}</dt>
        <dd>
          <code>{{ observed.code || t("shortcuts.unreported") }}</code>
        </dd>
      </div>
      <div>
        <dt>{{ t("shortcuts.observedLocation") }}</dt>
        <dd>{{ observed.location }} · {{ t(`shortcuts.location.${observed.location}`) }}</dd>
      </div>
    </dl>
    <p id="shortcut-layout-hint" class="hint shortcut-layout-hint">
      {{ t("shortcuts.layoutHint") }}
    </p>

    <details class="shortcut-manual" open>
      <summary>{{ t("shortcuts.manualTitle") }}</summary>
      <label class="shortcut-field" for="shortcut-manual">
        <span>{{ t("shortcuts.manualLabel") }}</span>
        <input
          id="shortcut-manual"
          data-testid="shortcut-manual"
          class="native-select shortcut-manual-input"
          :value="manualShortcut"
          placeholder="Ctrl+K then Ctrl+C"
          maxlength="256"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          aria-describedby="shortcut-manual-hint"
          :aria-invalid="invalidShortcut"
          @input="editManual"
        />
      </label>
      <p id="shortcut-manual-hint" class="hint">{{ t("shortcuts.manualHint") }}</p>
      <p v-if="invalidShortcut" class="error-panel" role="alert">{{ t("shortcuts.invalid") }}</p>
      <fieldset class="shortcut-builder">
        <legend>{{ t("shortcuts.builderTitle") }}</legend>
        <div class="shortcut-modifiers">
          <button
            v-for="modifier in modifiers"
            :key="modifier"
            type="button"
            :data-testid="`shortcut-builder-modifier-${modifier}`"
            :aria-pressed="builderModifiers.includes(modifier)"
            :class="{ selected: builderModifiers.includes(modifier) }"
            @click="toggleModifier(modifier)"
          >
            {{ modifier === "Meta" ? t("shortcuts.meta") : modifier }}
          </button>
        </div>
        <div class="shortcut-builder-row">
          <label class="shortcut-field" for="shortcut-builder-key">
            <span>{{ t("shortcuts.builderKey") }}</span>
            <select
              id="shortcut-builder-key"
              v-model="builderKey"
              class="native-select"
              data-testid="shortcut-builder-key"
            >
              <option value="">{{ t("shortcuts.modifierOnly") }}</option>
              <optgroup :label="t('shortcuts.keys.letters')">
                <option v-for="key in letterKeys" :key="key" :value="key">{{ key }}</option>
              </optgroup>
              <optgroup :label="t('shortcuts.keys.digits')">
                <option v-for="key in digitKeys" :key="key" :value="key">{{ key }}</option>
              </optgroup>
              <optgroup :label="t('shortcuts.keys.named')">
                <option v-for="key in namedKeys" :key="key" :value="key">{{ key }}</option>
              </optgroup>
              <optgroup :label="t('shortcuts.keys.punctuation')">
                <option v-for="key in punctuationKeys" :key="key" :value="key">{{ key }}</option>
              </optgroup>
              <optgroup :label="t('shortcuts.keys.function')">
                <option v-for="key in functionKeys" :key="key" :value="key">{{ key }}</option>
              </optgroup>
              <optgroup :label="t('shortcuts.keys.numpad')">
                <option v-for="key in numpadKeys" :key="key" :value="key">{{ key }}</option>
              </optgroup>
            </select>
          </label>
          <Button
            variant="outline"
            size="sm"
            data-testid="shortcut-builder-add"
            :disabled="!canAdd"
            @click="addManualStroke"
            >{{ t("shortcuts.addStroke") }}</Button
          >
        </div>
        <p class="hint">{{ t("shortcuts.builderHint") }}</p>
      </fieldset>
    </details>
    <div class="shortcut-filters">
      <label class="shortcut-field" for="shortcut-platform"
        ><span>{{ t("shortcuts.platformLabel") }}</span>
        <select
          id="shortcut-platform"
          v-model="platform"
          class="native-select"
          data-testid="shortcut-platform"
        >
          <option value="">{{ t("shortcuts.allPlatforms") }}</option>
          <option v-for="value in platforms" :key="value" :value="value">
            {{ t(`shortcuts.platform.${value}`) }}
          </option>
        </select>
      </label>
      <label class="shortcut-field" for="shortcut-surface"
        ><span>{{ t("shortcuts.surfaceLabel") }}</span>
        <select
          id="shortcut-surface"
          v-model="surface"
          class="native-select"
          data-testid="shortcut-surface"
        >
          <option value="">{{ t("shortcuts.allSurfaces") }}</option>
          <option v-for="value in surfaces" :key="value" :value="value">
            {{ t(`shortcuts.surface.${value}`) }}
          </option>
        </select>
      </label>
      <label class="shortcut-field" for="shortcut-app"
        ><span>{{ t("shortcuts.app") }}</span>
        <select id="shortcut-app" v-model="appId" class="native-select" data-testid="shortcut-app">
          <option value="">{{ t("shortcuts.allApps") }}</option>
          <option v-for="app in apps" :key="app.id" :value="app.id">{{ app.name }}</option>
        </select>
      </label>
      <label class="shortcut-field" for="shortcut-text"
        ><span>{{ t("shortcuts.text") }}</span>
        <input
          id="shortcut-text"
          v-model="text"
          class="native-select"
          data-testid="shortcut-text"
          :placeholder="t('shortcuts.textPlaceholder')"
          maxlength="200"
          type="search"
        />
      </label>
      <label class="shortcut-field" for="shortcut-match-mode"
        ><span>{{ t("shortcuts.matchMode") }}</span>
        <select
          id="shortcut-match-mode"
          v-model="matchMode"
          class="native-select"
          data-testid="shortcut-match-mode"
        >
          <option value="exact">{{ t("shortcuts.exact") }}</option>
          <option value="contains">{{ t("shortcuts.contains") }}</option>
        </select>
      </label>
      <label class="shortcut-field" for="shortcut-key-mode"
        ><span>{{ t("shortcuts.keyMode") }}</span>
        <select
          id="shortcut-key-mode"
          v-model="keyMode"
          class="native-select"
          data-testid="shortcut-key-mode"
        >
          <option value="logical">{{ t("shortcuts.logical") }}</option>
          <option value="physical">{{ t("shortcuts.physical") }}</option>
        </select>
      </label>
    </div>
    <p v-if="keyMode === 'physical'" class="hint">{{ t("shortcuts.physicalHint") }}</p>
  </section>

  <section class="result-panel shortcut-results" aria-labelledby="shortcut-results-heading">
    <div class="result-header">
      <h2 id="shortcut-results-heading">
        <span class="step-number">02</span>{{ t("labels.result") }}
      </h2>
      <span class="hint" role="status" data-testid="shortcut-result-count">{{
        t("shortcuts.resultCount", { count: results.length })
      }}</span>
    </div>
    <p class="hint shortcut-coverage">
      {{ t("shortcuts.coverage", { records: shortcutRecords.length, apps: apps.length }) }}
    </p>
    <p class="hint shortcut-coverage" data-testid="shortcut-candidate-notice">
      {{ t("shortcuts.candidateNotice") }}
    </p>
    <p
      v-if="!visibleResults.length && !invalidShortcut"
      class="notice"
      role="status"
      data-testid="shortcut-no-matches"
    >
      {{ t("shortcuts.noMatches") }}
    </p>
    <div v-if="visibleResults.length" class="shortcut-result-grid">
      <article
        v-for="record in visibleResults"
        :key="record.id"
        class="shortcut-result"
        data-testid="shortcut-result"
        :data-record-id="record.id"
      >
        <div class="shortcut-card-heading">
          <h3>{{ record.app }}</h3>
          <span class="type-pill">{{ t(`shortcuts.surface.${record.surface}`) }}</span>
        </div>
        <p class="shortcut-card-keys">
          <kbd>{{ formatShortcut(record.sequence) }}</kbd>
        </p>
        <p class="shortcut-action">{{ action(record) }}</p>
        <p class="hint">
          {{
            t(record.sequence.length > 1 ? "shortcuts.sequenceBinding" : "shortcuts.chordBinding")
          }}
        </p>
        <dl class="shortcut-card-metadata">
          <div>
            <dt>{{ t("shortcuts.platformLabel") }}</dt>
            <dd>
              {{ record.platforms.map((value) => t(`shortcuts.platform.${value}`)).join(" / ") }}
            </dd>
          </div>
          <div>
            <dt>{{ t("shortcuts.version") }}</dt>
            <dd>{{ record.version }}</dd>
          </div>
          <div>
            <dt>{{ t("shortcuts.context") }}</dt>
            <dd>{{ context(record) }}</dd>
          </div>
          <div v-if="record.sequence.some((stroke) => stroke.code)">
            <dt>{{ t("shortcuts.recordCode") }}</dt>
            <dd>
              <code>{{ record.sequence.map((stroke) => stroke.code || "—").join(" → ") }}</code>
            </dd>
          </div>
        </dl>
        <div v-if="record.source" class="shortcut-card-source">
          <a
            :href="record.source.url"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="shortcut-source"
            >{{ record.source.title }} ↗</a
          >
          <p class="hint" data-testid="shortcut-checked">
            {{ t("shortcuts.checked", { date: record.source.checkedAt }) }}
          </p>
          <p v-if="record.source.license" class="hint shortcut-license-line">
            {{ t("shortcuts.dataLicense") }}
            <a
              v-if="record.source.license.url"
              :href="record.source.license.url"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="shortcut-license"
              >{{ record.source.license.spdx }}</a
            >
            <span v-else>{{ record.source.license.spdx }}</span>
          </p>
          <details>
            <summary>{{ t("shortcuts.rights") }}</summary>
            <p class="hint">{{ record.source.rights }}</p>
            <template v-if="record.source.license">
              <dl class="shortcut-card-metadata shortcut-license-metadata">
                <div v-if="record.source.license.attribution">
                  <dt>{{ t("shortcuts.attributionLabel") }}</dt>
                  <dd data-testid="shortcut-attribution">
                    {{ record.source.license.attribution }}
                  </dd>
                </div>
                <div v-if="record.source.license.changes">
                  <dt>{{ t("shortcuts.changesLabel") }}</dt>
                  <dd>{{ record.source.license.changes }}</dd>
                </div>
              </dl>
              <p class="hint">{{ t("shortcuts.licenseScope") }}</p>
              <p v-if="record.source.license.shareAlike" class="hint">
                {{ t("shortcuts.shareAlike") }}
              </p>
              <div class="shortcut-license-links">
                <a
                  v-if="record.source.license.upstreamUrl"
                  :href="record.source.license.upstreamUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ t("shortcuts.upstream") }} ↗</a
                >
                <a
                  v-if="record.source.license.offlinePath"
                  :href="localSourceHref(record.source.license.offlinePath)"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="shortcut-notice"
                  >{{ t("shortcuts.offlineNotice") }} ↗</a
                >
                <a
                  v-if="record.source.license.licenseTextPath"
                  :href="localSourceHref(record.source.license.licenseTextPath)"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="shortcut-license-text"
                  >{{ t("shortcuts.licenseText") }} ↗</a
                >
              </div>
            </template>
            <template v-if="record.source.publication">
              <p class="hint">
                {{
                  t(
                    record.source.publication.state === "candidate"
                      ? "shortcuts.publicationCandidate"
                      : "shortcuts.publicationHeld",
                  )
                }}
              </p>
              <p v-if="record.source.publication.reviewedAt" class="hint">
                {{
                  t("shortcuts.publicationReviewed", { date: record.source.publication.reviewedAt })
                }}
              </p>
              <p v-if="record.source.publication.reason" class="hint">
                {{ record.source.publication.reason }}
              </p>
            </template>
          </details>
        </div>
      </article>
    </div>
    <nav
      v-if="pages > 1"
      class="control-row shortcut-pagination"
      :aria-label="t('shortcuts.pagination')"
    >
      <Button
        variant="outline"
        size="sm"
        data-testid="shortcut-previous"
        :disabled="page === 1"
        @click="page--"
        >{{ t("shortcuts.previous") }}</Button
      >
      <span class="hint">{{ t("shortcuts.page", { page, pages }) }}</span>
      <Button
        variant="outline"
        size="sm"
        data-testid="shortcut-next"
        :disabled="page === pages"
        @click="page++"
        >{{ t("shortcuts.next") }}</Button
      >
    </nav>
    <p class="hint shortcut-results-note">{{ t("shortcuts.verification") }}</p>
  </section>
</template>

<style scoped>
.shortcut-purpose {
  margin-bottom: 1rem;
}
.shortcut-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.75rem;
  min-width: 0;
}
.shortcut-field > span {
  font-weight: 550;
}
.shortcut-field input,
.shortcut-field select {
  width: 100%;
  min-width: 0;
}
.shortcut-capture {
  padding: 1.25rem;
  border: 1px solid var(--input);
  border-radius: 10px;
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-mono);
  font-size: clamp(1rem, 2.3vw, 1.6rem);
  min-height: 5rem;
}
.shortcut-capture:focus {
  border-color: var(--ring);
  background: var(--orange-soft);
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.shortcut-capture::placeholder {
  color: var(--muted-foreground);
  font-family: var(--font-sans);
  font-size: 0.9rem;
}
.shortcut-capture-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}
.shortcut-focus-state {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--muted-foreground);
  font-size: 0.7rem;
}
.shortcut-focus-state > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.shortcut-focus-state.listening {
  color: var(--positive);
}
.shortcut-observed {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.7rem;
}
.shortcut-observed > div {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 0;
}
.shortcut-observed dt,
.shortcut-card-metadata dt {
  color: var(--muted-foreground);
}
.shortcut-observed dd {
  overflow-wrap: anywhere;
}
.shortcut-layout-hint {
  margin-top: 0.75rem;
}
.shortcut-manual {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}
.shortcut-manual summary {
  font-size: 0.8rem;
  font-weight: 550;
  cursor: pointer;
}
.shortcut-manual > .shortcut-field {
  margin-top: 1rem;
}
.shortcut-manual-input {
  font-family: var(--font-mono);
}
.shortcut-builder {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
}
.shortcut-builder legend {
  font-size: 0.75rem;
  padding: 0 0.4rem;
}
.shortcut-modifiers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.shortcut-modifiers button {
  border: 1px solid var(--input);
  background: var(--card);
  border-radius: 6px;
  padding: 0.5rem 0.8rem;
  min-height: 36px;
  font-size: 0.75rem;
}
.shortcut-modifiers button.selected {
  background: var(--orange-soft);
  border-color: var(--ring);
  color: var(--primary);
}
.shortcut-builder-row {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0.75rem 0 0.4rem;
}
.shortcut-builder-row .shortcut-field {
  flex: 1 1 200px;
}
.shortcut-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
}
.shortcut-coverage {
  margin-bottom: 1rem;
}
.shortcut-result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.shortcut-result {
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 1rem;
  min-width: 0;
}
.shortcut-card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.shortcut-card-heading h3 {
  font-size: 0.85rem;
  font-weight: 650;
}
.shortcut-card-keys {
  margin: 1rem 0 0.65rem;
}
.shortcut-card-keys kbd {
  display: inline-block;
  max-width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-bottom-width: 3px;
  border-radius: 5px;
  background: var(--background);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}
.shortcut-action {
  font-size: 0.8rem;
  font-weight: 550;
}
.shortcut-card-metadata {
  display: grid;
  gap: 0.65rem;
  margin-top: 1rem;
  font-size: 0.7rem;
}
.shortcut-card-metadata > div {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: 0.5rem;
}
.shortcut-card-metadata dd {
  overflow-wrap: anywhere;
  line-height: 1.65;
}
.shortcut-card-source {
  border-top: 1px solid var(--border);
  margin-top: 1rem;
  padding-top: 0.8rem;
}
.shortcut-card-source a {
  font-size: 0.7rem;
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  overflow-wrap: anywhere;
}
.shortcut-card-source summary {
  cursor: pointer;
  font-size: 0.7rem;
  color: var(--muted-foreground);
  margin-top: 0.5rem;
}
.shortcut-card-source details p {
  margin-top: 0.4rem;
  overflow-wrap: anywhere;
}
.shortcut-license-line {
  margin-top: 0.3rem;
}
.shortcut-license-metadata {
  margin-top: 0.65rem;
}
.shortcut-license-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-top: 0.65rem;
}
.shortcut-pagination {
  justify-content: flex-end;
  margin-top: 1rem;
}
.shortcut-results-note {
  margin-top: 1rem;
}
@media (max-width: 900px) {
  .shortcut-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .shortcut-result-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 480px) {
  .shortcut-filters {
    grid-template-columns: minmax(0, 1fr);
  }
  .shortcut-card-metadata > div {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.2rem;
  }
  .shortcut-capture {
    padding: 1rem 0.75rem;
  }
  .shortcut-builder {
    padding: 0.75rem;
  }
}
</style>
