<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import AppHeader from './components/AppHeader.vue';
import ControlPanel from './components/ControlPanel.vue';
import PreviewCard from './components/PreviewCard.vue';
import { useI18n } from './composables/useI18n.ts';
import { useLogoPreview } from './composables/useLogoPreview.ts';
import { DEFAULT_STATE } from './constants.ts';
import type { LogoFormState } from './types.ts';

const { t } = useI18n();

const state = reactive<LogoFormState>({
  ...DEFAULT_STATE,
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
  Object.assign(state, DEFAULT_STATE);
  triggerPreview();
  showToast(t('toast-reset'));
};

const handleChange = () => {
  triggerPreview();
};

onMounted(() => {
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
