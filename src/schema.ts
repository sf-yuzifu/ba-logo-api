import { t } from 'elysia';

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
    })
  ),
  l: t.Optional(t.String({ description: 'left 别名' })),

  right: t.Optional(
    t.String({
      description: 'Logo 右侧主文字（深灰色，默认"档案"）',
      examples: ['Archive', '档案'],
    })
  ),
  r: t.Optional(t.String({ description: 'right 别名' })),

  // 可选副标题（PR #12）
  subtitle: t.Optional(
    t.String({
      description: '右下方可选副标题（如官方日文副标）',
      examples: ['ブルーアーカイブ', 'Blue Archive'],
    })
  ),
  sub: t.Optional(t.String({ description: 'subtitle 别名' })),

  subtitleColor: t.Optional(
    t.String({
      description: '副标题颜色（默认跟随次要文字颜色）',
      examples: ['#2B2B2B', '#FFFFFF'],
    })
  ),
  subColor: t.Optional(t.String({ description: 'subtitleColor 别名' })),

  // 坐标偏移
  offsetX: t.Optional(
    t.Numeric({
      description: '光环与十字 X 轴偏移量（像素，默认 -15）',
      examples: [-15, 0, 20],
    })
  ),
  x: t.Optional(t.Numeric({ description: 'offsetX 别名' })),

  offsetY: t.Optional(
    t.Numeric({
      description: '光环与十字 Y 轴偏移量（像素，默认 0）',
      examples: [0, -10, 10],
    })
  ),
  y: t.Optional(t.Numeric({ description: 'offsetY 别名' })),

  // 背景与样式
  transparent: t.Optional(
    FlexibleBoolean
  ),
  tp: t.Optional(FlexibleBoolean),

  // 分辨率缩放（PR #9）
  scale: t.Optional(
    t.Numeric({
      description: '分辨率缩放倍率（1x=250p, 2x=500p, 4x=1000p，范围 0.1 ~ 8.0，默认 1）',
      minimum: 0.1,
      maximum: 8.0,
      examples: [1, 2, 4],
    })
  ),
  s: t.Optional(
    t.Numeric({
      description: 'scale 别名',
      minimum: 0.1,
      maximum: 8.0,
    })
  ),

  // 配色方案（PR #6）
  darkMode: t.Optional(FlexibleBoolean),
  dark: t.Optional(FlexibleBoolean),

  swapColors: t.Optional(FlexibleBoolean),
  swap: t.Optional(FlexibleBoolean),

  accentColor: t.Optional(
    t.String({
      description: '主强调色（十六进制颜色代码，影响左文字与十字架，默认 #128AFA）',
      examples: ['#128AFA', '#FF5722', '#00E5FF'],
    })
  ),
  accent: t.Optional(t.String({ description: 'accentColor 别名' })),

  textColor: t.Optional(
    t.String({
      description: '文字主题色（十六进制颜色代码，影响右文字与光环，默认 #2B2B2B）',
      examples: ['#2B2B2B', '#000000', '#FFFFFF'],
    })
  ),
  color: t.Optional(t.String({ description: 'textColor 别名' })),
  tc: t.Optional(t.String({ description: 'textColor 别名' })),

  // 留白边距（支持纯数字如 10，或 CSS 语法字符串如 "10 20", "10,20,30,40"）
  padding: t.Optional(
    t.Union([
      t.Numeric({ description: '留白边距像素值' }),
      t.String({
        description: '内容留白边距（支持 CSS 语法，如 "10 20", "10,20,30,40"）',
        examples: ['2', '10', '10 20', '10,20,30,40'],
      }),
    ])
  ),
  pad: t.Optional(
    t.Union([
      t.Numeric(),
      t.String({ description: 'padding 别名' }),
    ])
  ),
  paddingTop: t.Optional(t.Numeric({ description: '独立上留白边距（像素）' })),
  pt: t.Optional(t.Numeric({ description: 'paddingTop 别名' })),
  paddingRight: t.Optional(t.Numeric({ description: '独立右留白边距（像素）' })),
  pr: t.Optional(t.Numeric({ description: 'paddingRight 别名' })),
  paddingBottom: t.Optional(t.Numeric({ description: '独立下留白边距（像素）' })),
  pb: t.Optional(t.Numeric({ description: 'paddingBottom 别名' })),
  paddingLeft: t.Optional(t.Numeric({ description: '独立左留白边距（像素）' })),
  pl: t.Optional(t.Numeric({ description: 'paddingLeft 别名' })),
  center: t.Optional(
    FlexibleBoolean
  ),
  vcenter: t.Optional(FlexibleBoolean),

  format: t.Optional(
    t.Union(
      [
        t.Literal('png'),
        t.Literal('webp'),
        t.Literal('jpeg'),
        t.Literal('jpg'),
        t.Literal('base64'),
      ],
      {
        description: '输出格式（png / webp / jpeg / base64）',
        default: 'png',
      }
    )
  ),
});

export type LogoQuery = typeof LogoQuerySchema.static;
