import type { SupportedLang } from '../types.ts';

export const DEFAULT_TEXT_PAIRS: Record<SupportedLang, { left: string; right: string }> = {
  zh: { left: '蔚蓝', right: '档案' },
  'zh-tw': { left: '蔚藍', right: '檔案' },
  en: { left: 'Blue', right: 'Archive' },
  ja: { left: 'ブルー', right: 'アーカイブ' },
  ko: { left: '블루', right: '아카이브' },
};

export function getDefaultTextPair(lang: SupportedLang) {
  return DEFAULT_TEXT_PAIRS[lang] ?? DEFAULT_TEXT_PAIRS.zh;
}

export function getTextPairAfterLanguageChange(
  current: { left: string; right: string },
  lang: SupportedLang,
) {
  const isDefaultPair = Object.values(DEFAULT_TEXT_PAIRS).some(
    (pair) => pair.left === current.left && pair.right === current.right,
  );
  return isDefaultPair ? getDefaultTextPair(lang) : null;
}
