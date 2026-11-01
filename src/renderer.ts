import {
  type Canvas,
  convertSVGTextToPath,
  createCanvas,
  Path2D,
  type SKRSContext2D,
} from '@napi-rs/canvas';
import {
  BASE_CANVAS_HEIGHT,
  BASE_CANVAS_WIDTH,
  BASE_FONT_SIZE,
  BASE_SUBTITLE_FONT_SIZE,
  COLORS,
  CROSS_PATH_DATA,
  DEFAULT_GRAPH_OFFSET,
  HALO_PATH_DATA,
  HOLLOW_POLYGON,
  HORIZONTAL_TILT,
  PADDING_X,
  SVG_VIEWBOX_SIZE,
  TEXT_BASELINE,
} from './constants.ts';
import { FONT_FAMILY, loadFonts } from './font.ts';

export type OutputFormat = 'png' | 'webp' | 'jpeg' | 'jpg' | 'base64' | 'svg';

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
  subtitleOffsetX?: number; // 副标题 X 轴偏移量微调（像素，默认 0）
  subtitleOffsetY?: number; // 副标题 Y 轴偏移量微调（像素，默认 0）
  offsetX?: number;
  offsetY?: number;
  transparent?: boolean;
  padding?: PaddingValue; // 留白边距（支持数字、CSS 语法字符串如 "10 20", "10,20,30,40"、数组）
  paddingTop?: number; // 独立上留白边距（可选覆盖）
  paddingRight?: number; // 独立右留白边距（可选覆盖）
  paddingBottom?: number; // 独立下留白边距（可选覆盖）
  paddingLeft?: number; // 独立左留白边距（可选覆盖）
  wordGap?: number; // 两词之间的间隔距离（像素，默认 0，范围 -100 ~ 300，随 scale 缩放）
  center?: boolean; // 文本垂直视觉居中（有背景时默认 true，透明模式默认 false）
  accentColor?: string; // 主强调色（左文字、十字架，默认 #128AFA）
  textColor?: string; // 文字主题色（右文字、光环，默认 #2B2B2B，暗黑模式默认 #FFFFFF）
  crossColor?: string; // 可选十字独立颜色（默认跟随 accentColor）
  haloColor?: string; // 可选光环独立颜色（默认跟随 textColor）
  motifsBehindText?: boolean; // 是否将十字与光环置于文字图层下方（默认 false）
  darkMode?: boolean; // 是否开启暗黑模式（默认 false）
  swapColors?: boolean; // 是否对调左右文字颜色（默认 false）
  scale?: number; // 分辨率缩放倍率（默认 1，支持 2x, 3x, 4x 等高清水印与海报分辨率）
  format?: OutputFormat; // 输出格式（'png' | 'webp' | 'jpeg' | 'jpg' | 'base64'，默认 'png'）
}

export interface RenderResult {
  canvas?: Canvas;
  buffer: Buffer;
  mimeType: string;
  dataUrl: string;
  base64: string;
  svg?: string;
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
  color: string,
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
  bgColor: string,
): Canvas {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, w, h);
  const u32 = new Uint32Array(imgData.data.buffer);

  let minY = 0,
    maxY = h - 1,
    minX = 0,
    maxX = w - 1;
  let found = false;

  // 1. 从上往下扫描 minY（统一基于 Alpha 透明通道检测，免疫前景色与背景色相同导致的检测失效）
  topLoop: for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (u32[row + x] >>> 24 > 10) {
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
      if (u32[row + x] >>> 24 > 10) {
        maxY = y;
        break bottomLoop;
      }
    }
  }

  // 3. 从左往右扫描 minX
  leftLoop: for (let x = 0; x < w; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (u32[y * w + x] >>> 24 > 10) {
        minX = x;
        break leftLoop;
      }
    }
  }

  // 4. 从右往左扫描 maxX
  rightLoop: for (let x = w - 1; x >= minX; x--) {
    for (let y = minY; y <= maxY; y++) {
      if (u32[y * w + x] >>> 24 > 10) {
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
  tCtx.drawImage(canvas, minX, minY, contentW, srcH, padBox.left, padBox.top, contentW, srcH);
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
  const defaultHaloColor = swapColors ? accentColor : baseTextColor;
  const defaultCrossColor = swapColors ? baseTextColor : accentColor;
  const haloColor = options.haloColor ? normalizeColor(options.haloColor) : defaultHaloColor;
  const crossColor = options.crossColor ? normalizeColor(options.crossColor) : defaultCrossColor;
  const motifsBehindText = options.motifsBehindText ?? false;

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
  const ascentL =
    textMetricsL.fontBoundingBoxAscent ?? textMetricsL.actualBoundingBoxAscent ?? 74 * scale;
  const descentL =
    textMetricsL.fontBoundingBoxDescent ?? textMetricsL.actualBoundingBoxDescent ?? 10 * scale;
  const ascentR =
    textMetricsR.fontBoundingBoxAscent ?? textMetricsR.actualBoundingBoxAscent ?? 74 * scale;

  const textWidthL =
    textMetricsL.width - (TEXT_BASELINE * canvasHeight + descentL) * HORIZONTAL_TILT;
  const textWidthR =
    textMetricsR.width + (TEXT_BASELINE * canvasHeight - ascentR) * HORIZONTAL_TILT;

  // 测量副标题排版边界
  let subtitleMetricsWidth = 0;
  let subAscent = 26 * scale;
  let subDescent = 6 * scale;
  let minSubX_rel = 0;
  let maxSubX_rel = 0;

  const rawSubOffsetX = Number(options.subtitleOffsetX ?? 0);
  const rawSubOffsetY = Number(options.subtitleOffsetY ?? 0);
  const scaledSubOffsetX = Number.isFinite(rawSubOffsetX) ? rawSubOffsetX * scale : 0;
  const scaledSubOffsetY = Number.isFinite(rawSubOffsetY) ? rawSubOffsetY * scale : 0;

  const subY = canvasHeight * TEXT_BASELINE + subtitleFontSize + 5 * scale + scaledSubOffsetY;

  if (subtitle) {
    measureCtx.font = subtitleFont;
    const subMetrics = measureCtx.measureText(subtitle);
    subtitleMetricsWidth = subMetrics.width;
    subAscent =
      subMetrics.fontBoundingBoxAscent ?? subMetrics.actualBoundingBoxAscent ?? 26 * scale;
    subDescent =
      subMetrics.fontBoundingBoxDescent ?? subMetrics.actualBoundingBoxDescent ?? 6 * scale;

    const subtitleX_rel = textWidthR + subtitleFontSize + scaledSubOffsetX;
    // 斜体转换下，副标题相对于 midX 的屏幕 X 范围
    minSubX_rel = subtitleX_rel - subtitleMetricsWidth + HORIZONTAL_TILT * (subY + subDescent);
    maxSubX_rel = subtitleX_rel + HORIZONTAL_TILT * (subY - subAscent);
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

  const scaledOffsetX = offsetX * scale;
  const scaledOffsetY = offsetY * scale;

  // 词间距（wordGap，范围 -100 ~ 300）
  const rawWordGap = Number(options.wordGap ?? 0);
  const wordGap = Number.isFinite(rawWordGap)
    ? Math.min(Math.max(rawWordGap, -100), 300) * scale
    : 0;
  const halfGap = Math.round(wordGap / 2);

  // 综合主文字、副标题、光环偏移量与词间距，动态计算基底画布左右所需空间（防止超长副标题被截断）
  const needLeft = Math.max(
    textWidthL + halfGap,
    canvasHeight / 2 - scaledOffsetX - halfGap,
    subtitle ? -(minSubX_rel + halfGap) : 0,
    initialWidth / 2,
  );
  const needRight = Math.max(
    textWidthR + halfGap,
    canvasHeight / 2 + scaledOffsetX + halfGap,
    subtitle ? maxSubX_rel + halfGap : 0,
    initialWidth / 2,
  );

  const canvasWidthL = Math.ceil(needLeft + margin);
  const canvasWidthR = Math.ceil(needRight + margin);
  const totalCanvasWidth = canvasWidthL + canvasWidthR;

  // 动态扩展基底画布高度，确保副标题底部和光环上下位移有充足绘制空间
  const totalCanvasHeight = Math.max(
    canvasHeight,
    subtitle ? Math.ceil(subY + subDescent + margin) : 0,
    Math.ceil(scaledOffsetY + canvasHeight + margin),
  );

  // 左右文字在中央分界线两侧施加 ± halfGap 偏移
  const leftTextX = canvasWidthL - halfGap;
  const rightTextX = canvasWidthL + halfGap;
  const graphX = rightTextX - canvasHeight / 2 + scaledOffsetX;
  const graphY = scaledOffsetY;
  const subtitleX = rightTextX + textWidthR + subtitleFontSize + scaledSubOffsetX;

  // 创建绘制基底画布（始终在透明通道绘制图元，由裁切层统一负责背景填充与包围盒计算）
  const canvas = createCanvas(totalCanvasWidth, totalCanvasHeight);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, totalCanvasWidth, totalCanvasHeight);

  if (motifsBehindText) {
    // 【图标置底模式】：光环与十字位于文字图层下方，文字无镂空遮挡
    // 1. 绘制光环 (Halo)
    drawVectorShape(ctx, haloPath, graphX, graphY, canvasHeight, haloColor);

    // 2. 绘制十字镂空多边形遮罩 (Hollow Polygon)
    ctx.beginPath();
    ctx.moveTo(
      graphX + (HOLLOW_POLYGON[0][0] / SVG_VIEWBOX_SIZE) * canvasHeight,
      graphY + (HOLLOW_POLYGON[0][1] / SVG_VIEWBOX_SIZE) * canvasHeight,
    );
    for (let i = 1; i < HOLLOW_POLYGON.length; i++) {
      ctx.lineTo(
        graphX + (HOLLOW_POLYGON[i][0] / SVG_VIEWBOX_SIZE) * canvasHeight,
        graphY + (HOLLOW_POLYGON[i][1] / SVG_VIEWBOX_SIZE) * canvasHeight,
      );
    }
    ctx.closePath();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // 3. 绘制十字 (Cross)
    drawVectorShape(ctx, crossPath, graphX, graphY, canvasHeight, crossColor);

    // 4. 绘制左侧主文本 (textAlign = 'end')
    ctx.font = font;
    ctx.fillStyle = primaryColor;
    ctx.textAlign = 'end';
    ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
    ctx.fillText(textL, leftTextX, canvasHeight * TEXT_BASELINE);
    ctx.resetTransform();

    // 5. 绘制右侧文字 (直接绘制在光环/十字上方)
    ctx.font = font;
    ctx.textAlign = 'start';
    ctx.fillStyle = secondaryColor;
    ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
    ctx.fillText(textR, rightTextX, canvasHeight * TEXT_BASELINE);
    ctx.resetTransform();
  } else {
    // 【官方标准层级模式】：左文字 -> 光环 -> 右文字描边镂空光环 -> 右文字填充 -> 镂空多边形 -> 十字
    // 2. 绘制左侧主文本 (textAlign = 'end')
    ctx.font = font;
    ctx.fillStyle = primaryColor;
    ctx.textAlign = 'end';
    ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
    ctx.fillText(textL, leftTextX, canvasHeight * TEXT_BASELINE);
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
    ctx.strokeText(textR, rightTextX, canvasHeight * TEXT_BASELINE);

    // 填充文字实体颜色
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = secondaryColor;
    ctx.fillText(textR, rightTextX, canvasHeight * TEXT_BASELINE);
    ctx.resetTransform();

    // 5. 绘制十字镂空多边形遮罩 (Hollow Polygon)
    ctx.beginPath();
    ctx.moveTo(
      graphX + (HOLLOW_POLYGON[0][0] / SVG_VIEWBOX_SIZE) * canvasHeight,
      graphY + (HOLLOW_POLYGON[0][1] / SVG_VIEWBOX_SIZE) * canvasHeight,
    );
    for (let i = 1; i < HOLLOW_POLYGON.length; i++) {
      ctx.lineTo(
        graphX + (HOLLOW_POLYGON[i][0] / SVG_VIEWBOX_SIZE) * canvasHeight,
        graphY + (HOLLOW_POLYGON[i][1] / SVG_VIEWBOX_SIZE) * canvasHeight,
      );
    }
    ctx.closePath();

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // 6. 绘制十字 (Cross)
    drawVectorShape(ctx, crossPath, graphX, graphY, canvasHeight, crossColor);
  }

  // 6.5 绘制可选副标题 (PR #12)
  if (subtitle) {
    ctx.font = subtitleFont;
    ctx.fillStyle = subtitleColor;
    ctx.textAlign = 'end';
    ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
    ctx.fillText(subtitle, subtitleX, subY);
    ctx.resetTransform();
  }

  // 7. 紧凑像素级包围盒裁切（支持四周 CSS 独立 padding 留白与文本视觉居中）
  const isCenter = options.center ?? !transparent;
  const textCenterY = canvasHeight * TEXT_BASELINE - (ascentL - descentL) / 2;
  return trimCanvas(canvas, padBox, transparent, isCenter, textCenterY, backgroundColor);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function textToVectorSvg(
  text: string,
  fontSize: number,
  anchor: 'start' | 'end' = 'start',
): string {
  if (!text) return '';
  const dummySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="2000"><text x="1000" y="1000" font-family="${FONT_FAMILY}" font-size="${fontSize}" text-anchor="${anchor}">${escapeXml(
    text,
  )}</text></svg>`;
  const res = convertSVGTextToPath(dummySvg).toString('utf8');

  const pathRegex = /<path\s+([^>]+)\/>/g;
  const paths: string[] = [];
  for (const match of res.matchAll(pathRegex)) {
    paths.push(`<path ${match[1]}/>`);
  }

  return `<g transform="translate(-1000 -1000)">${paths.join('')}</g>`;
}

/**
 * 渲染纯矢量 SVG 格式 Logo（包含汉字轮廓化 Path，无需客户端安装字体，支持 Figma / AI 无损缩放）
 */
export function renderLogoSvg(options: RenderOptions = {}): string {
  loadFonts();

  const scale = Number(options.scale ?? 1);
  const textL = options.textL ?? '蔚蓝';
  const textR = options.textR ?? '档案';
  const subtitle = options.subtitle?.trim();
  const offsetX = options.offsetX ?? DEFAULT_GRAPH_OFFSET.x;
  const offsetY = options.offsetY ?? DEFAULT_GRAPH_OFFSET.y;
  const subX = options.subtitleOffsetX ?? 0;
  const subYOffset = options.subtitleOffsetY ?? 0;
  const transparent = options.transparent ?? false;
  const darkMode = options.darkMode ?? false;
  const swapColors = options.swapColors ?? false;
  const motifsBehindText = options.motifsBehindText ?? false;

  const accentColor = options.accentColor ? normalizeColor(options.accentColor) : COLORS.blue;
  const defaultTextColor = darkMode ? COLORS.white : COLORS.darkGray;
  const baseTextColor = options.textColor ? normalizeColor(options.textColor) : defaultTextColor;
  const backgroundColor = darkMode ? COLORS.darkGray : COLORS.white;

  const primaryColor = swapColors ? baseTextColor : accentColor;
  const secondaryColor = swapColors ? accentColor : baseTextColor;
  const defaultHaloColor = swapColors ? accentColor : baseTextColor;
  const defaultCrossColor = swapColors ? baseTextColor : accentColor;
  const haloColor = options.haloColor ? normalizeColor(options.haloColor) : defaultHaloColor;
  const crossColor = options.crossColor ? normalizeColor(options.crossColor) : defaultCrossColor;
  const subtitleColor = options.subtitleColor
    ? normalizeColor(options.subtitleColor)
    : secondaryColor;

  const canvasHeight = Math.round(BASE_CANVAS_HEIGHT * scale);
  const initialWidth = Math.round(BASE_CANVAS_WIDTH * scale);
  const fontSize = Math.round(BASE_FONT_SIZE * scale);
  const paddingX = Math.round(PADDING_X * scale);
  const strokeWidth = 12 * scale;
  const subtitleFontSize = Math.round(BASE_SUBTITLE_FONT_SIZE * scale);

  const vectorL = textToVectorSvg(textL, fontSize, 'end');
  const vectorR = textToVectorSvg(textR, fontSize, 'start');
  const vectorSub = subtitle ? textToVectorSvg(subtitle, subtitleFontSize, 'end') : '';

  const measureCtx = getMeasureCtx();
  measureCtx.font = `${fontSize}px "${FONT_FAMILY}"`;
  const textMetricsL = measureCtx.measureText(textL);
  const textMetricsR = measureCtx.measureText(textR);

  const ascentL =
    textMetricsL.fontBoundingBoxAscent ?? textMetricsL.actualBoundingBoxAscent ?? 74 * scale;
  const descentL =
    textMetricsL.fontBoundingBoxDescent ?? textMetricsL.actualBoundingBoxDescent ?? 10 * scale;
  const ascentR =
    textMetricsR.fontBoundingBoxAscent ?? textMetricsR.actualBoundingBoxAscent ?? 74 * scale;

  const textWidthL =
    textMetricsL.width - (TEXT_BASELINE * canvasHeight + descentL) * HORIZONTAL_TILT;
  const textWidthR =
    textMetricsR.width + (TEXT_BASELINE * canvasHeight - ascentR) * HORIZONTAL_TILT;

  let subtitleMetricsWidth = 0;
  let subAscent = 26 * scale;
  let subDescent = 6 * scale;
  let minSubX_rel = 0;
  let maxSubX_rel = 0;

  const scaledSubOffsetX = subX * scale;
  const scaledSubOffsetY = subYOffset * scale;
  const subY = canvasHeight * TEXT_BASELINE + subtitleFontSize + 5 * scale + scaledSubOffsetY;

  if (subtitle) {
    measureCtx.font = `${subtitleFontSize}px "${FONT_FAMILY}"`;
    const subMetrics = measureCtx.measureText(subtitle);
    subtitleMetricsWidth = subMetrics.width;
    subAscent =
      subMetrics.fontBoundingBoxAscent ?? subMetrics.actualBoundingBoxAscent ?? 26 * scale;
    subDescent =
      subMetrics.fontBoundingBoxDescent ?? subMetrics.actualBoundingBoxDescent ?? 6 * scale;

    const subtitleX_rel = textWidthR + subtitleFontSize + scaledSubOffsetX;
    minSubX_rel = subtitleX_rel - subtitleMetricsWidth + HORIZONTAL_TILT * (subY + subDescent);
    maxSubX_rel = subtitleX_rel + HORIZONTAL_TILT * (subY - subAscent);
  }

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

  const scaledOffsetX = offsetX * scale;
  const scaledOffsetY = offsetY * scale;

  const rawWordGap = Number(options.wordGap ?? 0);
  const wordGapVal = Number.isFinite(rawWordGap)
    ? Math.min(Math.max(rawWordGap, -100), 300) * scale
    : 0;
  const halfGap = Math.round(wordGapVal / 2);

  const needLeft = Math.max(
    textWidthL + halfGap,
    canvasHeight / 2 - scaledOffsetX - halfGap,
    subtitle ? -(minSubX_rel + halfGap) : 0,
    initialWidth / 2,
  );
  const needRight = Math.max(
    textWidthR + halfGap,
    canvasHeight / 2 + scaledOffsetX + halfGap,
    subtitle ? maxSubX_rel + halfGap : 0,
    initialWidth / 2,
  );

  const canvasWidthL = Math.ceil(needLeft + margin);
  const canvasWidthR = Math.ceil(needRight + margin);
  const totalCanvasWidth = canvasWidthL + canvasWidthR;
  const totalCanvasHeight = Math.max(
    canvasHeight,
    subtitle ? Math.ceil(subY + subDescent + margin) : 0,
    Math.ceil(scaledOffsetY + canvasHeight + margin),
  );

  const leftTextX = canvasWidthL - halfGap;
  const rightTextX = canvasWidthL + halfGap;
  const graphX = rightTextX - canvasHeight / 2 + scaledOffsetX;
  const graphY = scaledOffsetY;
  const subtitleX = rightTextX + textWidthR + subtitleFontSize + scaledSubOffsetX;

  const scanCanvas = createCanvas(totalCanvasWidth, totalCanvasHeight);
  const sCtx = scanCanvas.getContext('2d');
  sCtx.font = `${fontSize}px "${FONT_FAMILY}"`;
  sCtx.fillStyle = '#fff';
  sCtx.textAlign = 'end';
  sCtx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
  sCtx.fillText(textL, leftTextX, canvasHeight * TEXT_BASELINE);
  sCtx.resetTransform();

  sCtx.save();
  sCtx.translate(graphX, graphY);
  sCtx.scale(canvasHeight / SVG_VIEWBOX_SIZE, canvasHeight / SVG_VIEWBOX_SIZE);
  sCtx.fill(new Path2D(HALO_PATH_DATA));
  sCtx.fill(new Path2D(CROSS_PATH_DATA));
  sCtx.restore();

  sCtx.font = `${fontSize}px "${FONT_FAMILY}"`;
  sCtx.textAlign = 'start';
  sCtx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
  sCtx.fillText(textR, rightTextX, canvasHeight * TEXT_BASELINE);
  sCtx.resetTransform();

  if (subtitle) {
    sCtx.font = `${subtitleFontSize}px "${FONT_FAMILY}"`;
    sCtx.textAlign = 'end';
    sCtx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
    sCtx.fillText(subtitle, subtitleX, subY);
    sCtx.resetTransform();
  }

  const imgData = sCtx.getImageData(0, 0, totalCanvasWidth, totalCanvasHeight);
  const u32 = new Uint32Array(imgData.data.buffer);
  let minX = totalCanvasWidth,
    minY = totalCanvasHeight,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < totalCanvasHeight; y++) {
    const row = y * totalCanvasWidth;
    for (let x = 0; x < totalCanvasWidth; x++) {
      if (u32[row + x] >>> 24 > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const isCenter = options.center ?? !transparent;
  const textCenterY = canvasHeight * TEXT_BASELINE - (ascentL - descentL) / 2;
  let effMaxY = maxY;
  if (isCenter) {
    const distTop = textCenterY - minY;
    if (distTop > 0) effMaxY = Math.max(maxY, Math.round(textCenterY + distTop));
  }

  const contentW = maxX - minX + 1;
  const contentH = effMaxY - minY + 1;
  const finalW = contentW + padBox.left + padBox.right;
  const finalH = contentH + padBox.top + padBox.bottom;

  const vx = (minX - padBox.left).toFixed(2);
  const vy = (minY - padBox.top).toFixed(2);

  const hollowPoints = HOLLOW_POLYGON.map(
    (p) =>
      `${(graphX + (p[0] / SVG_VIEWBOX_SIZE) * canvasHeight).toFixed(2)},${(
        graphY + (p[1] / SVG_VIEWBOX_SIZE) * canvasHeight
      ).toFixed(2)}`,
  ).join(' ');

  const haloScale = (canvasHeight / SVG_VIEWBOX_SIZE).toFixed(4);
  const baseL = canvasHeight * TEXT_BASELINE;
  const transX_L = (leftTextX + HORIZONTAL_TILT * baseL).toFixed(2);
  const transX_R = (rightTextX + HORIZONTAL_TILT * baseL).toFixed(2);

  let svg = `<?xml version="1.0" encoding="utf-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${finalW}" height="${finalH}" viewBox="${vx} ${vy} ${finalW} ${finalH}">\n`;

  if (!transparent) {
    svg += `  <rect x="${vx}" y="${vy}" width="${finalW}" height="${finalH}" fill="${backgroundColor}"/>\n`;
  }

  if (motifsBehindText) {
    svg += `  <g transform="translate(${graphX} ${graphY}) scale(${haloScale})">\n`;
    svg += `    <path fill="${haloColor}" d="${HALO_PATH_DATA}"/>\n`;
    svg += `  </g>\n`;
    svg += `  <polygon points="${hollowPoints}" fill="${transparent ? 'none' : backgroundColor}"/>\n`;
    svg += `  <g transform="translate(${graphX} ${graphY}) scale(${haloScale})">\n`;
    svg += `    <path fill="${crossColor}" d="${CROSS_PATH_DATA}"/>\n`;
    svg += `  </g>\n`;
    svg += `  <g transform="matrix(1 0 ${HORIZONTAL_TILT} 1 ${transX_L} ${baseL.toFixed(2)})" fill="${primaryColor}">\n`;
    svg += `    ${vectorL}\n`;
    svg += `  </g>\n`;
    svg += `  <g transform="matrix(1 0 ${HORIZONTAL_TILT} 1 ${transX_R} ${baseL.toFixed(2)})" fill="${secondaryColor}">\n`;
    svg += `    ${vectorR}\n`;
    svg += `  </g>\n`;
  } else {
    svg += `  <g transform="matrix(1 0 ${HORIZONTAL_TILT} 1 ${transX_L} ${baseL.toFixed(2)})" fill="${primaryColor}">\n`;
    svg += `    ${vectorL}\n`;
    svg += `  </g>\n`;

    svg += `  <defs>\n`;
    svg += `    <mask id="ba-halo-mask" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">\n`;
    svg += `      <rect x="-5000" y="-5000" width="10000" height="10000" fill="white"/>\n`;
    svg += `      <polygon points="${hollowPoints}" fill="black"/>\n`;
    svg += `      <g transform="matrix(1 0 ${HORIZONTAL_TILT} 1 ${transX_R} ${baseL.toFixed(2)})" fill="black" stroke="black" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round">\n`;
    svg += `        ${vectorR}\n`;
    svg += `      </g>\n`;
    svg += `    </mask>\n`;
    svg += `  </defs>\n`;

    svg += `  <g transform="translate(${graphX} ${graphY}) scale(${haloScale})" mask="url(#ba-halo-mask)">\n`;
    svg += `    <path fill="${haloColor}" d="${HALO_PATH_DATA}"/>\n`;
    svg += `  </g>\n`;

    svg += `  <g transform="matrix(1 0 ${HORIZONTAL_TILT} 1 ${transX_R} ${baseL.toFixed(2)})" fill="${secondaryColor}">\n`;
    svg += `    ${vectorR}\n`;
    svg += `  </g>\n`;

    svg += `  <g transform="translate(${graphX} ${graphY}) scale(${haloScale})">\n`;
    svg += `    <path fill="${crossColor}" d="${CROSS_PATH_DATA}"/>\n`;
    svg += `  </g>\n`;
  }

  if (subtitle && vectorSub) {
    const transX_Sub = (subtitleX + HORIZONTAL_TILT * subY).toFixed(2);
    svg += `  <g transform="matrix(1 0 ${HORIZONTAL_TILT} 1 ${transX_Sub} ${subY.toFixed(2)})" fill="${subtitleColor}">\n`;
    svg += `    ${vectorSub}\n`;
    svg += `  </g>\n`;
  }

  svg += `</svg>\n`;
  return svg;
}

/**
 * 渲染并导出指定格式的 Logo 图片数据包（支持 png, webp, jpeg, svg, base64）
 */
export function renderLogoToBuffer(options: RenderOptions = {}): RenderResult {
  const format = (options.format ?? 'png').toLowerCase() as OutputFormat;

  if (format === 'svg') {
    const svg = renderLogoSvg(options);
    const buffer = Buffer.from(svg, 'utf8');
    const mimeType = 'image/svg+xml; charset=utf-8';
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const vbMatch = /viewBox="[^"]+\s+([\d.]+)\s+([\d.]+)"/.exec(svg);
    const width = vbMatch ? Math.round(parseFloat(vbMatch[1])) : 722;
    const height = vbMatch ? Math.round(parseFloat(vbMatch[2])) : 505;

    return {
      buffer,
      mimeType,
      dataUrl,
      base64,
      svg,
      width,
      height,
    };
  }

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
