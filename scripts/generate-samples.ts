import fs from 'node:fs';
import path from 'node:path';
import { renderLogoToBuffer } from '../src/renderer.ts';

const outDir = path.resolve(import.meta.dir, '../samples');
fs.mkdirSync(outDir, { recursive: true });

console.log('🚀 开始生成离线样例图...\n');

const samples = [
  {
    filename: '01-default-1x.png',
    options: { textL: '蔚蓝', textR: '档案', scale: 1, center: false },
    desc: '标准中文（1x）',
  },
  {
    filename: '02-official-en-jp-2x.png',
    options: {
      textL: 'Blue',
      textR: 'Archive',
      subtitle: 'ブルーアーカイブ',
      scale: 2,
    },
    desc: '官方英日副标题风格（2x 高清）',
  },
  {
    filename: '03-dark-mode-2x.png',
    options: {
      textL: 'Blue',
      textR: 'Archive',
      subtitle: 'ブルーアーカイブ',
      darkMode: true,
      scale: 2,
    },
    desc: '暗黑模式（2x 高清）',
  },
  {
    filename: '04-custom-color-swap-2x.png',
    options: {
      textL: '碧蓝',
      textR: '航线',
      accentColor: '#FF5722',
      swapColors: true,
      scale: 2,
      center: false,
    },
    desc: '自定义橙色强调色 + 左右颜色互换（2x）',
  },
  {
    filename: '05-transparent-2x.png',
    options: {
      textL: '透明',
      textR: '背景',
      transparent: true,
      scale: 2,
      center: false,
    },
    desc: '透明背景镂空裁切（亮色模式，2x）',
  },
  {
    filename: '05-transparent-dark-2x.png',
    options: {
      textL: '透明',
      textR: '背景',
      transparent: true,
      darkMode: true,
      scale: 2,
      center: false,
    },
    desc: '透明背景镂空裁切（暗色模式自适应，2x）',
  },
  {
    filename: '06-hires-4x.png',
    options: {
      textL: '超高',
      textR: '清4K',
      scale: 4,
      center: false,
    },
    desc: '4x 超高分辨率印刷级大图',
  },
];

for (const s of samples) {
  const start = performance.now();
  const res = renderLogoToBuffer(s.options);
  const cost = (performance.now() - start).toFixed(2);
  const dest = path.join(outDir, s.filename);
  fs.writeFileSync(dest, res.buffer);
  console.log(
    `✅ [${cost}ms] ${s.desc} -> ${s.filename} (${res.width}x${res.height}, ${(res.buffer.length / 1024).toFixed(1)} KB)`,
  );
}

console.log(`\n🎉 全部样例图生成完成，保存在：${outDir}`);
