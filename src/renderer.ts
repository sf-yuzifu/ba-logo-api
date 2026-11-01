import { createCanvas, Path2D, type Canvas, type SKRSContext2D } from '@napi-rs/canvas';
import { loadFonts, FONT_FAMILY } from './font.ts';
import {
  BASE_CANVAS_HEIGHT,
  BASE_CANVAS_WIDTH,
  BASE_FONT_SIZE,
  BASE_SUBTITLE_FONT_SIZE,
  TEXT_BASELINE,
  HORIZONTAL_TILT,
  PADDING_X,
  DEFAULT_GRAPH_OFFSET,
  SVG_VIEWBOX_SIZE,
  HALO_PATH_DATA,
  CROSS_PATH_DATA,
  HOLLOW_POLYGON,
  COLORS,
} from './constants.ts';

export type OutputFormat = 'png' | 'webp' | 'jpeg' | 'jpg' | 'base64';

export interface RenderOptions {
  textL?: string;
  textR?: string;
  subtitle?: string; // 可选副标题（PR #12，如 "ブルーアーカイブ"，右下方对齐绘制）
  subtitleColor?: string; // 可选副标题颜色（默认跟随右侧次要文字颜色）
  offsetX?: number;
  offsetY?: number;
  transparent?: boolean;
  crop?: boolean; // 是否自动紧凑裁切两端多余空白（默认 true）
  accentColor?: string; // 自定义主题强调色（默认 #128AFA）
  darkMode?: boolean; // 是否开启暗黑模式（默认 false）
  swapColors?: boolean; // 是否对调左右文字颜色（默认 false）
  scale?: number; // 分辨率缩放倍率（默认 1，支持 2x, 3x, 4x 等高清水印与海报分辨率）
  format?: OutputFormat; // 输出格式（'png' | 'webp' | 'jpeg' | 'jpg' | 'base64'，默认 'png'）
}

export type BaseRenderOptions = RenderOptions;

export interface RenderResult {
  canvas: Canvas;
  buffer: Buffer;
  mimeType: string;
  dataUrl: string;
  base64: string;
  width: number;
  height: number;
}

// 预先编译 SVG 矢量 Path2D 实例
const haloPath = new Path2D(HALO_PATH_DATA);
const crossPath = new Path2D(CROSS_PATH_DATA);

/**
 * 规范化十六进制颜色字符串（自动补充 # 前缀）
 */
function normalizeColor(color: string): string {
  const trimmed = color.trim();
  if (/^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    return `#${trimmed}`;
  }
  return trimmed;
}

/**
 * 绘制缩放后的 SVG Path 矢量图形
 */
function drawVectorShape(
  ctx: SKRSContext2D,
  path: Path2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x, y);
  const scale = size / SVG_VIEWBOX_SIZE;
  ctx.scale(scale, scale);
  ctx.fill(path);
  ctx.restore();
}

/**
 * 渲染 Blue Archive 基础 Logo
 */
export function renderLogo(options: RenderOptions = {}): Canvas {
  // 确保字体已加载至内存
  loadFonts();

  const textL = options.textL ?? '蔚蓝';
  const textR = options.textR ?? '档案';
  const offsetX = options.offsetX ?? DEFAULT_GRAPH_OFFSET.x;
  const offsetY = options.offsetY ?? DEFAULT_GRAPH_OFFSET.y;
  const transparent = options.transparent ?? false;
  const crop = options.crop ?? true;

  // PR #6 色彩自定义与暗黑模式逻辑
  const accentColor = options.accentColor ? normalizeColor(options.accentColor) : COLORS.blue;
  const darkMode = options.darkMode ?? false;
  const swapColors = options.swapColors ?? false;

  const backgroundColor = darkMode ? COLORS.darkGray : COLORS.white;
  const baseTextColor = darkMode ? COLORS.white : COLORS.darkGray;
  const primaryColor = swapColors ? baseTextColor : accentColor;
  const secondaryColor = swapColors ? accentColor : baseTextColor;
  const haloColor = baseTextColor;
  const crossColor = accentColor;

  // PR #9 高清缩放倍率 (支持 0.1 ~ 8x，默认 1)
  const rawScale = Number(options.scale ?? 1);
  const scale = Number.isFinite(rawScale) ? Math.min(Math.max(rawScale, 0.1), 8) : 1;

  const canvasHeight = Math.round(BASE_CANVAS_HEIGHT * scale);
  const initialWidth = Math.round(BASE_CANVAS_WIDTH * scale);
  const fontSize = Math.round(BASE_FONT_SIZE * scale);
  const paddingX = Math.round(PADDING_X * scale);
  const strokeWidth = 12 * scale;
  const font = `${fontSize}px "${FONT_FAMILY}"`;

  // PR #12 副标题配置
  const subtitle = options.subtitle?.trim();
  const subtitleColor = options.subtitleColor
    ? normalizeColor(options.subtitleColor)
    : secondaryColor;
  const subtitleFontSize = Math.round(BASE_SUBTITLE_FONT_SIZE * scale);
  const subtitleFont = `${subtitleFontSize}px "${FONT_FAMILY}"`;

  // 创建测量用临时画布与测量上下文
  const measureCanvas = createCanvas(initialWidth, canvasHeight);
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = font;

  const textMetricsL = measureCtx.measureText(textL);
  const textMetricsR = measureCtx.measureText(textR);

  // 计算斜体排版引起的文字宽度扩展
  const ascentL = textMetricsL.fontBoundingBoxAscent ?? textMetricsL.actualBoundingBoxAscent ?? 74 * scale;
  const descentL = textMetricsL.fontBoundingBoxDescent ?? textMetricsL.actualBoundingBoxDescent ?? 10 * scale;
  const ascentR = textMetricsR.fontBoundingBoxAscent ?? textMetricsR.actualBoundingBoxAscent ?? 74 * scale;
  const descentR = textMetricsR.fontBoundingBoxDescent ?? textMetricsR.actualBoundingBoxDescent ?? 10 * scale;

  const textWidthL =
    textMetricsL.width - (TEXT_BASELINE * canvasHeight + descentL) * HORIZONTAL_TILT;
  const textWidthR =
    textMetricsR.width + (TEXT_BASELINE * canvasHeight - ascentR) * HORIZONTAL_TILT;

  // 测量副标题
  let subtitleMetricsWidth = 0;
  if (subtitle) {
    measureCtx.font = subtitleFont;
    subtitleMetricsWidth = measureCtx.measureText(subtitle).width;
  }

  // 根据主副文字长度动态计算画布左右分界线
  const rightSpan = subtitle ? textWidthR + subtitleFontSize + paddingX : textWidthR + paddingX;
  const canvasWidthL = Math.max(textWidthL + paddingX, initialWidth / 2);
  const canvasWidthR = Math.max(rightSpan, initialWidth / 2);
  const totalCanvasWidth = canvasWidthL + canvasWidthR;

  // 计算副标题实际边界
  const subtitleRight = canvasWidthL + textWidthR + subtitleFontSize;
  const subtitleLeft = subtitleRight - subtitleMetricsWidth;

  // 创建正式绘制画布
  const canvas = createCanvas(totalCanvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // 1. 清空并绘制背景
  ctx.clearRect(0, 0, totalCanvasWidth, canvasHeight);
  if (!transparent) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, totalCanvasWidth, canvasHeight);
  }

  // 2. 绘制左侧主文本 (textAlign = 'end')
  ctx.font = font;
  ctx.fillStyle = primaryColor;
  ctx.textAlign = 'end';
  ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
  ctx.fillText(textL, canvasWidthL, canvasHeight * TEXT_BASELINE);
  ctx.resetTransform();

  // 3. 绘制光环 (Halo)
  const scaledOffsetX = offsetX * scale;
  const scaledOffsetY = offsetY * scale;
  const graphX = canvasWidthL - canvasHeight / 2 + scaledOffsetX;
  const graphY = scaledOffsetY;
  drawVectorShape(ctx, haloPath, graphX, graphY, canvasHeight, haloColor);

  // 4. 绘制右侧文字 (次要颜色 + 描边裁切光环)
  ctx.font = font;
  ctx.textAlign = 'start';

  // 如果是透明背景，使用 destination-out 擦除下方图层，实现镂空光环
  if (transparent) {
    ctx.globalCompositeOperation = 'destination-out';
  }
  ctx.strokeStyle = backgroundColor;
  ctx.lineWidth = strokeWidth;
  ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
  ctx.strokeText(textR, canvasWidthL, canvasHeight * TEXT_BASELINE);

  // 填充文字实体颜色
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = secondaryColor;
  ctx.fillText(textR, canvasWidthL, canvasHeight * TEXT_BASELINE);
  ctx.resetTransform();

  // 5. 绘制十字镂空多边形遮罩 (Hollow Polygon)
  ctx.beginPath();
  ctx.moveTo(
    graphX + (HOLLOW_POLYGON[0][0] / SVG_VIEWBOX_SIZE) * canvasHeight,
    graphY + (HOLLOW_POLYGON[0][1] / SVG_VIEWBOX_SIZE) * canvasHeight
  );
  for (let i = 1; i < HOLLOW_POLYGON.length; i++) {
    ctx.lineTo(
      graphX + (HOLLOW_POLYGON[i][0] / SVG_VIEWBOX_SIZE) * canvasHeight,
      graphY + (HOLLOW_POLYGON[i][1] / SVG_VIEWBOX_SIZE) * canvasHeight
    );
  }
  ctx.closePath();

  if (transparent) {
    ctx.globalCompositeOperation = 'destination-out';
  }
  ctx.fillStyle = backgroundColor;
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // 6. 绘制十字 (Cross)
  drawVectorShape(ctx, crossPath, graphX, graphY, canvasHeight, crossColor);

  // 6.5 绘制可选副标题 (PR #12)
  if (subtitle) {
    ctx.font = subtitleFont;
    ctx.fillStyle = subtitleColor;
    ctx.textAlign = 'end';
    ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
    const subX = subtitleRight;
    const subY = canvasHeight * TEXT_BASELINE + subtitleFontSize + 5 * scale;
    ctx.fillText(subtitle, subX, subY);
    ctx.resetTransform();
  }

  // 7. 紧凑裁切边界（修复 PR #1 并兼顾短文本与副标题完整性）
  if (crop) {
    const graphRight = graphX + canvasHeight;
    // 汇总所有元素的最小左边界与最大右边界
    let minLeft = Math.min(canvasWidthL - textWidthL - paddingX, graphX);
    let maxRight = Math.max(canvasWidthL + textWidthR + paddingX, graphRight);

    if (subtitle) {
      minLeft = Math.min(minLeft, subtitleLeft - paddingX);
      maxRight = Math.max(maxRight, subtitleRight + paddingX);
    }

    const safeLeft = Math.max(0, Math.floor(minLeft));
    const safeRight = Math.min(totalCanvasWidth, Math.ceil(maxRight));
    const croppedWidth = safeRight - safeLeft;

    if (croppedWidth < totalCanvasWidth) {
      const croppedCanvas = createCanvas(croppedWidth, canvasHeight);
      const croppedCtx = croppedCanvas.getContext('2d');
      croppedCtx.drawImage(
        canvas,
        safeLeft,
        0,
        croppedWidth,
        canvasHeight,
        0,
        0,
        croppedWidth,
        canvasHeight
      );
      return croppedCanvas;
    }
  }

  return canvas;
}

/**
 * 渲染并导出指定格式的 Logo 图片数据包（支持 png, webp, jpeg, base64）
 */
export function renderLogoToBuffer(options: RenderOptions = {}): RenderResult {
  const format = (options.format ?? 'png').toLowerCase() as OutputFormat;
  const isJpeg = format === 'jpeg' || format === 'jpg';

  // JPEG 格式不支持 alpha 透明度通道，遇透明设置强制关闭以规避黑底瑕疵
  const actualTransparent = isJpeg ? false : (options.transparent ?? false);
  const canvas = renderLogo({
    ...options,
    transparent: actualTransparent,
  });

  let buffer: Buffer;
  let mimeType: string;

  if (isJpeg) {
    mimeType = 'image/jpeg';
    buffer = canvas.toBuffer('image/jpeg', 90);
  } else if (format === 'webp') {
    mimeType = 'image/webp';
    buffer = canvas.toBuffer('image/webp', 90);
  } else {
    // png 以及 base64 默认使用高质量 png 编码
    mimeType = 'image/png';
    buffer = canvas.toBuffer('image/png');
  }

  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return {
    canvas,
    buffer,
    mimeType,
    dataUrl,
    base64,
    width: canvas.width,
    height: canvas.height,
  };
}
