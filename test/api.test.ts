import { describe, it, expect } from 'bun:test';
import { createApp } from '../src/app.ts';

describe('HTTP Route & Compatibility Tests', () => {
  const app = createApp();

  it('GET / 应当返回服务运行状态', async () => {
    const res = await app.handle(new Request('http://localhost/'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('online');
    expect(body.name).toBe('ba-logo-api');
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
        'http://localhost/api/logo?left=Blue&right=Archive&subtitle=%E3%83%96%E3%83%AB%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AB%E3%82%A4%E3%83%96&scale=2&format=webp&accent=00E5FF'
      )
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/webp');
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
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
});
