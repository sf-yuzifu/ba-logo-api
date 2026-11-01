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

export type PaddingValue = number | string | (number | string)[];

export interface PaddingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * 解析并格式化类似 CSS 语法的留白边距 (单值 / 2值 / 3值 / 4值)，支持数字、字符串与数组
 */
export function parsePadding(input?: PaddingValue, scale = 1): PaddingBox {
  let box = [2, 2, 2, 2];

  if (typeof input === 'number') {
    const val = Number.isFinite(input) ? Math.max(0, input) : 2;
    box = [val, val, val, val];
  } else if (Array.isArray(input)) {
    const nums = input.map((n) => Math.max(0, Number(n) || 0));
    if (nums.length === 1) box = [nums[0], nums[0], nums[0], nums[0]];
    else if (nums.length === 2) box = [nums[0], nums[1], nums[0], nums[1]];
    else if (nums.length === 3) box = [nums[0], nums[1], nums[2], nums[1]];
    else if (nums.length >= 4) box = [nums[0], nums[1], nums[2], nums[3]];
  } else if (typeof input === 'string') {
    const parts = input
      .trim()
      .split(/[\s,]+/)
      .map((p) => p.replace(/px$/i, ''))
      .filter((p) => p.length > 0)
      .map((p) => Math.max(0, parseFloat(p) || 0));

    if (parts.length === 1) box = [parts[0], parts[0], parts[0], parts[0]];
    else if (parts.length === 2) box = [parts[0], parts[1], parts[0], parts[1]];
    else if (parts.length === 3) box = [parts[0], parts[1], parts[2], parts[1]];
    else if (parts.length >= 4) box = [parts[0], parts[1], parts[2], parts[3]];
  }

  return {
    top: Math.round(box[0] * scale),
    right: Math.round(box[1] * scale),
    bottom: Math.round(box[2] * scale),
    left: Math.round(box[3] * scale),
  };
}

export interface RenderOptions {
  textL?: string;
  textR?: string;
  subtitle?: string; // 可选副标题（PR #12，如 "ブルーアーカイブ"，右下方对齐绘制）
  subtitleColor?: string; // 可选副标题颜色（默认跟随右侧次要文字颜色）
  offsetX?: number;
  offsetY?: number;
  transparent?: boolean;
  padding?: PaddingValue; // 留白边距（支持数字、CSS 语法字符串如 "10 20", "10,20,30,40"、数组）
  paddingTop?: number; // 独立上留白边距（可选覆盖）
  paddingRight?: number; // 独立右留白边距（可选覆盖）
  paddingBottom?: number; // 独立下留白边距（可选覆盖）
  paddingLeft?: number; // 独立左留白边距（可选覆盖）
  center?: boolean; // 文本垂直视觉居中（有背景时默认 true，透明模式默认 false）
  accentColor?: string; // 主强调色（左文字、十字架，默认 #128AFA）
  textColor?: string; // 文字主题色（右文字、光环，默认 #2B2B2B，暗黑模式默认 #FFFFFF）
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

// 预先编译 SVG 矢量 Path2D 实例与全局单例测量画布
const haloPath = new Path2D(HALO_PATH_DATA);
const crossPath = new Path2D(CROSS_PATH_DATA);

let sharedMeasureCanvas: Canvas | null = null;
let sharedMeasureCtx: SKRSContext2D | null = null;

/**
 * 获取单例 1x1 文本度量上下文（避免每次请求重复开辟大画布测量，节约 90% 测量内存）
 */
function getMeasureCtx(): SKRSContext2D {
  if (!sharedMeasureCtx) {
    sharedMeasureCanvas = createCanvas(1, 1);
    sharedMeasureCtx = sharedMeasureCanvas.getContext('2d');
  }
  return sharedMeasureCtx;
}

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
 * 基于像素分析计算实际图形边界，并精确保留指定上下左右 padding 边缘
 * 当 center 为 true 时，以文本视觉中心对称计算纵向留白，避免文字下沉
 */
function trimCanvas(
  canvas: Canvas,
  padBox: PaddingBox,
  transparent: boolean,
  center: boolean,
  textCenterY: number,
  bgColor: string
): Canvas {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, w, h);
  const u32 = new Uint32Array(imgData.data.buffer);

  let minY = 0, maxY = h - 1, minX = 0, maxX = w - 1;
  let found = false;

  // 1. 从上往下扫描 minY（统一基于 Alpha 透明通道检测，免疫前景色与背景色相同导致的检测失效）
  topLoop: for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if ((u32[row + x] >>> 24) > 10) {
        minY = y;
        found = true;
        break topLoop;
      }
    }
  }

  if (!found) {
    if (!transparent) {
      const bgCanvas = createCanvas(w, h);
      const bgCtx = bgCanvas.getContext('2d');
      bgCtx.fillStyle = bgColor;
      bgCtx.fillRect(0, 0, w, h);
      return bgCanvas;
    }
    return canvas;
  }

  // 2. 从下往上扫描 maxY
  bottomLoop: for (let y = h - 1; y >= minY; y--) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if ((u32[row + x] >>> 24) > 10) {
        maxY = y;
        break bottomLoop;
      }
    }
  }

  // 3. 从左往右扫描 minX
  leftLoop: for (let x = 0; x < w; x++) {
    for (let y = minY; y <= maxY; y++) {
      if ((u32[y * w + x] >>> 24) > 10) {
        minX = x;
        break leftLoop;
      }
    }
  }

  // 4. 从右往左扫描 maxX
  rightLoop: for (let x = w - 1; x >= minX; x--) {
    for (let y = minY; y <= maxY; y++) {
      if ((u32[y * w + x] >>> 24) > 10) {
        maxX = x;
        break rightLoop;
      }
    }
  }

  // 如果启用 center 文本视觉居中（对称上下留白，消除文字下沉感）
  let effMaxY = maxY;
  if (center) {
    const distTop = textCenterY - minY;
    if (distTop > 0) {
      effMaxY = Math.max(maxY, Math.round(textCenterY + distTop));
    }
  }

  const contentW = maxX - minX + 1;
  const contentH = effMaxY - minY + 1;
  const targetW = contentW + padBox.left + padBox.right;
  const targetH = contentH + padBox.top + padBox.bottom;

  const trimmed = createCanvas(targetW, targetH);
  const tCtx = trimmed.getContext('2d');
  if (!transparent) {
    tCtx.fillStyle = bgColor;
    tCtx.fillRect(0, 0, targetW, targetH);
  }

  const srcH = Math.min(h - minY, contentH);
  tCtx.drawImage(
    canvas,
    minX,
    minY,
    contentW,
    srcH,
    padBox.left,
    padBox.top,
    contentW,
    srcH
  );
  return trimmed;
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

  // PR #6 色彩自定义与暗黑模式逻辑
  const accentColor = options.accentColor ? normalizeColor(options.accentColor) : COLORS.blue;
  const darkMode = options.darkMode ?? false;
  const swapColors = options.swapColors ?? false;

  const backgroundColor = darkMode ? COLORS.darkGray : COLORS.white;
  const defaultTextColor = darkMode ? COLORS.white : COLORS.darkGray;
  const baseTextColor = options.textColor ? normalizeColor(options.textColor) : defaultTextColor;

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

  // 1. 获取全局单例测量上下文（避免每次请求重复开辟无谓画布）
  const measureCtx = getMeasureCtx();
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

  // 计算用户自定义 padding，支持数字、CSS 语法或独立方向参数
  const padBox = parsePadding(options.padding, scale);
  if (options.paddingTop !== undefined && !Number.isNaN(Number(options.paddingTop))) {
    padBox.top = Math.max(0, Math.round(Number(options.paddingTop) * scale));
  }
  if (options.paddingRight !== undefined && !Number.isNaN(Number(options.paddingRight))) {
    padBox.right = Math.max(0, Math.round(Number(options.paddingRight) * scale));
  }
  if (options.paddingBottom !== undefined && !Number.isNaN(Number(options.paddingBottom))) {
    padBox.bottom = Math.max(0, Math.round(Number(options.paddingBottom) * scale));
  }
  if (options.paddingLeft !== undefined && !Number.isNaN(Number(options.paddingLeft))) {
    padBox.left = Math.max(0, Math.round(Number(options.paddingLeft) * scale));
  }

  const maxPadH = Math.max(padBox.left, padBox.right);
  const margin = Math.max(paddingX, maxPadH + 20 * scale);

  // 根据主副文字长度动态计算基准画布左右分界线
  const rightSpan = subtitle ? textWidthR + subtitleFontSize + margin : textWidthR + margin;
  const canvasWidthL = Math.max(textWidthL + margin, initialWidth / 2 + margin);
  const canvasWidthR = Math.max(rightSpan, initialWidth / 2 + margin);
  const totalCanvasWidth = canvasWidthL + canvasWidthR;

  // 原始光环与副标题绝对坐标
  const scaledOffsetX = offsetX * scale;
  const scaledOffsetY = offsetY * scale;
  const graphX = canvasWidthL - canvasHeight / 2 + scaledOffsetX;
  const graphY = scaledOffsetY;
  const midX = canvasWidthL;
  const subtitleX = canvasWidthL + textWidthR + subtitleFontSize;

  // 创建绘制基底画布（始终在透明通道绘制图元，由裁切层统一负责背景填充与包围盒计算）
  const canvas = createCanvas(totalCanvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, totalCanvasWidth, canvasHeight);

  // 2. 绘制左侧主文本 (textAlign = 'end')
  ctx.font = font;
  ctx.fillStyle = primaryColor;
  ctx.textAlign = 'end';
  ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
  ctx.fillText(textL, midX, canvasHeight * TEXT_BASELINE);
  ctx.resetTransform();

  // 3. 绘制光环 (Halo)
  drawVectorShape(ctx, haloPath, graphX, graphY, canvasHeight, haloColor);

  // 4. 绘制右侧文字 (次要颜色 + 描边裁切光环)
  ctx.font = font;
  ctx.textAlign = 'start';

  // 使用 destination-out 擦除下方图层，实现镂空光环
  ctx.globalCompositeOperation = 'destination-out';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = strokeWidth;
  ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
  ctx.strokeText(textR, midX, canvasHeight * TEXT_BASELINE);

  // 填充文字实体颜色
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = secondaryColor;
  ctx.fillText(textR, midX, canvasHeight * TEXT_BASELINE);
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

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000000';
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
    const subY = canvasHeight * TEXT_BASELINE + subtitleFontSize + 5 * scale;
    ctx.fillText(subtitle, subtitleX, subY);
    ctx.resetTransform();
  }

  // 7. 紧凑像素级包围盒裁切（支持四周 CSS 独立 padding 留白与文本视觉居中）
  const isCenter = options.center ?? !transparent;
  const textCenterY = canvasHeight * TEXT_BASELINE - (ascentL - descentL) / 2;
  return trimCanvas(canvas, padBox, transparent, isCenter, textCenterY, backgroundColor);
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
