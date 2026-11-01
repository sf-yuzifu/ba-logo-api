import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { renderLogoToBuffer, type RenderOptions, type OutputFormat } from './renderer.ts';

/**
 * 将 Query 查询参数解析并标准化为 RenderOptions
 */
export function parseLogoQuery(query: Record<string, string | undefined>): RenderOptions {
  // 左侧文字
  const textL = query.left ?? query.l ?? '蔚蓝';
  // 右侧文字
  const textR = query.right ?? query.r ?? '档案';
  // 副标题
  const subtitle = query.subtitle ?? query.sub;
  const subtitleColor = query.subtitleColor ?? query.subColor;

  // 坐标偏移
  const xStr = query.offsetX ?? query.x;
  const offsetX = xStr !== undefined && !Number.isNaN(Number(xStr)) ? Number(xStr) : undefined;
  const yStr = query.offsetY ?? query.y;
  const offsetY = yStr !== undefined && !Number.isNaN(Number(yStr)) ? Number(yStr) : undefined;

  // 透明背景
  const tpStr = query.transparent ?? query.tp;
  const transparent = tpStr === 'true' || tpStr === '1';

  // 缩放倍率
  const scaleStr = query.scale ?? query.s;
  const scale = scaleStr !== undefined && !Number.isNaN(Number(scaleStr)) ? Number(scaleStr) : undefined;

  // 暗黑模式
  const darkStr = query.darkMode ?? query.dark;
  const darkMode = darkStr === 'true' || darkStr === '1';

  // 颜色互换
  const swapStr = query.swapColors ?? query.swap;
  const swapColors = swapStr === 'true' || swapStr === '1';

  // 强调色
  const accentColor = query.accentColor ?? query.accent;

  // 紧凑裁切
  const cropStr = query.crop;
  const crop = cropStr !== undefined ? cropStr !== 'false' && cropStr !== '0' : true;

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
export function handleLogoRequest(query: Record<string, string | undefined>, set: any) {
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
    .get('/balogo', ({ query, set }) => {
      return handleLogoRequest(query, set);
    })

    // 2. 现代 RESTful 路由 (GET /api/logo)
    .get('/api/logo', ({ query, set }) => {
      return handleLogoRequest(query, set);
    })

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
