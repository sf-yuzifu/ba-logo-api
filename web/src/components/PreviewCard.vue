<script setup lang="ts">
import { useI18n } from '../composables/useI18n.ts';
import type { ActivePreview, LogoFormState } from '../types.ts';

const props = defineProps<{
  state: LogoFormState;
  activePreview: ActivePreview;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'download'): void;
  (e: 'copyImage'): void;
  (e: 'copyMarkdown'): void;
  (e: 'copyApiUrl'): void;
  (e: 'resetAll'): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="card preview-card">
    <div class="card-header">
      <div class="card-title">{{ t('preview-title') }}</div>
      <div class="meta-bar">
        <div class="meta-badge">
          <span>{{ t('meta-size') }}</span>: <strong>{{ activePreview.width }} × {{ activePreview.height }}</strong>
        </div>
        <div class="meta-badge">
          <span>{{ t('meta-time') }}</span>: <strong>{{ activePreview.latencyMs }}ms</strong>
        </div>
      </div>
    </div>

    <!-- 画布视口 -->
    <div
      class="preview-canvas-box"
      id="previewBox"
      :class="{
        'transparent-grid': state.transparent,
        'dark-bg': state.dark && !state.transparent
      }"
    >
      <img
        v-if="activePreview.blobUrl"
        id="previewImg"
        class="preview-img"
        alt="Logo Preview"
        :src="activePreview.blobUrl"
      >
      <div class="preview-loading" id="previewLoading" :class="{ active: isLoading }">
        <div class="spinner"></div>
        <div>{{ t('preview-loading') }}</div>
      </div>
    </div>

    <!-- Base64 文本展示区 (仅在 format=base64 时显示) -->
    <div v-if="activePreview.snapshot.format === 'base64' && activePreview.base64Data" id="base64Box" style="display: block;">
      {{ activePreview.base64Data.dataUrl }}
    </div>

    <!-- 实时 API URL -->
    <div class="url-box-container">
      <div class="url-text" id="apiUrlText">{{ activePreview.url || '/api/logo' }}</div>
      <button
        type="button"
        class="copy-url-btn"
        id="btnCopyUrl"
        @click="emit('copyApiUrl')"
      >
        {{ t('copy-api') }}
      </button>
    </div>

    <!-- 动作按钮组 -->
    <div class="actions-grid">
      <button
        type="button"
        class="action-btn action-btn-primary"
        id="btnDownload"
        @click="emit('download')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>{{ t('btn-download') }}</span>
      </button>

      <button
        type="button"
        class="action-btn action-btn-copy"
        id="btnCopyImage"
        @click="emit('copyImage')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>{{ t('btn-copy-img') }}</span>
      </button>

      <button
        type="button"
        class="action-btn action-btn-secondary"
        id="btnCopyMarkdown"
        @click="emit('copyMarkdown')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>{{ t('btn-copy-md') }}</span>
      </button>

      <button
        type="button"
        class="action-btn action-btn-secondary"
        id="btnResetAll"
        @click="emit('resetAll')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
        <span>{{ t('btn-reset-all') }}</span>
      </button>
    </div>
  </div>
</template>
