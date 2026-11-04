import { t } from 'elysia';

const queryAliases: Record<string, string[]> = {};
const registeredAliases: string[] = [];

function alias<T>(canonical: string, name: string, schema: T): T {
  if (!queryAliases[canonical]) queryAliases[canonical] = [];
  queryAliases[canonical].push(name);
  registeredAliases.push(name);
  return schema;
}

export function getRegisteredQueryAliases(): readonly string[] {
  return registeredAliases;
}

export function resolveQueryAlias(query: object, canonical: string): unknown {
  const values = query as Record<string, unknown>;
  for (const name of [canonical, ...(queryAliases[canonical] ?? [])]) {
    if (values[name] !== undefined) return values[name];
  }
  return undefined;
}

/**
 * 宽松布尔值转换转换器（兼容 'true', 'false', '1', '0', boolean）
 */
export const FlexibleBoolean = t
  .Transform(t.Union([t.Boolean(), t.String()]))
  .Decode((val) => {
    if (typeof val === 'boolean') return val;
    return val === 'true' || val === '1';
  })
  .Encode((val) => val);

/**
 * Blue Archive Logo API 查询参数校验模型
 */
export const LogoQuerySchema = t.Object({
  // 主要文字
  left: t.Optional(
    t.String({
      description: 'Logo 左侧主文字（蓝色，默认"蔚蓝"）',
      examples: ['Blue', '蔚蓝'],
    }),
  ),
  l: alias('left', 'l', t.Optional(t.String({ description: 'left 别名' }))),

  right: t.Optional(
    t.String({
      description: 'Logo 右侧主文字（深灰色，默认"档案"）',
      examples: ['Archive', '档案'],
    }),
  ),
  r: alias('right', 'r', t.Optional(t.String({ description: 'right 别名' }))),

  // 可选副标题（PR #12）
  subtitle: t.Optional(
    t.String({
      description: '右下方可选副标题（如官方日文副标）',
      examples: ['ブルーアーカイブ', 'Blue Archive'],
    }),
  ),
  sub: alias('subtitle', 'sub', t.Optional(t.String({ description: 'subtitle 别名' }))),

  subtitleColor: t.Optional(
    t.String({
      description: '副标题颜色（默认跟随次要文字颜色）',
      examples: ['#2B2B2B', '#FFFFFF'],
    }),
  ),
  subColor: alias(
    'subtitleColor',
    'subColor',
    t.Optional(t.String({ description: 'subtitleColor 别名' })),
  ),

  subtitleOffsetX: t.Optional(
    t.Numeric({
      description: '副标题 X 轴偏移量（像素，默认 0）',
      examples: [0, 20, -20],
    }),
  ),
  subX: alias(
    'subtitleOffsetX',
    'subX',
    t.Optional(t.Numeric({ description: 'subtitleOffsetX 别名' })),
  ),

  subtitleOffsetY: t.Optional(
    t.Numeric({
      description: '副标题 Y 轴偏移量（像素，默认 0）',
      examples: [0, 10, -10],
    }),
  ),
  subY: alias(
    'subtitleOffsetY',
    'subY',
    t.Optional(t.Numeric({ description: 'subtitleOffsetY 别名' })),
  ),

  // 坐标偏移
  offsetX: t.Optional(
    t.Numeric({
      description: '光环与十字 X 轴偏移量（像素，默认 -15）',
      examples: [-15, 0, 20],
    }),
  ),
  x: alias('offsetX', 'x', t.Optional(t.Numeric({ description: 'offsetX 别名' }))),

  offsetY: t.Optional(
    t.Numeric({
      description: '光环与十字 Y 轴偏移量（像素，默认 0）',
      examples: [0, -10, 10],
    }),
  ),
  y: alias('offsetY', 'y', t.Optional(t.Numeric({ description: 'offsetY 别名' }))),

  // 词间距（左右两词间距微调）
  wordGap: t.Optional(
    t.Numeric({
      description: '左右两词之间的间隔（像素，默认 0，范围 -100 ~ 300）',
      minimum: -100,
      maximum: 300,
      examples: [0, 20, -10],
    }),
  ),
  gap: alias(
    'wordGap',
    'gap',
    t.Optional(
      t.Numeric({
        description: 'wordGap 别名',
        minimum: -100,
        maximum: 300,
      }),
    ),
  ),

  // 背景与样式
  transparent: t.Optional(FlexibleBoolean),
  tp: alias('transparent', 'tp', t.Optional(FlexibleBoolean)),

  // 分辨率缩放（PR #9）
  scale: t.Optional(
    t.Numeric({
      description: '分辨率缩放倍率（1x=250p, 2x=500p, 4x=1000p，范围 0.1 ~ 8.0，默认 1）',
      minimum: 0.1,
      maximum: 8.0,
      examples: [1, 2, 4],
    }),
  ),
  s: alias(
    'scale',
    's',
    t.Optional(
      t.Numeric({
        description: 'scale 别名',
        minimum: 0.1,
        maximum: 8.0,
      }),
    ),
  ),

  // 配色方案（PR #6）
  darkMode: t.Optional(FlexibleBoolean),
  dark: alias('darkMode', 'dark', t.Optional(FlexibleBoolean)),

  swapColors: t.Optional(FlexibleBoolean),
  swap: alias('swapColors', 'swap', t.Optional(FlexibleBoolean)),

  accentColor: t.Optional(
    t.String({
      description: '主强调色（十六进制颜色代码，影响左文字与十字架，默认 #128AFA）',
      examples: ['#128AFA', '#FF5722', '#00E5FF'],
    }),
  ),
  accent: alias('accentColor', 'accent', t.Optional(t.String({ description: 'accentColor 别名' }))),

  textColor: t.Optional(
    t.String({
      description: '文字主题色（十六进制颜色代码，影响右文字与光环，默认 #2B2B2B）',
      examples: ['#2B2B2B', '#000000', '#FFFFFF'],
    }),
  ),
  color: alias('textColor', 'color', t.Optional(t.String({ description: 'textColor 别名' }))),
  tc: alias('textColor', 'tc', t.Optional(t.String({ description: 'textColor 别名' }))),

  // 独立图元色彩与层级控制
  crossColor: t.Optional(
    t.String({
      description: '十字独立颜色（默认跟随 accentColor）',
      examples: ['#FFD700', '#FF5722', '#128AFA'],
    }),
  ),
  cross: alias('crossColor', 'cross', t.Optional(t.String({ description: 'crossColor 别名' }))),

  haloColor: t.Optional(
    t.String({
      description: '光环独立颜色（默认跟随 textColor）',
      examples: ['#9C27B0', '#2B2B2B', '#FFFFFF'],
    }),
  ),
  halo: alias('haloColor', 'halo', t.Optional(t.String({ description: 'haloColor 别名' }))),

  motifsBehindText: t.Optional(FlexibleBoolean),
  underText: alias('motifsBehindText', 'underText', t.Optional(FlexibleBoolean)),
  behind: alias('motifsBehindText', 'behind', t.Optional(FlexibleBoolean)),

  // 留白边距（支持纯数字如 10，或 CSS 语法字符串如 "10 20", "10,20,30,40"）
  padding: t.Optional(
    t.Union([
      t.Numeric({ description: '留白边距像素值' }),
      t.String({
        description: '内容留白边距（支持 CSS 语法，如 "10 20", "10,20,30,40"）',
        examples: ['2', '10', '10 20', '10,20,30,40'],
      }),
    ]),
  ),
  pad: alias(
    'padding',
    'pad',
    t.Optional(t.Union([t.Numeric(), t.String({ description: 'padding 别名' })])),
  ),
  paddingTop: t.Optional(t.Numeric({ description: '独立上留白边距（像素）' })),
  pt: alias('paddingTop', 'pt', t.Optional(t.Numeric({ description: 'paddingTop 别名' }))),
  paddingRight: t.Optional(t.Numeric({ description: '独立右留白边距（像素）' })),
  pr: alias('paddingRight', 'pr', t.Optional(t.Numeric({ description: 'paddingRight 别名' }))),
  paddingBottom: t.Optional(t.Numeric({ description: '独立下留白边距（像素）' })),
  pb: alias('paddingBottom', 'pb', t.Optional(t.Numeric({ description: 'paddingBottom 别名' }))),
  paddingLeft: t.Optional(t.Numeric({ description: '独立左留白边距（像素）' })),
  pl: alias('paddingLeft', 'pl', t.Optional(t.Numeric({ description: 'paddingLeft 别名' }))),
  center: t.Optional(FlexibleBoolean),
  vcenter: alias('center', 'vcenter', t.Optional(FlexibleBoolean)),

  format: t.Optional(
    t.Union(
      [
        t.Literal('png'),
        t.Literal('webp'),
        t.Literal('jpeg'),
        t.Literal('jpg'),
        t.Literal('base64'),
        t.Literal('svg'),
        t.Literal('gif'),
        t.Literal('apng'),
      ],
      {
        description: '输出格式（png / webp / jpeg / svg / base64 / gif / apng）',
        default: 'png',
      },
    ),
  ),
  fps: t.Optional(
    t.Numeric({
      description: '动图帧率（针对 gif / apng，默认 24，范围 10~30）',
      minimum: 10,
      maximum: 30,
      default: 24,
    }),
  ),
  duration: t.Optional(
    t.Numeric({
      description: '动图入场时长秒数（针对 gif / apng，默认 1.1，范围 0.4~3.0）',
      minimum: 0.4,
      maximum: 3.0,
      default: 1.1,
    }),
  ),
});

export type LogoQuery = typeof LogoQuerySchema.static;
