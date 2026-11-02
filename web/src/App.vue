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
  <div id="toast" :class="{ show: toastVisible }">
    {{ toastMessage }}
  </div>
</template>
