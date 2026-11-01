import { describe, it, expect } from 'bun:test';
import { renderLogo, renderLogoToBuffer } from '../src/renderer.ts';
import { BASE_CANVAS_HEIGHT } from '../src/constants.ts';

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

  it('应当支持多格式导出 (PNG, WebP, JPEG, Base64)', () => {
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

    const base64Result = renderLogoToBuffer({ format: 'base64' });
    expect(base64Result.base64).toBeDefined();
    expect(base64Result.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('应当支持分辨率等比例缩放 (scale)', () => {
    // 开启 crop: false 时高度严格等于 BASE_CANVAS_HEIGHT * scale
    const raw1x = renderLogo({ scale: 1, crop: false });
    const raw2x = renderLogo({ scale: 2, crop: false });
    const raw3x = renderLogo({ scale: 3, crop: false });

    expect(raw1x.height).toBe(250);
    expect(raw2x.height).toBe(500);
    expect(raw3x.height).toBe(750);

    // 默认 crop: true 紧凑裁切模式下，各倍率尺寸也应当严格保持成倍放大
    const logo1x = renderLogo({ scale: 1 });
    const logo2x = renderLogo({ scale: 2 });
    expect(Math.abs(logo2x.width - logo1x.width * 2)).toBeLessThan(10);
    expect(Math.abs(logo2x.height - logo1x.height * 2)).toBeLessThan(10);
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

    // 关闭 crop 应当保留初始总宽度
    const uncropped = renderLogo({ crop: false });
    expect(uncropped.width).toBeGreaterThanOrEqual(900);
  });

  it('单次渲染性能基准测试应当小于 50ms', () => {
    const start = performance.now();
    renderLogoToBuffer({ textL: '蔚蓝', textR: '档案', scale: 1 });
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
