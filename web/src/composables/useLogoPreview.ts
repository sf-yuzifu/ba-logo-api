import { onUnmounted, ref } from 'vue';
import type { ActivePreview, LogoFormState } from '../types.ts';
import { buildLogoUrl } from '../utils/url.ts';
import { useI18n } from './useI18n.ts';

export function useLogoPreview(state: LogoFormState) {
  const { t } = useI18n();

  const isLoading = ref(false);
  const toastMessage = ref('');
  const toastVisible = ref(false);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  const activePreview = ref<ActivePreview>({
    url: '',
    snapshot: { ...state },
    blobUrl: null,
    blob: null,
    base64Data: null,
    width: '--',
    height: '--',
    latencyMs: '--',
    error: null,
  });

  let currentRequestId = 0;
  let abortController: AbortController | null = null;
  const auxiliaryControllers = new Set<AbortController>();
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const showToast = (message: string) => {
    toastMessage.value = message;
    toastVisible.value = true;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastVisible.value = false;
    }, 2200);
  };

  const triggerPreview = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      executePreview();
    }, 80);
  };

  const executePreview = async () => {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const requestId = ++currentRequestId;
    const snapshot = { ...state };
    const requestUrl = buildLogoUrl(snapshot);

    isLoading.value = true;
    const startTime = performance.now();

    try {
      const response = await fetch(requestUrl, {
        signal: abortController.signal,
      });
      const latencyMs = (performance.now() - startTime).toFixed(1);

      if (requestId !== currentRequestId) {
        return;
      }

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        if (requestId !== currentRequestId) return;
        const summary =
          (errorJson as Record<string, string>).summary ||
          (errorJson as Record<string, string>).message ||
          response.statusText;
        activePreview.value = {
          ...activePreview.value,
          url: requestUrl,
          snapshot,
          width: `Err ${response.status}`,
          height: '--',
          latencyMs,
          error: summary,
        };
        isLoading.value = false;
        showToast(`${t('toast-validation-failed')}: ${summary}`);
        return;
      }

      if (snapshot.format === 'base64') {
        const json = await response.json();
        if (requestId !== currentRequestId) return;
        const data = json.data;

        // 清理旧的 Blob URL
        if (activePreview.value.blobUrl && !activePreview.value.base64Data) {
          URL.revokeObjectURL(activePreview.value.blobUrl);
        }

        activePreview.value = {
          url: requestUrl,
          snapshot,
          blobUrl: data.dataUrl,
          blob: null,
          base64Data: data,
          width: data.width,
          height: data.height,
          latencyMs,
          error: null,
        };
        isLoading.value = false;
        return;
      }

      const blob = await response.blob();
      if (requestId !== currentRequestId) {
        return;
      }

      if (activePreview.value.blobUrl && !activePreview.value.base64Data) {
        URL.revokeObjectURL(activePreview.value.blobUrl);
      }
      const newBlobUrl = URL.createObjectURL(blob);

      // 读取图片自然尺寸
      const img = new Image();
      img.onload = () => {
        if (requestId === currentRequestId) {
          activePreview.value.width = img.naturalWidth;
          activePreview.value.height = img.naturalHeight;
        }
      };
      img.onerror = () => {
        if (requestId === currentRequestId) {
          activePreview.value.width = t('load-failed');
          activePreview.value.height = '--';
        }
      };
      img.src = newBlobUrl;

      activePreview.value = {
        url: requestUrl,
        snapshot,
        blobUrl: newBlobUrl,
        blob,
        base64Data: null,
        width: '--',
        height: '--',
        latencyMs,
        error: null,
      };
      isLoading.value = false;
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return;
      }
      if (requestId === currentRequestId) {
        isLoading.value = false;
        activePreview.value.latencyMs = '--';
        activePreview.value.width = t('load-failed');
        activePreview.value.height = '--';
        showToast(t('toast-network-error'));
      }
    }
  };

  const copyApiUrl = async () => {
    const fullUrl = buildLogoUrl(state, window.location.origin);
    try {
      await navigator.clipboard.writeText(fullUrl);
      showToast(t('toast-copied'));
    } catch {
      showToast(t('toast-copy-failed'));
    }
  };

  const copyMarkdown = async () => {
    const fullUrl = buildLogoUrl(state, window.location.origin);
    const title = (state.left || 'Blue') + (state.right || 'Archive');
    const md = `![${title} Logo](${fullUrl})`;
    try {
      await navigator.clipboard.writeText(md);
      showToast(t('toast-copied'));
    } catch {
      showToast(t('toast-copy-failed'));
    }
  };

  const downloadImage = () => {
    const preview = activePreview.value;
    if (preview.snapshot.format === 'base64') {
      if (preview.base64Data?.base64) {
        navigator.clipboard
          .writeText(preview.base64Data.base64)
          .then(() => showToast(t('toast-copied')))
          .catch(() => showToast(t('toast-copy-failed')));
      }
      return;
    }

    if (!preview.blobUrl) return;

    const link = document.createElement('a');
    link.href = preview.blobUrl;
    const title = (preview.snapshot.left || 'Blue') + (preview.snapshot.right || 'Archive');
    const ext =
      preview.snapshot.format === 'apng' ? 'png' : preview.snapshot.format.replace('-animated', '');
    link.download = `${title}_logo.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t('toast-download'));
  };

  const copyImage = async () => {
    try {
      let pngBlob: Blob;
      const preview = activePreview.value;
      if (preview.snapshot.format === 'png' && preview.blob) {
        pngBlob = preview.blob;
      } else {
        const pngUrl = buildLogoUrl({ ...preview.snapshot, format: 'png' });
        const controller = new AbortController();
        auxiliaryControllers.add(controller);
        let res: Response;
        try {
          res = await fetch(pngUrl, { signal: controller.signal });
        } finally {
          auxiliaryControllers.delete(controller);
        }
        pngBlob = await res.blob();
      }

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      showToast(t('toast-img-copied'));
    } catch {
      showToast(t('toast-copy-failed'));
    }
  };

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (toastTimer) clearTimeout(toastTimer);
    currentRequestId++;
    if (abortController) abortController.abort();
    for (const controller of auxiliaryControllers) controller.abort();
    auxiliaryControllers.clear();
    if (activePreview.value.blobUrl && !activePreview.value.base64Data) {
      URL.revokeObjectURL(activePreview.value.blobUrl);
    }
  });

  return {
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
  };
}
