<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '../composables/useI18n.ts';
import { useTheme } from '../composables/useTheme.ts';
import { LANG_OPTIONS } from '../locales/index.ts';
import type { SupportedLang } from '../types.ts';

const { lang, setLang, t } = useI18n();
const { themeMode, cycleTheme } = useTheme();

const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const currentLangOption = computed(() => {
  return LANG_OPTIONS.find((item) => item.lang === lang.value) || LANG_OPTIONS[0];
});

const themeTitle = computed(() => {
  if (themeMode.value === 'auto') return t('theme-tip-auto');
  if (themeMode.value === 'light') return t('theme-tip-light');
  return t('theme-tip-dark');
});

const themeLabel = computed(() => {
  if (themeMode.value === 'auto') return 'AUTO';
  if (themeMode.value === 'light') return 'LIGHT';
  return 'DARK';
});

const langShortCode = computed(() => {
  const map: Record<SupportedLang, string> = {
    zh: 'ZH',
    'zh-tw': 'TW',
    en: 'EN',
    ja: 'JA',
    ko: 'KO',
  };
  return map[lang.value] || lang.value.toUpperCase();
});

const handleSelectLang = (newLang: SupportedLang) => {
  setLang(newLang);
  isDropdownOpen.value = false;
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isDropdownOpen.value = false;
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <header>
    <a href="/" class="brand">
      <div class="brand-badge-container">
        <div class="brand-badge">
          <svg class="brand-badge-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
          </svg>
          <span>SCHALE</span>
        </div>
      </div>
      <div class="brand-text-group">
        <div class="brand-title">
          Blue Archive <span class="brand-title-sub">Logo Generator</span>
        </div>
        <div class="brand-sub">TACTICAL LOGISTICS // KIVOTOS D1</div>
      </div>
    </a>

    <div class="nav-links">
      <!-- 主题模式切换按钮 (跟随系统 / 亮色 / 暗色) -->
      <button
        type="button"
        class="theme-toggle-btn"
        :title="themeTitle"
        @click="cycleTheme"
        aria-label="Toggle Color Theme"
      >
        <!-- 自动 (Auto) -->
        <svg v-if="themeMode === 'auto'" class="theme-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor"></path>
        </svg>
        <!-- 浅色 (Light) -->
        <svg v-else-if="themeMode === 'light'" class="theme-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <!-- 暗色 (Dark) -->
        <svg v-else class="theme-icon theme-icon-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <span class="theme-label">{{ themeLabel }}</span>
      </button>

      <!-- 语言选择下拉菜单 -->
      <div class="lang-dropdown-container" ref="dropdownRef">
        <button
          type="button"
          class="lang-dropdown-trigger"
          :class="{ active: isDropdownOpen }"
          @click="toggleDropdown"
          aria-haspopup="listbox"
          :aria-expanded="isDropdownOpen"
        >
          <svg class="lang-globe-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span class="lang-trigger-label lang-label-full">{{ currentLangOption.label }}</span>
          <span class="lang-trigger-label lang-label-short">{{ langShortCode }}</span>
          <svg class="lang-chevron" :class="{ rotate: isDropdownOpen }" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <transition name="dropdown">
          <div v-if="isDropdownOpen" class="lang-dropdown-menu" role="listbox">
            <div class="dropdown-header-tag">// LANGUAGE SELECT</div>
            <button
              v-for="item in LANG_OPTIONS"
              :key="item.lang"
              type="button"
              class="lang-menu-item"
              :class="{ selected: lang === item.lang }"
              role="option"
              :aria-selected="lang === item.lang"
              @click="handleSelectLang(item.lang)"
            >
              <div class="menu-item-left">
                <span class="menu-item-label">{{ item.label }}</span>
                <span class="menu-item-sub">{{ item.subLabel }}</span>
              </div>
              <svg v-if="lang === item.lang" class="menu-item-check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </div>
        </transition>
      </div>

      <a href="/swagger" class="nav-btn nav-btn-primary" target="_blank" :title="t('nav-swagger')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span class="nav-btn-text">{{ t('nav-swagger') }}</span>
      </a>

      <a href="https://lab.nulla.top/ba-logo/" class="nav-btn nav-btn-default" target="_blank" rel="noopener noreferrer" :title="t('nav-upstream')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        <span class="nav-btn-text">{{ t('nav-upstream') }}</span>
      </a>
    </div>
  </header>
</template>
