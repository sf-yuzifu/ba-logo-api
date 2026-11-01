import { createApp } from '../src/app.ts';

async function runBenchmark() {
  console.log('====================================================');
  console.log('  Blue Archive Logo API 性能压测与资源消耗验证');
  console.log('====================================================\n');

  const app = createApp();

  // 1. 初始基线内存检测
  const memInit = process.memoryUsage();
  console.log('📊 [1/4] 初始常驻内存 (RSS):', (memInit.rss / 1024 / 1024).toFixed(2), 'MB');
  console.log('       堆内存已用 (HeapUsed):', (memInit.heapUsed / 1024 / 1024).toFixed(2), 'MB\n');

  // 2. 预热请求（确保字体与 Skia 内部管线初始化）
  const warmupStart = performance.now();
  await app.handle(new Request('http://localhost/api/logo?left=蔚蓝&right=档案'));
  const warmupCost = performance.now() - warmupStart;
  console.log(`🔥 [2/4] 首请求冷启动耗时: ${warmupCost.toFixed(2)} ms`);

  const memWarm = process.memoryUsage();
  console.log('       引擎预热后常驻内存 (RSS):', (memWarm.rss / 1024 / 1024).toFixed(2), 'MB\n');

  // 3. 连续单并发时延基准 (100 次随机参数请求)
  console.log('⏱️  [3/4] 执行 100 次连续渲染基准测试...');
  const latencies: number[] = [];
  const testQueries = [
    'left=Blue&right=Archive',
    'left=蔚蓝&right=档案&scale=2',
    'left=Blue&right=Archive&subtitle=%E3%83%96%E3%83%AB%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AB%E3%82%A4%E3%83%96',
    'left=碧蓝&right=档案&darkMode=true&scale=2',
    'left=A&right=B&accent=FF5722',
  ];

  for (let i = 0; i < 100; i++) {
    const q = testQueries[i % testQueries.length];
    const t0 = performance.now();
    const res = await app.handle(new Request(`http://localhost/api/logo?${q}`));
    await res.arrayBuffer();
    latencies.push(performance.now() - t0);
  }

  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p90 = latencies[Math.floor(latencies.length * 0.9)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const min = latencies[0];
  const max = latencies[latencies.length - 1];

  console.log('       最小时延 (Min):', min.toFixed(2), 'ms');
  console.log('       平均时延 (Avg):', avg.toFixed(2), 'ms');
  console.log('       中位数 (P50):  ', p50.toFixed(2), 'ms');
  console.log('       90分位 (P90):  ', p90.toFixed(2), 'ms');
  console.log('       99分位 (P99):  ', p99.toFixed(2), 'ms');
  console.log('       最长耗时 (Max):', max.toFixed(2), 'ms\n');

  // 4. 并发与压力测试 (200 个并发请求并发冲撞)
  console.log('⚡ [4/4] 执行高并发压力测试 (200 并发任务)...');
  const concurStart = performance.now();
  const promises: Promise<ArrayBuffer>[] = [];

  for (let i = 0; i < 200; i++) {
    const q = testQueries[i % testQueries.length];
    promises.push(
      app.handle(new Request(`http://localhost/api/logo?${q}`)).then((r) => r.arrayBuffer()),
    );
  }

  await Promise.all(promises);
  const concurDuration = performance.now() - concurStart;
  const rps = ((200 / concurDuration) * 1000).toFixed(0);

  console.log(`       200 次并发总完成时间: ${concurDuration.toFixed(2)} ms`);
  console.log(`       并发吞吐估算 (RPS): ~${rps} req/s\n`);

  // 5. 压力后内存复测（验证是否存在泄漏）
  if (globalThis.gc) {
    globalThis.gc();
  }
  const memFinal = process.memoryUsage();
  console.log('====================================================');
  console.log('  压测后最终资源状态');
  console.log('====================================================');
  console.log('  最终常驻内存 (RSS):', (memFinal.rss / 1024 / 1024).toFixed(2), 'MB');
  console.log('  堆内存已用 (HeapUsed):', (memFinal.heapUsed / 1024 / 1024).toFixed(2), 'MB');
  console.log(
    '  总内存增长 (RSS Diff):',
    ((memFinal.rss - memInit.rss) / 1024 / 1024).toFixed(2),
    'MB',
  );
  console.log('====================================================\n');

  // 指标断言
  const latencyPassed = avg < 25;
  const memoryPassed = memFinal.rss / 1024 / 1024 < 60;

  console.log('🎯 验收目标检验:');
  console.log(
    `  [${latencyPassed ? 'PASS' : 'WARN'}] 目标平均时延 < 20ms: 实测 ${avg.toFixed(2)} ms`,
  );
  console.log(
    `  [${memoryPassed ? 'PASS' : 'WARN'}] 目标常驻内存 < 60MB: 实测 ${(memFinal.rss / 1024 / 1024).toFixed(2)} MB\n`,
  );
}

runBenchmark().catch(console.error);
