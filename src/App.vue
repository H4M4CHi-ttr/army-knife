<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  ChevronRight,
  CodeXml,
  Database,
  Heart,
  LayoutGrid,
  LockKeyhole,
  Menu,
  Moon,
  Network,
  Palette,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  TextCursorInput,
} from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ToolIcon from "@/components/ToolIcon.vue";
import SettingsDialog from "@/components/SettingsDialog.vue";
import { getTool, isToolId, tools, type Category, type ToolId } from "@/lib/catalog";
import { settings } from "@/lib/preferences";
import { setFontLocale } from "@/lib/fonts";
import { searchTools } from "@/lib/search";
import { ClassifierClient } from "@/lib/search/classifier-client";
import { mergeRankings } from "@/lib/search/classifier-runtime";

const WasmTool = defineAsyncComponent(() => import("@/components/tools/WasmTool.vue"));
const JsonTool = defineAsyncComponent(() => import("@/components/tools/JsonTool.vue"));
const CidrTool = defineAsyncComponent(() => import("@/components/tools/CidrTool.vue"));
const UnicodeTool = defineAsyncComponent(() => import("@/components/tools/UnicodeTool.vue"));
const ContrastTool = defineAsyncComponent(() => import("@/components/tools/ContrastTool.vue"));
const HarTool = defineAsyncComponent(() => import("@/components/tools/HarTool.vue"));
const EnvTool = defineAsyncComponent(() => import("@/components/tools/EnvTool.vue"));
const UrlTool = defineAsyncComponent(() => import("@/components/tools/UrlTool.vue"));
const ExplainTool = defineAsyncComponent(() => import("@/components/tools/ExplainTool.vue"));
const { t, locale } = useI18n();
const { preferences, status } = settings;
const query = ref("");
const classifierRank = ref<{ query: string; ids: ToolId[] } | null>(null);
const classifierStatus = ref<"idle" | "loading" | "ready" | "error">("idle");
let classifierWorker: ClassifierClient | null = null;
let classifierFailed = false;
const activeCategory = ref<Category | "all">("all");
const favoritesOnly = ref(false);
const mobileOpen = ref(false);
const settingsOpen = ref(false);
const fontError = ref(false);
const hash = ref(window.location.hash);
const searchInput = ref<HTMLInputElement>();
const heading = ref<HTMLElement>();
const settingsButton = ref<InstanceType<typeof Button>>();
let settingsTrigger: HTMLElement | null = null;
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const logo = `${import.meta.env.BASE_URL}favicon.svg`;
const languageNames = {
  ja: "日本語",
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ko: "한국어",
};
const categoryIcons = { data: Database, text: TextCursorInput, network: Network, design: Palette };
const categories: Category[] = ["data", "text", "network", "design"];
const enabled = computed(() => tools.filter((tool) => preferences.enabledTools.includes(tool.id)));
const requestedId = computed(() => hash.value.match(/^#\/tool\/([a-z-]+)$/)?.[1]);
const selectedTool = computed(() =>
  isToolId(requestedId.value) && preferences.enabledTools.includes(requestedId.value)
    ? getTool(requestedId.value)
    : null,
);
const matches = computed(() => {
  const fallback = searchTools(query.value, enabled.value);
  const result = classifierRank.value;
  if (!query.value.trim() || preferences.searchMode === "lexical" ||
      !result || result.query !== query.value) return fallback;
  const ranked = preferences.searchMode === "classifier"
    ? result.ids
    : mergeRankings(searchTools(query.value, tools).map((tool) => tool.id), result.ids);
  const allowed = new Map(enabled.value.map((tool) => [tool.id, tool]));
  return ranked.flatMap((id) => {
    const match = allowed.get(id);
    return match ? [match] : [];
  });
});
const shown = computed(() =>
  matches.value.filter(
    (tool) =>
      (activeCategory.value === "all" || tool.category === activeCategory.value) &&
      (!favoritesOnly.value || preferences.favorites.includes(tool.id)),
  ),
);
const libraryHeading = computed(() =>
  query.value
    ? t("app.results", { query: query.value })
    : favoritesOnly.value
      ? t("nav.favorites")
      : activeCategory.value !== "all"
        ? t(`categories.${activeCategory.value}`)
        : t("app.headline"),
);

function home(category: Category | "all" = "all", favorites = false) {
  activeCategory.value = category;
  favoritesOnly.value = favorites;
  query.value = "";
  mobileOpen.value = false;
  window.location.hash = "/";
}
function chooseTool(id: ToolId) {
  window.location.hash = `/tool/${id}`;
  query.value = "";
  mobileOpen.value = false;
}
function favorite(id: ToolId) {
  preferences.favorites = preferences.favorites.includes(id)
    ? preferences.favorites.filter((value) => value !== id)
    : [...preferences.favorites, id];
}
function openSettings(event?: Event) {
  settingsTrigger =
    event?.currentTarget instanceof HTMLElement
      ? event.currentTarget
      : (document.activeElement as HTMLElement);
  mobileOpen.value = false;
  settingsOpen.value = true;
}
function restoreSettingsFocus(event: Event) {
  event.preventDefault();
  (settingsTrigger?.isConnected
    ? settingsTrigger
    : (settingsButton.value?.$el as HTMLElement)
  )?.focus();
}
function applyTheme() {
  const dark =
    preferences.theme === "dark" || (preferences.theme === "system" && systemTheme.matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#10151d" : "#f7f8fa");
}
function toggleTheme() {
  preferences.theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
}
function onHash() {
  hash.value = window.location.hash;
  query.value = "";
  mobileOpen.value = false;
}
function skipToContent() {
  document.getElementById("main-content")?.focus();
}
function onKey(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (!settingsOpen.value) searchInput.value?.focus();
  }
  if (event.key === "Escape" && !settingsOpen.value) {
    mobileOpen.value = false;
    query.value = "";
  }
}
watch(
  [query, () => preferences.searchMode],
  ([input, mode], _, onCleanup) => {
    classifierRank.value = null;
    if (mode === "lexical") {
      classifierWorker?.stop();
      classifierWorker = null;
      classifierFailed = false;
      classifierStatus.value = "idle";
      return;
    }
    if (classifierFailed) {
      classifierStatus.value = "error";
      return;
    }

    const client = (classifierWorker ??= new ClassifierClient());
    classifierStatus.value = "loading";
    let obsolete = false;
    const start = async () => {
      try {
        if (input.trim()) {
          const ids = await client.rank(input);
          if (!obsolete && query.value === input && preferences.searchMode !== "lexical") {
            classifierRank.value = { query: input, ids };
          }
        } else {
          await client.load();
        }
        if (!obsolete && preferences.searchMode !== "lexical") {
          classifierStatus.value = "ready";
        }
      } catch {
        // No silent remote fallback, no uncaught errors, no query persistence.
        if (!obsolete) {
          classifierFailed = true;
          classifierStatus.value = "error";
          client.stop();
          if (classifierWorker === client) classifierWorker = null;
        }
      }
    };
    const timer = window.setTimeout(() => { void start(); }, input.trim() ? 100 : 0);
    onCleanup(() => {
      obsolete = true;
      window.clearTimeout(timer);
    });
  },
  { immediate: true },
);
watch(() => preferences.theme, applyTheme, { immediate: true });
watch(
  () => preferences.locale,
  (value) => {
    locale.value = value;
    fontError.value = false;
    setFontLocale(value).catch(() => {
      if (preferences.locale === value) fontError.value = true;
    });
  },
  { immediate: true },
);
watch(
  [selectedTool, locale],
  ([value]) => {
    document.title = `${value ? t(`tool.${value.id}.name`) : "Army Knife"} — ${t("app.tagline")}`;
  },
  { immediate: true },
);
watch(selectedTool, async () => {
  await nextTick();
  heading.value?.focus({ preventScroll: true });
});
watch(
  () => preferences.enabledTools,
  () => {
    if (isToolId(requestedId.value) && !preferences.enabledTools.includes(requestedId.value))
      window.location.hash = "/";
  },
  { deep: true },
);
onMounted(() => {
  window.addEventListener("hashchange", onHash);
  window.addEventListener("keydown", onKey);
  systemTheme.addEventListener("change", applyTheme);
});
onBeforeUnmount(() => {
  classifierWorker?.stop();
  classifierWorker = null;
  window.removeEventListener("hashchange", onHash);
  window.removeEventListener("keydown", onKey);
  systemTheme.removeEventListener("change", applyTheme);
});
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="skipToContent">{{ t("nav.skip") }}</a>
  <div class="app-shell">
    <button
      v-if="mobileOpen"
      class="sidebar-backdrop"
      :aria-label="t('actions.close')"
      @click="mobileOpen = false"
    ></button>
    <aside :class="['sidebar', { 'sidebar-open': mobileOpen }]">
      <a class="brand" href="#/" @click.prevent="home()"
        ><img :src="logo" alt="" width="37" height="37" />
        <div>
          <strong>army<span>knife</span><span class="brand-dot">.</span></strong
          ><span class="brand-sub">DEVELOPER WORKBENCH</span>
        </div></a
      >
      <nav :aria-label="t('nav.workspace')">
        <p class="nav-label">{{ t("nav.workspace") }}</p>
        <button
          :class="[
            'nav-item',
            { active: !selectedTool && !favoritesOnly && activeCategory === 'all' },
          ]"
          @click="home()"
        >
          <LayoutGrid /><span>{{ t("nav.library") }}</span
          ><span class="nav-count">{{ enabled.length }}</span>
        </button>
        <button
          :class="['nav-item', { active: !selectedTool && favoritesOnly }]"
          @click="home('all', true)"
        >
          <Heart /><span>{{ t("nav.favorites") }}</span
          ><span v-if="preferences.favorites.length" class="nav-count">{{
            enabled.filter((tool) => preferences.favorites.includes(tool.id)).length
          }}</span>
        </button>
        <p class="nav-label category-label">{{ t("nav.categories") }}</p>
        <button
          v-for="category in categories"
          :key="category"
          :class="[
            'nav-item category-item',
            { active: !selectedTool && !favoritesOnly && activeCategory === category },
          ]"
          @click="home(category)"
        >
          <component :is="categoryIcons[category]" /><span>{{ t(`categories.${category}`) }}</span
          ><span class="category-count">{{
            enabled.filter((tool) => tool.category === category).length
          }}</span>
        </button>
        <div class="sidebar-divider"></div>
        <a
          v-for="tool in enabled"
          :key="tool.id"
          :href="`#/tool/${tool.id}`"
          :class="['nav-tool', { selected: selectedTool?.id === tool.id }]"
          :aria-current="selectedTool?.id === tool.id ? 'page' : undefined"
          ><ToolIcon :id="tool.id" /><span>{{ t(`tool.${tool.id}.name`) }}</span
          ><span v-if="selectedTool?.id === tool.id" class="active-dot"></span
        ></a>
      </nav>
      <div class="sidebar-bottom">
        <div class="private-note">
          <LockKeyhole class="size-4" /><strong>{{ t("app.localShort") }}</strong>
          <p>{{ t("app.privacy") }}</p>
        </div>
        <button class="nav-item" @click="openSettings">
          <Settings2 /><span>{{ t("nav.settings") }}</span></button
        ><a
          class="source-link"
          href="https://github.com/H4M4CHi-ttr/army-knife"
          target="_blank"
          rel="noopener noreferrer"
          ><CodeXml class="size-4" />{{ t("nav.source") }}<ArrowUpRight class="size-3.5"
        /></a>
      </div>
    </aside>
    <div class="main-shell">
      <header class="topbar">
        <Button
          variant="ghost"
          size="icon"
          class="mobile-menu"
          :aria-label="t('nav.menu')"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
          ><Menu class="size-5"
        /></Button>
        <div class="search-wrap">
          <Search class="search-icon" /><input
            ref="searchInput"
            v-model="query"
            class="global-search"
            :placeholder="t('app.search')"
            :aria-label="t('app.searchLabel')"
            aria-keyshortcuts="Control+K Meta+K"
            autocomplete="off"
            spellcheck="false"
            :maxlength="150"
            @keydown.enter="query.trim() && matches[0] && chooseTool(matches[0].id)"
          /><kbd>⌘ / Ctrl K</kbd>
          <div v-if="query && selectedTool" class="search-results">
            <p v-if="preferences.searchMode !== 'lexical'" class="hint" role="status">{{ t(`search.status.${classifierStatus}`) }}</p>
            <a v-for="tool in matches" :key="tool.id" :href="`#/tool/${tool.id}`"
              ><ToolIcon :id="tool.id" />{{ t(`tool.${tool.id}.name`) }}<ArrowUpRight
            /></a>
            <p v-if="!matches.length" class="hint">{{ t("states.noMatches") }}</p>
          </div>
        </div>
        <div class="topbar-actions">
          <span class="local-badge"><span></span>{{ t("app.localShort") }}</span
          ><Button
            variant="ghost"
            size="icon"
            :aria-label="t('settings.appearance')"
            @click="toggleTheme"
            ><Sun class="theme-light-icon size-4" /><Moon class="theme-dark-icon size-4" /></Button
          ><Button
            ref="settingsButton"
            variant="ghost"
            size="sm"
            :aria-label="t('nav.settings')"
            data-testid="settings-button"
            @click="openSettings"
            ><Settings2 class="size-4" /><span class="header-language">{{
              languageNames[preferences.locale]
            }}</span></Button
          >
        </div>
      </header>
      <main id="main-content" class="workspace" tabindex="-1">
        <template v-if="!selectedTool">
          <section class="hero">
            <div class="hero-copy">
              <p class="eyebrow"><span></span>{{ t("app.eyebrow") }}</p>
              <h1 ref="heading" tabindex="-1">{{ libraryHeading }}</h1>
              <p>{{ favoritesOnly ? t("app.favoritesLead") : t("app.lead") }}</p>
              <div class="hero-meta">
                <span><ShieldCheck class="size-4" />{{ t("app.local") }}</span
                ><span class="meta-separator">/</span
                ><span>{{ t("app.enabled", { count: enabled.length }) }}</span>
              </div>
            </div>
            <div class="hero-mark" aria-hidden="true">
              <div class="mark-orbit"></div>
              <img :src="logo" alt="" /><span class="mark-code mark-code-one">{ }</span
              ><span class="mark-code mark-code-two">&lt;/&gt;</span
              ><span class="mark-label">LOCAL FIRST</span>
            </div>
          </section>
          <div class="collection-toolbar">
            <p v-if="preferences.searchMode !== 'lexical'" class="hint classifier-status" role="status" data-testid="classifier-status">{{ t(`search.status.${classifierStatus}`) }}</p>
            <h2>
              {{ t("app.collection") }}<span>{{ shown.length.toString().padStart(2, "0") }}</span>
            </h2>
            <Button variant="ghost" size="sm" @click="openSettings"
              ><SlidersHorizontal class="size-3.5" />{{ t("nav.settings") }}</Button
            >
          </div>
          <div class="category-pills">
            <button :class="{ current: activeCategory === 'all' }" @click="activeCategory = 'all'">
              {{ t("categories.all") }}</button
            ><button
              v-for="category in categories.filter((item) =>
                enabled.some((tool) => tool.category === item),
              )"
              :key="category"
              :class="{ current: activeCategory === category }"
              @click="activeCategory = category"
            >
              {{ t(`categories.${category}`) }}
            </button>
          </div>
          <div v-if="shown.length" class="tool-grid">
            <article v-for="tool in shown" :key="tool.id" class="tool-card">
              <a
                :href="`#/tool/${tool.id}`"
                :data-testid="`tool-card-${tool.id}`"
                class="tool-card-link"
                ><div class="card-top">
                  <span :class="['tool-icon', `icon-${tool.color}`]"
                    ><ToolIcon :id="tool.id" /></span
                  ><span v-if="tool.wasm" class="wasm-label">WASM</span>
                </div>
                <h3>{{ t(`tool.${tool.id}.name`) }}</h3>
                <p>{{ t(`tool.${tool.id}.description`) }}</p>
                <div class="card-footer">
                  <span>{{ t(`categories.${tool.category}`) }}</span
                  ><ArrowUpRight class="size-4" /></div></a
              ><button
                :class="['favorite-button', { favorited: preferences.favorites.includes(tool.id) }]"
                :data-testid="`favorite-${tool.id}`"
                :aria-pressed="preferences.favorites.includes(tool.id)"
                :aria-label="`${t(`tool.${tool.id}.name`)}: ${t(preferences.favorites.includes(tool.id) ? 'actions.unfavorite' : 'actions.favorite')}`"
                @click="favorite(tool.id)"
              >
                <Heart class="size-4" />
              </button>
            </article>
            <button
              v-if="!query && activeCategory === 'all' && !favoritesOnly"
              class="collection-card"
              @click="openSettings"
            >
              <span class="collection-card-icon"><SlidersHorizontal class="size-5" /></span
              ><strong>{{ t("app.complement") }}</strong>
              <p>{{ t("app.complementHint") }}</p>
              <span class="collection-card-link"
                >{{ t("nav.settings") }}<ChevronRight class="size-4"
              /></span>
            </button>
          </div>
          <div v-else class="library-empty">
            <Box class="size-9" />
            <h2>{{ t("app.empty") }}</h2>
            <p>{{ t("app.emptyHint") }}</p>
            <Button variant="outline" @click="openSettings">{{ t("nav.settings") }}</Button>
          </div>
          <div class="workspace-footnote">
            <ShieldCheck class="size-4" />
            <p>{{ t("app.privacy") }}</p>
          </div>
        </template>
        <template v-else>
          <button class="back-link" @click="home()">
            <ArrowLeft class="size-3.5" />{{ t("actions.back") }}
          </button>
          <div class="workbench-heading">
            <span :class="['tool-icon', `icon-${selectedTool.color}`]"
              ><ToolIcon :id="selectedTool.id"
            /></span>
            <div>
              <div class="workbench-title">
                <h1 ref="heading" tabindex="-1">{{ t(`tool.${selectedTool.id}.name`) }}</h1>
                <Badge v-if="selectedTool.wasm" variant="secondary">Rust / WASM</Badge>
              </div>
              <p>{{ t(`tool.${selectedTool.id}.description`) }}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="
                t(
                  preferences.favorites.includes(selectedTool.id)
                    ? 'actions.unfavorite'
                    : 'actions.favorite',
                )
              "
              :aria-pressed="preferences.favorites.includes(selectedTool.id)"
              @click="favorite(selectedTool.id)"
              ><Heart
                :class="[
                  'size-4',
                  { 'heart-filled': preferences.favorites.includes(selectedTool.id) },
                ]"
            /></Button>
          </div>
          <WasmTool
            v-if="
              selectedTool.id === 'csv' || selectedTool.id === 'logs' || selectedTool.id === 'sets'
            "
            :id="selectedTool.id"
            :key="selectedTool.id"
          />
          <JsonTool
            v-else-if="selectedTool.id === 'json-diff' || selectedTool.id === 'json-format'"
            :id="selectedTool.id"
            :key="selectedTool.id"
          />
          <CidrTool v-else-if="selectedTool.id === 'cidr'" key="cidr" />
          <UnicodeTool v-else-if="selectedTool.id === 'unicode'" key="unicode" />
          <ContrastTool v-else-if="selectedTool.id === 'contrast'" key="contrast" />
          <HarTool v-else-if="selectedTool.id === 'har'" key="har" />
          <EnvTool v-else-if="selectedTool.id === 'env'" key="env" />
          <UrlTool v-else-if="selectedTool.id === 'url'" key="url" />
          <ExplainTool v-else-if="selectedTool.id === 'explain'" key="explain" />
        </template>
        <p v-if="!status.available" class="notice" role="status">
          {{ t("settings.storageError") }}
        </p>
        <footer class="page-footer">
          <span>{{ t("app.footer") }}</span
          ><span class="font-mono">army-knife / v0.2.0</span>
        </footer>
      </main>
    </div>
  </div>
  <SettingsDialog
    v-model:open="settingsOpen"
    :font-error="fontError"
    @closed="restoreSettingsFocus"
  />
</template>
