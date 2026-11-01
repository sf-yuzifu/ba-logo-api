<script setup lang="ts">
import { useI18n } from '../composables/useI18n.ts';
import { LANG_OPTIONS } from '../locales/index.ts';
import type { SupportedLang } from '../types.ts';

const { lang, setLang, t } = useI18n();

const handleSelectLang = (newLang: SupportedLang) => {
  setLang(newLang);
};
</script>

<template>
  <header>
    <a href="/" class="brand">
      <div class="brand-badge">SCHALE</div>
      <div class="brand-title">
        Blue Archive <span>Logo Generator</span>
      </div>
    </a>
    <div class="nav-links">
      <div class="lang-pills" id="langPills">
        <button
          v-for="item in LANG_OPTIONS"
          :key="item.lang"
          type="button"
          class="lang-pill"
          :class="{ active: lang === item.lang }"
          @click="handleSelectLang(item.lang)"
        >
          {{ item.label }}
        </button>
      </div>
      <a href="/swagger" class="nav-btn nav-btn-primary" target="_blank">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>{{ t('nav-swagger') }}</span>
      </a>
      <a href="https://ba-logo.subrecovery.top/" class="nav-btn nav-btn-default" target="_blank" rel="noopener noreferrer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        <span>{{ t('nav-upstream') }}</span>
      </a>
    </div>
  </header>
</template>
