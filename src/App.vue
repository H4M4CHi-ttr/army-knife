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
import { getTool, tools, type Category, type ToolId } from "@/lib/catalog";
import type { QuickToolId } from "@/lib/tools/quick-converters";
import { settings } from "@/lib/preferences";
import { setFontLocale } from "@/lib/fonts";
import { legacyHashTool, legacyToolRedirect, localeHomePath, resolvePageRoute, toolPath } from "@/lib/routes";

const WasmTool = defineAsyncComponent(() => import("@/components/tools/WasmTool.vue"));
const JsonTool = defineAsyncComponent(() => import("@/components/tools/JsonTool.vue"));
const CidrTool = defineAsyncComponent(() => import("@/components/tools/CidrTool.vue"));
const UnicodeTool = defineAsyncComponent(() => import("@/components/tools/UnicodeTool.vue"));
const ContrastTool = defineAsyncComponent(() => import("@/components/tools/ContrastTool.vue"));
const HarTool = defineAsyncComponent(() => import("@/components/tools/HarTool.vue"));
const EnvTool = defineAsyncComponent(() => import("@/components/tools/EnvTool.vue"));
const UrlTool = defineAsyncComponent(() => import("@/components/tools/UrlTool.vue"));
const ExplainTool = defineAsyncComponent(() => import("@/components/tools/ExplainTool.vue"));
const ShortcutTool = defineAsyncComponent(() => import("@/components/tools/ShortcutTool.vue"));
const ChmodTool = defineAsyncComponent(() => import("@/components/tools/ChmodTool.vue"));
const Base64Tool = defineAsyncComponent(() => import("@/components/tools/Base64Tool.vue"));
const FiveTools = defineAsyncComponent(() => import("@/components/tools/FiveTools.vue"));
const OgTagsTool = defineAsyncComponent(() => import("@/components/tools/OgTagsTool.vue"));
const TextCodecTool = defineAsyncComponent(() => import("@/components/tools/TextCodecTool.vue"));
const DummyTextTool = defineAsyncComponent(() => import("@/components/tools/DummyTextTool.vue"));
const SpecificityTool = defineAsyncComponent(() => import("@/components/tools/SpecificityTool.vue"));
const FluidTypeTool = defineAsyncComponent(() => import("@/components/tools/FluidTypeTool.vue"));
const InspectorTool = defineAsyncComponent(() => import("@/components/tools/InspectorTool.vue"));
const BezierTool = defineAsyncComponent(() => import("@/components/tools/BezierTool.vue"));
const GradientTool = defineAsyncComponent(() => import("@/components/tools/GradientTool.vue"));
const PlaceholderTool = defineAsyncComponent(() => import("@/components/tools/PlaceholderTool.vue"));
const PathBatchTool = defineAsyncComponent(() => import("@/components/tools/PathBatchTool.vue"));
const PaletteTool = defineAsyncComponent(() => import("@/components/tools/PaletteTool.vue"));
const QuickTool = defineAsyncComponent(() => import("@/components/tools/QuickTool.vue"));
const FileInspectorTool = defineAsyncComponent(() => import("@/components/tools/FileInspectorTool.vue"));
const TextInspectorTool = defineAsyncComponent(() => import("@/components/tools/TextInspectorTool.vue"));
const { t, locale } = useI18n();
const { preferences, status } = settings;
const query = ref("");
const activeCategory = ref<Category | "all">("all");
const favoritesOnly = ref(false);
const mobileOpen = ref(false);
const settingsOpen = ref(false);
const fontError = ref(false);
const pageRoute = ref(resolvePageRoute(window.location.pathname, import.meta.env.BASE_URL));
let renderedPath = window.location.pathname;
let navigationSequence = 0;
const pageDocumentCache = new Map<string, Promise<Document | null>>();
if (pageRoute.value.kind !== "unknown") preferences.locale = pageRoute.value.locale;
const searchInput = ref<HTMLInputElement>();
const heading = ref<HTMLElement>();
const settingsButton = ref<InstanceType<typeof Button>>();
let settingsTrigger: HTMLElement | null = null;
let focusHeadingAfterSettingsClose = false;
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
const requestedTool = computed(() =>
  pageRoute.value.kind === "tool" ? getTool(pageRoute.value.toolId) : null,
);
const selectedTool = computed(() =>
  requestedTool.value && preferences.enabledTools.includes(requestedTool.value.id)
    ? requestedTool.value
    : null,
);
const homeHref = computed(() => localeHomePath(preferences.locale, import.meta.env.BASE_URL));
const guideHasHeading = computed(() => {
  const route = pageRoute.value;
  const guide = document.getElementById("page-guide");
  if (!guide || route.kind === "unknown" || guide.dataset.locale !== route.locale) return false;
  return route.kind === "tool"
    ? guide.dataset.tool === route.toolId
    : guide.dataset.page === "home";
});
const pageStates = {
  ja: {
    disabled: "このツールは設定で無効になっています",
    disabledHint: "説明は引き続き読めます。操作するには設定でこのツールを有効にしてください。",
    unknown: "ページが見つかりません",
    unknownHint: "ツール一覧から利用したいツールを選んでください。",
  },
  en: {
    disabled: "This tool is disabled in your settings",
    disabledHint: "You can still read the guide. Enable this tool in Settings to use it.",
    unknown: "Page not found",
    unknownHint: "Choose a tool from the tool collection.",
  },
  "zh-CN": {
    disabled: "此工具已在设置中停用",
    disabledHint: "您仍可阅读说明。请在设置中启用此工具后使用。",
    unknown: "找不到页面",
    unknownHint: "请从工具列表中选择所需的工具。",
  },
  "zh-TW": {
    disabled: "此工具已在設定中停用",
    disabledHint: "您仍可閱讀說明。請在設定中啟用此工具後使用。",
    unknown: "找不到頁面",
    unknownHint: "請從工具清單中選擇所需的工具。",
  },
  ko: {
    disabled: "설정에서 이 도구가 비활성화되어 있습니다",
    disabledHint: "설명은 계속 읽을 수 있습니다. 사용하려면 설정에서 이 도구를 활성화하세요.",
    unknown: "페이지를 찾을 수 없습니다",
    unknownHint: "도구 목록에서 사용할 도구를 선택하세요.",
  },
};
const pageState = computed(() => pageStates[preferences.locale]);
const matches = computed(() =>
  enabled.value.filter((tool) => {
    const haystack =
      `${t(`tool.${tool.id}.name`)} ${t(`tool.${tool.id}.description`)} ${tool.keywords}`.toLocaleLowerCase(
        locale.value,
      );
    return query.value
      .toLocaleLowerCase(locale.value)
      .trim()
      .split(/\s+/)
      .every((part) => haystack.includes(part));
  }),
);
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

function collectionHref(category: Category | "all" = "all", favorites = false) {
  return `${homeHref.value}${favorites ? "#favorites" : category === "all" ? "" : `#category-${category}`}`;
}
function applyCollectionHash() {
  if (pageRoute.value.kind !== "home") return;
  const category = window.location.hash.replace(/^#category-/, "");
  activeCategory.value = categories.includes(category as Category) ? (category as Category) : "all";
  favoritesOnly.value = window.location.hash === "#favorites";
  query.value = "";
  mobileOpen.value = false;
}
applyCollectionHash();
function chooseTool(id: ToolId) {
  query.value = "";
  mobileOpen.value = false;
  void navigateTo(new URL(toolHref(id), window.location.origin));
}
function favorite(id: ToolId) {
  preferences.favorites = preferences.favorites.includes(id)
    ? preferences.favorites.filter((value) => value !== id)
    : [...preferences.favorites, id];
}
function toolHref(id: ToolId) {
  return toolPath(preferences.locale, id, import.meta.env.BASE_URL);
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
  if (focusHeadingAfterSettingsClose) {
    focusHeadingAfterSettingsClose = false;
    void nextTick(() => heading.value?.focus({ preventScroll: true }));
    return;
  }
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
function pageDocumentMatches(
  page: Document,
  route: ReturnType<typeof resolvePageRoute>,
): boolean {
  const guide = page.getElementById("page-guide");
  if (
    route.kind === "unknown" ||
    !guide ||
    guide.dataset.locale !== route.locale ||
    !page.head.querySelector('link[rel="canonical"]') ||
    !page.head.querySelector('meta[name="description"]')
  )
    return false;
  return route.kind === "home"
    ? guide.dataset.page === "home"
    : guide.dataset.tool === route.toolId;
}

async function loadPageDocument(path: string): Promise<Document | null> {
  let pending = pageDocumentCache.get(path);
  if (!pending) {
    pending = fetch(path, { credentials: "omit" })
      .then(async (response) => {
        if (!response.ok || !response.headers.get("content-type")?.includes("text/html"))
          return null;
        return new DOMParser().parseFromString(await response.text(), "text/html");
      })
      .catch(() => null);
    pageDocumentCache.set(path, pending);
  }
  const page = await pending;
  if (!page) pageDocumentCache.delete(path);
  return page;
}

function applyPageDocument(page: Document): boolean {
  const guide = page.getElementById("page-guide");
  const description = page.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  const canonical = page.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!guide || !description || !canonical) return false;

  const currentGuide = document.getElementById("page-guide");
  if (currentGuide) currentGuide.replaceWith(guide.cloneNode(true));
  else document.body.append(guide.cloneNode(true));

  document.documentElement.lang = page.documentElement.lang;
  document.title = page.title;

  const currentDescription = document.head.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );
  if (currentDescription) currentDescription.content = description.content;
  else document.head.append(description.cloneNode(true));

  const currentCanonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (currentCanonical) currentCanonical.href = canonical.href;
  else document.head.append(canonical.cloneNode(true));

  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((link) => link.remove());
  page.head
    .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')
    .forEach((link) => document.head.append(link.cloneNode(true)));
  return true;
}

type NavigationHistoryMode = "push" | "replace" | "pop";

async function navigateTo(
  destination: URL,
  historyMode: NavigationHistoryMode = "push",
): Promise<void> {
  if (destination.origin !== window.location.origin || destination.search) return;

  const legacy = legacyToolRedirect(
    destination.hash,
    preferences.locale,
    import.meta.env.BASE_URL,
  );
  if (legacy) {
    const normalPath = new URL(legacy, window.location.origin);
    await navigateTo(normalPath, historyMode === "pop" ? "replace" : historyMode);
    return;
  }

  const route = resolvePageRoute(destination.pathname, import.meta.env.BASE_URL);
  if (route.kind === "unknown") return;
  if (historyMode === "push" && destination.href === window.location.href) {
    navigationSequence += 1;
    return;
  }

  const pathChanged = destination.pathname !== renderedPath;
  const sequence = ++navigationSequence;
  let page: Document | null = null;
  if (pathChanged) {
    page = await loadPageDocument(destination.pathname);
    if (sequence !== navigationSequence) return;
    if (!page || !pageDocumentMatches(page, route)) {
      pageDocumentCache.delete(destination.pathname);
      if (historyMode === "pop") window.location.reload();
      else window.location.assign(destination.href);
      return;
    }
  }
  if (sequence !== navigationSequence) return;

  if (historyMode === "push") window.history.pushState(null, "", destination.href);
  else if (historyMode === "replace") window.history.replaceState(null, "", destination.href);
  if (pathChanged && page && !applyPageDocument(page)) {
    if (historyMode === "pop") window.location.reload();
    else window.location.assign(destination.href);
    return;
  }

  if (pathChanged) {
    renderedPath = destination.pathname;
    if (settingsOpen.value) focusHeadingAfterSettingsClose = true;
    settingsOpen.value = false;
    if (historyMode !== "pop")
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
  pageRoute.value = route;
  preferences.locale = route.locale;
  query.value = "";
  mobileOpen.value = false;
  applyCollectionHash();
}

function onInternalLinkClick(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>("a[href]");
  if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

  const destination = new URL(link.href);
  if (destination.origin !== window.location.origin || destination.search) return;
  const samePath = destination.pathname === window.location.pathname;
  const collectionHash =
    destination.hash === "#favorites" || destination.hash.startsWith("#category-");
  const legacyHash = legacyHashTool(destination.hash);
  if (samePath && destination.hash && !collectionHash && !legacyHash) return;
  if (
    resolvePageRoute(destination.pathname, import.meta.env.BASE_URL).kind === "unknown" &&
    !legacyHash
  )
    return;

  event.preventDefault();
  void navigateTo(destination);
}

function onHash() {
  const destination = legacyToolRedirect(
    window.location.hash,
    preferences.locale,
    import.meta.env.BASE_URL,
  );
  if (destination) void navigateTo(new URL(destination, window.location.origin), "replace");
  else applyCollectionHash();
}

function onLocation() {
  const destination = new URL(window.location.href);
  const legacy = legacyToolRedirect(
    destination.hash,
    preferences.locale,
    import.meta.env.BASE_URL,
  );
  void navigateTo(
    legacy ? new URL(legacy, window.location.origin) : destination,
    legacy ? "replace" : "pop",
  );
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
watch(() => preferences.theme, applyTheme, { immediate: true });
watch(
  () => preferences.locale,
  (value, previous) => {
    locale.value = value;
    fontError.value = false;
    setFontLocale(value).catch(() => {
      if (preferences.locale === value) fontError.value = true;
    });
    if (previous && previous !== value && pageRoute.value.kind !== "unknown") {
      const destination =
        pageRoute.value.kind === "tool" ? toolHref(pageRoute.value.toolId) : homeHref.value;
      if (window.location.pathname !== destination)
        void navigateTo(new URL(destination, window.location.origin));
    }
  },
  { immediate: true },
);
watch(
  [requestedTool, locale],
  ([value]) => {
    document.title = value
      ? `${t(`tool.${value.id}.name`)} — Army Knife`
      : `Army Knife — ${t("app.tagline")}`;
  },
  { immediate: true },
);
watch([requestedTool, locale], async () => {
  await nextTick();
  heading.value?.focus({ preventScroll: true });
});
onMounted(() => {
  document.addEventListener("click", onInternalLinkClick);
  window.addEventListener("hashchange", onHash);
  window.addEventListener("popstate", onLocation);
  window.addEventListener("keydown", onKey);
  systemTheme.addEventListener("change", applyTheme);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onInternalLinkClick);
  window.removeEventListener("hashchange", onHash);
  window.removeEventListener("popstate", onLocation);
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
      <a class="brand" :href="homeHref"
        ><img :src="logo" alt="" width="37" height="37" />
        <div>
          <strong>army<span>knife</span><span class="brand-dot">.</span></strong
          ><span class="brand-sub">DEVELOPER WORKBENCH</span>
        </div></a
      >
      <nav :aria-label="t('nav.workspace')">
        <p class="nav-label">{{ t("nav.workspace") }}</p>
        <a
          :href="homeHref"
          :class="[
            'nav-item',
            { active: pageRoute.kind === 'home' && !favoritesOnly && activeCategory === 'all' },
          ]"
        >
          <LayoutGrid /><span>{{ t("nav.library") }}</span
          ><span class="nav-count">{{ enabled.length }}</span>
        </a>
        <a
          :href="collectionHref('all', true)"
          :class="['nav-item', { active: pageRoute.kind === 'home' && favoritesOnly }]"
        >
          <Heart /><span>{{ t("nav.favorites") }}</span
          ><span v-if="preferences.favorites.length" class="nav-count">{{
            enabled.filter((tool) => preferences.favorites.includes(tool.id)).length
          }}</span>
        </a>
        <p class="nav-label category-label">{{ t("nav.categories") }}</p>
        <a
          v-for="category in categories"
          :key="category"
          :href="collectionHref(category)"
          :class="[
            'nav-item category-item',
            { active: pageRoute.kind === 'home' && !favoritesOnly && activeCategory === category },
          ]"
        >
          <component :is="categoryIcons[category]" /><span>{{ t(`categories.${category}`) }}</span
          ><span class="category-count">{{
            enabled.filter((tool) => tool.category === category).length
          }}</span>
        </a>
        <div class="sidebar-divider"></div>
        <a
          v-for="tool in enabled"
          :key="tool.id"
          :href="toolHref(tool.id)"
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
            @keydown.enter="pageRoute.kind === 'tool' && matches[0] && chooseTool(matches[0].id)"
          /><kbd>⌘ / Ctrl K</kbd>
          <div v-if="query && pageRoute.kind === 'tool'" class="search-results">
            <a v-for="tool in matches" :key="tool.id" :href="toolHref(tool.id)"
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
        <template v-if="pageRoute.kind === 'home'">
          <section class="hero">
            <div class="hero-copy">
              <p class="eyebrow"><span></span>{{ t("app.eyebrow") }}</p>
              <component :is="guideHasHeading ? 'h2' : 'h1'" ref="heading" tabindex="-1">{{
                libraryHeading
              }}</component>
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
                :href="toolHref(tool.id)"
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
        <template v-else-if="requestedTool">
          <a class="back-link" :href="homeHref">
            <ArrowLeft class="size-3.5" />{{ t("actions.back") }}
          </a>
          <div class="workbench-heading">
            <span :class="['tool-icon', `icon-${requestedTool.color}`]"
              ><ToolIcon :id="requestedTool.id"
            /></span>
            <div>
              <div class="workbench-title">
                <component :is="guideHasHeading ? 'h2' : 'h1'" ref="heading" tabindex="-1">{{
                  t(`tool.${requestedTool.id}.name`)
                }}</component>
                <Badge v-if="requestedTool.wasm" variant="secondary">Rust / WASM</Badge>
              </div>
              <p>{{ t(`tool.${requestedTool.id}.description`) }}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="
                t(
                  preferences.favorites.includes(requestedTool.id)
                    ? 'actions.unfavorite'
                    : 'actions.favorite',
                )
              "
              :aria-pressed="preferences.favorites.includes(requestedTool.id)"
              @click="favorite(requestedTool.id)"
              ><Heart
                :class="[
                  'size-4',
                  { 'heart-filled': preferences.favorites.includes(requestedTool.id) },
                ]"
            /></Button>
          </div>
          <section v-if="!selectedTool" class="library-empty" data-testid="tool-disabled">
            <Box class="size-9" />
            <h2>{{ pageState.disabled }}</h2>
            <p>{{ pageState.disabledHint }}</p>
            <Button variant="outline" data-testid="disabled-settings" @click="openSettings">{{
              t("nav.settings")
            }}</Button>
          </section>
          <template v-else>
            <WasmTool
              v-if="
                selectedTool.id === 'csv' ||
                selectedTool.id === 'logs' ||
                selectedTool.id === 'sets'
              "
              :id="selectedTool.id"
              :key="`${selectedTool.id}:${preferences.locale}`"
            />
            <JsonTool
              v-else-if="selectedTool.id === 'json-diff' || selectedTool.id === 'json-format'"
              :id="selectedTool.id"
              :key="`${selectedTool.id}:${preferences.locale}`"
            />
            <CidrTool v-else-if="selectedTool.id === 'cidr'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <UnicodeTool v-else-if="selectedTool.id === 'unicode'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <ContrastTool v-else-if="selectedTool.id === 'contrast'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <HarTool v-else-if="selectedTool.id === 'har'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <EnvTool v-else-if="selectedTool.id === 'env'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <UrlTool v-else-if="selectedTool.id === 'url'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <ExplainTool v-else-if="selectedTool.id === 'explain'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <ShortcutTool v-else-if="selectedTool.id === 'shortcuts'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <ChmodTool v-else-if="selectedTool.id === 'chmod'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <Base64Tool v-else-if="selectedTool.id === 'base64'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <TextCodecTool
              v-else-if="selectedTool.id === 'html-entities' || selectedTool.id === 'url-encode'"
              :kind="selectedTool.id" :key="`${selectedTool.id}:${preferences.locale}`"
            />
            <DummyTextTool v-else-if="selectedTool.id === 'dummy-text'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <SpecificityTool v-else-if="selectedTool.id === 'css-specificity'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <FluidTypeTool v-else-if="selectedTool.id === 'fluid-type'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <InspectorTool
              v-else-if="selectedTool.id === 'text-stats' || selectedTool.id === 'string-literals' || selectedTool.id === 'http-reference' || selectedTool.id === 'git-conflicts' || selectedTool.id === 'color-converter'"
              :kind="selectedTool.id" :key="`${selectedTool.id}:${preferences.locale}`"
            />
            <OgTagsTool v-else-if="selectedTool.id === 'og-tags'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <FiveTools
              v-else-if="selectedTool.id === 'timestamp' || selectedTool.id === 'jwt' || selectedTool.id === 'ids' || selectedTool.id === 'password'"
              :id="selectedTool.id"
              :key="selectedTool.id + ':' + preferences.locale"
            />
            <BezierTool v-else-if="selectedTool.id === 'cubic-bezier'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <GradientTool v-else-if="selectedTool.id === 'css-gradient'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <PlaceholderTool v-else-if="selectedTool.id === 'svg-placeholder'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <PathBatchTool v-else-if="selectedTool.id === 'path-batch'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <PaletteTool v-else-if="selectedTool.id === 'color-palette'" :key="`${selectedTool.id}:${preferences.locale}`" />
            <QuickTool
              v-else-if="['data-units', 'css-units', 'unicode-normalize', 'slug', 'unicode-escape'].includes(selectedTool.id)"
              :id="selectedTool.id as QuickToolId"
              :key="`${selectedTool.id}:${preferences.locale}`"
            />
            <FileInspectorTool
              v-else-if="selectedTool.id === 'sri' || selectedTool.id === 'encoding' || selectedTool.id === 'magic'"
              :kind="selectedTool.id" :key="`${selectedTool.id}:${preferences.locale}`"
            />
            <TextInspectorTool
              v-else-if="selectedTool.id === 'user-agent' || selectedTool.id === 'set-cookie'"
              :kind="selectedTool.id" :key="`${selectedTool.id}:${preferences.locale}`"
            />
          </template>
        </template>
        <section v-else class="library-empty" data-testid="page-not-found">
          <Box class="size-9" />
          <h1 ref="heading" tabindex="-1">{{ pageState.unknown }}</h1>
          <p>{{ pageState.unknownHint }}</p>
          <a class="back-link" :href="homeHref">{{ t("actions.back") }}</a>
        </section>
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
