import { computed, ref } from 'vue';
import { LOCALES } from '../locales/index.ts';
import type { SupportedLang } from '../types.ts';

const currentLang = ref<SupportedLang>('zh');

export function useI18n() {
  const t = (key: string): string => {
    const dict = LOCALES[currentLang.value] ?? LOCALES.zh;
    return dict[key] ?? LOCALES.zh[key] ?? key;
  };

  const setLang = (lang: SupportedLang) => {
    currentLang.value = lang;
  };

  return {
    lang: computed(() => currentLang.value),
    setLang,
    t,
  };
}
