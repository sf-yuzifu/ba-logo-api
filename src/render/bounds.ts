import { type Canvas, createCanvas } from '@napi-rs/canvas';
import type { PaddingBox } from '../renderer.ts';

export interface AlphaBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function findAlphaBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  center = false,
  textCenterY = 0,
): AlphaBounds | undefined {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) return undefined;
  if (center) maxY = Math.max(maxY, Math.round(textCenterY + (textCenterY - minY)));
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export interface TrimCanvasOptions {
  padding: PaddingBox;
  transparent: boolean;
  center: boolean;
  textCenterY: number;
  backgroundColor: string;
}

export function trimCanvas(canvas: Canvas, options: TrimCanvasOptions): Canvas {
  const context = canvas.getContext('2d');
  const bounds = findAlphaBounds(
    context.getImageData(0, 0, canvas.width, canvas.height).data,
    canvas.width,
    canvas.height,
    options.center,
    options.textCenterY,
  );
  if (!bounds) {
    if (options.transparent) return canvas;
    const background = createCanvas(canvas.width, canvas.height);
    const backgroundContext = background.getContext('2d');
    backgroundContext.fillStyle = options.backgroundColor;
    backgroundContext.fillRect(0, 0, background.width, background.height);
    return background;
  }
  const result = createCanvas(
    bounds.width + options.padding.left + options.padding.right,
    bounds.height + options.padding.top + options.padding.bottom,
  );
  const resultContext = result.getContext('2d');
  if (!options.transparent) {
    resultContext.fillStyle = options.backgroundColor;
    resultContext.fillRect(0, 0, result.width, result.height);
  }
  const sourceHeight = Math.min(canvas.height - bounds.minY, bounds.height);
  resultContext.drawImage(
    canvas,
    bounds.minX,
    bounds.minY,
    bounds.width,
    sourceHeight,
    options.padding.left,
    options.padding.top,
    bounds.width,
    sourceHeight,
  );
  return result;
}
