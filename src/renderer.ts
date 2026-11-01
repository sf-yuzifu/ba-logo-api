import { createCanvas, Path2D, type Canvas, type SKRSContext2D } from '@napi-rs/canvas';
import { loadFonts, FONT_FAMILY } from './font.ts';
import {
  BASE_CANVAS_HEIGHT,
  BASE_CANVAS_WIDTH,
  BASE_FONT_SIZE,
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

export interface BaseRenderOptions {
  textL?: string;
  textR?: string;
  offsetX?: number;
  offsetY?: number;
  transparent?: boolean;
  crop?: boolean; // 是否自动紧凑裁切两端多余空白（默认 true）
}

// 预先编译 SVG 矢量 Path2D 实例
const haloPath = new Path2D(HALO_PATH_DATA);
const crossPath = new Path2D(CROSS_PATH_DATA);

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
export function renderLogo(options: BaseRenderOptions = {}): Canvas {
  // 确保字体已加载至内存
  loadFonts();

  const textL = options.textL ?? '蔚蓝';
  const textR = options.textR ?? '档案';
  const offsetX = options.offsetX ?? DEFAULT_GRAPH_OFFSET.x;
  const offsetY = options.offsetY ?? DEFAULT_GRAPH_OFFSET.y;
  const transparent = options.transparent ?? false;
  const crop = options.crop ?? true;

  const canvasHeight = BASE_CANVAS_HEIGHT;
  const initialWidth = BASE_CANVAS_WIDTH;
  const font = `${BASE_FONT_SIZE}px "${FONT_FAMILY}"`;

  // 创建测量用临时画布与测量上下文
  const measureCanvas = createCanvas(initialWidth, canvasHeight);
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = font;

  const textMetricsL = measureCtx.measureText(textL);
  const textMetricsR = measureCtx.measureText(textR);

  // 计算斜体排版引起的文字宽度扩展
  const ascentL = textMetricsL.fontBoundingBoxAscent ?? textMetricsL.actualBoundingBoxAscent ?? 74;
  const descentL = textMetricsL.fontBoundingBoxDescent ?? textMetricsL.actualBoundingBoxDescent ?? 10;
  const ascentR = textMetricsR.fontBoundingBoxAscent ?? textMetricsR.actualBoundingBoxAscent ?? 74;
  const descentR = textMetricsR.fontBoundingBoxDescent ?? textMetricsR.actualBoundingBoxDescent ?? 10;

  const textWidthL =
    textMetricsL.width - (TEXT_BASELINE * canvasHeight + descentL) * HORIZONTAL_TILT;
  const textWidthR =
    textMetricsR.width + (TEXT_BASELINE * canvasHeight - ascentR) * HORIZONTAL_TILT;

  // 根据文字长度动态计算画布左右分界线
  const canvasWidthL = Math.max(textWidthL + PADDING_X, initialWidth / 2);
  const canvasWidthR = Math.max(textWidthR + PADDING_X, initialWidth / 2);
  const totalCanvasWidth = canvasWidthL + canvasWidthR;

  // 创建正式绘制画布
  const canvas = createCanvas(totalCanvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // 1. 清空并绘制背景
  ctx.clearRect(0, 0, totalCanvasWidth, canvasHeight);
  if (!transparent) {
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(0, 0, totalCanvasWidth, canvasHeight);
  }

  // 2. 绘制左侧蓝色文字 (textAlign = 'end')
  ctx.font = font;
  ctx.fillStyle = COLORS.blue;
  ctx.textAlign = 'end';
  ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
  ctx.fillText(textL, canvasWidthL, canvasHeight * TEXT_BASELINE);
  ctx.resetTransform();

  // 3. 绘制深灰光环 (Halo)
  const graphX = canvasWidthL - canvasHeight / 2 + offsetX;
  const graphY = offsetY;
  drawVectorShape(ctx, haloPath, graphX, graphY, canvasHeight, COLORS.darkGray);

  // 4. 绘制右侧文字 (深灰文字 + 白色描边裁切光环)
  ctx.font = font;
  ctx.textAlign = 'start';

  // 如果是透明背景，使用 destination-out 擦除下方图层，实现镂空光环
  if (transparent) {
    ctx.globalCompositeOperation = 'destination-out';
  }
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 12;
  ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
  ctx.strokeText(textR, canvasWidthL, canvasHeight * TEXT_BASELINE);

  // 填充文字实体颜色
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = COLORS.darkGray;
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
  ctx.fillStyle = COLORS.white;
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // 6. 绘制十字 (Cross)
  drawVectorShape(ctx, crossPath, graphX, graphY, canvasHeight, COLORS.blue);

  // 7. 紧凑裁切边界（修复 PR #1 并兼顾短文本光环完整性）
  if (crop) {
    const graphRight = graphX + canvasHeight;
    // 安全裁切左边界：确保同时容纳最左侧倾斜文字以及光环/十字左侧边缘
    const safeLeft = Math.max(0, Math.floor(Math.min(canvasWidthL - textWidthL - PADDING_X, graphX)));
    // 安全裁切右边界：确保同时容纳最右侧倾斜文字以及光环/十字右侧边缘
    const safeRight = Math.min(
      totalCanvasWidth,
      Math.ceil(Math.max(canvasWidthL + textWidthR + PADDING_X, graphRight))
    );
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
