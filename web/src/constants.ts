import type { ColorPreset, LogoFormState, OutputFormat } from './types.ts';

export const DEFAULT_STATE: Readonly<LogoFormState> = Object.freeze({
  left: '蔚蓝',
  right: '档案',
  subtitle: '',
  subtitleColor: '',
  subX: 0,
  subY: 0,
  accent: '#128AFA',
  textColor: '#2B2B2B',
  crossColor: '',
  haloColor: '',
  behind: false,
  x: -15,
  y: 0,
  wordGap: 0,
  scale: 2,
  format: 'png',
  transparent: false,
  dark: false,
  swap: false,
  padding: '2',
  center: true,
});

export const ACCENT_PRESETS: ColorPreset[] = [
  { color: '#128AFA', name: '官方经典蓝' },
  { color: '#FF5722', name: '阿里乌斯橙红' },
  { color: '#00E5FF', name: '千年数码青' },
  { color: '#9C27B0', name: '格黑娜暗紫' },
  { color: '#FFB300', name: '三一金色' },
];

export const TEXT_COLOR_PRESETS: ColorPreset[] = [
  { color: '#2B2B2B', name: '官方深灰黑' },
  { color: '#000000', name: '纯黑' },
  { color: '#FFFFFF', name: '纯白', borderColor: '#cbd5e1' },
  { color: '#4C5866', name: '石板灰' },
  { color: '#128AFA', name: '同色天蓝' },
];

export const SCALE_OPTIONS = [
  { value: 1, label: '1x (250p)' },
  { value: 2, label: '2x (500p)' },
  { value: 3, label: '3x (750p)' },
  { value: 4, label: '4x (1000p)' },
] as const;

export const FORMAT_OPTIONS: { format: OutputFormat; i18nKey: string }[] = [
  { format: 'png', i18nKey: 'format-png' },
  { format: 'webp', i18nKey: 'format-webp' },
  { format: 'svg', i18nKey: 'format-svg' },
  { format: 'jpeg', i18nKey: 'format-jpeg' },
  { format: 'base64', i18nKey: 'format-base64' },
];
