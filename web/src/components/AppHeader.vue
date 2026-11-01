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
          Blue Archive <span>Logo Generator</span>
        </div>
        <div class="brand-sub">TACTICAL LOGISTICS // KIVOTOS D1</div>
      </div>
    </a>

    <div class="nav-links">
      <div class="sys-status-badge">
        <span class="sys-status-dot"></span>
        <span>ONLINE</span>
      </div>

      <div class="lang-pills" id="langPills">
        <span class="lang-globe-icon" title="Language / 语言切换">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </span>
        <button
          v-for="item in LANG_OPTIONS"
          :key="item.lang"
          type="button"
          class="lang-pill"
          :class="{ active: lang === item.lang }"
          :title="item.enName"
          @click="handleSelectLang(item.lang)"
        >
          {{ item.label }}
        </button>
      </div>

      <a href="/swagger" class="nav-btn nav-btn-primary" target="_blank">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>{{ t('nav-swagger') }}</span>
      </a>

      <a href="https://ba-logo.subrecovery.top/" class="nav-btn nav-btn-default" target="_blank" rel="noopener noreferrer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        <span>{{ t('nav-upstream') }}</span>
      </a>
    </div>
  </header>
</template>
