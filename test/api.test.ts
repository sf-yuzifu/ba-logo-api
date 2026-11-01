import { describe, it, expect } from 'bun:test';
import { createApp } from '../src/app.ts';

describe('HTTP Route & Compatibility Tests', () => {
  const app = createApp();

  it('GET / 默认应当返回 Blue Archive 风格的 WebUI 调试页面', async () => {
    const res = await app.handle(new Request('http://localhost/'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('Blue Archive Logo Generator');
    expect(html).toContain('SCHALE');
  });

  it('GET / 携带 Accept: application/json 或访问 /health 应当返回 JSON 状态', async () => {
    const res = await app.handle(
      new Request('http://localhost/', {
        headers: { Accept: 'application/json' },
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('online');
    expect(body.name).toBe('ba-logo-api');

    const healthRes = await app.handle(new Request('http://localhost/health'));
    expect(healthRes.status).toBe(200);
    const health = (await healthRes.json()) as any;
    expect(health.status).toBe('ok');
  });

  it('GET / 应当返回支持 i18n、一键复制图片与重置的 WebUI', async () => {
    const res = await app.handle(new Request('http://localhost/'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('id="langPills"');
    expect(html).toContain('id="btnCopyImage"');
    expect(html).toContain('id="btnResetAll"');
    expect(html).toContain('class="reset-badge"');
  });

  it('GET /balogo 应当完全向后兼容 3 年前的旧版参数', async () => {
    const res = await app.handle(
      new Request('http://localhost/balogo?l=碧蓝&r=档案&x=-10&y=5&tp=true')
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo 应当支持现代全量参数', async () => {
    const res = await app.handle(
      new Request(
        'http://localhost/api/logo?left=Blue&right=Archive&subtitle=%E3%83%96%E3%83%AB%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AB%E3%82%A4%E3%83%96&scale=2&format=webp&accent=00E5FF&textColor=000000&padding=10'
      )
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/webp');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo 应当支持 CSS 语法 padding 参数 (如 padding=10,20)', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&padding=10,20')
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo 应当支持 wordGap / gap 两词间距参数', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&wordGap=30')
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo 应当支持副标题偏移 (subX / subY)', async () => {
    const res = await app.handle(
      new Request(
        'http://localhost/api/logo?left=Blue&right=Archive&subtitle=%E3%83%96%E3%83%AB%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AB%E3%82%A4%E3%83%96&subX=20&subY=10'
      )
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo 应当支持独立 crossColor, haloColor 与 motifsBehindText 参数', async () => {
    const res = await app.handle(
      new Request(
        'http://localhost/api/logo?left=Blue&right=Archive&crossColor=FFD700&haloColor=9C27B0&motifsBehindText=true'
      )
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('GET /api/logo?format=svg 应当返回纯矢量 SVG 文件', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive&format=svg')
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
    const text = await res.text();
    expect(text).toContain('<svg');
    expect(text).toContain('<path');
  });

  it('GET /api/logo?format=base64 应当返回结构化 JSON', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/logo?left=蔚蓝&right=档案&format=base64')
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = (await res.json()) as any;
    expect(body.code).toBe(200);
    expect(body.data.base64).toBeDefined();
    expect(body.data.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('参数校验失败时（如 scale 超标或非法格式）应当返回 422 错误以保护服务器', async () => {
    // scale 超出 8.0 最大限制
    const res1 = await app.handle(
      new Request('http://localhost/api/logo?scale=99')
    );
    expect(res1.status).toBe(422);

    // 非法 format 格式
    const res2 = await app.handle(
      new Request('http://localhost/api/logo?format=gif')
    );
    expect(res2.status).toBe(422);
  });

  it('GET /swagger 与 /swagger/json 应当成功提供交互式文档及 OpenAPI 规范', async () => {
    const htmlRes = await app.handle(new Request('http://localhost/swagger'));
    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get('content-type')).toContain('text/html');

    const jsonRes = await app.handle(new Request('http://localhost/swagger/json'));
    expect(jsonRes.status).toBe(200);
    const spec = (await jsonRes.json()) as any;
    expect(spec.openapi || spec.swagger).toBeDefined();
    expect(spec.paths['/api/logo']).toBeDefined();
    expect(spec.paths['/balogo']).toBeDefined();
  });

  it('应当正确输出 Cache-Control 与 ETag 并在命中缓存时响应 304 Not Modified', async () => {
    // 首次请求获取 ETag
    const firstRes = await app.handle(new Request('http://localhost/api/logo?left=Blue&right=Archive'));
    expect(firstRes.status).toBe(200);
    expect(firstRes.headers.get('cache-control')).toContain('max-age=86400');
    const etag = firstRes.headers.get('etag');
    expect(etag).toBeDefined();
    expect(etag?.startsWith('W/"')).toBe(true);

    // 带 If-None-Match 请求校验 304
    const cachedRes = await app.handle(
      new Request('http://localhost/api/logo?left=Blue&right=Archive', {
        headers: { 'If-None-Match': etag! },
      })
    );
    expect(cachedRes.status).toBe(304);
  });
});
