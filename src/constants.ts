/**
 * Blue Archive Logo 基础布局与矢量常量配置
 * 数据来源：nulla2011/bluearchive-logo 及 PR #6, #9, #12
 */

// 画布与排版基础尺寸（1x 基准）
export const BASE_CANVAS_HEIGHT = 250;
export const BASE_CANVAS_WIDTH = 900;
export const BASE_FONT_SIZE = 84;
export const BASE_SUBTITLE_FONT_SIZE = 30;
export const TEXT_BASELINE = 0.68;
export const HORIZONTAL_TILT = -0.4; // 倾斜率（约 -20度倾角）
export const PADDING_X = 10;
export const DEFAULT_GRAPH_OFFSET = { x: -15, y: 0 };

// 矢量图形基准坐标系尺寸 (viewBox 500x500)
export const SVG_VIEWBOX_SIZE = 500;

// 光环 (Halo) SVG 矢量 Path 数据 (PR #6)
export const HALO_PATH_DATA =
  'M185 75.1c-23 2.2-39.8 9.9-45.4 20.7-3.2 6.2-3.8 10.8-2.1 17.4 3.1 11.7 9.9 22.3 22.5 34.9 17.7 17.8 39.9 32.9 71.9 49.1 16.8 8.5 19 9.1 19.1 5.6 0-.5-6.8-4.2-15-8.3-27.9-14-46.7-26.5-62.8-42-20-19.1-27.7-34.5-23.8-47.8 13.9-48 171.4-20.2 259 45.7 12.5 9.4 27.7 24.6 33.2 33.2 9.1 14.3 9.8 29.5 1.5 36.8-1.1 1.1-2.1 2.3-2.1 2.8 0 .4 3.7.8 8.3.8h8.3l1.8-3.7c6.5-13.7-1-32.2-21.3-52.3-46.5-46-145.2-86.9-224-93-14.9-1.1-16.7-1.1-29.1.1z';

// 十字 (Cross) SVG 矢量 Path 数据 (PR #6)
export const CROSS_PATH_DATA =
  'M366.5 28.5c.543.06.876.393 1 1a23718.046 23718.046 0 0 0-53 110.5 9965.6 9965.6 0 0 0 170 81A5795.598 5795.598 0 0 1 307 151.5l-141 234A11825.57 11825.57 0 0 1 293.5 146a29249.106 29249.106 0 0 0-207-96 193.841 193.841 0 0 1 21 7 22718.148 22718.148 0 0 0 193 76.5c2.128-.554 3.628-1.887 4.5-4 20.511-33.695 41.011-67.361 61.5-101Z';

// 十字遮罩镂空多边形顶点数据（500x500 基准坐标，用于在十字上裁剪出穿过光环的透空区域）
export const HOLLOW_POLYGON: ReadonlyArray<readonly [number, number]> = [
  [284, 136],
  [321, 153],
  [159, 410],
  [148, 403],
] as const;

// 默认配色方案
export const COLORS = {
  blue: '#128AFA',
  darkGray: '#2B2B2B',
  white: '#FFFFFF',
} as const;
