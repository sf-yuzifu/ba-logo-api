import { describe, expect, it } from 'bun:test';
import { DEFAULT_STATE } from '../web/src/constants.ts';
import { LOCALES } from '../web/src/locales/index.ts';
import type { LogoFormState } from '../web/src/types.ts';
import { buildLogoUrl } from '../web/src/utils/url.ts';

describe('WebUI Frontend Architecture & Logic Tests', () => {
  it('DEFAULT_STATE 应当包含完整的初始控制台字段且不可变', () => {
    expect(DEFAULT_STATE.endpoint).toBe('api');
    expect(DEFAULT_STATE.left).toBe('蔚蓝');
    expect(DEFAULT_STATE.right).toBe('档案');
    expect(DEFAULT_STATE.accent).toBe('#128AFA');
    expect(DEFAULT_STATE.textColor).toBe('#2B2B2B');
    expect(DEFAULT_STATE.scale).toBe(2);
    expect(DEFAULT_STATE.padding).toBe('2');
    expect(DEFAULT_STATE.format).toBe('png');
    expect(DEFAULT_STATE.transparent).toBe(false);
    expect(DEFAULT_STATE.dark).toBe(false);
    expect(DEFAULT_STATE.swap).toBe(false);
    expect(DEFAULT_STATE.behind).toBe(false);

    expect(Object.isFrozen(DEFAULT_STATE)).toBe(true);
  });

  it('buildLogoUrl 应当正确序列化 RESTful /api/logo 查询参数', () => {
    const state: LogoFormState = {
      ...DEFAULT_STATE,
      left: 'Blue',
      right: 'Archive',
      subtitle: 'ブルーアーカイブ',
      subtitleColor: '#4A90E2',
      subX: 10,
      subY: -5,
      accent: '#FF5722',
      textColor: '#333333',
      crossColor: '#FFD700',
      haloColor: '#9C27B0',
      behind: true,
      x: 5,
      y: -10,
      wordGap: 25,
      scale: 3,
      format: 'svg',
      transparent: true,
      dark: true,
      swap: true,
      padding: '10 20',
      center: true, // transparent=true 且 center=true 时应当显式携带 center=true
    };

    const url = buildLogoUrl(state);
    expect(url.startsWith('/api/logo?')).toBe(true);

    const parsed = new URL(`http://localhost${url}`);
    expect(parsed.searchParams.get('left')).toBe('Blue');
    expect(parsed.searchParams.get('right')).toBe('Archive');
    expect(parsed.searchParams.get('subtitle')).toBe('ブルーアーカイブ');
    expect(parsed.searchParams.get('subtitleColor')).toBe('4A90E2');
    expect(parsed.searchParams.get('subX')).toBe('10');
    expect(parsed.searchParams.get('subY')).toBe('-5');
    expect(parsed.searchParams.get('accent')).toBe('FF5722');
    expect(parsed.searchParams.get('textColor')).toBe('333333');
    expect(parsed.searchParams.get('crossColor')).toBe('FFD700');
    expect(parsed.searchParams.get('haloColor')).toBe('9C27B0');
    expect(parsed.searchParams.get('motifsBehindText')).toBe('true');
    expect(parsed.searchParams.get('offsetX')).toBe('5');
    expect(parsed.searchParams.get('offsetY')).toBe('-10');
    expect(parsed.searchParams.get('wordGap')).toBe('25');
    expect(parsed.searchParams.get('scale')).toBe('3');
    expect(parsed.searchParams.get('format')).toBe('svg');
    expect(parsed.searchParams.get('transparent')).toBe('true');
    expect(parsed.searchParams.get('darkMode')).toBe('true');
    expect(parsed.searchParams.get('swapColors')).toBe('true');
    expect(parsed.searchParams.get('padding')).toBe('10 20');
    expect(parsed.searchParams.get('center')).toBe('true');
  });

  it('buildLogoUrl 应当正确序列化旧版兼容 /balogo 查询参数并补齐 subColor', () => {
    const state: LogoFormState = {
      ...DEFAULT_STATE,
      endpoint: 'balogo',
      left: '碧蓝',
      right: '航线',
      subtitle: 'アズールレーン',
      subtitleColor: '#123456',
      subX: 15,
      subY: 8,
      accent: '#FF9800',
      crossColor: '#E91E63',
      haloColor: '#3F51B5',
      behind: true,
      x: -20,
      y: 12,
      wordGap: 18,
      scale: 1,
      format: 'webp',
      transparent: true,
      dark: true,
      swap: true,
      padding: '5',
    };

    const url = buildLogoUrl(state);
    expect(url.startsWith('/balogo?')).toBe(true);

    const parsed = new URL(`http://localhost${url}`);
    expect(parsed.searchParams.get('l')).toBe('碧蓝');
    expect(parsed.searchParams.get('r')).toBe('航线');
    expect(parsed.searchParams.get('sub')).toBe('アズールレーン');
    expect(parsed.searchParams.get('subColor')).toBe('123456');
    expect(parsed.searchParams.get('subX')).toBe('15');
    expect(parsed.searchParams.get('subY')).toBe('8');
    expect(parsed.searchParams.get('accent')).toBe('FF9800');
    expect(parsed.searchParams.get('cross')).toBe('E91E63');
    expect(parsed.searchParams.get('halo')).toBe('3F51B5');
    expect(parsed.searchParams.get('behind')).toBe('true');
    expect(parsed.searchParams.get('x')).toBe('-20');
    expect(parsed.searchParams.get('y')).toBe('12');
    expect(parsed.searchParams.get('gap')).toBe('18');
    expect(parsed.searchParams.get('scale')).toBeNull(); // scale=1 时省略默认值
    expect(parsed.searchParams.get('format')).toBe('webp');
    expect(parsed.searchParams.get('tp')).toBe('true');
    expect(parsed.searchParams.get('dark')).toBe('true');
    expect(parsed.searchParams.get('swap')).toBe('true');
    expect(parsed.searchParams.get('padding')).toBe('5');
  });

  it('i18n 词典应当在所有支持的语言中具备 100% 键覆盖率', () => {
    const zhKeys = Object.keys(LOCALES.zh).sort();
    expect(zhKeys.length).toBeGreaterThan(30);

    const targetLangs = ['zh-tw', 'en', 'ja'] as const;
    for (const lang of targetLangs) {
      const dict = LOCALES[lang];
      expect(dict).toBeDefined();

      for (const key of zhKeys) {
        const value = dict[key];
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
