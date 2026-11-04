import { type Canvas, createCanvas, Path2D } from '@napi-rs/canvas';
import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import UPNG from 'upng-js';
import {
  BASE_FONT_SIZE,
  CROSS_PATH_DATA,
  HALO_PATH_DATA,
  HOLLOW_POLYGON,
  HORIZONTAL_TILT,
  SVG_VIEWBOX_SIZE,
  TEXT_BASELINE,
} from '../constants.ts';
import { FONT_FAMILY, loadFonts } from '../font.ts';
import { drawLogoCanvas, type RenderOptions } from '../renderer.ts';
import { findAlphaBounds } from './bounds.ts';
import { computeLogoLayout, type LogoLayout } from './layout.ts';
import { type NormalizedRenderOptions, normalizeRenderOptions } from './options.ts';

function easeOutCubic(x: number): number {
  return 1 - (1 - x) ** 3;
}

/**
 * 绘制带平滑渐变边界的文字着色
 * 在扫描线附近用多层渐变过渡，避免硬边截断感
 */
function drawTextSmoothScan(
  ctx: ReturnType<Canvas['getContext']>,
  text: string,
  x: number,
  y: number,
  color: string,
  scanY: number,
  topY: number,
  bottomY: number,
  direction: 'down' | 'up',
  scale: number,
  align: 'start' | 'end',
  offsetX: number,
): void {
  const font = ctx.font;
  const feather = 10 * scale; // 渐变过渡带高度
  const layers = 8; // 渐变层数，越多越平滑

  const fillTransformedText = () => {
    ctx.save();
    ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, offsetX, 0);
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;

  // 1. 绘制纯色主体区域
  ctx.save();
  ctx.fillStyle = color;
  if (direction === 'down') {
    ctx.beginPath();
    ctx.rect(0, 0, 9999, scanY - feather);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(0, scanY + feather, 9999, 9999);
    ctx.clip();
  }
  fillTransformedText();
  ctx.restore();

  // 2. 渐变过渡带：多层递减 alpha 叠加
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const alpha = 1 - t;
    let layerY: number;
    if (direction === 'down') {
      layerY = scanY - feather + feather * 2 * t;
    } else {
      layerY = scanY + feather - feather * 2 * t;
    }

    ctx.save();
    ctx.globalAlpha = alpha * 0.6; // 最大 60% 不透明度，与底色融合
    ctx.fillStyle = color;
    ctx.beginPath();
    if (direction === 'down') {
      ctx.rect(0, layerY, 9999, (feather * 2) / layers + 1);
    } else {
      ctx.rect(0, layerY - (feather * 2) / layers - 1, 9999, (feather * 2) / layers + 1);
    }
    ctx.clip();
    fillTransformedText();
    ctx.restore();
  }

  // 3. 扫描能量光带（中心亮线）
  if (scanY > topY && scanY < bottomY) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#FFFFFF';
    const bandH = 2 * scale;
    ctx.fillRect(0, scanY - bandH / 2, 9999, bandH);
    ctx.restore();
  }

  ctx.restore();
}

const haloPath = new Path2D(HALO_PATH_DATA);
const crossPath = new Path2D(CROSS_PATH_DATA);

/**
 * 沿十字的一组交叉方向揭示完整矢量路径。
 * 只扩大裁剪窗口，不缩放十字本身，避免产生整体放大动画。
 */
function drawCrossRevealArm(
  ctx: ReturnType<Canvas['getContext']>,
  canvasHeight: number,
  centerX: number,
  centerY: number,
  angle: number,
  reveal: number,
  drawContent: () => void,
): void {
  const fullLength = canvasHeight * 2;
  const visibleLength = Math.max(fullLength * reveal, 0.001);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.rect(-visibleLength / 2, -canvasHeight * 0.15, visibleLength, canvasHeight * 0.3);
  ctx.clip();
  ctx.rotate(-angle);
  ctx.translate(-centerX, -centerY);
  drawContent();
  ctx.restore();
}

export interface AnimatedOptions extends RenderOptions {
  fps?: number;
  duration?: number;
  holdDuration?: number;
}

export interface AnimatedRenderResult {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  framesCount: number;
  duration: number;
}

let measureCanvas: Canvas | null = null;
function getMeasureContext() {
  if (!measureCanvas) {
    measureCanvas = createCanvas(1, 1);
  }
  return measureCanvas.getContext('2d');
}

/**
 * 绘制特定进度 p (0.0 ~ 1.0) 下的动画帧画布
 * 物理运动学设计（按实际秒数驱动）：
 * Phase 1 (0.00s-0.33s): 文字在初始位置，先完成颜色注入（左↓右↑，带渐变平滑过渡）
 * Phase 2 (0.33s-0.55s): 着色完成后，文字水平靠拢归位
 * Phase 3 (0.506s 起): 十字架以 0.5 秒展开，白色镂空同步延伸；副标题与十字同步左→右展开，光环随后左→右展开
 */
export function drawAnimatedLogoCanvas(
  normalized: NormalizedRenderOptions,
  layout: LogoLayout,
  progress: number,
  actionDuration = 1.1,
): Canvas {
  const scale = normalized.scale;
  const canvasHeight = Math.round(250 * scale);
  const font = `${Math.round(BASE_FONT_SIZE * scale)}px "${FONT_FAMILY}"`;
  const subtitleFont = `${layout.subtitleFontSize}px "${FONT_FAMILY}"`;
  const strokeWidth = 12 * scale;

  const {
    totalCanvasWidth,
    totalCanvasHeight,
    leftTextX,
    rightTextX,
    graphX,
    graphY,
    subtitleX,
    subY,
  } = layout;

  const canvas = createCanvas(totalCanvasWidth, totalCanvasHeight);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, totalCanvasWidth, totalCanvasHeight);

  const textL = normalized.textL;
  const textR = normalized.textR;
  const subtitle = normalized.subtitle;
  const primaryColor = normalized.primaryColor;
  const secondaryColor = normalized.secondaryColor;
  const subtitleColor = normalized.subtitleColor;
  const crossColor = normalized.crossColor;
  const haloColor = normalized.haloColor;

  const elapsed = progress * actionDuration;

  // === Phase 1: 颜色注入（初始位置先着色，0.00s -> 0.33s） ===
  const scanProgress = Math.min(Math.max(elapsed / 0.33, 0), 1);

  // === Phase 2: 文字水平靠拢（着色完成后，0.33s -> 0.55s） ===
  const textMoveP = Math.min(Math.max((elapsed - 0.33) / 0.22, 0), 1);
  const textMoveEase = easeOutCubic(textMoveP);
  const textMoveRemain = 1 - textMoveEase;

  const leftDx = -70 * textMoveRemain * scale;
  const rightDx = 70 * textMoveRemain * scale;

  // 文字 alpha：原视频文字直接以纯白实色出现，无需淡入
  const textIntroAlpha = 1;

  // === Phase 3: 十字架延伸，完整展开耗时 0.5 秒 ===
  const crossDuration = Math.min(0.5, Math.max(0.1, actionDuration - 0.55));
  const crossP = Math.min(Math.max((elapsed - 0.506) / crossDuration, 0), 1);
  const crossEase = easeOutCubic(crossP);
  const crossAlpha = Math.min(crossP / 0.12, 1);
  const crossReveal = crossEase;

  // === Phase 3: 光环左→右展开 (0.594s -> 0.814s) ===
  const haloP = Math.min(Math.max((elapsed - 0.594) / 0.22, 0), 1);
  const haloEase = easeOutCubic(haloP);
  const haloAlpha = Math.min(haloP / 0.12, 1);

  // === Phase 3: 副标题与十字同步，左→右擦入并在同一帧完成 ===
  const subEase = crossEase;
  const subAlpha = crossAlpha;

  const crossCenterX = graphX + (307 / SVG_VIEWBOX_SIZE) * canvasHeight;
  const crossCenterY = graphY + (151.5 / SVG_VIEWBOX_SIZE) * canvasHeight;
  const diagonalAngle = Math.atan2(28.5 - 385.5, 366.5 - 166);
  const transverseAngle = Math.atan2(220 - 50, 483.5 - 86.5);

  // 十字和白色镂空共用相同延伸窗口，延伸到哪里就立即绘制/裁切到哪里。
  const revealWithCross = (drawContent: () => void) => {
    if (crossReveal >= 1) {
      drawContent();
      return;
    }
    drawCrossRevealArm(
      ctx,
      canvasHeight,
      crossCenterX,
      crossCenterY,
      diagonalAngle,
      crossReveal,
      drawContent,
    );
    drawCrossRevealArm(
      ctx,
      canvasHeight,
      crossCenterX,
      crossCenterY,
      transverseAngle,
      crossReveal,
      drawContent,
    );
  };

  const textBaselineY = canvasHeight * TEXT_BASELINE;
  ctx.font = font;
  const leftMetrics = ctx.measureText(textL);
  const rightMetrics = ctx.measureText(textR);
  const leftTopY = textBaselineY - leftMetrics.actualBoundingBoxAscent;
  const leftBottomY = textBaselineY + leftMetrics.actualBoundingBoxDescent;
  const rightTopY = textBaselineY - rightMetrics.actualBoundingBoxAscent;
  const rightBottomY = textBaselineY + rightMetrics.actualBoundingBoxDescent;
  const leftScanY = leftTopY + (leftBottomY - leftTopY) * scanProgress;
  const rightScanY = rightBottomY - (rightBottomY - rightTopY) * scanProgress;

  // --- Step 1: 左侧文字自左滑入，主强调色自上而下注入 ---
  ctx.save();
  ctx.globalAlpha = textIntroAlpha;
  ctx.font = font;
  ctx.textAlign = 'end';
  ctx.fillStyle = '#E8F4FF';
  ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, leftDx, 0);
  ctx.fillText(textL, leftTextX, textBaselineY);
  ctx.restore();

  if (scanProgress > 0 && scanProgress < 1) {
    drawTextSmoothScan(
      ctx,
      textL,
      leftTextX,
      textBaselineY,
      primaryColor,
      leftScanY,
      leftTopY,
      leftBottomY,
      'down',
      scale,
      'end',
      leftDx,
    );
  } else if (scanProgress >= 1) {
    // 着色完成，绘制纯色
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'end';
    ctx.fillStyle = primaryColor;
    ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, leftDx, 0);
    ctx.fillText(textL, leftTextX, textBaselineY);
    ctx.restore();
  }

  // --- Step 2: 绘制光环 (Halo, 自左向右横向展开) ---
  if (haloAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = haloAlpha;

    const haloBoxX = graphX;
    const haloBoxW = canvasHeight;
    const haloWipeWidth = haloBoxW * haloEase;

    ctx.beginPath();
    ctx.rect(haloBoxX - 10 * scale, 0, haloWipeWidth + 20 * scale, totalCanvasHeight);
    ctx.clip();

    ctx.save();
    ctx.translate(graphX, graphY);
    const s = canvasHeight / SVG_VIEWBOX_SIZE;
    ctx.scale(s, s);
    ctx.fillStyle = haloColor;
    ctx.fill(haloPath);
    ctx.restore();

    ctx.restore();
  }

  // --- Step 3: 右文字白色描边随十字延伸同步裁切 ---
  if (crossP > 0) {
    revealWithCross(() => {
      ctx.save();
      ctx.font = font;
      ctx.textAlign = 'start';
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = strokeWidth;
      ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, rightDx, 0);
      ctx.strokeText(textR, rightTextX, textBaselineY);
      ctx.restore();
    });
  }

  // --- Step 4: 右侧文字自右滑入，次要文字色自下而上注入 ---
  ctx.save();
  ctx.globalAlpha = textIntroAlpha;
  ctx.font = font;
  ctx.textAlign = 'start';
  ctx.fillStyle = '#E8F4FF';
  ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, rightDx, 0);
  ctx.fillText(textR, rightTextX, textBaselineY);
  ctx.restore();

  if (scanProgress > 0 && scanProgress < 1) {
    drawTextSmoothScan(
      ctx,
      textR,
      rightTextX,
      textBaselineY,
      secondaryColor,
      rightScanY,
      rightTopY,
      rightBottomY,
      'up',
      scale,
      'start',
      rightDx,
    );
  } else if (scanProgress >= 1) {
    // 着色完成，绘制纯色
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'start';
    ctx.fillStyle = secondaryColor;
    ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, rightDx, 0);
    ctx.fillText(textR, rightTextX, textBaselineY);
    ctx.restore();
  }

  // --- Step 5: 十字镂空多边形随延伸区域同步裁切 ---
  if (crossP > 0) {
    revealWithCross(() => {
      ctx.save();
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
      ctx.restore();
    });
  }

  // --- Step 6: 绘制十字架（尺寸不变，从交点沿两组方向向外延伸） ---
  if (crossAlpha > 0 && crossReveal > 0.001) {
    ctx.save();
    ctx.globalAlpha = crossAlpha;
    revealWithCross(() => {
      ctx.save();
      ctx.translate(graphX, graphY);
      const s = canvasHeight / SVG_VIEWBOX_SIZE;
      ctx.scale(s, s);
      ctx.fillStyle = crossColor;
      ctx.fill(crossPath);
      ctx.restore();
    });
    ctx.restore();
  }

  // --- Step 7: 副标题仅以最终颜色左→右显现，与十字同步完成 ---
  if (subtitle && subAlpha > 0) {
    const mCtx = getMeasureContext();
    mCtx.font = subtitleFont;
    const subWidth = mCtx.measureText(subtitle).width;
    const subLeftX = subtitleX - subWidth;
    const subVisibleW = subWidth * subEase;
    const subClipY = subY - layout.subtitleFontSize - 12 * scale;
    const subClipH = layout.subtitleFontSize + 24 * scale;

    ctx.save();
    ctx.globalAlpha = subAlpha;
    ctx.font = subtitleFont;
    ctx.textAlign = 'end';
    ctx.fillStyle = subtitleColor;
    ctx.setTransform(1, 0, HORIZONTAL_TILT, 1, 0, 0);
    ctx.beginPath();
    ctx.rect(subLeftX - 10 * scale, subClipY, subVisibleW + 15 * scale, subClipH);
    ctx.clip();
    ctx.fillText(subtitle, subtitleX, subY);
    ctx.restore();
  }

  return canvas;
}

/**
 * 渲染逐帧动效并导出为 GIF 或 APNG 格式二进制包
 */
export function renderLogoAnimatedToBuffer(
  options: AnimatedOptions = {},
  targetFormat: 'gif' | 'apng' = 'gif',
): AnimatedRenderResult {
  loadFonts();
  const normalized = normalizeRenderOptions(options);
  const layout = computeLogoLayout(normalized);

  // 1. 基于最终静态完成态确定整段动效的统一包围盒（避免帧间抖动）
  const finalCanvas = drawLogoCanvas(normalized, layout);
  const ctx = finalCanvas.getContext('2d');
  const finalPixels = ctx.getImageData(0, 0, finalCanvas.width, finalCanvas.height).data;
  const bounds = findAlphaBounds(
    finalPixels,
    finalCanvas.width,
    finalCanvas.height,
    normalized.center,
    layout.textCenterY,
  );

  const fps = Math.min(Math.max(options.fps ?? 24, 10), 30);
  const actionDuration = Math.min(Math.max(options.duration ?? 1.1, 0.4), 3.0);
  const holdDuration = Math.min(Math.max(options.holdDuration ?? 1.2, 0.2), 3.0);

  const totalFrames = Math.max(Math.round(fps * actionDuration), 8);
  const stepDelayMs = Math.round(1000 / fps);
  const holdDelayMs = Math.round(holdDuration * 1000);

  const scale = normalized.scale;
  const padding = normalized.padding;

  // 为文字水平入场的 70px 位移与抗锯齿边缘留出空间
  const extraLeft = Math.ceil(72 * scale);
  const extraRight = Math.ceil(72 * scale);
  const extraTop = Math.round(40 * scale);
  const extraBottom = Math.round(40 * scale);

  const cropMinX = Math.max(0, (bounds ? bounds.minX : 0) - extraLeft);
  const cropMinY = Math.max(0, (bounds ? bounds.minY : 0) - extraTop);
  const cropMaxX = Math.min(
    finalCanvas.width,
    (bounds ? bounds.maxX : finalCanvas.width) + extraRight,
  );
  const cropMaxY = Math.min(
    finalCanvas.height,
    (bounds ? bounds.maxY : finalCanvas.height) + extraBottom,
  );

  const cropW = Math.max(1, cropMaxX - cropMinX + 1);
  const cropH = Math.max(1, cropMaxY - cropMinY + 1);

  const outW = Math.max(cropW + padding.left + padding.right, 1);
  const outH = Math.max(cropH + padding.top + padding.bottom, 1);

  const rgbaBuffers: ArrayBuffer[] = [];
  const delays: number[] = [];

  const gif = targetFormat === 'gif' ? GIFEncoder() : null;

  for (let i = 0; i < totalFrames; i++) {
    const p = i / (totalFrames - 1);
    const frameCanvas = drawAnimatedLogoCanvas(normalized, layout, p, actionDuration);

    const croppedCanvas = createCanvas(outW, outH);
    const crCtx = croppedCanvas.getContext('2d');

    if (!normalized.transparent) {
      crCtx.fillStyle = normalized.backgroundColor;
      crCtx.fillRect(0, 0, outW, outH);
    }

    crCtx.drawImage(
      frameCanvas,
      cropMinX,
      cropMinY,
      cropW,
      cropH,
      padding.left,
      padding.top,
      cropW,
      cropH,
    );

    const imgData = crCtx.getImageData(0, 0, outW, outH).data;
    rgbaBuffers.push(imgData.buffer as ArrayBuffer);

    const isLast = i === totalFrames - 1;
    const delay = isLast ? holdDelayMs : stepDelayMs;
    delays.push(delay);

    if (gif) {
      const palette = quantize(imgData, 256);
      const index = applyPalette(imgData, palette);
      gif.writeFrame(index, outW, outH, {
        palette,
        delay,
        repeat: 0,
        transparent: normalized.transparent,
      });
    }
  }

  let buffer: Buffer;
  let mimeType: string;

  if (targetFormat === 'gif' && gif) {
    gif.finish();
    buffer = Buffer.from(gif.bytes());
    mimeType = 'image/gif';
  } else {
    // APNG 格式：无损编码 (cnum: 0 保留 24位真彩与 8位透明通道)
    const apngArrayBuffer = UPNG.encode(rgbaBuffers, outW, outH, 0, delays);
    buffer = Buffer.from(apngArrayBuffer);
    mimeType = 'image/png';
  }

  return {
    buffer,
    mimeType,
    width: outW,
    height: outH,
    framesCount: totalFrames,
    duration: actionDuration + holdDuration,
  };
}
