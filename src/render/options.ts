import { BASE_SUBTITLE_FONT_SIZE, COLORS, DEFAULT_GRAPH_OFFSET } from '../constants.ts';
import type { PaddingBox, PaddingValue, RenderOptions } from '../renderer.ts';

export interface NormalizedRenderOptions
  extends Omit<
    RenderOptions,
    'padding' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'
  > {
  textL: string;
  textR: string;
  subtitle: string;
  offsetX: number;
  offsetY: number;
  subtitleOffsetX: number;
  subtitleOffsetY: number;
  subtitleFontSize: number;
  wordGap: number;
  scale: number;
  transparent: boolean;
  darkMode: boolean;
  swapColors: boolean;
  motifsBehindText: boolean;
  center: boolean;
  padding: PaddingBox;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  haloColor: string;
  crossColor: string;
  subtitleColor: string;
}

export function normalizeColor(color: string): string {
  const trimmed = color.trim();
  return /^[0-9a-fA-F]{3,8}$/.test(trimmed) ? `#${trimmed}` : trimmed;
}

function finite(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

export function normalizeRenderOptions(options: RenderOptions = {}): NormalizedRenderOptions {
  const scale = Math.min(Math.max(finite(options.scale, 1), 0.1), 8);
  const transparent = options.transparent ?? false;
  const darkMode = options.darkMode ?? false;
  const swapColors = options.swapColors ?? false;
  const accentColor = options.accentColor ? normalizeColor(options.accentColor) : COLORS.blue;
  const textColor = options.textColor
    ? normalizeColor(options.textColor)
    : darkMode
      ? COLORS.white
      : COLORS.darkGray;
  const primaryColor = swapColors ? textColor : accentColor;
  const secondaryColor = swapColors ? accentColor : textColor;
  const padding = parsePadding(options.padding, scale);
  const overrides = [
    options.paddingTop,
    options.paddingRight,
    options.paddingBottom,
    options.paddingLeft,
  ];
  (['top', 'right', 'bottom', 'left'] as const).forEach((side, index) => {
    const value = overrides[index];
    if (value !== undefined && Number.isFinite(value)) {
      padding[side] = Math.max(0, Math.round(value * scale));
    }
  });

  return {
    ...options,
    textL: options.textL ?? '蔚蓝',
    textR: options.textR ?? '档案',
    subtitle: options.subtitle?.trim() ?? '',
    subtitleColor: options.subtitleColor ? normalizeColor(options.subtitleColor) : secondaryColor,
    offsetX: finite(options.offsetX, DEFAULT_GRAPH_OFFSET.x),
    offsetY: finite(options.offsetY, DEFAULT_GRAPH_OFFSET.y),
    subtitleOffsetX: finite(options.subtitleOffsetX, 0),
    subtitleOffsetY: finite(options.subtitleOffsetY, 0),
    subtitleFontSize: Math.min(
      Math.max(finite(options.subtitleFontSize, BASE_SUBTITLE_FONT_SIZE), 12),
      96,
    ),
    wordGap: Math.min(Math.max(finite(options.wordGap, 0), -100), 300),
    scale,
    accentColor,
    textColor,
    transparent,
    darkMode,
    swapColors,
    motifsBehindText: options.motifsBehindText ?? false,
    center: options.center ?? !transparent,
    padding,
    backgroundColor: darkMode ? COLORS.darkGray : COLORS.white,
    primaryColor,
    secondaryColor,
    haloColor: options.haloColor
      ? normalizeColor(options.haloColor)
      : swapColors
        ? accentColor
        : textColor,
    crossColor: options.crossColor
      ? normalizeColor(options.crossColor)
      : swapColors
        ? textColor
        : accentColor,
  };
}

export function parsePadding(input?: PaddingValue, scale = 1): PaddingBox {
  let box = [2, 2, 2, 2];
  if (typeof input === 'number') {
    const value = Number.isFinite(input) ? Math.max(0, input) : 2;
    box = [value, value, value, value];
  } else if (Array.isArray(input)) {
    const values = input.map((value) => Math.max(0, Number(value) || 0));
    if (values.length === 1) box = [values[0], values[0], values[0], values[0]];
    else if (values.length === 2) box = [values[0], values[1], values[0], values[1]];
    else if (values.length === 3) box = [values[0], values[1], values[2], values[1]];
    else if (values.length >= 4) box = values.slice(0, 4);
  } else if (typeof input === 'string') {
    const values = input
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((part) => Math.max(0, Number.parseFloat(part.replace(/px$/i, '')) || 0));
    if (values.length === 1) box = [values[0], values[0], values[0], values[0]];
    else if (values.length === 2) box = [values[0], values[1], values[0], values[1]];
    else if (values.length === 3) box = [values[0], values[1], values[2], values[1]];
    else if (values.length >= 4) box = values.slice(0, 4);
  }
  return {
    top: Math.round(box[0] * scale),
    right: Math.round(box[1] * scale),
    bottom: Math.round(box[2] * scale),
    left: Math.round(box[3] * scale),
  };
}
