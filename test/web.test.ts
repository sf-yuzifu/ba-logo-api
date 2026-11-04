import { describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { getDefaultTextPair, getTextPairOnLanguageChange } from '../web/src/constants/textPairs.ts';
import { DEFAULT_STATE } from '../web/src/constants.ts';
import { LOCALES } from '../web/src/locales/index.ts';
import type { LogoFormState } from '../web/src/types.ts';
import { buildLogoUrl } from '../web/src/utils/url.ts';
import { createPreviewHarness } from './helpers/useLogoPreviewHarness.ts';

describe('WebUI Frontend Architecture & Logic Tests', () => {
  it('默认标题随语言切换；用户编辑后不因语言切换而被覆盖', () => {
    expect(getDefaultTextPair('ko')).toEqual({ left: '블루', right: '아카이브' });
    expect(getTextPairOnLanguageChange(false, 'ja')).toEqual({
      left: 'ブルー',
      right: 'アーカイブ',
    });
    // 即使用户输入恰好等于另一语言的默认标题，也视为自定义输入，不应再被自动替换。
    expect(getTextPairOnLanguageChange(true, 'ko')).toBeNull();
    expect(getDefaultTextPair('en')).toEqual({ left: 'Blue', right: 'Archive' });
  });

  it('DEFAULT_STATE 应当包含完整的初始控制台字段且不可变', () => {
    expect(DEFAULT_STATE.left).toBe('蔚蓝');
    expect(DEFAULT_STATE.right).toBe('档案');
    expect(DEFAULT_STATE.accent).toBe('#128AFA');
    expect(DEFAULT_STATE.textColor).toBe('#2B2B2B');
    expect(DEFAULT_STATE.scale).toBe(2);
    expect(DEFAULT_STATE.subtitleFontSize).toBe(24);
    expect(DEFAULT_STATE.subY).toBe(4);
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
      subtitleFontSize: 42,
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
    expect(parsed.searchParams.get('subtitleFontSize')).toBe('42');
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

  it('buildLogoUrl 应当正确序列化 RESTful /api/logo 查询参数并规范化十六进制色值', () => {
    const state: LogoFormState = {
      ...DEFAULT_STATE,
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
    expect(url.startsWith('/api/logo?')).toBe(true);

    const parsed = new URL(`http://localhost${url}`);
    expect(parsed.searchParams.get('left')).toBe('碧蓝');
    expect(parsed.searchParams.get('right')).toBe('航线');
    expect(parsed.searchParams.get('subtitle')).toBe('アズールレーン');
    expect(parsed.searchParams.get('subtitleColor')).toBe('123456');
    expect(parsed.searchParams.get('subX')).toBe('15');
    expect(parsed.searchParams.get('subY')).toBe('8');
    expect(parsed.searchParams.get('accent')).toBe('FF9800');
    expect(parsed.searchParams.get('crossColor')).toBe('E91E63');
    expect(parsed.searchParams.get('haloColor')).toBe('3F51B5');
    expect(parsed.searchParams.get('motifsBehindText')).toBe('true');
    expect(parsed.searchParams.get('offsetX')).toBe('-20');
    expect(parsed.searchParams.get('offsetY')).toBe('12');
    expect(parsed.searchParams.get('wordGap')).toBe('18');
    expect(parsed.searchParams.get('scale')).toBeNull(); // scale=1 时省略默认值
    expect(parsed.searchParams.get('format')).toBe('webp');
    expect(parsed.searchParams.get('transparent')).toBe('true');
    expect(parsed.searchParams.get('darkMode')).toBe('true');
    expect(parsed.searchParams.get('swapColors')).toBe('true');
    expect(parsed.searchParams.get('padding')).toBe('5');
  });

  it('buildLogoUrl 应保留默认值省略、空副标题与相对/绝对 origin 行为', () => {
    const url = buildLogoUrl(DEFAULT_STATE);
    expect(url).toBe('/api/logo?left=%E8%94%9A%E8%93%9D&right=%E6%A1%A3%E6%A1%88&scale=2');

    const absoluteUrl = buildLogoUrl(
      { ...DEFAULT_STATE, subtitle: '', center: true },
      'https://example.com',
    );
    expect(absoluteUrl).toBe(
      'https://example.com/api/logo?left=%E8%94%9A%E8%93%9D&right=%E6%A1%A3%E6%A1%88&scale=2',
    );

    const defaultSubtitleUrl = new URL(
      `http://localhost${buildLogoUrl({ ...DEFAULT_STATE, subtitle: 'BlueArchive' })}`,
    );
    expect(defaultSubtitleUrl.searchParams.get('subY')).toBeNull();
    const zeroSubtitleYUrl = new URL(
      `http://localhost${buildLogoUrl({ ...DEFAULT_STATE, subtitle: 'BlueArchive', subY: 0 })}`,
    );
    expect(zeroSubtitleYUrl.searchParams.get('subY')).toBe('0');
  });

  it('i18n 词典应当在所有支持的语言中具备 100% 键覆盖率，且覆盖代码中所有引用的翻译键', () => {
    const zhKeys = Object.keys(LOCALES.zh).sort();
    expect(zhKeys.length).toBeGreaterThan(30);

    const targetLangs = ['zh-tw', 'en', 'ja', 'ko'] as const;
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

    // 扫描 web/src 源码中所有实际引用的 t('...') 键
    const srcDir = new URL('../web/src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    const collectFiles = (dir: string): string[] => {
      const list: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          list.push(...collectFiles(fullPath));
        } else if (/\.(vue|ts|js)$/.test(entry.name) && !fullPath.includes('/locales/')) {
          list.push(fullPath);
        }
      }
      return list;
    };

    const usedKeys = new Set<string>();
    for (const file of collectFiles(srcDir)) {
      const content = readFileSync(file, 'utf8');
      const matches = content.matchAll(/\bt\(['"]([^'"]+)['"]\)/g);
      for (const match of matches) {
        usedKeys.add(match[1]);
      }
    }

    const allLangs = ['zh', ...targetLangs] as const;
    for (const lang of allLangs) {
      const dict = LOCALES[lang];
      for (const key of usedKeys) {
        expect(dict[key]).toBeDefined();
        expect(typeof dict[key]).toBe('string');
        expect(dict[key].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('AppHeader 导航外链应正确指向 Swagger 与官方原版前端', () => {
    const headerContent = readFileSync(
      new URL('../web/src/components/AppHeader.vue', import.meta.url),
      'utf8',
    );
    expect(headerContent).toContain('href="/swagger"');
    expect(headerContent).toContain('href="https://lab.nulla.top/ba-logo/"');
    expect(headerContent).not.toContain('subrecovery.top');
  });

  it('移动端应具备完整的视口配置、置顶吸顶预览、紧凑导航与底部浮动操作栏', () => {
    const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
    expect(html).toContain('viewport-fit=cover');

    const appVue = readFileSync(new URL('../web/src/App.vue', import.meta.url), 'utf8');
    expect(appVue).toContain('class="mobile-floating-bar"');
    expect(appVue).toContain('@click="downloadImage"');
    expect(appVue).toContain('@click="copyImage"');

    const css = readFileSync(new URL('../web/src/styles/main.css', import.meta.url), 'utf8');
    expect(css).toContain('@media (max-width: 1240px)');
    expect(css).toContain('@media (max-width: 960px)');
    expect(css).toContain('@media (max-width: 720px)');
    expect(css).toContain('@media (max-width: 480px)');
    expect(css).toContain('.mobile-floating-bar');
    expect(css).toContain('order: -1');
    expect(css).toContain('position: sticky');
    expect(css).toContain('env(safe-area-inset-bottom');
  });

  it('主题样式应同时定义明暗主题变量，并让组件通过变量引用主题色', () => {
    const css = readFileSync(new URL('../web/src/styles/main.css', import.meta.url), 'utf8');
    const darkTheme = css.slice(
      css.indexOf("html[data-theme='dark'] {"),
      css.indexOf('\n}', css.indexOf("html[data-theme='dark'] {")),
    );

    for (const variable of [
      '--surface-hover',
      '--surface-raised',
      '--input-focus-bg',
      '--primary-focus-ring',
      '--control-focus-ring',
      '--surface-control',
      '--surface-popover',
      '--surface-loading',
      '--switch-track',
      '--tag-neutral-bg',
      '--tag-neutral-border',
      '--tag-neutral-text',
      '--shadow-card',
      '--header-bg',
    ]) {
      expect(css).toContain(`${variable}:`);
      expect(darkTheme).toContain(`${variable}:`);
    }
    expect(css).toContain('background: var(--surface-hover)');
    expect(css).toContain('background: var(--input-focus-bg)');
  });

  it('useLogoPreview 应通过取消与请求序号阻止旧响应覆盖最新预览', async () => {
    const state = { ...DEFAULT_STATE };
    const harness = createPreviewHarness(state);
    const unmount = harness.mount();
    const pending: Array<{ resolve: (response: Response) => void; signal?: AbortSignal }> = [];
    const originalFetch = globalThis.fetch;
    const originalImage = globalThis.Image;
    globalThis.Image = class {
      naturalWidth = 12;
      naturalHeight = 8;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    } as unknown as typeof Image;
    globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((resolve) => {
        pending.push({ resolve, signal: init?.signal ?? undefined });
      })) as typeof fetch;

    try {
      harness.api.triggerPreview();
      await new Promise((resolve) => setTimeout(resolve, 100));
      state.left = '最新';
      harness.api.triggerPreview();
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(pending.length).toBe(2);
      expect(pending[0].signal?.aborted).toBe(true);
      expect(harness.api.isLoading.value).toBe(true);

      pending[1].resolve(new Response(new Blob([new Uint8Array([2])], { type: 'image/png' })));
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(harness.api.activePreview.value.snapshot.left).toBe('最新');
      expect(harness.api.isLoading.value).toBe(false);

      // 模拟不遵守 AbortSignal 的传输层：旧请求晚到也不得覆盖新预览。
      pending[0].resolve(new Response(new Blob([new Uint8Array([1])], { type: 'image/png' })));
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(harness.api.activePreview.value.snapshot.left).toBe('最新');
      expect(harness.api.isLoading.value).toBe(false);
    } finally {
      unmount();
      globalThis.fetch = originalFetch;
      globalThis.Image = originalImage;
    }
  });

  it('useLogoPreview 应拒绝过期的 Base64 JSON 响应', async () => {
    const state: LogoFormState = { ...DEFAULT_STATE, format: 'base64' };
    const harness = createPreviewHarness(state);
    const unmount = harness.mount();
    const jsonResponses: Array<(value: unknown) => void> = [];
    const originalFetch = globalThis.fetch;
    const originalImage = globalThis.Image;
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    let fetchCount = 0;
    globalThis.Image = class {
      naturalWidth = 14;
      naturalHeight = 9;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    } as unknown as typeof Image;
    URL.createObjectURL = (() => 'blob:png-latest') as typeof URL.createObjectURL;
    URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
    globalThis.fetch = (() =>
      fetchCount++ === 0
        ? Promise.resolve({
            ok: true,
            json: () => new Promise((resolve) => jsonResponses.push(resolve)),
          })
        : Promise.resolve(
            new Response(new Blob([new Uint8Array([1])], { type: 'image/png' })),
          )) as unknown as typeof fetch;

    try {
      harness.api.triggerPreview();
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(jsonResponses).toHaveLength(1);

      state.format = 'png';
      state.left = 'new PNG';
      harness.api.triggerPreview();
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(jsonResponses).toHaveLength(1);

      // 完成最新 PNG 请求，再让旧 Base64 响应晚到。
      await new Promise((resolve) => setTimeout(resolve, 10));
      jsonResponses[0]({
        data: {
          base64: 'old',
          dataUrl: 'data:image/png;base64,old',
          width: 1,
          height: 1,
          mimeType: 'image/png',
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(harness.api.activePreview.value.snapshot.format).toBe('png');
      expect(harness.api.activePreview.value.snapshot.left).toBe('new PNG');
    } finally {
      unmount();
      globalThis.fetch = originalFetch;
      globalThis.Image = originalImage;
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });

  it('useLogoPreview 应在替换与卸载时回收 Blob URL，并清除 toast 定时器', async () => {
    const state = { ...DEFAULT_STATE };
    const harness = createPreviewHarness(state);
    const unmount = harness.mount();
    const originalFetch = globalThis.fetch;
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const originalImage = globalThis.Image;
    const created: string[] = [];
    const revoked: string[] = [];
    let imageSrc = '';
    URL.createObjectURL = (() => {
      const url = `blob:test-${created.length + 1}`;
      created.push(url);
      return url;
    }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = ((url: string) => revoked.push(url)) as typeof URL.revokeObjectURL;
    globalThis.Image = class {
      naturalWidth = 10;
      naturalHeight = 20;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) {
        imageSrc = value;
      }
    } as unknown as typeof Image;
    globalThis.fetch = (async () =>
      new Response(
        new Blob([new Uint8Array([1])], { type: 'image/png' }),
      )) as unknown as typeof fetch;

    try {
      harness.api.triggerPreview();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(harness.api.activePreview.value.blobUrl).toBe(imageSrc);

      state.left = 'replaced';
      harness.api.triggerPreview();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(revoked).toContain(created[0]);

      harness.api.showToast('test');
      unmount();
      expect(revoked).toContain(created[1]);
    } finally {
      globalThis.fetch = originalFetch;
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      globalThis.Image = originalImage;
    }
  });

  it('useLogoPreview 卸载时应取消复制图片发起的辅助请求', async () => {
    const state = { ...DEFAULT_STATE, format: 'svg' as const };
    const harness = createPreviewHarness(state);
    const unmount = harness.mount();
    const originalFetch = globalThis.fetch;
    let signal: AbortSignal | undefined;
    globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    }) as typeof fetch;

    try {
      const copyPromise = harness.api.copyImage();
      expect(signal?.aborted).toBe(false);
      unmount();
      expect(signal?.aborted).toBe(true);
      await copyPromise;
    } finally {
      unmount();
      globalThis.fetch = originalFetch;
    }
  });

  it('useTheme 应当正确管理主题模式并支持 cycleTheme 轮转', async () => {
    const { useTheme } = await import('../web/src/composables/useTheme.ts');
    const theme = useTheme();

    theme.setThemeMode('light');
    expect(theme.themeMode.value).toBe('light');
    expect(theme.resolvedTheme.value).toBe('light');

    theme.cycleTheme();
    expect(theme.themeMode.value).toBe('dark');
    expect(theme.resolvedTheme.value).toBe('dark');

    theme.cycleTheme();
    expect(theme.themeMode.value).toBe('auto');

    // 重置回 auto
    theme.setThemeMode('auto');
    expect(theme.themeMode.value).toBe('auto');
  });
});
