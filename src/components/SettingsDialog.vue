<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Sun, Moon, Monitor, X, ShieldCheck, RotateCcw, ExternalLink } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import ToolIcon from "./ToolIcon.vue";
import { settings, type Theme } from "@/lib/preferences";
import { tools, type ToolId } from "@/lib/catalog";
defineProps<{ open: boolean; fontError: boolean }>();
const emit = defineEmits<{ "update:open": [value: boolean]; closed: [event: Event] }>();
const { t } = useI18n();
const { preferences, status } = settings;
const themes: { value: Theme; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
];
const languages = {
  ja: "日本語",
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ko: "한국어",
};
const base = import.meta.env.BASE_URL;
const fontBase = `${base}fonts/licenses/`;
function toggleTool(id: ToolId, enabled: boolean) {
  preferences.enabledTools = enabled
    ? [...new Set([...preferences.enabledTools, id])]
    : preferences.enabledTools.filter((value) => value !== id);
}
</script>
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="settings-dialog"
      :show-close-button="false"
      @close-auto-focus="emit('closed', $event)"
    >
      <div class="settings-heading">
        <div>
          <DialogTitle>{{ t("settings.title") }}</DialogTitle
          ><DialogDescription>{{ t("settings.lead") }}</DialogDescription>
        </div>
        <DialogClose as-child
          ><Button
            variant="ghost"
            size="icon"
            :aria-label="t('actions.close')"
            data-testid="settings-close"
            ><X class="size-4" /></Button
        ></DialogClose>
      </div>
      <section class="settings-section">
        <h3>{{ t("settings.appearance") }}</h3>
        <div class="theme-options">
          <Button
            v-for="theme in themes"
            :key="theme.value"
            :variant="preferences.theme === theme.value ? 'default' : 'outline'"
            :data-testid="`theme-${theme.value}`"
            :aria-pressed="preferences.theme === theme.value"
            @click="preferences.theme = theme.value"
            ><component :is="theme.icon" class="size-4" />{{ t(`theme.${theme.value}`) }}</Button
          >
        </div>
      </section>
      <section class="settings-section">
        <label for="language-select" class="field-label">{{ t("settings.language") }}</label
        ><select
          id="language-select"
          v-model="preferences.locale"
          class="native-select language-select"
          data-testid="locale-select"
        >
          <option v-for="(name, code) in languages" :key="code" :value="code" :lang="code">
            {{ name }}
          </option>
        </select>
        <p class="hint">{{ t("settings.fonts") }}</p>
        <p v-if="fontError" class="notice" role="status">{{ t("settings.fontError") }}</p>
      </section>
      <section class="settings-section">
        <h3>{{ t("settings.tools") }}</h3>
        <p class="hint">{{ t("settings.devtoysHint") }}</p>
        <div class="tool-toggles">
          <div v-for="tool in tools" :key="tool.id" class="tool-toggle">
            <span :class="['tool-icon', `icon-${tool.color}`]"><ToolIcon :id="tool.id" /></span
            ><label :for="`switch-${tool.id}`"
              ><strong>{{ t(`tool.${tool.id}.name`) }}</strong
              ><span v-if="tool.devtoys" class="overlap-label">{{
                t("settings.devtoys")
              }}</span></label
            ><Switch
              :id="`switch-${tool.id}`"
              :data-testid="`toggle-${tool.id}`"
              :model-value="preferences.enabledTools.includes(tool.id)"
              :aria-label="t(`tool.${tool.id}.name`)"
              @update:model-value="toggleTool(tool.id, $event)"
            />
          </div>
        </div>
      </section>
      <section class="privacy-detail">
        <ShieldCheck class="size-5" />
        <div>
          <h3>{{ t("settings.privacyTitle") }}</h3>
          <p>{{ t("settings.privacyDetail") }}</p>
          <div class="license-links">
            <span>{{ t("settings.licenses") }}</span
            ><a :href="`${fontBase}Sarasa-Gothic-OFL.txt`" target="_blank" rel="noopener noreferrer"
              >Sarasa Mono · OFL<ExternalLink class="size-3" /></a
            ><a :href="`${fontBase}noto-sans-OFL.txt`" target="_blank" rel="noopener noreferrer"
              >Noto Sans · OFL<ExternalLink class="size-3" /></a
            ><a
              v-for="region in ['jp', 'sc', 'tc', 'kr']"
              :key="region"
              :href="`${fontBase}noto-sans-${region}-OFL.txt`"
              target="_blank"
              rel="noopener noreferrer"
              >Noto {{ region.toUpperCase() }} · OFL<ExternalLink class="size-3" /></a
            ><a :href="`${base}THIRD_PARTY_NOTICES.md`" target="_blank" rel="noopener noreferrer"
              >Army Knife / OSS<ExternalLink class="size-3"
            /></a>
          </div>
        </div>
      </section>
      <p v-if="!status.available" role="status" class="notice">{{ t("settings.storageError") }}</p>
      <div class="settings-footer">
        <Button variant="ghost" size="sm" @click="settings.reset()"
          ><RotateCcw class="size-3.5" />{{ t("actions.reset") }}</Button
        ><span>Army Knife <span class="font-mono">v0.1.0</span></span>
      </div>
    </DialogContent>
  </Dialog>
</template>
