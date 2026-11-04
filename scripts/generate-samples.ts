import fs from 'node:fs';
import path from 'node:path';
import { type RenderOptions, renderLogoToBuffer } from '../src/renderer.ts';

const outDir = path.resolve(import.meta.dir, '../samples');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

console.log('🚀 开始生成多语言离线样例图...\n');

const locales: {
  directory: string;
  label: string;
  options: RenderOptions;
  customOptions: RenderOptions;
}[] = [
  {
    directory: 'en',
    label: '英文（无副标题）',
    options: { textL: 'Blue', textR: 'Archive', subtitle: '' },
    customOptions: { textL: 'Red', textR: 'Archive' },
  },
  {
    directory: 'zh-CN',
    label: '简体中文',
    options: { textL: '蔚蓝', textR: '档案', subtitle: 'BlueArchive' },
    customOptions: { textL: '赤红', textR: '档案', subtitle: 'RedArchive' },
  },
  {
    directory: 'zh-TW',
    label: '繁体中文',
    options: { textL: '蔚藍', textR: '檔案', subtitle: 'BlueArchive' },
    customOptions: { textL: '赤紅', textR: '檔案', subtitle: 'RedArchive' },
  },
  {
    directory: 'ja',
    label: '日文',
    options: { textL: 'ブルー', textR: 'アーカイブ', subtitle: 'BlueArchive' },
    customOptions: { textL: 'レッド', textR: 'アーカイブ', subtitle: 'RedArchive' },
  },
  {
    directory: 'ko',
    label: '韩文',
    options: { textL: '블루', textR: '아카이브', subtitle: 'BlueArchive' },
    customOptions: { textL: '레드', textR: '아카이브', subtitle: 'RedArchive' },
  },
];

const variants: {
  filename: string;
  options: RenderOptions;
  desc: string;
  customTitle?: boolean;
}[] = [
  {
    filename: '01-official-2x.png',
    options: { scale: 2 },
    desc: '官方本地化样式（2x）',
  },
  {
    filename: '02-dark-mode-2x.png',
    options: { scale: 2, darkMode: true },
    desc: '暗黑模式（2x）',
  },
  {
    filename: '03-custom-color-swap-2x.png',
    options: {
      scale: 2,
      accentColor: '#FF0000',
      swapColors: true,
    },
    desc: 'RedArchive 红色强调色 + 左右颜色互换（2x）',
    customTitle: true,
  },
  {
    filename: '04-transparent-2x.png',
    options: { scale: 2, transparent: true, center: false },
    desc: '透明背景镂空裁切（亮色模式，2x）',
  },
  {
    filename: '04-transparent-dark-2x.png',
    options: { scale: 2, transparent: true, darkMode: true, center: false },
    desc: '透明背景镂空裁切（暗色模式，2x）',
  },
  {
    filename: '05-animated-entrance.gif',
    options: { scale: 1, format: 'gif', fps: 24, duration: 1.1 },
    desc: '入场动效 GIF（24fps）',
  },
  {
    filename: '06-animated-entrance.svg',
    options: { scale: 1, format: 'svg-animated', duration: 1.1 },
    desc: 'Animated SVG 纯矢量动图',
  },
  {
    filename: '07-animated-entrance.webp',
    options: { scale: 1, format: 'webp-animated', fps: 24, duration: 1.1 },
    desc: 'Animated WebP 动图',
  },
];

for (const locale of locales) {
  const localeDir = path.join(outDir, locale.directory);
  fs.mkdirSync(localeDir, { recursive: true });

  for (const variant of variants) {
    const start = performance.now();
    const res = renderLogoToBuffer({
      padding: '24 0',
      center: false,
      ...locale.options,
      ...variant.options,
      ...(variant.customTitle ? locale.customOptions : {}),
    });
    const cost = (performance.now() - start).toFixed(2);
    const relativePath = `${locale.directory}/${variant.filename}`;
    fs.writeFileSync(path.join(localeDir, variant.filename), res.buffer);
    console.log(
      `✅ [${cost}ms] ${locale.label} · ${variant.desc} -> ${relativePath} (${res.width}x${res.height}, ${(res.buffer.length / 1024).toFixed(1)} KB)`,
    );
  }
}

console.log(`\n🎉 全部多语言样例图生成完成，保存在：${outDir}`);
