import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';

export const FONT_FAMILY = 'BlueArchive';
export const FONT_PATH = join(import.meta.dir, '../assets/fonts/ba.ttf');

let isFontLoaded = false;

/**
 * 将合并字体一次性载入内存并注册到 Skia 引擎中
 */
export function loadFonts(): boolean {
  if (isFontLoaded) {
    return true;
  }

  if (!existsSync(FONT_PATH)) {
    throw new Error(`Font file not found at: ${FONT_PATH}`);
  }

  const success = GlobalFonts.registerFromPath(FONT_PATH, FONT_FAMILY);
  if (!success) {
    throw new Error(`Failed to register font from: ${FONT_PATH}`);
  }

  isFontLoaded = true;
  return true;
}
