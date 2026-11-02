import { describe, expect, it } from 'bun:test';
import { createApp } from '../src/app.ts';
import { getRegisteredQueryAliases, LogoQuerySchema } from '../src/schema.ts';

describe('HTTP Route & Compatibility Tests', () => {
  const app = createApp();

  it('GET / 默认应当返回 Blue Archive 风格的 WebUI 调试页面与 SPA 挂载点', async () => {
    const res = await app.handle(new Request('http://localhost/'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('Blue Archive Logo Generator');
    expect(html).toContain('id="app"');
  });

  it('GET / 携带 Accept: application/json 或访问 /health 应当返回 JSON 状态及动态版本信息', async () => {
    const res = await app.handle(
      new Request('http://localhost/', {
        headers: { Accept: 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    const body: unknown = await res.json();
    expect(body).toMatchObject({ status: 'online', name: 'ba-logo-api', version: '2.0.0' });

    const healthRes = await app.handle(new Request('http://localhost/health'));
    expect(healthRes.status).toBe(200);
    const health: unknown = await healthRes.json();
    expect(health).toMatchObject({ status: 'ok', version: '2.0.0' });
  });

  it('GET /api/logo 应当保留 center 参数的布尔与 undefined 语义区别', async () => {
    const defaultCenterRes = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive'),
    );
    const falseCenterRes = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&center=false'),
    );
    const trueCenterRes = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&center=true'),
    );

    expect(defaultCenterRes.status).toBe(200);
    expect(falseCenterRes.status).toBe(200);
    expect(trueCenterRes.status).toBe(200);

    const defaultBuf = await defaultCenterRes.arrayBuffer();
    const falseBuf = await falseCenterRes.arrayBuffer();
    const trueBuf = await trueCenterRes.arrayBuffer();

    // 默认（有背景时）为居中，与 center=true 完全一致
    expect(defaultBuf.byteLength).toBe(trueBuf.byteLength);
    // center=false 去除纵向对称居中留白，尺寸和内容大小不同
    expect(falseBuf.byteLength).not.toBe(trueBuf.byteLength);
  });

  it('GET /assets/* 静态路由应当能正常分发构建后的前端资源文件', async () => {
    const res = await app.handle(new Request('http://localhost/assets/non-existent-test.js'));
    expect(res.status).toBe(404);
  });

  it('GET /balogo 应当完全向后兼容 3 年前的旧版参数', async () => {
    const res = await app.handle(
      new Request('http://localhost/balogo?l=碧蓝&r=档案&x=-10&y=5&tp=true'),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo 应当支持现代全量参数', async () => {
    const res = await app.handle(
      new Request(
        'http://localhost/api/logo?left=Blue&right=Archive&subtitle=%E3%83%96%E3%83%AB%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AB%E3%82%A4%E3%83%96&scale=2&format=webp&accent=00E5FF&textColor=000000&padding=10',
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/webp');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo 应当支持 CSS 语法 padding 参数 (如 padding=10,20)', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&padding=10,20'),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo 应当支持 wordGap / gap 两词间距参数', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&wordGap=30'),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo 应当支持副标题偏移 (subX / subY)', async () => {
    const res = await app.handle(
      new Request(
        'http://localhost/api/logo?left=Blue&right=Archive&subtitle=%E3%83%96%E3%83%AB%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AB%E3%82%A4%E3%83%96&subX=20&subY=10',
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo 应当支持独立 crossColor, haloColor 与 motifsBehindText 参数', async () => {
    const res = await app.handle(
      new Request(
        'http://localhost/api/logo?left=Blue&right=Archive&crossColor=FFD700&haloColor=9C27B0&motifsBehindText=true',
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('新旧路由与长短参数别名应当完全等价并输出相同二进制结果', async () => {
    // 1. /api/logo 全称长参数 vs /api/logo 短别名
    const resLong = await app.handle(
      new Request(
        'http://localhost/api/logo?left=Blue&right=Archive&subtitle=%E3%83%96%E3%83%AB%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AB%E3%82%A4%E3%83%96&subtitleColor=4A90E2&subtitleOffsetX=15&subtitleOffsetY=-8&scale=2&wordGap=20&offsetX=10&offsetY=-5&transparent=true&accentColor=FF5722&textColor=333333&crossColor=FFD700&haloColor=9C27B0&motifsBehindText=true&padding=10',
      ),
    );
    const resShort = await app.handle(
      new Request(
        'http://localhost/api/logo?l=Blue&r=Archive&sub=%E3%83%96%E3%83%AB%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AB%E3%82%A4%E3%83%96&subColor=4A90E2&subX=15&subY=-8&s=2&gap=20&x=10&y=-5&tp=true&accent=FF5722&tc=333333&cross=FFD700&halo=9C27B0&behind=true&pad=10',
      ),
    );

    expect(resLong.status).toBe(200);
    expect(resShort.status).toBe(200);
    const bufLong = Buffer.from(await resLong.arrayBuffer());
    const bufShort = Buffer.from(await resShort.arrayBuffer());
    expect(bufLong.equals(bufShort)).toBe(true);

    // 2. /balogo 兼容路由 vs /api/logo 现代路由
    const resBalogo = await app.handle(
      new Request('http://localhost/balogo?l=蔚蓝&r=档案&s=2&dark=true&swap=true'),
    );
    const resApi = await app.handle(
      new Request(
        'http://localhost/api/logo?left=蔚蓝&right=档案&scale=2&darkMode=true&swapColors=true',
      ),
    );
    expect(resBalogo.status).toBe(200);
    expect(resApi.status).toBe(200);
    const bufBalogo = Buffer.from(await resBalogo.arrayBuffer());
    const bufApi = Buffer.from(await resApi.arrayBuffer());
    expect(bufBalogo.equals(bufApi)).toBe(true);

    // 3. 方向留白别名等价性 (paddingTop vs pt, paddingLeft vs pl)
    const resPadLong = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&paddingTop=14&paddingLeft=22'),
    );
    const resPadShort = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&pt=14&pl=22'),
    );
    expect(resPadLong.status).toBe(200);
    expect(resPadShort.status).toBe(200);
    const bufPadLong = Buffer.from(await resPadLong.arrayBuffer());
    const bufPadShort = Buffer.from(await resPadShort.arrayBuffer());
    expect(bufPadLong.equals(bufPadShort)).toBe(true);
  });

  it('长参数与别名同时提供时应优先采用长参数', async () => {
    const canonical = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&scale=1'),
    );
    const conflictingAlias = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&l=Other&right=Archive&r=Other&scale=1&s=2'),
    );
    expect(
      Buffer.from(await conflictingAlias.arrayBuffer()).equals(
        Buffer.from(await canonical.arrayBuffer()),
      ),
    ).toBe(true);
  });

  it('GET /api/logo?format=svg 应当返回纯矢量 SVG 文件', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&format=svg'),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
    const text = await res.text();
    expect(text).toContain('<svg');
    expect(text).toContain('<path');
  });

  it('GET /api/logo?format=base64 应当返回结构化 JSON', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/logo?left=蔚蓝&right=档案&format=base64'),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body: unknown = await res.json();
    expect(body).toMatchObject({
      code: 200,
      data: {
        base64: expect.any(String),
        dataUrl: expect.stringMatching(/^data:image\/png;base64,/),
      },
    });
  });

  it('参数校验失败时（如 scale 超标或非法格式）应当返回 422 错误以保护服务器', async () => {
    // scale 超出 8.0 最大限制
    const res1 = await app.handle(new Request('http://localhost/api/logo?scale=99'));
    expect(res1.status).toBe(422);

    // 非法 format 格式
    const res2 = await app.handle(new Request('http://localhost/api/logo?format=gif'));
    expect(res2.status).toBe(422);
  });

  it('GET /swagger 与 /swagger/json 应当成功提供交互式文档及 OpenAPI 规范', async () => {
    const htmlRes = await app.handle(new Request('http://localhost/swagger'));
    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get('content-type')).toContain('text/html');

    const jsonRes = await app.handle(new Request('http://localhost/swagger/json'));
    expect(jsonRes.status).toBe(200);
    const spec: unknown = await jsonRes.json();
    expect(spec).toMatchObject({
      openapi: expect.any(String),
      paths: {
        '/api/logo': expect.any(Object),
        '/balogo': expect.any(Object),
      },
    });

    expect(Object.keys(LogoQuerySchema.properties)).toContain('left');
    expect(Object.keys(LogoQuerySchema.properties)).toContain('l');
    expect(getRegisteredQueryAliases()).toContain('behind');
    for (const name of ['left', 'l', 'motifsBehindText', 'behind']) {
      expect(JSON.stringify(LogoQuerySchema)).toContain(name);
    }
  });

  it('参数别名登记应与 LogoQuerySchema 字段保持同步', () => {
    const schemaFields = Object.keys(LogoQuerySchema.properties);
    for (const name of getRegisteredQueryAliases()) {
      expect(schemaFields).toContain(name);
    }
  });

  it('应当正确输出 Cache-Control 与 ETag 并在命中缓存时响应 304 Not Modified', async () => {
    // 首次请求获取 ETag
    const firstRes = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive'),
    );
    expect(firstRes.status).toBe(200);
    expect(firstRes.headers.get('cache-control')).toContain('max-age=86400');
    const etag = firstRes.headers.get('etag');
    if (!etag) throw new Error('Expected an ETag header');
    expect(etag.startsWith('W/"')).toBe(true);

    // 带 If-None-Match 请求校验 304
    const cachedRes = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive', {
        headers: { 'If-None-Match': etag },
      }),
    );
    expect(cachedRes.status).toBe(304);
  });
});
