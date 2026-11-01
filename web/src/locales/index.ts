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

export const LANG_OPTIONS: { lang: SupportedLang; label: string; subLabel: string }[] = [
  { lang: 'zh', label: '简体中文', subLabel: 'Simplified Chinese' },
  { lang: 'zh-tw', label: '繁體中文', subLabel: 'Traditional Chinese' },
  { lang: 'en', label: 'English', subLabel: 'English' },
  { lang: 'ja', label: '日本語', subLabel: 'Japanese' },
];
