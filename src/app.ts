import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { renderLogoToBuffer, type RenderOptions, type OutputFormat } from './renderer.ts';
import { LogoQuerySchema, type LogoQuery } from './schema.ts';
import { getWebUIHtml } from './webui.ts';

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
export function handleLogoRequest(
  query: Record<string, any>,
  set: any,
  requestHeaders?: Headers | Record<string, string | undefined>
) {
  const options = parseLogoQuery(query);
  const result = renderLogoToBuffer(options);

  // 基于图片内容生成 ETag (使用 Bun 内置高效快速哈希)
  const hash = Bun.hash(result.buffer).toString(16);
  const etag = `W/"${hash}-${result.buffer.length}"`;

  // 检查客户端 If-None-Match 缓存命中
  const ifNoneMatch =
    requestHeaders instanceof Headers
      ? requestHeaders.get('if-none-match')
      : requestHeaders?.['if-none-match'];

  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        'ETag': etag,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 如果指定格式为 base64，返回结构化 JSON
  if (options.format === 'base64') {
    set.headers['content-type'] = 'application/json; charset=utf-8';
    set.headers['cache-control'] = 'public, max-age=86400, stale-while-revalidate=604800';
    set.headers['etag'] = etag;
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

  // 默认返回二进制图片流并附带强缓存及 ETag 响应头
  return new Response(result.buffer, {
    status: 200,
    headers: {
      'Content-Type': result.mimeType,
      'Content-Length': result.buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'ETag': etag,
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
    .use(
      swagger({
        path: '/swagger',
        documentation: {
          info: {
            title: 'Blue Archive Logo API',
            version: '2.0.0',
            description:
              '高性能蔚蓝档案 (Blue Archive) 风格 Logo 生成器 API。基于 Bun + ElysiaJS + Skia Canvas 构建，支持毫秒级渲染、无损矢量光环、4K高清倍率、副标题排版、暗黑模式及多格式导出。',
            license: {
              name: 'MIT',
              url: 'https://opensource.org/licenses/MIT',
            },
          },
          tags: [
            { name: 'Logo Generation', description: 'Logo 核心生成接口' },
            { name: 'Health', description: '服务健康检查与状态探测' },
          ],
        },
      })
    )

    // 1. 旧版兼容路由 (GET /balogo)
    .get(
      '/balogo',
      ({ query, set, headers }) => {
        return handleLogoRequest(query, set, headers);
      },
      {
        query: LogoQuerySchema,
        detail: {
          tags: ['Logo Generation'],
          summary: '旧版兼容接口（兼容 3 年前旧版参数 l, r, x, y, tp）',
          description:
            '完全兼容旧项目的请求参数，直接返回二进制图片流，平滑迁移老客户端或聊天机器人。',
        },
      }
    )

    // 2. 现代 RESTful 路由 (GET /api/logo)
    .get(
      '/api/logo',
      ({ query, set, headers }) => {
        return handleLogoRequest(query, set, headers);
      },
      {
        query: LogoQuerySchema,
        detail: {
          tags: ['Logo Generation'],
          summary: '生成 Blue Archive 风格 Logo（RESTful 现代接口）',
          description:
            '接收完整的排版与色彩参数，使用 Skia 矢量引擎即时生成并返回图片二进制数据或 Base64 编码数据。',
        },
      }
    )

    // 3. 根路径：默认呈现 Blue Archive 风格交互式 WebUI 调试页
    .get(
      '/',
      ({ headers, set }) => {
        const accept = headers['accept'] ?? '';
        if (accept.includes('application/json')) {
          return {
            name: 'ba-logo-api',
            version: '2.0.0',
            status: 'online',
            docs: '/swagger',
            endpoints: ['/api/logo', '/balogo'],
          };
        }
        set.headers['content-type'] = 'text/html; charset=utf-8';
        return getWebUIHtml();
      },
      {
        detail: {
          tags: ['Health'],
          summary: '在线交互式控制台 / 服务探测',
        },
      }
    )

    // 4. 健康检查探测接口
    .get(
      '/health',
      () => {
        return {
          status: 'ok',
          uptime: process.uptime(),
          timestamp: Date.now(),
        };
      },
      {
        detail: {
          tags: ['Health'],
          summary: '集群健康探测探针',
        },
      }
    );

  return app;
}
