import { computed, ref } from 'vue';
import { LOCALES } from '../locales/index.ts';
import type { SupportedLang } from '../types.ts';

const STORAGE_KEY = 'ba-ui-lang';

const getInitialLang = (): SupportedLang => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['zh', 'zh-tw', 'en', 'ja', 'ko'].includes(saved)) {
      return saved as SupportedLang;
    }
    const nav = navigator.language?.toLowerCase() || '';
    if (nav.startsWith('ko')) return 'ko';
    if (nav.startsWith('ja')) return 'ja';
    if (nav === 'zh-tw' || nav === 'zh-hk' || nav === 'zh-mo') return 'zh-tw';
    if (nav.startsWith('zh')) return 'zh';
    if (nav.startsWith('en')) return 'en';
  }
  return 'zh';
};

const applyLangToDOM = (lang: SupportedLang) => {
  if (typeof document === 'undefined') return;
  const langMap: Record<SupportedLang, string> = {
    zh: 'zh-CN',
    'zh-tw': 'zh-TW',
    en: 'en',
    ja: 'ja',
    ko: 'ko',
  };
  document.documentElement.setAttribute('lang', langMap[lang] || lang);
  document.title = LOCALES[lang]['app-title'] ?? LOCALES.zh['app-title'];
};

const initialLang = getInitialLang();
const currentLang = ref<SupportedLang>(initialLang);
if (typeof document !== 'undefined') {
  applyLangToDOM(initialLang);
}

export function useI18n() {
  const t = (key: string): string => {
    const dict = LOCALES[currentLang.value] ?? LOCALES.zh;
    return dict[key] ?? LOCALES.zh[key] ?? key;
  };

  const setLang = (lang: SupportedLang) => {
    currentLang.value = lang;
    applyLangToDOM(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {}
    }
  };

  return {
    lang: computed(() => currentLang.value),
    setLang,
    t,
  };
}
