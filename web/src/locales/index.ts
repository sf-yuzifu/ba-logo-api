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

export const LANG_OPTIONS: { lang: SupportedLang; label: string; enName: string }[] = [
  { lang: 'zh', label: '简中', enName: 'Simplified Chinese' },
  { lang: 'zh-tw', label: '繁中', enName: 'Traditional Chinese' },
  { lang: 'en', label: 'English', enName: 'English' },
  { lang: 'ja', label: '日本語', enName: 'Japanese' },
];
