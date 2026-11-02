<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import AppHeader from './components/AppHeader.vue';
import ControlPanel from './components/ControlPanel.vue';
import PreviewCard from './components/PreviewCard.vue';
import { useI18n } from './composables/useI18n.ts';
import { useLogoPreview } from './composables/useLogoPreview.ts';
import { useTheme } from './composables/useTheme.ts';
import { getDefaultTextPair, getTextPairOnLanguageChange } from './constants/textPairs.ts';
import { DEFAULT_STATE } from './constants.ts';
import type { LogoFormState } from './types.ts';

const { lang, t } = useI18n();
const { initTheme } = useTheme();

const initialPair = getDefaultTextPair(lang.value);

const state = reactive<LogoFormState>({
  ...DEFAULT_STATE,
  left: initialPair.left,
  right: initialPair.right,
});

const titleEditedByUser = ref(false);

watch(lang, (newLang) => {
  const nextPair = getTextPairOnLanguageChange(titleEditedByUser.value, newLang);
  if (nextPair) {
    state.left = nextPair.left;
    state.right = nextPair.right;
    triggerPreview();
  }
});

const {
  isLoading,
  toastMessage,
  toastVisible,
  activePreview,
  showToast,
  triggerPreview,
  copyApiUrl,
  copyMarkdown,
  downloadImage,
  copyImage,
} = useLogoPreview(state);

const handleResetAll = () => {
  const currentPair = getDefaultTextPair(lang.value);
  titleEditedByUser.value = false;
  Object.assign(state, DEFAULT_STATE, {
    left: currentPair.left,
    right: currentPair.right,
  });
  triggerPreview();
  showToast(t('toast-reset'));
};

const handleChange = () => {
  triggerPreview();
};

const handleTitleInput = () => {
  titleEditedByUser.value = true;
  triggerPreview();
};

const handleTitleReset = () => {
  titleEditedByUser.value = false;
  triggerPreview();
};

onMounted(() => {
  initTheme();
  triggerPreview();
});
</script>

<template>
  <AppHeader />
  <main>
    <ControlPanel
      :state="state"
      @change="handleChange"
      @title-input="handleTitleInput"
      @title-reset="handleTitleReset"
    />
    <PreviewCard
      :state="state"
      :active-preview="activePreview"
      :is-loading="isLoading"
      @download="downloadImage"
      @copy-image="copyImage"
      @copy-markdown="copyMarkdown"
      @copy-api-url="copyApiUrl"
      @reset-all="handleResetAll"
    />
  </main>

  <!-- 移动端底部战术吸底浮动操作栏 -->
  <aside class="mobile-floating-bar" aria-label="Mobile Actions">
    <button
      type="button"
      class="floating-btn floating-btn-primary"
      @click="downloadImage"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>{{ t('btn-download') }}</span>
    </button>
    <button
      type="button"
      class="floating-btn floating-btn-secondary"
      @click="copyImage"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>{{ t('btn-copy-img') }}</span>
    </button>
    <button
      type="button"
      class="floating-btn floating-btn-icon"
      :title="t('btn-copy-md')"
      @click="copyMarkdown"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    </button>
    <button
      type="button"
      class="floating-btn floating-btn-icon"
      :title="t('btn-reset-all')"
      @click="handleResetAll"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
      </svg>
    </button>
  </aside>

  <div id="toast" :class="{ show: toastVisible }">
    {{ toastMessage }}
  </div>
</template>
