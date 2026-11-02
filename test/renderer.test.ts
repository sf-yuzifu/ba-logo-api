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

  it('renderLogoToBuffer 应当对 Base64 与 dataUrl 实行惰性按需求值', () => {
    const png = renderLogoToBuffer({ format: 'png' });
    const descriptorBase64 = Object.getOwnPropertyDescriptor(png, 'base64');
    const descriptorDataUrl = Object.getOwnPropertyDescriptor(png, 'dataUrl');
    expect(typeof descriptorBase64?.get).toBe('function');
    expect(typeof descriptorDataUrl?.get).toBe('function');
    expect(png.base64.length).toBeGreaterThan(100);
    expect(png.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('SVG 纯矢量导出应当无残留文本标签、无嵌入位图，并与位图尺寸一致', async () => {
    const optionsList = [
      {},
      { scale: 2, textL: 'Blue', textR: 'Archive', subtitle: 'ブルーアーカイブ' },
      { transparent: true },
      { transparent: true, padding: '3 8 11 17', subtitle: '長い副タイトル' },
      { motifsBehindText: true, padding: '5 10 15 20' },
      { motifsBehindText: true, transparent: true, darkMode: true, wordGap: 30 },
      { center: false, padding: '0 12 24 6', offsetX: 25, offsetY: -12 },
      { crossColor: '#FFD700', haloColor: '#9C27B0', subtitleColor: '#FF5722' },
      { subtitleOffsetX: 30, subtitleOffsetY: -15, swapColors: true },
    ];

    for (const options of optionsList) {
      const raster = renderLogo(options);
      const svg = renderLogoToBuffer({ ...options, format: 'svg' });
      const image = await loadImage(svg.buffer);

      // 验证无任何客户端字体依赖与位图残留
      const svgText = svg.svg ?? svg.buffer.toString('utf8');
      expect(svgText).toContain('<svg');
      expect(svgText).toContain('viewBox=');
      expect(svgText).toContain('<path');
      expect(svgText).not.toContain('<text');
      expect(svgText).not.toContain('<tspan');
      expect(svgText).not.toContain('<image');
      expect(svgText).not.toContain('data:image/');

      // 验证元数据与光栅化尺寸完全一致
      expect(svg.width).toBe(raster.width);
      expect(svg.height).toBe(raster.height);
      expect(image.width).toBe(raster.width);
      expect(image.height).toBe(raster.height);
    }
  });

  it('SVG viewBox 与导出尺寸应基于位图渲染的同一 alpha bounds', () => {
    const optionsList = [
      {},
      { transparent: true },
      { transparent: true, padding: '3 8 11 17', subtitle: '長い副タイトル' },
      { motifsBehindText: true, padding: '5 10 15 20' },
      { motifsBehindText: true, transparent: true, darkMode: true, wordGap: 30 },
      { center: false, padding: '0 12 24 6', offsetX: 25, offsetY: -12 },
      { scale: 3, textL: 'Blue', textR: 'Archive', subtitle: 'ブルーアーカイブ' },
      { crossColor: '#FFD700', haloColor: '#9C27B0', swapColors: true },
    ];

    for (const options of optionsList) {
      const bitmap = renderLogo(options);
      const vector = renderLogoToBuffer({ ...options, format: 'svg' });
      expect(vector.width).toBe(bitmap.width);
      expect(vector.height).toBe(bitmap.height);
      expect(vector.svg).toContain(`width="${bitmap.width}" height="${bitmap.height}"`);
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

    // CSS 三值字符串 "10 25 30"：上 10，左右 25，下 30
    const pad3Val = renderLogo({ textL: '蔚蓝', textR: '档案', scale: 1, padding: '10 25 30' });
    expect(pad3Val.width).toBe(base.width + 50); // 左右各 25
    expect(pad3Val.height).toBe(base.height + 40); // 上 10 + 下 30

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

  it('应当安全处理参数边界条件（极端缩放、极值间距、空文本与空白）', () => {
    // 极小 scale 限制于 0.1，超大 scale 限制于 8.0
    const tinyScale = renderLogo({ scale: 0.0001 });
    const minScale = renderLogo({ scale: 0.1 });
    expect(tinyScale.width).toBe(minScale.width);
    expect(tinyScale.height).toBe(minScale.height);

    const hugeScale = renderLogo({ scale: 999 });
    const maxScale = renderLogo({ scale: 8.0 });
    expect(hugeScale.width).toBe(maxScale.width);
    expect(hugeScale.height).toBe(maxScale.height);

    // wordGap 上下界安全钳制 (-100 ~ 300)
    const minGap = renderLogo({ wordGap: -100, scale: 1 });
    const underGap = renderLogo({ wordGap: -999, scale: 1 });
    expect(underGap.width).toBe(minGap.width);

    const maxGap = renderLogo({ wordGap: 300, scale: 1 });
    const overGap = renderLogo({ wordGap: 9999, scale: 1 });
    expect(overGap.width).toBe(maxGap.width);

    // 空文本与仅空格安全渲染
    const emptyLogo = renderLogo({ textL: '', textR: '' });
    expect(emptyLogo.width).toBeGreaterThan(0);
    expect(emptyLogo.height).toBeGreaterThan(0);

    const spaceLogo = renderLogo({ textL: '   ', textR: '   ' });
    expect(spaceLogo.width).toBeGreaterThan(0);
    expect(spaceLogo.height).toBeGreaterThan(0);
  });

  it('应当原生支持韩语（Hangul）文本位图与纯矢量 SVG 轮廓化渲染', () => {
    // 验证韩文字符 "블루" / "아카이브" 在位图和矢量导出下均可正常渲染
    const pngRes = renderLogoToBuffer({
      textL: '블루',
      textR: '아카이브',
      subtitle: '로고 생성기',
      format: 'png',
    });
    expect(pngRes.buffer.length).toBeGreaterThan(0);
    expect(pngRes.width).toBeGreaterThan(300);
    expect(pngRes.height).toBeGreaterThan(100);

    const svgRes = renderLogoToBuffer({
      textL: '블루',
      textR: '아카이브',
      subtitle: 'Blue Archive',
      format: 'svg',
    });
    expect(svgRes.svg).toBeDefined();
    expect(svgRes.svg).toContain('<path');
    expect(svgRes.buffer.length).toBeGreaterThan(0);
  });

  it('渲染性能基准多采样测试应当中位数小于 50ms', () => {
    // 预热 1 次
    renderLogoToBuffer({ textL: '蔚蓝', textR: '档案', scale: 1 });

    // 运行 5 次并统计中位数
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      renderLogoToBuffer({ textL: '蔚蓝', textR: '档案', scale: 1 });
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    const median = times[2];
    expect(median).toBeLessThan(50);
  });
});
