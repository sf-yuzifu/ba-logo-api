<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import AppHeader from './components/AppHeader.vue';
import ControlPanel from './components/ControlPanel.vue';
import PreviewCard from './components/PreviewCard.vue';
import { useI18n } from './composables/useI18n.ts';
import { useLogoPreview } from './composables/useLogoPreview.ts';
import { useTheme } from './composables/useTheme.ts';
import { DEFAULT_STATE } from './constants.ts';
import type { LogoFormState, SupportedLang } from './types.ts';

const { lang, t } = useI18n();
const { initTheme } = useTheme();

const DEFAULT_TEXT_PAIRS: Record<SupportedLang, { left: string; right: string }> = {
  zh: { left: '蔚蓝', right: '档案' },
  'zh-tw': { left: '蔚藍', right: '檔案' },
  en: { left: 'Blue', right: 'Archive' },
  ja: { left: 'ブルー', right: 'アーカイブ' },
  ko: { left: '블루', right: '아카이브' },
};

const initialPair = DEFAULT_TEXT_PAIRS[lang.value] ?? DEFAULT_TEXT_PAIRS.zh;

const state = reactive<LogoFormState>({
  ...DEFAULT_STATE,
  left: initialPair.left,
  right: initialPair.right,
});

watch(lang, (newLang) => {
  const isDefaultPair = Object.values(DEFAULT_TEXT_PAIRS).some(
    (p) => p.left === state.left && p.right === state.right,
  );
  if (isDefaultPair) {
    const nextPair = DEFAULT_TEXT_PAIRS[newLang];
    if (nextPair) {
      state.left = nextPair.left;
      state.right = nextPair.right;
      triggerPreview();
    }
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
  const currentPair = DEFAULT_TEXT_PAIRS[lang.value] ?? DEFAULT_TEXT_PAIRS.zh;
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

onMounted(() => {
  initTheme();
  triggerPreview();
});
</script>

<template>
  <AppHeader />
  <main>
    <ControlPanel :state="state" @change="handleChange" />
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
  <div id="toast" :class="{ show: toastVisible }">
    {{ toastMessage }}
  </div>
</template>
