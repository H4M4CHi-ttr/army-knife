<script setup vapor lang="ts">
import { computed, ref, watch } from "vue";
import { useAppI18n } from "@/i18n/useAppI18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OutputActions from "@/components/OutputActions.vue";
import { useToolExecution } from "@/composables/useToolExecution";
import { ToolError } from "@/lib/tools/errors";
import {
  generateIdentifiers, generateSecrets, generateOgTags, inspectIdentifier, inspectJwt,
  inspectTimestamp, type DateInputKind, type IdFormat, type JwtInspection,
  type OgFields, type SecretGeneration, type TimestampInfo,
} from "@/lib/tools/five-tools";

const props = defineProps<{ id: "timestamp" | "jwt" | "ids" | "password" | "og-tags" }>();
const { t } = useAppI18n();

const dateValue = ref("");
const dateKind = ref<DateInputKind>("iso");
const timezone = ref("UTC");
const { result: timeResult, error: timeError } = useToolExecution<TimestampInfo>({
  source: computed(() => [dateValue.value, dateKind.value, timezone.value]),
  canRun: () => props.id === "timestamp" && Boolean(dateValue.value.trim()),
  mode: "instant",
  execute: () => inspectTimestamp(dateValue.value, dateKind.value, timezone.value),
});
const timeRows = computed(() => timeResult.value ? [
  ["five.utc", timeResult.value.utc],
  ["five.seconds", timeResult.value.unixSeconds],
  ["five.milliseconds", timeResult.value.unixMilliseconds],
  ["five.inTimezone", timeResult.value.zoned],
] : []);

const token = ref("");
const { result: jwtResult, error: jwtError } = useToolExecution<JwtInspection>({
  source: token,
  canRun: () => props.id === "jwt" && Boolean(token.value.trim()),
  mode: "instant",
  execute: () => inspectJwt(token.value),
});

const idFormat = ref<IdFormat>("v7");
const idCount = ref(5);
const idResults = ref<string[]>([]);
const idError = ref("");
const identifier = ref("");
const inspectedId = computed(() => {
  if (!identifier.value.trim()) return null;
  try { return inspectIdentifier(identifier.value); } catch { return null; }
});
watch([idFormat, idCount], () => { idResults.value = []; idError.value = ""; });
function runIds(): void {
  idResults.value = [];
  try { idResults.value = generateIdentifiers(idFormat.value, idCount.value); idError.value = ""; }
  catch (error) { idError.value = errorCode(error); }
}

const secretMode = ref<"password" | "hex">("password");
const secretLength = ref(24);
const secretCount = ref(5);
const lower = ref(true);
const upper = ref(true);
const digits = ref(true);
const symbols = ref(false);
const exclude = ref("");
const secretResult = ref<SecretGeneration | null>(null);
const secretError = ref("");
watch([secretMode, secretLength, secretCount, lower, upper, digits, symbols, exclude], () => {
  secretResult.value = null;
  secretError.value = "";
});
function runSecrets(): void {
  secretResult.value = null;
  try {
    secretResult.value = generateSecrets({
      mode: secretMode.value, length: secretLength.value, count: secretCount.value,
      lower: lower.value, upper: upper.value, digits: digits.value,
      symbols: symbols.value, exclude: exclude.value,
    });
    secretError.value = "";
  } catch (error) { secretError.value = errorCode(error); }
}
function errorCode(error: unknown): string {
  return error instanceof ToolError ? error.code : "INTERNAL_ERROR";
}

const ogTitle = ref("");
const ogDescription = ref("");
const ogUrl = ref("");
const ogImage = ref("");
const ogLocale = ref("ja_JP");
const ogType = ref<OgFields["type"]>("website");
const ogFields = computed<OgFields>(() => ({
  title: ogTitle.value, description: ogDescription.value, url: ogUrl.value,
  image: ogImage.value, locale: ogLocale.value, type: ogType.value,
}));
const { result: ogResult, error: ogError } = useToolExecution<ReturnType<typeof generateOgTags>>({
  source: ogFields,
  canRun: () => props.id === "og-tags" && Boolean(ogTitle.value || ogUrl.value),
  mode: "instant",
  execute: () => generateOgTags(ogFields.value),
});
</script>

<template>
  <div class="tool-panel five-tools">
    <template v-if="id === 'timestamp'">
      <div class="five-grid">
        <label class="five-field"><span class="field-label">{{ t("five.format") }}</span>
          <select v-model="dateKind" class="native-select" data-testid="date-kind">
            <option value="iso">ISO 8601 / RFC 3339</option>
            <option value="seconds">Unix seconds</option>
            <option value="milliseconds">Unix milliseconds</option>
          </select>
        </label>
        <label class="five-field"><span class="field-label">{{ t("five.timezone") }}</span>
          <Input v-model="timezone" maxlength="80" data-testid="date-zone" list="five-zones" />
          <datalist id="five-zones"><option value="UTC"/><option value="Asia/Tokyo"/>
            <option value="America/New_York"/><option value="Europe/London"/></datalist>
        </label>
      </div>
      <label class="five-field"><span class="field-label">{{ t("labels.input") }}</span>
        <Input v-model="dateValue" maxlength="256" data-testid="date-input"
          :placeholder="dateKind === 'iso' ? '2026-10-12T12:30:00+09:00' : '1791775800'" spellcheck="false" />
      </label>
      <p class="hint">{{ t("tool.timestamp.hint") }}</p>
      <Button variant="outline" size="sm" @click="dateValue = dateKind === 'iso' ? '2026-10-12T12:30:00+09:00' : dateKind === 'seconds' ? '-1' : '-1'">{{ t("actions.sample") }}</Button>
      <p v-if="timeError" class="error-panel" role="alert">{{ t("errors." + timeError) }}</p>
      <section v-if="timeResult" class="result-panel" aria-live="polite">
        <div class="result-header"><h2>{{ t("labels.result") }}</h2>
          <OutputActions :text="timeRows.map((item) => item[0] + ': ' + item[1]).join('\n')" filename="timestamp.txt" /></div>
        <div class="table-scroll"><table class="data-table"><tbody>
          <tr v-for="item in timeRows" :key="item[0]"><th scope="row">{{ t(item[0]) }}</th><td><code>{{ item[1] }}</code></td></tr>
        </tbody></table></div>
      </section>
    </template>

    <template v-else-if="id === 'jwt'">
      <label class="five-field"><span class="field-label">{{ t("five.token") }}</span>
        <textarea v-model="token" class="five-textarea font-mono" rows="4" maxlength="65536"
          data-testid="jwt-input" spellcheck="false" autocomplete="off" />
      </label>
      <p class="hint">{{ t("tool.jwt.hint") }}</p>
      <p class="five-warning" role="note">{{ t("five.unverified") }}</p>
      <p v-if="jwtError" class="error-panel" role="alert">{{ t("errors." + jwtError) }}</p>
      <section v-if="jwtResult" class="result-panel" aria-live="polite">
        <div class="result-header"><h2>{{ t("labels.result") }}</h2>
          <OutputActions :text="jwtResult.header + '\n' + jwtResult.payload" filename="jwt-decoded.txt" /></div>
        <p><strong>{{ t("five.algorithm") }}:</strong> {{ jwtResult.algorithm }}</p>
        <p>{{ t("five.signature") }}: {{ t(jwtResult.signaturePresent ? "labels.yes" : "labels.no") }}</p>
        <p v-if="jwtResult.expired" class="five-warning">{{ t("five.expired") }}</p>
        <p v-if="jwtResult.notYetValid" class="five-warning">{{ t("five.notYetValid") }}</p>
        <h3>Header</h3><pre class="five-code">{{ jwtResult.header }}</pre>
        <h3>Payload</h3><pre class="five-code">{{ jwtResult.payload }}</pre>
        <div v-if="jwtResult.claimsTimes.length" class="table-scroll">
          <table class="data-table"><tbody>
            <tr v-for="claim in jwtResult.claimsTimes" :key="claim.name">
              <th scope="row">{{ claim.name }}</th><td>{{ claim.utc }}</td>
            </tr>
          </tbody></table>
        </div>
      </section>
    </template>

    <template v-else-if="id === 'ids'">
      <div class="five-grid">
        <label class="five-field"><span class="field-label">{{ t("five.format") }}</span>
          <select v-model="idFormat" class="native-select" data-testid="id-format">
            <option value="v4">UUID v4</option><option value="v7">UUID v7</option><option value="ulid">ULID</option>
          </select>
        </label>
        <label class="five-field"><span class="field-label">{{ t("labels.count") }} (1–100)</span>
          <Input v-model.number="idCount" type="number" min="1" max="100" step="1" data-testid="id-count" />
        </label>
      </div>
      <Button data-testid="id-generate" @click="runIds">{{ t("five.generate") }}</Button>
      <p class="hint">{{ t("tool.ids.hint") }}</p>
      <p v-if="idError" class="error-panel" role="alert">{{ t("errors." + idError) }}</p>
      <section v-if="idResults.length" class="result-panel" aria-live="polite">
        <div class="result-header"><h2>{{ t("labels.result") }}</h2>
          <OutputActions :text="idResults.join('\n')" filename="identifiers.txt" /></div>
        <textarea class="five-textarea font-mono" readonly :value="idResults.join('\n')" :rows="Math.min(idResults.length + 1, 10)" data-testid="id-results" />
      </section>
      <label class="five-field"><span class="field-label">{{ t("five.inspectId") }}</span>
        <Input v-model="identifier" maxlength="128" data-testid="id-inspect" spellcheck="false" />
      </label>
      <p v-if="identifier.trim() && !inspectedId" class="error-panel" role="alert">{{ t("errors.INVALID_REQUEST") }}</p>
      <div v-if="inspectedId" class="result-panel" aria-live="polite">
        <p><strong>{{ inspectedId.format }}</strong>: <code>{{ inspectedId.normalized }}</code></p>
        <p v-if="inspectedId.utc">{{ t("five.timestamp") }}: <code>{{ inspectedId.utc }}</code></p>
      </div>
    </template>

    <template v-else-if="id === 'password'">
      <div class="five-grid">
        <label class="five-field"><span class="field-label">{{ t("five.mode") }}</span>
          <select v-model="secretMode" class="native-select" data-testid="secret-mode">
            <option value="password">{{ t("five.password") }}</option>
            <option value="hex">{{ t("five.hexToken") }}</option>
          </select>
        </label>
        <label class="five-field"><span class="field-label">{{ t("five.length") }} (8–128)</span>
          <Input v-model.number="secretLength" type="number" min="8" max="128" step="1" data-testid="secret-length" />
        </label>
        <label class="five-field"><span class="field-label">{{ t("labels.count") }} (1–20)</span>
          <Input v-model.number="secretCount" type="number" min="1" max="20" step="1" data-testid="secret-count" />
        </label>
      </div>
      <div v-if="secretMode === 'password'" class="five-field">
        <span class="field-label">{{ t("five.characterSets") }}</span>
        <div class="five-checks">
          <label><input v-model="lower" type="checkbox"/> a–z</label>
          <label><input v-model="upper" type="checkbox"/> A–Z</label>
          <label><input v-model="digits" type="checkbox"/> 0–9</label>
          <label><input v-model="symbols" type="checkbox"/> !@#$…</label>
        </div>
        <label class="five-field"><span class="field-label">{{ t("five.exclude") }}</span>
          <Input v-model="exclude" maxlength="128" data-testid="secret-exclude" spellcheck="false" /></label>
      </div>
      <Button data-testid="secret-generate" @click="runSecrets">{{ t("five.generate") }}</Button>
      <p class="hint">{{ t("tool.password.hint") }}</p>
      <p v-if="secretError" class="error-panel" role="alert">{{ t("errors." + secretError) }}</p>
      <section v-if="secretResult" class="result-panel" aria-live="polite">
        <div class="result-header"><h2>{{ t("labels.result") }}</h2>
          <OutputActions :text="secretResult.values.join('\n')" filename="generated-secrets.txt" /></div>
        <textarea class="five-textarea font-mono" readonly :value="secretResult.values.join('\n')"
          :rows="Math.min(secretResult.values.length + 1, 10)" data-testid="secret-results" />
        <p class="hint">{{ t("five.estimatedEntropy") }}: {{ secretResult.estimatedBits }} bits. {{ t("five.entropyNote") }}</p>
      </section>
    </template>

    <template v-else-if="id === 'og-tags'">
      <div class="five-grid">
        <label class="five-field"><span class="field-label">{{ t("five.title") }} *</span>
          <Input v-model="ogTitle" maxlength="200" data-testid="og-title" /></label>
        <label class="five-field"><span class="field-label">URL *</span>
          <Input v-model="ogUrl" maxlength="2048" data-testid="og-url" type="url" placeholder="https://example.com/post" /></label>
        <label class="five-field"><span class="field-label">{{ t("five.imageUrl") }}</span>
          <Input v-model="ogImage" maxlength="2048" placeholder="https://example.com/image.png" /></label>
        <label class="five-field"><span class="field-label">{{ t("five.locale") }}</span>
          <Input v-model="ogLocale" maxlength="40" placeholder="ja_JP" /></label>
        <label class="five-field"><span class="field-label">{{ t("five.type") }}</span>
          <select v-model="ogType" class="native-select"><option value="website">website</option><option value="article">article</option></select></label>
      </div>
      <label class="five-field"><span class="field-label">{{ t("five.description") }}</span>
        <textarea v-model="ogDescription" maxlength="1000" class="five-textarea" rows="3" /></label>
      <p class="hint">{{ t("tool.og-tags.hint") }}</p>
      <p v-if="ogError" class="error-panel" role="alert">{{ t("errors." + ogError) }}</p>
      <section v-if="ogResult" class="result-panel" aria-live="polite">
        <div class="result-header"><h2>{{ t("labels.result") }}</h2>
          <OutputActions :text="ogResult.html" filename="metadata.html" type="text/html" /></div>
        <div class="five-preview"><span>{{ ogResult.host }}</span>
          <strong>{{ ogTitle }}</strong><p>{{ ogDescription }}</p>
          <small>{{ t("five.previewNoFetch") }}</small></div>
        <pre class="five-code" data-testid="og-result">{{ ogResult.html }}</pre>
      </section>
    </template>
  </div>
</template>

<style scoped>
.five-tools { display: grid; gap: 1rem; }
.five-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); }
.five-field { display: grid; gap: 0.4rem; min-width: 0; }
.five-field input, .five-field select { width: 100%; }
.five-textarea { display: block; width: 100%; min-height: 5rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: 0.6rem; background: transparent; color: inherit; resize: vertical; overflow-wrap: anywhere; }
.five-checks { display: flex; gap: 1rem; flex-wrap: wrap; }
.five-checks label { display: inline-flex; align-items: center; gap: 0.35rem; }
.five-warning { border-left: 3px solid currentColor; padding: 0.7rem; font-weight: 600; }
.five-code { overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 22rem; border-radius: 0.5rem; padding: 0.85rem; background: var(--muted); font-family: var(--font-mono, monospace); }
.five-preview { border: 1px solid var(--border); border-radius: 0.65rem; padding: 0.85rem; display: grid; gap: 0.3rem; overflow-wrap: anywhere; }
.five-preview span, .five-preview small { opacity: 0.7; }
.five-preview strong { font-size: 1.1rem; }
</style>
