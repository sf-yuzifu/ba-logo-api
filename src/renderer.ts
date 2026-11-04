import {
  type Canvas,
  convertSVGTextToPath,
  createCanvas,
  Path2D,
  type SKRSContext2D,
} from '@napi-rs/canvas';
import {
  BASE_CANVAS_HEIGHT,
  BASE_FONT_SIZE,
  CROSS_PATH_DATA,
  HALO_PATH_DATA,
  HOLLOW_POLYGON,
  HORIZONTAL_TILT,
  SVG_VIEWBOX_SIZE,
  TEXT_BASELINE,
} from './constants.ts';
import { FONT_FAMILY, loadFonts } from './font.ts';
import { renderLogoAnimatedToBuffer } from './render/animated.ts';
import { findAlphaBounds, trimCanvas as trimCanvasShared } from './render/bounds.ts';
import { computeLogoLayout, type LogoLayout } from './render/layout.ts';
import {
  type NormalizedRenderOptions,
  normalizeRenderOptions,
  parsePadding as parsePaddingShared,
} from './render/options.ts';

export type OutputFormat = 'png' | 'webp' | 'jpeg' | 'jpg' | 'base64' | 'svg' | 'gif' | 'apng';

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
  return parsePaddingShared(input, scale);
}

export interface RenderOptions {
  textL?: string;
  textR?: string;
  subtitle?: string; // 可选副标题（PR #12，如 "ブルーアーカイブ"，右下方对齐绘制）
  subtitleColor?: string; // 可选副标题颜色（默认跟随右侧次要文字颜色）
  subtitleOffsetX?: number; // 副标题 X 轴偏移量微调（像素，默认 0）
  subtitleOffsetY?: number; // 副标题 Y 轴偏移量微调（像素，默认 0）
  subtitleFontSize?: number; // 副标题基础字号（默认 24，范围 12~96，随 scale 缩放）
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
  format?: OutputFormat; // 输出格式（'png' | 'webp' | 'jpeg' | 'jpg' | 'base64' | 'svg' | 'gif' | 'apng'，默认 'png'）
  fps?: number; // 动图帧率（针对 gif/apng，默认 24，范围 10~30）
  duration?: number; // 动图入场时长（针对 gif/apng，秒，默认 1.1，范围 0.4~3.0）
  holdDuration?: number; // 动图定格时长（针对 gif/apng，秒，默认 1.2，范围 0.2~3.0）
}

export interface RenderResult {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  canvas?: Canvas;
  svg?: string;
  readonly base64: string;
  readonly dataUrl: string;
}

// 预先编译 SVG 矢量 Path2D 实例与全局单例测量画布
const haloPath = new Path2D(HALO_PATH_DATA);
const crossPath = new Path2D(CROSS_PATH_DATA);

let sharedMeasureCanvas: Canvas | null = null;
let sharedMeasureCtx: SKRSContext2D | null = null;

/**
 * 获取单例 1x1 文本度量上下文（避免每次请求重复开辟大画布测量，减少临时画布与内存分配）
 */
function getMeasureCtx(): SKRSContext2D {
  if (!sharedMeasureCtx) {
    sharedMeasureCanvas = createCanvas(1, 1);
    sharedMeasureCtx = sharedMeasureCanvas.getContext('2d');
  }
  return sharedMeasureCtx;
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
  return trimCanvasShared(canvas, {
    padding: padBox,
    transparent,
    center,
    textCenterY,
    backgroundColor: bgColor,
  });
}

/**
 * 渲染 Blue Archive 基础 Logo
 */
export function drawLogoCanvas(normalized: NormalizedRenderOptions, layout: LogoLayout): Canvas {
  const { textL, textR, primaryColor, secondaryColor } = normalized;
  const haloColor = normalized.haloColor;
  const crossColor = normalized.crossColor;
  const motifsBehindText = normalized.motifsBehindText;

  // PR #9 高清缩放倍率 (支持 0.1 ~ 8x，默认 1)
  const scale = normalized.scale;

  const canvasHeight = Math.round(BASE_CANVAS_HEIGHT * scale);
  const fontSize = Math.round(BASE_FONT_SIZE * scale);
  const strokeWidth = 12 * scale;
  const font = `${fontSize}px "${FONT_FAMILY}"`;

  // PR #12 副标题配置
  const subtitle = normalized.subtitle;
  const subtitleColor = normalized.subtitleColor;
  const subtitleFontSize = layout.subtitleFontSize;
  const subtitleFont = `${subtitleFontSize}px "${FONT_FAMILY}"`;

  // 1. 获取全局单例测量上下文（避免每次请求重复开辟无谓画布）
  const measureCtx = getMeasureCtx();
  measureCtx.font = font;

  measureCtx.measureText(textL);
  measureCtx.measureText(textR);

  // 综合主文字、副标题、光环偏移量与词间距，动态计算基底画布左右所需空间（防止超长副标题被截断）
  const totalCanvasWidth = layout.totalCanvasWidth;
  const totalCanvasHeight = layout.totalCanvasHeight;
  const leftTextX = layout.leftTextX;
  const rightTextX = layout.rightTextX;
  const graphX = layout.graphX;
  const graphY = layout.graphY;
  const subtitleX = layout.subtitleX;
  const subY = layout.subY;

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
  return canvas;
}

export function renderLogo(options: RenderOptions = {}): Canvas {
  loadFonts();
  const normalized = normalizeRenderOptions(options);
  const layout = computeLogoLayout(normalized);
  const canvas = drawLogoCanvas(normalized, layout);
  return trimCanvas(
    canvas,
    normalized.padding,
    normalized.transparent,
    normalized.center,
    layout.textCenterY,
    normalized.backgroundColor,
  );
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
export interface SvgRenderResult {
  svg: string;
  width: number;
  height: number;
}

export function renderLogoSvg(options: RenderOptions = {}): SvgRenderResult {
  loadFonts();
  const normalized = normalizeRenderOptions(options);
  const layout = computeLogoLayout(normalized);
  const {
    textL,
    textR,
    subtitle,
    transparent,
    motifsBehindText,
    backgroundColor,
    primaryColor,
    secondaryColor,
    haloColor,
    crossColor,
    subtitleColor,
    padding: padBox,
  } = normalized;
  const {
    canvasHeight,
    fontSize,
    subtitleFontSize,
    strokeWidth,
    graphX,
    graphY,
    subY,
    textBaseline: baseL,
    textTransformXLeft,
    textTransformXRight,
    subtitleTransformX,
  } = layout;

  const vectorL = textToVectorSvg(textL, fontSize, 'end');
  const vectorR = textToVectorSvg(textR, fontSize, 'start');
  const vectorSub = subtitle ? textToVectorSvg(subtitle, subtitleFontSize, 'end') : '';

  const renderedCanvas = drawLogoCanvas(normalized, layout);
  const scanContext = renderedCanvas.getContext('2d');
  const bounds = findAlphaBounds(
    scanContext.getImageData(0, 0, renderedCanvas.width, renderedCanvas.height).data,
    renderedCanvas.width,
    renderedCanvas.height,
    normalized.center,
    layout.textCenterY,
  );
  const finalW = bounds ? bounds.width + padBox.left + padBox.right : layout.totalCanvasWidth;
  const finalH = bounds ? bounds.height + padBox.top + padBox.bottom : layout.totalCanvasHeight;
  const vx = ((bounds?.minX ?? 0) - padBox.left).toFixed(2);
  const vy = ((bounds?.minY ?? 0) - padBox.top).toFixed(2);

  const hollowPoints = HOLLOW_POLYGON.map(
    (p) =>
      `${(graphX + (p[0] / SVG_VIEWBOX_SIZE) * canvasHeight).toFixed(2)},${(
        graphY + (p[1] / SVG_VIEWBOX_SIZE) * canvasHeight
      ).toFixed(2)}`,
  ).join(' ');

  const haloScale = (canvasHeight / SVG_VIEWBOX_SIZE).toFixed(4);
  const transX_L = textTransformXLeft.toFixed(2);
  const transX_R = textTransformXRight.toFixed(2);

  let svg = `<?xml version="1.0" encoding="utf-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${finalW}" height="${finalH}" viewBox="${vx} ${vy} ${finalW} ${finalH}">\n`;

  if (!transparent) {
    svg += `  <rect x="${vx}" y="${vy}" width="${finalW}" height="${finalH}" fill="${backgroundColor}"/>\n`;
  }

  if (motifsBehindText) {
    svg += `  <g transform="translate(${graphX} ${graphY}) scale(${haloScale})">\n`;
    svg += `    <path fill="${haloColor}" d="${HALO_PATH_DATA}"/>\n`;
    svg += `  </g>\n`;
    if (!transparent) svg += `  <polygon points="${hollowPoints}" fill="${backgroundColor}"/>\n`;
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
    svg += `      <g transform="matrix(1 0 ${HORIZONTAL_TILT} 1 ${transX_R} ${baseL.toFixed(2)})" fill="black" stroke="black" stroke-width="${strokeWidth}" stroke-linejoin="miter" stroke-linecap="butt">\n`;
    svg += `        ${vectorR}\n`;
    svg += `      </g>\n`;
    svg += `    </mask>\n`;
    svg += `    <mask id="ba-text-cutout" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">\n`;
    svg += `      <rect x="-5000" y="-5000" width="10000" height="10000" fill="white"/>\n`;
    svg += `      <polygon points="${hollowPoints}" fill="black"/>\n`;
    svg += `    </mask>\n`;
    svg += `  </defs>\n`;

    svg += `  <g mask="url(#ba-halo-mask)">\n`;
    svg += `    <g transform="translate(${graphX} ${graphY}) scale(${haloScale})">\n`;
    svg += `      <path fill="${haloColor}" d="${HALO_PATH_DATA}"/>\n`;
    svg += `    </g>\n`;
    svg += `  </g>\n`;

    svg += `  <g mask="url(#ba-text-cutout)">\n`;
    svg += `    <g transform="matrix(1 0 ${HORIZONTAL_TILT} 1 ${transX_R} ${baseL.toFixed(2)})" fill="${secondaryColor}">\n`;
    svg += `      ${vectorR}\n`;
    svg += `    </g>\n`;
    svg += `  </g>\n`;

    svg += `  <g transform="translate(${graphX} ${graphY}) scale(${haloScale})">\n`;
    svg += `    <path fill="${crossColor}" d="${CROSS_PATH_DATA}"/>\n`;
    svg += `  </g>\n`;
  }

  if (subtitle && vectorSub) {
    const transX_Sub = subtitleTransformX.toFixed(2);
    svg += `  <g transform="matrix(1 0 ${HORIZONTAL_TILT} 1 ${transX_Sub} ${subY.toFixed(2)})" fill="${subtitleColor}">\n`;
    svg += `    ${vectorSub}\n`;
    svg += `  </g>\n`;
  }

  svg += `</svg>\n`;
  return { svg, width: finalW, height: finalH };
}

/**
 * 渲染并导出指定格式的 Logo 图片数据包（支持 png, webp, jpeg, svg, base64）
 */
export function renderLogoToBuffer(options: RenderOptions = {}): RenderResult {
  const format = (options.format ?? 'png').toLowerCase() as OutputFormat;

  if (format === 'svg') {
    const { svg, width, height } = renderLogoSvg(options);
    const buffer = Buffer.from(svg, 'utf8');
    const mimeType = 'image/svg+xml; charset=utf-8';
    let cachedBase64: string | undefined;
    let cachedDataUrl: string | undefined;

    return {
      buffer,
      mimeType,
      svg,
      width,
      height,
      get base64() {
        if (cachedBase64 === undefined) {
          cachedBase64 = buffer.toString('base64');
        }
        return cachedBase64;
      },
      get dataUrl() {
        if (cachedDataUrl === undefined) {
          cachedDataUrl = `data:${mimeType};base64,${this.base64}`;
        }
        return cachedDataUrl;
      },
    };
  }

  if (format === 'gif' || format === 'apng') {
    const animRes = renderLogoAnimatedToBuffer(options, format);
    let cachedBase64: string | undefined;
    let cachedDataUrl: string | undefined;

    return {
      buffer: animRes.buffer,
      mimeType: animRes.mimeType,
      width: animRes.width,
      height: animRes.height,
      get base64() {
        if (cachedBase64 === undefined) {
          cachedBase64 = animRes.buffer.toString('base64');
        }
        return cachedBase64;
      },
      get dataUrl() {
        if (cachedDataUrl === undefined) {
          cachedDataUrl = `data:${animRes.mimeType};base64,${this.base64}`;
        }
        return cachedDataUrl;
      },
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

  const width = canvas.width;
  const height = canvas.height;
  let cachedBase64: string | undefined;
  let cachedDataUrl: string | undefined;

  return {
    buffer,
    mimeType,
    width,
    height,
    get base64() {
      if (cachedBase64 === undefined) {
        cachedBase64 = buffer.toString('base64');
      }
      return cachedBase64;
    },
    get dataUrl() {
      if (cachedDataUrl === undefined) {
        cachedDataUrl = `data:${mimeType};base64,${this.base64}`;
      }
      return cachedDataUrl;
    },
  };
}
