import { createCanvas } from '@napi-rs/canvas';
import {
  BASE_FONT_SIZE,
  CROSS_PATH_DATA,
  HALO_PATH_DATA,
  HOLLOW_POLYGON,
  HORIZONTAL_TILT,
  SVG_VIEWBOX_SIZE,
} from '../constants.ts';
import { loadFonts } from '../font.ts';
import { drawLogoCanvas, type SvgRenderResult, textToVectorSvg } from '../renderer.ts';
import { type AnimatedOptions, drawAnimatedLogoCanvas } from './animated.ts';
import { findAlphaBounds } from './bounds.ts';
import { computeLogoLayout } from './layout.ts';
import { normalizeRenderOptions } from './options.ts';

const EASE_OUT_CUBIC = '0.215 0.61 0.355 1';
const LINEAR = '0 0 1 1';

function n(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function animate(
  attributeName: string,
  from: number,
  to: number,
  startAt: number,
  endAt: number,
  totalDuration: number,
  ease = EASE_OUT_CUBIC,
): string {
  const start = n(from);
  const end = n(to);
  const begin = startAt <= 0 ? '0' : n(startAt / totalDuration);
  const finish = n(endAt / totalDuration);
  const values = startAt <= 0 ? `${start};${end};${end}` : `${start};${start};${end};${end}`;
  const keyTimes = startAt <= 0 ? `0;${finish};1` : `0;${begin};${finish};1`;
  const keySplines = startAt <= 0 ? `${ease};${LINEAR}` : `${LINEAR};${ease};${LINEAR}`;
  return `<animate attributeName="${attributeName}" values="${values}" keyTimes="${keyTimes}" dur="${n(totalDuration)}s" repeatCount="indefinite" calcMode="spline" keySplines="${keySplines}"/>`;
}

function animateTranslation(
  from: number,
  startAt: number,
  endAt: number,
  totalDuration: number,
): string {
  const begin = n(startAt / totalDuration);
  const finish = n(endAt / totalDuration);
  return `<animateTransform attributeName="transform" type="translate" values="${n(from)} 0;${n(from)} 0;0 0;0 0" keyTimes="0;${begin};${finish};1" dur="${n(totalDuration)}s" repeatCount="indefinite" calcMode="spline" keySplines="${LINEAR};${EASE_OUT_CUBIC};${LINEAR}"/>`;
}

function scanClip(
  id: string,
  width: number,
  top: number,
  bottom: number,
  direction: 'down' | 'up',
  totalDuration: number,
): string {
  const height = Math.max(0, bottom - top);
  const initialY = direction === 'down' ? top : bottom;
  return `<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="0" y="${n(initialY)}" width="${n(width)}" height="0">${animate('y', initialY, top, 0, 0.33, totalDuration, LINEAR)}${animate('height', 0, height, 0, 0.33, totalDuration, LINEAR)}</rect></clipPath>`;
}

function textLayers(vector: string, transform: string, color: string, clipId: string): string {
  return `<g transform="${transform}" fill="#E8F4FF" opacity="0.1">${vector}</g><g clip-path="url(#${clipId})"><g transform="${transform}" fill="${color}">${vector}</g></g>`;
}

export function renderLogoAnimatedSvg(options: AnimatedOptions = {}): SvgRenderResult {
  loadFonts();
  const normalized = normalizeRenderOptions(options);
  const layout = computeLogoLayout(normalized);
  const actionDuration = Math.min(Math.max(options.duration ?? 1.1, 0.4), 3);
  const holdDuration = Math.min(Math.max(options.holdDuration ?? 1.2, 0.2), 3);
  const totalDuration = actionDuration + holdDuration;
  const scale = normalized.scale;
  const { totalCanvasWidth, totalCanvasHeight, canvasHeight, graphX, graphY, subtitleX, subY } =
    layout;

  const finalCanvas = drawLogoCanvas(normalized, layout);
  const finalPixels = finalCanvas
    .getContext('2d')
    .getImageData(0, 0, finalCanvas.width, finalCanvas.height).data;
  const finalBounds = findAlphaBounds(
    finalPixels,
    finalCanvas.width,
    finalCanvas.height,
    normalized.center,
    layout.textCenterY,
  );
  const initialCanvas = drawAnimatedLogoCanvas(normalized, layout, 0);
  const initialPixels = initialCanvas
    .getContext('2d')
    .getImageData(0, 0, initialCanvas.width, initialCanvas.height).data;
  const initialBounds = findAlphaBounds(initialPixels, initialCanvas.width, initialCanvas.height);
  const minX = Math.min(finalBounds?.minX ?? 0, initialBounds?.minX ?? 0);
  const minY = Math.min(finalBounds?.minY ?? 0, initialBounds?.minY ?? 0);
  const maxX = Math.max(finalBounds?.maxX ?? finalCanvas.width - 1, initialBounds?.maxX ?? 0);
  const maxY = Math.max(finalBounds?.maxY ?? finalCanvas.height - 1, initialBounds?.maxY ?? 0);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const { padding } = normalized;
  const width = cropW + padding.left + padding.right;
  const height = cropH + padding.top + padding.bottom;
  const viewX = minX - padding.left;
  const viewY = minY - padding.top;

  const vectorL = textToVectorSvg(normalized.textL, layout.fontSize, 'end');
  const vectorR = textToVectorSvg(normalized.textR, layout.fontSize, 'start');
  const vectorSub = normalized.subtitle
    ? textToVectorSvg(normalized.subtitle, layout.subtitleFontSize, 'end')
    : '';
  const transformL = `matrix(1 0 ${HORIZONTAL_TILT} 1 ${n(layout.textTransformXLeft)} ${n(layout.textBaseline)})`;
  const transformR = `matrix(1 0 ${HORIZONTAL_TILT} 1 ${n(layout.textTransformXRight)} ${n(layout.textBaseline)})`;
  const transformSub = `matrix(1 0 ${HORIZONTAL_TILT} 1 ${n(layout.subtitleTransformX)} ${n(subY)})`;
  const haloScale = canvasHeight / SVG_VIEWBOX_SIZE;
  const hollowPoints = HOLLOW_POLYGON.map(
    ([x, y]) =>
      `${n(graphX + (x / SVG_VIEWBOX_SIZE) * canvasHeight)},${n(graphY + (y / SVG_VIEWBOX_SIZE) * canvasHeight)}`,
  ).join(' ');

  const crossDuration = Math.min(0.5, Math.max(0.1, actionDuration - 0.55));
  const crossStart = 0.506;
  const crossEnd = crossStart + crossDuration;
  const crossCenterX = graphX + (307 / SVG_VIEWBOX_SIZE) * canvasHeight;
  const crossCenterY = graphY + (151.5 / SVG_VIEWBOX_SIZE) * canvasHeight;
  const diagonalAngle = (Math.atan2(28.5 - 385.5, 366.5 - 166) * 180) / Math.PI;
  const transverseAngle = (Math.atan2(220 - 50, 483.5 - 86.5) * 180) / Math.PI;
  const fullCrossLength = canvasHeight * 2;

  const crossClipRect = (id: string, angle: number) =>
    `<rect id="${id}" x="${n(crossCenterX)}" y="${n(crossCenterY - canvasHeight * 0.15)}" width="0" height="${n(canvasHeight * 0.3)}" transform="rotate(${n(angle)} ${n(crossCenterX)} ${n(crossCenterY)})">${animate('x', crossCenterX, crossCenterX - fullCrossLength / 2, crossStart, crossEnd, totalDuration)}${animate('width', 0, fullCrossLength, crossStart, crossEnd, totalDuration)}</rect>`;

  const measureContext = createCanvas(1, 1).getContext('2d');
  measureContext.font = layout.font;
  const leftMetrics = measureContext.measureText(normalized.textL);
  const rightMetrics = measureContext.measureText(normalized.textR);
  const leftTop = layout.textBaseline - leftMetrics.actualBoundingBoxAscent;
  const leftBottom = layout.textBaseline + leftMetrics.actualBoundingBoxDescent;
  const rightTop = layout.textBaseline - rightMetrics.actualBoundingBoxAscent;
  const rightBottom = layout.textBaseline + rightMetrics.actualBoundingBoxDescent;

  measureContext.font = layout.subtitleFont;
  const subtitleWidth = normalized.subtitle
    ? measureContext.measureText(normalized.subtitle).width
    : 0;
  const subtitleLeft = subtitleX - subtitleWidth;
  const subtitleClipY = subY - layout.subtitleFontSize - 12 * scale;
  const subtitleClipHeight = layout.subtitleFontSize + 24 * scale;

  let svg = `<?xml version="1.0" encoding="utf-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewX} ${viewY} ${width} ${height}">\n`;
  svg += `<title>Blue Archive animated logo</title>\n`;
  svg += `<defs>${scanClip('scan-left', totalCanvasWidth, leftTop, leftBottom, 'down', totalDuration)}${scanClip('scan-right', totalCanvasWidth, rightTop, rightBottom, 'up', totalDuration)}`;
  svg += `<clipPath id="cross-reveal" clipPathUnits="userSpaceOnUse">${crossClipRect('cross-diagonal', diagonalAngle)}${crossClipRect('cross-transverse', transverseAngle)}</clipPath>`;
  svg += `<clipPath id="halo-reveal" clipPathUnits="userSpaceOnUse"><rect x="${n(graphX - 10 * scale)}" y="0" width="0" height="${totalCanvasHeight}">${animate('width', 0, canvasHeight + 20 * scale, 0.594, 0.814, totalDuration)}</rect></clipPath>`;
  svg += `<clipPath id="subtitle-reveal" clipPathUnits="userSpaceOnUse"><rect x="${n(subtitleLeft - 10 * scale)}" y="${n(subtitleClipY)}" width="0" height="${n(subtitleClipHeight)}">${animate('width', 0, subtitleWidth + 15 * scale, crossStart, crossEnd, totalDuration)}</rect></clipPath>`;
  svg += `<mask id="halo-cutout" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="white"/><g clip-path="url(#cross-reveal)"><polygon points="${hollowPoints}" fill="black"/><g transform="${transformR}" fill="black" stroke="black" stroke-width="${layout.strokeWidth}">${vectorR}</g></g></mask>`;
  svg += `<mask id="text-cutout" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="white"/><g clip-path="url(#cross-reveal)"><polygon points="${hollowPoints}" fill="black"/></g></mask></defs>\n`;

  if (!normalized.transparent) {
    svg += `<rect x="${viewX}" y="${viewY}" width="${width}" height="${height}" fill="${normalized.backgroundColor}"/>\n`;
  }

  const leftDx = -(BASE_FONT_SIZE / 2) * scale;
  const rightDx = -leftDx;
  svg += `<g transform="translate(${n(leftDx)} 0)">${animateTranslation(leftDx, 0.33, 0.55, totalDuration)}${textLayers(vectorL, transformL, normalized.primaryColor, 'scan-left')}</g>\n`;
  svg += `<g clip-path="url(#halo-reveal)"><g mask="url(#halo-cutout)"><g transform="translate(${n(graphX)} ${n(graphY)}) scale(${n(haloScale)})"><path fill="${normalized.haloColor}" d="${HALO_PATH_DATA}"/></g></g></g>\n`;
  svg += `<g transform="translate(${n(rightDx)} 0)">${animateTranslation(rightDx, 0.33, 0.55, totalDuration)}<g mask="url(#text-cutout)">${textLayers(vectorR, transformR, normalized.secondaryColor, 'scan-right')}</g></g>\n`;
  svg += `<g clip-path="url(#cross-reveal)"><g transform="translate(${n(graphX)} ${n(graphY)}) scale(${n(haloScale)})"><path fill="${normalized.crossColor}" d="${CROSS_PATH_DATA}"/></g></g>\n`;
  if (normalized.subtitle && vectorSub) {
    svg += `<g clip-path="url(#subtitle-reveal)"><g transform="${transformSub}" fill="${normalized.subtitleColor}">${vectorSub}</g></g>\n`;
  }
  svg += `</svg>\n`;
  return { svg, width, height };
}
