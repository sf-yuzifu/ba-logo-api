import { type Canvas, createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import {
  BASE_CANVAS_HEIGHT,
  BASE_CANVAS_WIDTH,
  BASE_FONT_SIZE,
  HORIZONTAL_TILT,
  PADDING_X,
  TEXT_BASELINE,
} from '../constants.ts';
import { FONT_FAMILY } from '../font.ts';
import type { NormalizedRenderOptions } from './options.ts';

export interface LogoLayout {
  canvasHeight: number;
  totalCanvasWidth: number;
  canvasWidthL: number;
  totalCanvasHeight: number;
  fontSize: number;
  subtitleFontSize: number;
  strokeWidth: number;
  font: string;
  subtitleFont: string;
  ascentL: number;
  descentL: number;
  textWidthL: number;
  textWidthR: number;
  subtitleAscent: number;
  subtitleDescent: number;
  minSubtitleXRelative: number;
  maxSubtitleXRelative: number;
  leftTextX: number;
  rightTextX: number;
  graphX: number;
  graphY: number;
  subtitleX: number;
  subY: number;
  textBaseline: number;
  textCenterY: number;
  textTransformXLeft: number;
  textTransformXRight: number;
  subtitleTransformX: number;
  margin: number;
  halfGap: number;
}

let measureCanvas: Canvas | undefined;
let measureContext: SKRSContext2D | undefined;

function getMeasureContext(): SKRSContext2D {
  if (!measureContext) {
    measureCanvas = createCanvas(1, 1);
    measureContext = measureCanvas.getContext('2d');
  }
  return measureContext;
}

export function computeLogoLayout(options: NormalizedRenderOptions): LogoLayout {
  const { scale, padding, subtitle } = options;
  const canvasHeight = Math.round(BASE_CANVAS_HEIGHT * scale);
  const initialWidth = Math.round(BASE_CANVAS_WIDTH * scale);
  const fontSize = Math.round(BASE_FONT_SIZE * scale);
  const subtitleFontSize = Math.round(options.subtitleFontSize * scale);
  const strokeWidth = 12 * scale;
  const font = `${fontSize}px "${FONT_FAMILY}"`;
  const subtitleFont = `${subtitleFontSize}px "${FONT_FAMILY}"`;
  const ctx = getMeasureContext();
  ctx.font = font;
  const leftMetrics = ctx.measureText(options.textL);
  const rightMetrics = ctx.measureText(options.textR);
  const ascentL =
    leftMetrics.fontBoundingBoxAscent ?? leftMetrics.actualBoundingBoxAscent ?? 74 * scale;
  const descentL =
    leftMetrics.fontBoundingBoxDescent ?? leftMetrics.actualBoundingBoxDescent ?? 10 * scale;
  const ascentR =
    rightMetrics.fontBoundingBoxAscent ?? rightMetrics.actualBoundingBoxAscent ?? 74 * scale;
  const textWidthL =
    leftMetrics.width - (TEXT_BASELINE * canvasHeight + descentL) * HORIZONTAL_TILT;
  const textWidthR =
    rightMetrics.width + (TEXT_BASELINE * canvasHeight - ascentR) * HORIZONTAL_TILT;

  const subY =
    canvasHeight * TEXT_BASELINE + subtitleFontSize + 5 * scale + options.subtitleOffsetY * scale;
  let subtitleAscent = 26 * scale;
  let subtitleDescent = 6 * scale;
  let minSubtitleXRelative = 0;
  let maxSubtitleXRelative = 0;
  if (subtitle) {
    ctx.font = subtitleFont;
    const metrics = ctx.measureText(subtitle);
    subtitleAscent =
      metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent ?? subtitleAscent;
    subtitleDescent =
      metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent ?? subtitleDescent;
    const subtitleXRelative = textWidthR + subtitleFontSize + options.subtitleOffsetX * scale;
    minSubtitleXRelative =
      subtitleXRelative - metrics.width + HORIZONTAL_TILT * (subY + subtitleDescent);
    maxSubtitleXRelative = subtitleXRelative + HORIZONTAL_TILT * (subY - subtitleAscent);
  }

  const margin = Math.max(
    Math.round(PADDING_X * scale),
    Math.max(padding.left, padding.right) + 20 * scale,
  );
  const halfGap = Math.round((options.wordGap * scale) / 2);
  const needLeft = Math.max(
    textWidthL + halfGap,
    canvasHeight / 2 - options.offsetX * scale - halfGap,
    subtitle ? -(minSubtitleXRelative + halfGap) : 0,
    initialWidth / 2,
  );
  const needRight = Math.max(
    textWidthR + halfGap,
    canvasHeight / 2 + options.offsetX * scale + halfGap,
    subtitle ? maxSubtitleXRelative + halfGap : 0,
    initialWidth / 2,
  );
  const canvasWidthL = Math.ceil(needLeft + margin);
  const canvasWidthR = Math.ceil(needRight + margin);
  const textBaseline = canvasHeight * TEXT_BASELINE;
  const leftTextX = canvasWidthL - halfGap;
  const rightTextX = canvasWidthL + halfGap;
  const graphX = rightTextX - canvasHeight / 2 + options.offsetX * scale;
  const graphY = options.offsetY * scale;
  const subtitleX = rightTextX + textWidthR + subtitleFontSize + options.subtitleOffsetX * scale;
  const totalCanvasHeight = Math.max(
    canvasHeight,
    subtitle ? Math.ceil(subY + subtitleDescent + margin) : 0,
    Math.ceil(graphY + canvasHeight + margin),
  );

  return {
    canvasHeight,
    totalCanvasWidth: canvasWidthL + canvasWidthR,
    canvasWidthL,
    totalCanvasHeight,
    fontSize,
    subtitleFontSize,
    strokeWidth,
    font,
    subtitleFont,
    ascentL,
    descentL,
    textWidthL,
    textWidthR,
    subtitleAscent,
    subtitleDescent,
    minSubtitleXRelative,
    maxSubtitleXRelative,
    leftTextX,
    rightTextX,
    graphX,
    graphY,
    subtitleX,
    subY,
    textBaseline,
    textCenterY: textBaseline - (ascentL - descentL) / 2,
    textTransformXLeft: leftTextX + HORIZONTAL_TILT * textBaseline,
    textTransformXRight: rightTextX + HORIZONTAL_TILT * textBaseline,
    subtitleTransformX: subtitleX + HORIZONTAL_TILT * subY,
    margin,
    halfGap,
  };
}
