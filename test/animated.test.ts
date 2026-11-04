import { describe, expect, it } from 'bun:test';
import { type Canvas, loadImage } from '@napi-rs/canvas';
import { createApp } from '../src/app.ts';
import { BASE_FONT_SIZE } from '../src/constants.ts';
import { loadFonts } from '../src/font.ts';
import { drawAnimatedLogoCanvas, renderLogoAnimatedToBuffer } from '../src/render/animated.ts';
import { computeLogoLayout } from '../src/render/layout.ts';
import { normalizeRenderOptions } from '../src/render/options.ts';
import { renderLogoToBuffer } from '../src/renderer.ts';

function pixelBounds(canvas: Canvas, color?: readonly number[], alphaThreshold = 64) {
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  let minX = canvas.width;
  let maxX = -1;
  let minY = canvas.height;
  let maxY = -1;
  let count = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      if (pixels[index + 3] < alphaThreshold) continue;
      if (color?.some((channel, offset) => Math.abs(pixels[index + offset] - channel) > 2)) {
        continue;
      }
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      count++;
    }
  }
  expect(count).toBeGreaterThan(0);
  return { minX, maxX, minY, maxY, count };
}

describe('文字水平入场与反向着色', () => {
  for (const text of ['蔚蓝', 'HHH']) {
    for (const side of ['left', 'right'] as const) {
      it(`${side} / ${text} 应沿固定基线水平靠拢`, () => {
        loadFonts();
        const options = normalizeRenderOptions({
          textL: side === 'left' ? text : '',
          textR: side === 'right' ? text : '',
          transparent: true,
        });
        const layout = computeLogoLayout(options);
        // Phase 2 水平移动阶段（0.30-0.50）：文字已着色，水平靠拢
        const frames = [0.32, 0.36, 0.4, 0.44].map((progress) =>
          pixelBounds(drawAnimatedLogoCanvas(options, layout, progress)),
        );
        const first = frames[0];
        for (let i = 1; i < frames.length; i++) {
          const previous = frames[i - 1];
          const current = frames[i];
          expect(Math.abs(current.minY - first.minY)).toBeLessThanOrEqual(1);
          expect(Math.abs(current.maxY - first.maxY)).toBeLessThanOrEqual(1);
          if (side === 'left') {
            expect(current.minX).toBeGreaterThan(previous.minX);
          } else {
            expect(current.minX).toBeLessThan(previous.minX);
          }
        }
      });

      it(`${side} / ${text} 着色应${side === 'left' ? '自上而下' : '自下而上'}推进`, () => {
        loadFonts();
        const options = normalizeRenderOptions({
          textL: side === 'left' ? text : '',
          textR: side === 'right' ? text : '',
          accentColor: '#128AFA',
          textColor: '#2B2B2B',
          transparent: true,
        });
        const layout = computeLogoLayout(options);
        const color = side === 'left' ? [18, 138, 250] : [43, 43, 43];
        // Phase 1 着色阶段（0.0-0.30）：初始位置先着色，带渐变平滑过渡
        const early = pixelBounds(drawAnimatedLogoCanvas(options, layout, 0.08), color);
        const middle = drawAnimatedLogoCanvas(options, layout, 0.15);
        const colored = pixelBounds(middle, color);
        const late = pixelBounds(drawAnimatedLogoCanvas(options, layout, 0.22), color);
        const settled = pixelBounds(drawAnimatedLogoCanvas(options, layout, 0.5), color);

        // 着色必须发生在左右分离位置，不能提前出现在最终归位坐标。
        if (side === 'left') {
          expect(early.maxX).toBeLessThan(settled.maxX - 20);
        } else {
          expect(early.minX).toBeGreaterThan(settled.minX + 20);
        }

        expect(colored.count).toBeGreaterThan(early.count);
        expect(late.count).toBeGreaterThan(colored.count);
        // 渐变过渡带允许颜色与高光共存，验证着色区域按正确方向扩展
        if (side === 'left') {
          // 左侧自上而下：着色区域底部应随时间向下扩展
          expect(late.maxY).toBeGreaterThan(early.maxY);
          expect(late.count).toBeGreaterThan(colored.count);
        } else {
          // 右侧自下而上：着色区域顶部应随时间向上扩展
          expect(late.minY).toBeLessThan(early.minY);
          expect(late.count).toBeGreaterThan(colored.count);
        }
      });
    }
  }
});

describe('标题初始间距', () => {
  it('左右文字应各向外偏移半个基础字宽，总间距为一个字宽', () => {
    loadFonts();
    for (const side of ['left', 'right'] as const) {
      const options = normalizeRenderOptions({
        textL: side === 'left' ? '蔚' : '',
        textR: side === 'right' ? '档' : '',
        haloColor: '#00000000',
        crossColor: '#00000000',
        transparent: true,
      });
      const layout = computeLogoLayout(options);
      const initial = pixelBounds(drawAnimatedLogoCanvas(options, layout, 0), undefined, 1);
      const settled = pixelBounds(drawAnimatedLogoCanvas(options, layout, 0.5), undefined, 1);
      const displacement =
        side === 'left' ? settled.maxX - initial.maxX : initial.minX - settled.minX;
      expect(Math.abs(displacement - BASE_FONT_SIZE / 2)).toBeLessThanOrEqual(1);
    }
  });
});

describe('浅色文字着色可见性', () => {
  it('右侧白色文字应通过不透明度变化呈现自下而上的着色效果', () => {
    loadFonts();
    const options = normalizeRenderOptions({
      textL: '',
      textR: '档案',
      textColor: '#FFFFFF',
      darkMode: true,
      transparent: true,
    });
    const layout = computeLogoLayout(options);
    const opacityCounts = (canvas: Canvas) => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let faint = 0;
      let solid = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3];
        if (alpha >= 16 && alpha <= 64) faint++;
        if (alpha >= 250) solid++;
      }
      return { faint, solid };
    };

    const middle = opacityCounts(drawAnimatedLogoCanvas(options, layout, 0.15));
    const late = opacityCounts(drawAnimatedLogoCanvas(options, layout, 0.22));
    expect(middle.faint).toBeGreaterThan(500);
    expect(middle.solid).toBeGreaterThan(100);
    expect(late.solid).toBeGreaterThan(middle.solid);
  });
});

describe('文字扫描高光边界', () => {
  for (const text of ['蔚蓝', 'HHH']) {
    it(`${text} 着色时不应在文字外的透明画布边缘留下白线`, () => {
      loadFonts();
      const options = normalizeRenderOptions({
        textL: text,
        textR: '',
        accentColor: '#FFC300',
        textColor: '#FFFFFF',
        darkMode: true,
        transparent: true,
      });
      const layout = computeLogoLayout(options);
      const canvas = drawAnimatedLogoCanvas(options, layout, 0.15);
      const { width, height } = canvas;
      const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
      let edgePixelCount = 0;

      // 任意背景下，文字外的左右边缘都必须保持完全透明。
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < 4; x++) {
          if (pixels[(y * width + x) * 4 + 3] !== 0) edgePixelCount++;
          if (pixels[(y * width + width - 1 - x) * 4 + 3] !== 0) edgePixelCount++;
        }
      }
      expect(edgePixelCount).toBe(0);
    });
  }
});

describe('副标题横向揭示与十字同步', () => {
  it('应仅以最终颜色从左向右揭示，并与十字在同一帧完成', () => {
    loadFonts();
    const options = normalizeRenderOptions({
      textL: '',
      textR: '',
      subtitle: 'HHHHHHHH',
      subtitleColor: '#2B2B2B',
      haloColor: '#00000000',
      crossColor: '#00000000',
      transparent: true,
    });
    const layout = computeLogoLayout(options);
    const actionDuration = 1.1;
    const frameAt = (elapsed: number) =>
      drawAnimatedLogoCanvas(options, layout, elapsed / actionDuration, actionDuration);
    const pixels = (canvas: Canvas) =>
      Buffer.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data);

    const early = pixelBounds(frameAt(0.6));
    const laterFrame = frameAt(0.7);
    const later = pixelBounds(laterFrame);
    const laterPixels = pixels(laterFrame);
    let cyanPixelCount = 0;
    for (let i = 0; i < laterPixels.length; i += 4) {
      if (
        laterPixels[i + 3] >= 64 &&
        laterPixels[i + 2] > laterPixels[i] + 10 &&
        laterPixels[i + 1] > laterPixels[i] + 5
      ) {
        cyanPixelCount++;
      }
    }

    // 只扩大右侧横向揭示窗口，不进行纵向或斜向颜色扫描。
    expect(later.minX).toBe(early.minX);
    expect(later.maxX).toBeGreaterThan(early.maxX);
    expect(later.minY).toBe(early.minY);
    expect(later.maxY).toBe(early.maxY);
    expect(cyanPixelCount).toBe(0);

    const beforeCompletion = frameAt(0.8);
    const crossCompleted = frameAt(1.006);
    const finalFrame = frameAt(actionDuration);
    expect(pixels(beforeCompletion).equals(pixels(crossCompleted))).toBe(false);
    expect(pixels(crossCompleted).equals(pixels(finalFrame))).toBe(true);
  });
});

describe('动画 Logo 生成与编码 (GIF & APNG)', () => {
  const app = createApp();

  it('GIF / APNG 应仅添加与静态图相同的四边 padding，不强制总尺寸一致', () => {
    const cases = [
      {
        textL: '蔚蓝',
        textR: '档案',
        subtitle: 'BlueArchive',
        padding: '3 8 11 17',
        center: true,
      },
      {
        textL: 'Blue',
        textR: 'Archive',
        transparent: true,
        center: false,
        padding: '5 10 15 20',
        scale: 2,
      },
    ];

    for (const options of cases) {
      const { padding } = normalizeRenderOptions(options);
      for (const format of ['gif', 'apng'] as const) {
        const base = renderLogoAnimatedToBuffer(
          { ...options, padding: 0, fps: 10, duration: 0.4, holdDuration: 0.2 },
          format,
        );
        const padded = renderLogoAnimatedToBuffer(
          { ...options, fps: 10, duration: 0.4, holdDuration: 0.2 },
          format,
        );
        expect(padded.width - base.width).toBe(padding.left + padding.right);
        expect(padded.height - base.height).toBe(padding.top + padding.bottom);
      }
    }
  });

  it('应当能成功生成合法的 GIF 动图且包含 GIF89a 标志', () => {
    const res = renderLogoAnimatedToBuffer(
      {
        textL: '蔚蓝',
        textR: '档案',
        subtitle: 'BlueArchive',
        fps: 12,
        duration: 0.6,
        holdDuration: 0.5,
      },
      'gif',
    );

    expect(res.buffer).toBeDefined();
    expect(res.buffer.length).toBeGreaterThan(1000);
    expect(res.mimeType).toBe('image/gif');
    expect(res.width).toBeGreaterThan(100);
    expect(res.height).toBeGreaterThan(50);
    expect(res.framesCount).toBeGreaterThan(5);

    // 检查 GIF 魔法头 (GIF89a)
    const header = res.buffer.subarray(0, 6).toString('ascii');
    expect(header).toBe('GIF89a');
  });

  it('应当能成功生成合法的 APNG 动图且包含 acTL 与 fcTL 动画块', () => {
    const res = renderLogoAnimatedToBuffer(
      {
        textL: 'Blue',
        textR: 'Archive',
        fps: 12,
        duration: 0.5,
        holdDuration: 0.5,
      },
      'apng',
    );

    expect(res.buffer).toBeDefined();
    expect(res.buffer.length).toBeGreaterThan(1000);
    expect(res.mimeType).toBe('image/png');

    // 检查 PNG 签名: \x89PNG\r\n\x1a\n
    expect(res.buffer[0]).toBe(0x89);
    expect(res.buffer.subarray(1, 4).toString('ascii')).toBe('PNG');

    // 检查 APNG 专属块 acTL (Animation Control)
    const hex = res.buffer.toString('latin1');
    expect(hex.includes('acTL')).toBe(true);
    expect(hex.includes('fcTL')).toBe(true);
  });

  it('应当生成纯矢量 SMIL Animated SVG，并保持动画时间轴', async () => {
    const res = renderLogoToBuffer({
      textL: 'Blue',
      textR: 'Archive',
      subtitle: 'BlueArchive',
      format: 'svg-animated',
    });

    expect(res.mimeType).toBe('image/svg+xml; charset=utf-8');
    const svg = res.buffer.toString('utf8');
    expect(svg).toContain('<animate');
    expect(svg).toContain('<animateTransform');
    expect(svg).toContain('cross-reveal');
    expect(svg).toContain('subtitle-reveal');
    expect(svg).not.toContain('<image');
    expect(svg).not.toContain('<text');
    expect(svg).not.toContain('data:image/');
    const image = await loadImage(res.buffer);
    expect(image.width).toBe(res.width);
    expect(image.height).toBe(res.height);
  });

  it('应当生成包含 VP8X / ANIM / ANMF 的合法 Animated WebP', async () => {
    const res = renderLogoAnimatedToBuffer(
      {
        textL: 'Blue',
        textR: 'Archive',
        subtitle: 'BlueArchive',
        fps: 12,
        duration: 0.5,
        holdDuration: 0.5,
      },
      'webp-animated',
    );

    expect(res.mimeType).toBe('image/webp');
    expect(res.buffer.toString('ascii', 0, 4)).toBe('RIFF');
    expect(res.buffer.toString('ascii', 8, 12)).toBe('WEBP');
    const content = res.buffer.toString('latin1');
    expect(content).toContain('VP8X');
    expect(content).toContain('ANIM');
    expect(content).toContain('ANMF');
    const image = await loadImage(res.buffer);
    expect(image.width).toBe(res.width);
    expect(image.height).toBe(res.height);
  });

  it('API GET /api/logo 应支持 format=gif 并返回正确的 MIME 类型与内容', async () => {
    const req = new Request(
      'http://localhost/api/logo?left=蔚蓝&right=档案&format=gif&fps=12&duration=0.5',
    );
    const resp = await app.handle(req);

    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toContain('image/gif');

    const buf = Buffer.from(await resp.arrayBuffer());
    expect(buf.subarray(0, 6).toString('ascii')).toBe('GIF89a');
  });

  it('API GET /api/logo 应支持 format=apng 并返回正确的 MIME 类型与 APNG 内容', async () => {
    const req = new Request(
      'http://localhost/api/logo?left=Blue&right=Archive&format=apng&fps=12&duration=0.5',
    );
    const resp = await app.handle(req);

    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toContain('image/png');

    const buf = Buffer.from(await resp.arrayBuffer());
    expect(buf[0]).toBe(0x89);
    expect(buf.toString('latin1').includes('acTL')).toBe(true);
  });

  it('API 应支持 format=svg-animated 与 format=webp-animated', async () => {
    const svgResponse = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&format=svg-animated'),
    );
    expect(svgResponse.status).toBe(200);
    expect(svgResponse.headers.get('content-type')).toContain('image/svg+xml');
    const svg = await svgResponse.text();
    expect(svg).toContain('<animate');
    expect(svg).not.toContain('<image');

    const webpResponse = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&format=webp-animated&fps=12'),
    );
    expect(webpResponse.status).toBe(200);
    expect(webpResponse.headers.get('content-type')).toContain('image/webp');
    const webp = Buffer.from(await webpResponse.arrayBuffer());
    expect(webp.toString('ascii', 0, 4)).toBe('RIFF');
    expect(webp.toString('latin1')).toContain('ANMF');
  });

  it('支持透明通道与暗黑模式下的动效生成', () => {
    const resGif = renderLogoAnimatedToBuffer(
      {
        textL: '透明',
        textR: '动图',
        transparent: true,
        fps: 10,
        duration: 0.5,
      },
      'gif',
    );
    expect(resGif.buffer.length).toBeGreaterThan(500);

    const resApng = renderLogoAnimatedToBuffer(
      {
        textL: '暗黑',
        textR: '动图',
        darkMode: true,
        fps: 10,
        duration: 0.5,
      },
      'apng',
    );
    expect(resApng.buffer.length).toBeGreaterThan(500);
  });
});
