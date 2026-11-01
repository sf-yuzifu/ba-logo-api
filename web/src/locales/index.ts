import type { SupportedLang } from '../types.ts';
import en from './en.ts';
import ja from './ja.ts';
import zh from './zh.ts';
import zhTw from './zh-tw.ts';

export const LOCALES: Record<SupportedLang, Record<string, string>> = {
  zh,
  'zh-tw': zhTw,
  en,
  ja,
};

export const LANG_OPTIONS: { lang: SupportedLang; label: string }[] = [
  { lang: 'zh', label: '简中' },
  { lang: 'zh-tw', label: '繁中' },
  { lang: 'en', label: 'EN' },
  { lang: 'ja', label: '日本語' },
];
