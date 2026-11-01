import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { renderLogoToBuffer, type RenderOptions, type OutputFormat } from './renderer.ts';
import { LogoQuerySchema, type LogoQuery } from './schema.ts';

/**
 * 将 Query 查询参数解析并标准化为 RenderOptions
 */
export function parseLogoQuery(query: Record<string, any>): RenderOptions {
  // 左侧文字
  const textL = query.left ?? query.l ?? '蔚蓝';
  // 右侧文字
  const textR = query.right ?? query.r ?? '档案';
  // 副标题
  const subtitle = query.subtitle ?? query.sub;
  const subtitleColor = query.subtitleColor ?? query.subColor;

  // 坐标偏移
  const rawX = query.offsetX ?? query.x;
  const offsetX = rawX !== undefined && !Number.isNaN(Number(rawX)) ? Number(rawX) : undefined;
  const rawY = query.offsetY ?? query.y;
  const offsetY = rawY !== undefined && !Number.isNaN(Number(rawY)) ? Number(rawY) : undefined;

  // 透明背景
  const rawTp = query.transparent ?? query.tp;
  const transparent =
    typeof rawTp === 'boolean' ? rawTp : rawTp === 'true' || rawTp === '1';

  // 缩放倍率
  const rawScale = query.scale ?? query.s;
  const scale =
    rawScale !== undefined && !Number.isNaN(Number(rawScale)) ? Number(rawScale) : undefined;

  // 暗黑模式
  const rawDark = query.darkMode ?? query.dark;
  const darkMode =
    typeof rawDark === 'boolean' ? rawDark : rawDark === 'true' || rawDark === '1';

  // 颜色互换
  const rawSwap = query.swapColors ?? query.swap;
  const swapColors =
    typeof rawSwap === 'boolean' ? rawSwap : rawSwap === 'true' || rawSwap === '1';

  // 强调色
  const accentColor = query.accentColor ?? query.accent;

  // 紧凑裁切
  const rawCrop = query.crop;
  const crop =
    typeof rawCrop === 'boolean'
      ? rawCrop
      : rawCrop !== undefined
      ? rawCrop !== 'false' && rawCrop !== '0'
      : true;

  // 格式
  const format = (query.format ?? 'png').toLowerCase() as OutputFormat;

  return {
    textL,
    textR,
    subtitle,
    subtitleColor,
    offsetX,
    offsetY,
    transparent,
    scale,
    darkMode,
    swapColors,
    accentColor,
    crop,
    format,
  };
}

/**
 * 处理 Logo 生成请求的核心分发函数
 */
export function handleLogoRequest(query: Record<string, any>, set: any) {
  const options = parseLogoQuery(query);
  const result = renderLogoToBuffer(options);

  // 如果指定格式为 base64，返回结构化 JSON
  if (options.format === 'base64') {
    set.headers['content-type'] = 'application/json; charset=utf-8';
    return {
      code: 200,
      data: {
        base64: result.base64,
        dataUrl: result.dataUrl,
        width: result.width,
        height: result.height,
        mimeType: result.mimeType,
      },
    };
  }

  // 默认返回二进制图片流
  return new Response(result.buffer, {
    status: 200,
    headers: {
      'Content-Type': result.mimeType,
      'Content-Length': result.buffer.length.toString(),
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * 创建并配置 Elysia Web 应用实例
 */
export function createApp() {
  const app = new Elysia()
    .use(cors())

    // 1. 旧版兼容路由 (GET /balogo)
    .get(
      '/balogo',
      ({ query, set }) => {
        return handleLogoRequest(query, set);
      },
      {
        query: LogoQuerySchema,
      }
    )

    // 2. 现代 RESTful 路由 (GET /api/logo)
    .get(
      '/api/logo',
      ({ query, set }) => {
        return handleLogoRequest(query, set);
      },
      {
        query: LogoQuerySchema,
      }
    )

    // 根路径健康检查/欢迎信息
    .get('/', () => {
      return {
        name: 'ba-logo-api',
        version: '2.0.0',
        status: 'online',
        endpoints: ['/api/logo', '/balogo'],
      };
    });

  return app;
}
