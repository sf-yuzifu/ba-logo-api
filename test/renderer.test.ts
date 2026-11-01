import { describe, expect, it } from 'bun:test';
import { loadImage } from '@napi-rs/canvas';
import { renderLogo, renderLogoToBuffer } from '../src/renderer.ts';

describe('Renderer Core Unit Tests', () => {
  it('应当正常渲染默认参数并生成有效图片', () => {
    const result = renderLogoToBuffer();
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.mimeType).toBe('image/png');
    expect(result.buffer.length).toBeGreaterThan(1000);
    expect(result.base64.length).toBeGreaterThan(1000);
    expect(result.dataUrl.startsWith('data:image/png;base64,')).toBe(true);

    // PNG 文件头校验 (89 50 4E 47)
    expect(result.buffer[0]).toBe(0x89);
    expect(result.buffer[1]).toBe(0x50);
    expect(result.buffer[2]).toBe(0x4e);
    expect(result.buffer[3]).toBe(0x47);
  });

  it('应当支持多格式导出 (PNG, WebP, JPEG, SVG, Base64)', () => {
    const png = renderLogoToBuffer({ format: 'png' });
    expect(png.mimeType).toBe('image/png');
    expect(png.buffer[0]).toBe(0x89);

    const webp = renderLogoToBuffer({ format: 'webp' });
    expect(webp.mimeType).toBe('image/webp');
    // WebP RIFF 校验 (52 49 46 46)
    expect(webp.buffer.toString('ascii', 0, 4)).toBe('RIFF');
    expect(webp.buffer.toString('ascii', 8, 12)).toBe('WEBP');

    const jpeg = renderLogoToBuffer({ format: 'jpeg' });
    expect(jpeg.mimeType).toBe('image/jpeg');
    // JPEG SOI 校验 (FF D8)
    expect(jpeg.buffer[0]).toBe(0xff);
    expect(jpeg.buffer[1]).toBe(0xd8);

    const svg = renderLogoToBuffer({ format: 'svg', textL: 'Blue', textR: 'Archive' });
    expect(svg.mimeType).toContain('image/svg+xml');
    expect(svg.buffer.toString('utf8')).toContain('<svg');
    expect(svg.buffer.toString('utf8')).toContain('<path');

    const base64Result = renderLogoToBuffer({ format: 'base64' });
    expect(base64Result.base64).toBeDefined();
    expect(base64Result.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('SVG 与位图应共享边界尺寸并返回 SVG 宽高元数据', async () => {
    const optionsList = [
      {},
      { scale: 2, textL: 'Blue', textR: 'Archive', subtitle: 'ブルーアーカイブ' },
      { transparent: true },
      { transparent: true, padding: '3 8 11 17', subtitle: '長い副タイトル' },
      { motifsBehindText: true, padding: '5 10 15 20' },
      { motifsBehindText: true, transparent: true, darkMode: true, wordGap: 30 },
      { center: false, padding: '0 12 24 6', offsetX: 25, offsetY: -12 },
    ];

    for (const options of optionsList) {
      const raster = renderLogo(options);
      const svg = renderLogoToBuffer({ ...options, format: 'svg' });
      const image = await loadImage(svg.buffer);
      expect(svg.width).toBe(raster.width);
      expect(svg.height).toBe(raster.height);
      expect(image.width).toBe(raster.width);
      expect(image.height).toBe(raster.height);
      expect(svg.svg).not.toContain('<text');
      expect(svg.svg).not.toContain('<image');
    }
  });

  it('应当支持分辨率等比例缩放 (scale)', () => {
    // 紧凑裁切模式下，各倍率尺寸应当严格保持成倍放大
    const logo1x = renderLogo({ scale: 1 });
    const logo2x = renderLogo({ scale: 2 });
    const logo3x = renderLogo({ scale: 3 });

    expect(Math.abs(logo2x.width - logo1x.width * 2)).toBeLessThan(10);
    expect(Math.abs(logo2x.height - logo1x.height * 2)).toBeLessThan(10);
    expect(Math.abs(logo3x.width - logo1x.width * 3)).toBeLessThan(15);
    expect(Math.abs(logo3x.height - logo1x.height * 3)).toBeLessThan(15);
  });

  it('应当支持色彩自定义、暗黑模式与颜色互换', () => {
    const normal = renderLogoToBuffer({ accentColor: '#00E5FF' });
    expect(normal.buffer.length).toBeGreaterThan(0);

    // 不带 # 前缀的 Hex 颜色
    const noHash = renderLogoToBuffer({ accentColor: 'FF5722' });
    expect(noHash.buffer.length).toBeGreaterThan(0);

    // 暗黑模式
    const dark = renderLogoToBuffer({ darkMode: true });
    expect(dark.buffer.length).toBeGreaterThan(0);

    // 颜色对调
    const swapped = renderLogoToBuffer({ swapColors: true });
    expect(swapped.buffer.length).toBeGreaterThan(0);

    // 透明背景
    const transparent = renderLogoToBuffer({ transparent: true });
    expect(transparent.buffer.length).toBeGreaterThan(0);

    // 独立十字与光环颜色
    const customMotifs = renderLogoToBuffer({
      crossColor: '#FFD700',
      haloColor: '#9C27B0',
    });
    expect(customMotifs.buffer.length).toBeGreaterThan(0);

    // 图标置底模式
    const behind = renderLogoToBuffer({
      motifsBehindText: true,
      crossColor: '#FFD700',
      haloColor: '#9C27B0',
    });
    expect(behind.buffer.length).toBeGreaterThan(0);
  });

  it('应当支持副标题排版与渲染', () => {
    const withoutSub = renderLogo({ textL: 'Blue', textR: 'Archive' });
    const withSub = renderLogo({
      textL: 'Blue',
      textR: 'Archive',
      subtitle: 'ブルーアーカイブ',
    });

    // 带有副标题时，由于包含右下方副标题文本，宽度应当合理覆盖
    expect(withSub.width).toBeGreaterThanOrEqual(withoutSub.width);

    // 超长副标题向左延伸时不应发生左侧或底部截断
    const longSub = renderLogo({
      textL: '蔚蓝',
      textR: '档案',
      subtitle: '1145141313484848484111',
      scale: 2,
    });
    expect(longSub.width).toBeGreaterThan(1200);

    // 支持副标题独立位置微调 (subX, subY)
    const baseSub = renderLogo({
      textL: 'Blue',
      textR: 'Archive',
      subtitle: 'ブルーアーカイブ',
      transparent: true,
    });
    const shiftedSub = renderLogo({
      textL: 'Blue',
      textR: 'Archive',
      subtitle: 'ブルーアーカイブ',
      subtitleOffsetX: 60,
      subtitleOffsetY: 30,
      transparent: true,
    });
    expect(shiftedSub.width).toBeGreaterThan(baseSub.width);
    expect(shiftedSub.height).toBeGreaterThan(baseSub.height);
  });

  it('长短文本边界与裁剪安全性', () => {
    // 极短文本：保证光环不被裁剪，带有恰当边距
    const shortText = renderLogo({ textL: 'A', textR: 'B' });
    expect(shortText.width).toBeGreaterThanOrEqual(200);

    // 极长文本：应当动态拉伸而不报错
    const longText = renderLogo({
      textL: '超级漫长的大标题测试第一段',
      textR: '超长第二段文字演示',
    });
    expect(longText.width).toBeGreaterThan(800);
  });

  it('纯色或与背景同色（如白字白底）应当保持精确裁剪且尺寸一致', () => {
    const normal = renderLogo({ textL: '蔚蓝', textR: '档案', scale: 2 });
    const whiteOnWhite = renderLogo({
      textL: '蔚蓝',
      textR: '档案',
      accentColor: '#FFFFFF',
      textColor: '#FFFFFF',
      scale: 2,
    });
    // 白字在白底上通过 Alpha 通道计算，尺寸应当与正常色彩完全一致
    expect(whiteOnWhite.width).toBe(normal.width);
    expect(whiteOnWhite.height).toBe(normal.height);

    const normalTp = renderLogo({ textL: '蔚蓝', textR: '档案', scale: 2, transparent: true });
    const whiteTp = renderLogo({
      textL: '蔚蓝',
      textR: '档案',
      accentColor: '#FFFFFF',
      textColor: '#FFFFFF',
      scale: 2,
      transparent: true,
    });
    expect(whiteTp.width).toBe(normalTp.width);
    expect(whiteTp.height).toBe(normalTp.height);
  });

  it('应当完美支持 CSS 语法 padding（单值、双值、四值及上下左右全向加白）', () => {
    // 0 padding 紧贴边缘基准
    const base = renderLogo({ textL: '蔚蓝', textR: '档案', scale: 1, padding: 0 });

    // 单值数字：四周各 +10px
    const pad10 = renderLogo({ textL: '蔚蓝', textR: '档案', scale: 1, padding: 10 });
    expect(pad10.width).toBe(base.width + 20); // 左右各加 10
    expect(pad10.height).toBe(base.height + 20); // 上下各加 10

    // CSS 双值字符串 "10 30"：上下 10，左右 30
    const pad2Val = renderLogo({ textL: '蔚蓝', textR: '档案', scale: 1, padding: '10 30' });
    expect(pad2Val.width).toBe(base.width + 60); // 左右各 30 -> 60
    expect(pad2Val.height).toBe(base.height + 20); // 上下各 10 -> 20

    // CSS 四值字符串 "5 15 25 35"：上 5，右 15，下 25，左 35
    const pad4Val = renderLogo({ textL: '蔚蓝', textR: '档案', scale: 1, padding: '5 15 25 35' });
    expect(pad4Val.width).toBe(base.width + 15 + 35);
    expect(pad4Val.height).toBe(base.height + 5 + 25);

    // 独立方向参数覆盖
    const padOverride = renderLogo({
      textL: '蔚蓝',
      textR: '档案',
      scale: 1,
      padding: 0,
      paddingTop: 12,
      paddingLeft: 24,
    });
    expect(padOverride.width).toBe(base.width + 24);
    expect(padOverride.height).toBe(base.height + 12);
  });

  it('应当支持两词间距微调 (wordGap / gap)', () => {
    const normal = renderLogo({ textL: '蔚蓝', textR: '档案', scale: 2, wordGap: 0 });
    const wide = renderLogo({ textL: '蔚蓝', textR: '档案', scale: 2, wordGap: 40 });
    const tight = renderLogo({ textL: '蔚蓝', textR: '档案', scale: 2, wordGap: -20 });

    // scale: 2 时，gap=40 展开 80px，gap=-20 紧缩 40px
    expect(wide.width).toBe(normal.width + 80);
    expect(tight.width).toBe(normal.width - 40);
  });

  it('单次渲染性能基准测试应当小于 50ms', () => {
    const start = performance.now();
    renderLogoToBuffer({ textL: '蔚蓝', textR: '档案', scale: 1 });
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
