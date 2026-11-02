import path from 'node:path';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { type Context, Elysia } from 'elysia';
import pkg from '../package.json' with { type: 'json' };
import { type OutputFormat, type RenderOptions, renderLogoToBuffer } from './renderer.ts';
import { type LogoQuery, LogoQuerySchema } from './schema.ts';

const APP_NAME = pkg.name;
const APP_VERSION = pkg.version;
const WEB_DIST_DIR = path.resolve(import.meta.dir, '../dist/web');
const WEB_INDEX_PATH = path.join(WEB_DIST_DIR, 'index.html');
const CACHE_CONTROL_HEADER = 'public, max-age=86400, stale-while-revalidate=604800';

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return undefined;
}

function createCacheHeaders(
  etag: string,
  mimeType?: string,
  contentLength?: number,
): Record<string, string> {
  const headers: Record<string, string> = {
    ETag: etag,
    'Cache-Control': CACHE_CONTROL_HEADER,
  };
  if (mimeType) headers['Content-Type'] = mimeType;
  if (contentLength !== undefined) headers['Content-Length'] = contentLength.toString();
  return headers;
}

/**
 * 将 Query 查询参数解析并标准化为 RenderOptions
 */
export function parseLogoQuery(query: LogoQuery): RenderOptions {
  const textL = query.left ?? query.l ?? '蔚蓝';
  const textR = query.right ?? query.r ?? '档案';
  const subtitle = query.subtitle ?? query.sub;
  const subtitleColor = query.subtitleColor ?? query.subColor;

  const offsetX = parseOptionalNumber(query.offsetX ?? query.x);
  const offsetY = parseOptionalNumber(query.offsetY ?? query.y);
  const subtitleOffsetX = parseOptionalNumber(query.subtitleOffsetX ?? query.subX);
  const subtitleOffsetY = parseOptionalNumber(query.subtitleOffsetY ?? query.subY);
  const scale = parseOptionalNumber(query.scale ?? query.s);
  const wordGap = parseOptionalNumber(query.wordGap ?? query.gap);

  const transparent = parseOptionalBoolean(query.transparent ?? query.tp);
  const darkMode = parseOptionalBoolean(query.darkMode ?? query.dark);
  const swapColors = parseOptionalBoolean(query.swapColors ?? query.swap);
  const motifsBehindText = parseOptionalBoolean(
    query.motifsBehindText ?? query.underText ?? query.behind,
  );
  const center = parseOptionalBoolean(query.center ?? query.vcenter);

  const accentColor = query.accentColor ?? query.accent;
  const textColor = query.textColor ?? query.color ?? query.tc;
  const crossColor = query.crossColor ?? query.cross;
  const haloColor = query.haloColor ?? query.halo;

  const padding = query.padding ?? query.pad;
  const paddingTop = parseOptionalNumber(query.paddingTop ?? query.pt);
  const paddingRight = parseOptionalNumber(query.paddingRight ?? query.pr);
  const paddingBottom = parseOptionalNumber(query.paddingBottom ?? query.pb);
  const paddingLeft = parseOptionalNumber(query.paddingLeft ?? query.pl);

  const format = (query.format ?? 'png').toLowerCase() as OutputFormat;

  return {
    textL,
    textR,
    subtitle,
    subtitleColor,
    subtitleOffsetX,
    subtitleOffsetY,
    offsetX,
    offsetY,
    wordGap,
    transparent,
    scale,
    darkMode,
    swapColors,
    accentColor,
    textColor,
    crossColor,
    haloColor,
    motifsBehindText,
    padding,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    center,
    format,
  };
}

/**
 * 处理 Logo 生成请求的核心分发函数
 */
export function handleLogoRequest(
  query: LogoQuery,
  set: Context['set'],
  requestHeaders?: Headers | Record<string, string | undefined>,
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
      headers: createCacheHeaders(etag),
    });
  }

  // 如果指定格式为 base64，返回结构化 JSON
  if (options.format === 'base64') {
    set.headers['content-type'] = 'application/json; charset=utf-8';
    set.headers['cache-control'] = CACHE_CONTROL_HEADER;
    set.headers.etag = etag;
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
    headers: createCacheHeaders(etag, result.mimeType, result.buffer.length),
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
            version: APP_VERSION,
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
      }),
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
      },
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
      },
    )

    // 3. 根路径：默认呈现 Blue Archive 风格交互式 WebUI 调试页
    .get(
      '/',
      async ({ headers, set }) => {
        const accept = headers.accept ?? '';
        if (accept.includes('application/json')) {
          return {
            name: APP_NAME,
            version: APP_VERSION,
            status: 'online',
            docs: '/swagger',
            endpoints: ['/api/logo', '/balogo'],
          };
        }
        const distFile = Bun.file(WEB_INDEX_PATH);
        if (await distFile.exists()) {
          set.headers['content-type'] = 'text/html; charset=utf-8';
          return distFile;
        }
        set.status = 503;
        set.headers['content-type'] = 'text/html; charset=utf-8';
        return '<!DOCTYPE html><html><body><h1>WebUI Not Built</h1><p>Please run <code>bun run build:web</code> to build the Vue 3 frontend.</p></body></html>';
      },
      {
        detail: {
          tags: ['Health'],
          summary: '在线交互式控制台 / 服务探测',
        },
      },
    )

    // 4. WebUI 静态前端资源分发
    .get(
      '/assets/*',
      async ({ params, set }) => {
        const filePath = path.join(WEB_DIST_DIR, 'assets', params['*']);
        const file = Bun.file(filePath);
        if (!(await file.exists())) {
          set.status = 404;
          return 'Asset Not Found';
        }
        return file;
      },
      {
        detail: {
          tags: ['Health'],
          summary: 'WebUI 前端静态资源路由',
        },
      },
    )

    // 5. 健康检查探测接口
    .get(
      '/health',
      () => {
        return {
          status: 'ok',
          version: APP_VERSION,
          uptime: process.uptime(),
          timestamp: Date.now(),
        };
      },
      {
        detail: {
          tags: ['Health'],
          summary: '集群健康探测探针',
        },
      },
    );

  return app;
}
