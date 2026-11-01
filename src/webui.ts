/**
 * Blue Archive 风格的 WebUI 调试测试页
 * 设计风格参考自用户作品 BA-style-homepage 与 astroBlog：
 * 采用 Kivotos / Schale 浅蓝冰冷色调、玻璃拟态卡片、点阵网格与高响应式布局
 */

export function getWebUIHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blue Archive Logo Generator | API Console</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,600;0,700;0,800;0,900;1,700;1,900&family=Noto+Sans+SC:wght@500;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #128AFA;
      --primary-hover: #0c72d1;
      --primary-light: #e8f4fd;
      --accent-gold: #FFE401;
      --bg-color: #EAEFF5;
      --card-bg: rgba(255, 255, 255, 0.96);
      --card-border: #C7E4F6;
      --text-main: #2B2B2B;
      --text-muted: #5A6A7D;
      --focus-ring: #77DEFF;
      --focus-shadow: rgba(119, 222, 255, 0.45);
      --shadow-sm: 0 4px 12px rgba(40, 135, 200, 0.08);
      --shadow-md: 0 8px 24px rgba(40, 135, 200, 0.14);
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Nunito Sans', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg-color);
      background-image: 
        radial-gradient(#b8d2e8 1px, transparent 1px),
        linear-gradient(135deg, rgba(234, 239, 245, 0.8) 0%, rgba(220, 232, 243, 0.8) 100%);
      background-size: 24px 24px, 100% 100%;
      background-attachment: fixed;
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* 顶部导航栏 - Schale HUD 风格 */
    header {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 2px solid var(--card-border);
      padding: 0 2rem;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .brand-badge {
      background: var(--primary);
      color: #fff;
      font-weight: 900;
      font-size: 0.8rem;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      letter-spacing: 1px;
      transform: skew(-10deg);
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .brand-title span {
      color: var(--primary);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      font-weight: 700;
      padding: 7px 16px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .nav-btn-default {
      color: var(--text-muted);
      border: 1px solid var(--card-border);
      background: #fff;
    }

    .nav-btn-default:hover {
      color: var(--primary);
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--focus-shadow);
    }

    .nav-btn-primary {
      background: var(--primary);
      color: #fff;
      border: 1px solid var(--primary);
    }

    .nav-btn-primary:hover {
      background: var(--primary-hover);
      box-shadow: 0 4px 12px rgba(18, 138, 250, 0.35);
    }

    /* 主体布局 */
    main {
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem;
      display: grid;
      grid-template-columns: 480px minmax(0, 1fr);
      gap: 2rem;
      min-width: 0;
    }

    @media (max-width: 1024px) {
      main {
        grid-template-columns: minmax(0, 1fr);
        padding: 1.25rem;
      }
    }

    /* 卡片通用样式 */
    .card {
      background: var(--card-bg);
      border: 1.5px solid var(--card-border);
      border-radius: var(--radius-lg);
      padding: 1.75rem;
      box-shadow: var(--shadow-sm);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      min-width: 0;
      box-sizing: border-box;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1.5px solid var(--primary-light);
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      background: var(--primary);
      border-radius: 2px;
      transform: skew(-15deg);
    }

    /* 表单控件 */
    .form-group {
      margin-bottom: 1.15rem;
    }

    .form-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .input-text {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 14px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-main);
      background: #F8FAFC;
      border: 1.5px solid var(--card-border);
      border-radius: var(--radius-sm);
      outline: none;
      transition: all 0.2s ease;
    }

    .input-text:focus {
      background: #fff;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--focus-shadow);
    }

    /* 颜色选择器与预设 */
    .color-picker-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .color-presets {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .color-dot {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid #fff;
      box-shadow: 0 2px 5px rgba(0,0,0,0.15);
      transition: transform 0.2s ease;
    }

    .color-dot:hover {
      transform: scale(1.15);
    }

    input[type="color"] {
      -webkit-appearance: none;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: none;
    }

    input[type="color"]::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    input[type="color"]::-webkit-color-swatch {
      border: 1.5px solid var(--card-border);
      border-radius: var(--radius-sm);
    }

    /* 开关 Toggles */
    .toggles-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 1rem;
    }

    .toggle-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #F8FAFC;
      border: 1.5px solid var(--card-border);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }

    .toggle-item:hover {
      border-color: var(--primary);
      background: #fff;
    }

    .toggle-item span {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 38px;
      height: 20px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #CBD5E1;
      transition: .3s;
      border-radius: 20px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: var(--primary);
    }

    input:checked + .slider:before {
      transform: translateX(18px);
    }

    /* 格式选择标签 */
    .format-pills {
      display: flex;
      gap: 8px;
    }

    .pill-btn {
      flex: 1;
      padding: 7px 0;
      text-align: center;
      font-size: 0.82rem;
      font-weight: 800;
      border: 1.5px solid var(--card-border);
      border-radius: var(--radius-sm);
      background: #F8FAFC;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pill-btn.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 4px 10px rgba(18, 138, 250, 0.25);
    }

    /* 预览区 */
    .preview-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .preview-canvas-box {
      width: 100%;
      min-height: 380px;
      background: #fff;
      border: 1.5px solid var(--card-border);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      box-shadow: inset 0 2px 6px rgba(0,0,0,0.02);
      transition: background-color 0.3s ease;
    }

    .preview-canvas-box.transparent-grid {
      background-image: linear-gradient(45deg, #e9eff5 25%, transparent 25%), 
                        linear-gradient(-45deg, #e9eff5 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #e9eff5 75%), 
                        linear-gradient(-45deg, transparent 75%, #e9eff5 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    }

    .preview-canvas-box.dark-bg {
      background: #2B2B2B;
    }

    .preview-img {
      max-width: 100%;
      max-height: 480px;
      height: auto;
      object-fit: contain;
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.08));
      transition: opacity 0.2s ease;
    }

    .preview-loading {
      position: absolute;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(4px);
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: var(--primary);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      gap: 8px;
    }

    .preview-loading.active {
      opacity: 1;
      pointer-events: auto;
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid var(--primary-light);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* 元数据徽章 */
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .meta-badge {
      background: #F1F5F9;
      border: 1px solid var(--card-border);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .meta-badge strong {
      color: var(--primary);
      font-family: monospace;
    }

    /* 动作按钮组 */
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .action-btn {
      padding: 11px;
      font-size: 0.9rem;
      font-weight: 800;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .action-btn-primary {
      background: var(--primary);
      color: #fff;
    }

    .action-btn-primary:hover {
      background: var(--primary-hover);
      box-shadow: 0 4px 12px rgba(18, 138, 250, 0.35);
    }

    .action-btn-secondary {
      background: #fff;
      color: var(--text-main);
      border: 1.5px solid var(--card-border);
    }

    .action-btn-secondary:hover {
      border-color: var(--primary);
      color: var(--primary);
      box-shadow: 0 0 0 2px var(--focus-shadow);
    }

    .action-btn-copy {
      background: #F59E0B;
      color: #fff;
    }

    .action-btn-copy:hover {
      background: #D97706;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
    }

    /* 快捷重置按钮 */
    .reset-badge {
      background: #F1F5F9;
      border: 1px solid var(--card-border);
      border-radius: 4px;
      padding: 2px 7px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transition: all 0.2s ease;
      line-height: 1.2;
    }

    .reset-badge:hover {
      border-color: var(--primary);
      color: var(--primary);
      background: #fff;
    }

    /* 语言切换器 */
    .lang-pills {
      display: flex;
      background: #F1F5F9;
      padding: 3px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--card-border);
      gap: 2px;
      margin-right: 4px;
    }

    .lang-pills .pill-btn {
      padding: 4px 8px;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 4px;
      cursor: pointer;
      background: transparent;
      border: none;
      color: var(--text-muted);
      transition: all 0.15s ease;
    }

    .lang-pills .pill-btn.active {
      background: #fff;
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    /* API URL 预览条 */
    .url-box-container {
      background: #F8FAFC;
      border: 1.5px solid var(--card-border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .url-text {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 0.85rem;
      color: var(--text-muted);
      overflow-x: auto;
      white-space: nowrap;
      user-select: all;
      min-width: 0;
      flex: 1;
      padding-bottom: 2px;
      scrollbar-width: thin;
    }

    .url-text::-webkit-scrollbar {
      height: 4px;
    }
    .url-text::-webkit-scrollbar-track {
      background: transparent;
    }
    .url-text::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 2px;
    }
    .url-text::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .copy-url-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 0.8rem;
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .copy-url-btn:hover {
      background: var(--primary-hover);
    }

    /* Base64 弹窗 */
    #base64Box {
      display: none;
      margin-top: 10px;
      background: #0f172a;
      color: #38bdf8;
      padding: 10px;
      border-radius: var(--radius-sm);
      font-family: monospace;
      font-size: 0.75rem;
      max-height: 100px;
      overflow-y: auto;
      word-break: break-all;
    }

    /* Toast 提示 */
    #toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #1e293b;
      color: #fff;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 10px 18px;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-md);
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.25s ease;
      pointer-events: none;
      z-index: 1000;
    }

    #toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <!-- 顶部导航栏 -->
  <header>
    <a href="/" class="brand">
      <div class="brand-badge">SCHALE</div>
      <div class="brand-title">Blue<span>Archive</span> Logo API</div>
    </a>
    <div class="nav-links">
      <div class="lang-pills" id="langPills">
        <button type="button" class="pill-btn active" data-lang="zh">中</button>
        <button type="button" class="pill-btn" data-lang="zh-tw">繁</button>
        <button type="button" class="pill-btn" data-lang="en">EN</button>
        <button type="button" class="pill-btn" data-lang="ja">日</button>
      </div>
      <a href="/swagger" class="nav-btn nav-btn-primary" target="_blank">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <span data-i18n="nav-swagger">Swagger 交互文档</span>
      </a>
      <a href="https://github.com/nulla2011/bluearchive-logo" target="_blank" class="nav-btn nav-btn-default">
        <span data-i18n="nav-upstream">原版前端</span>
      </a>
    </div>
  </header>

  <!-- 主体工作区 -->
  <main>
    <!-- 左侧控制面板 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title" data-i18n="console-title">Logo 参数控制台</div>
        <!-- 路由模式切换 -->
        <div class="format-pills" id="endpointPills" style="width: 180px;">
          <div class="pill-btn active" data-ep="api" data-i18n="ep-restful">RESTful</div>
          <div class="pill-btn" data-ep="balogo" data-i18n="ep-legacy">旧版兼容</div>
        </div>
      </div>

      <!-- 文字配置 -->
      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-title">标题文字 (LEFT / RIGHT)</span>
          <button type="button" class="reset-badge" data-reset="text" title="重置文字"><span data-i18n="reset-text">默认 ↺</span></button>
        </label>
        <div class="form-row">
          <input type="text" id="inputLeft" class="input-text" value="蔚蓝" placeholder="左文字（蓝色）" data-i18n-ph="ph-left">
          <input type="text" id="inputRight" class="input-text" value="档案" placeholder="右文字（黑色）" data-i18n-ph="ph-right">
        </div>
      </div>

      <!-- 副标题配置 -->
      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-sub">副标题 (SUBTITLE，可选)</span>
          <button type="button" class="reset-badge" data-reset="subtitle" title="清空副标题"><span data-i18n="reset-clear">清空 ↺</span></button>
        </label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="inputSub" class="input-text" value="" placeholder="例如：ブルーアーカイブ / Blue Archive" data-i18n-ph="ph-sub">
          <input type="color" id="inputSubColor" value="#2B2B2B" title="自定义副标题颜色">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-sub-x">副标题 X 轴偏移量 (SUBTITLE X OFFSET)</span>
          <button type="button" class="reset-badge" data-reset="subX" title="重置 X 偏移"><span data-i18n="reset-0">默认 0 ↺</span></button>
        </label>
        <input type="number" id="inputSubX" class="input-text" value="0" placeholder="默认 0">
      </div>

      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-sub-y">副标题 Y 轴偏移量 (SUBTITLE Y OFFSET)</span>
          <button type="button" class="reset-badge" data-reset="subY" title="重置 Y 偏移"><span data-i18n="reset-0">默认 0 ↺</span></button>
        </label>
        <input type="number" id="inputSubY" class="input-text" value="0" placeholder="默认 0">
      </div>

      <!-- 主题色彩 -->
      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-accent">强调色 (ACCENT COLOR - 左文字与十字)</span>
          <button type="button" class="reset-badge" data-reset="accent" title="重置强调色"><span data-i18n="reset-accent">默认蓝 ↺</span></button>
        </label>
        <div class="color-picker-row">
          <input type="color" id="inputAccent" value="#128AFA">
          <div class="color-presets" id="accentPresets">
            <div class="color-dot" style="background: #128AFA;" data-color="#128AFA" title="官方经典蓝"></div>
            <div class="color-dot" style="background: #FF5722;" data-color="#FF5722" title="阿里乌斯橙红"></div>
            <div class="color-dot" style="background: #00E5FF;" data-color="#00E5FF" title="千年数码青"></div>
            <div class="color-dot" style="background: #9C27B0;" data-color="#9C27B0" title="格黑娜暗紫"></div>
            <div class="color-dot" style="background: #FFB300;" data-color="#FFB300" title="三一金色"></div>
          </div>
        </div>
      </div>

      <!-- 文字主题色彩 -->
      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-text-color">文字主题色 (TEXT COLOR - 右文字与光环)</span>
          <button type="button" class="reset-badge" data-reset="textColor" title="重置文字色"><span data-i18n="reset-text-color">默认灰 ↺</span></button>
        </label>
        <div class="color-picker-row">
          <input type="color" id="inputTextColor" value="#2B2B2B">
          <div class="color-presets" id="textColorPresets">
            <div class="color-dot" style="background: #2B2B2B;" data-color="#2B2B2B" title="官方深灰黑"></div>
            <div class="color-dot" style="background: #000000;" data-color="#000000" title="纯黑"></div>
            <div class="color-dot" style="background: #FFFFFF; border-color: #cbd5e1;" data-color="#FFFFFF" title="纯白"></div>
            <div class="color-dot" style="background: #4C5866;" data-color="#4C5866" title="石板灰"></div>
            <div class="color-dot" style="background: #128AFA;" data-color="#128AFA" title="同色天蓝"></div>
          </div>
        </div>
      </div>

      <!-- 独立十字与光环颜色 (可选独立定制) -->
      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-cross-color">十字独立颜色 (CROSS COLOR)</span>
          <button type="button" class="reset-badge" data-reset="crossColor" title="跟随强调色"><span data-i18n="reset-follow">跟随 ↺</span></button>
        </label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="inputCrossColor" class="input-text" value="" placeholder="默认跟随强调色，可输 Hex 如 #FFD700" data-i18n-ph="ph-cross-color">
          <input type="color" id="pickerCrossColor" value="#128AFA" title="十字拾色器">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-halo-color">光环独立颜色 (HALO COLOR)</span>
          <button type="button" class="reset-badge" data-reset="haloColor" title="跟随文字色"><span data-i18n="reset-follow">跟随 ↺</span></button>
        </label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="inputHaloColor" class="input-text" value="" placeholder="默认跟随文字色，可输 Hex 如 #9C27B0" data-i18n-ph="ph-halo-color">
          <input type="color" id="pickerHaloColor" value="#2B2B2B" title="光环拾色器">
        </div>
      </div>

      <!-- 坐标偏移 -->
      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-x-offset">光环 X 轴偏移量 (X OFFSET)</span>
          <button type="button" class="reset-badge" data-reset="x" title="重置 X 偏移"><span data-i18n="reset-x">默认 -15 ↺</span></button>
        </label>
        <input type="number" id="inputX" class="input-text" value="-15" placeholder="默认 -15">
      </div>

      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-y-offset">光环 Y 轴偏移量 (Y OFFSET)</span>
          <button type="button" class="reset-badge" data-reset="y" title="重置 Y 偏移"><span data-i18n="reset-0">默认 0 ↺</span></button>
        </label>
        <input type="number" id="inputY" class="input-text" value="0" placeholder="默认 0">
      </div>

      <!-- 两词间距 -->
      <div class="form-group">
        <label class="form-label">
          <span data-i18n="label-word-gap">两词间距 (WORD GAP)</span>
          <button type="button" class="reset-badge" data-reset="wordGap" title="重置间距"><span data-i18n="reset-0">默认 0 ↺</span></button>
        </label>
        <input type="number" id="inputWordGap" class="input-text" value="0" placeholder="默认 0">
      </div>

      <!-- 留白边距 -->
      <div class="form-group" id="paddingGroup">
        <label class="form-label">
          <span data-i18n="label-padding">留白边距 (PADDING - 支持 CSS 语法)</span>
          <button type="button" class="reset-badge" data-reset="padding" title="重置留白"><span data-i18n="reset-pad">默认 2 ↺</span></button>
        </label>
        <input type="text" id="inputPadding" class="input-text" value="2" placeholder="默认 2px，或输入 CSS 边距如 10 20" data-i18n-ph="ph-padding">
      </div>

      <!-- 分辨率倍率 -->
      <div class="form-group">
        <label class="form-label" data-i18n="label-scale">分辨率倍率 (SCALE)</label>
        <div class="format-pills" id="scalePills">
          <div class="pill-btn" data-scale="1">1x (250p)</div>
          <div class="pill-btn active" data-scale="2">2x (500p)</div>
          <div class="pill-btn" data-scale="3">3x (750p)</div>
          <div class="pill-btn" data-scale="4">4x (1000p)</div>
        </div>
      </div>

      <!-- 导出格式 -->
      <div class="form-group">
        <label class="form-label" data-i18n="label-format">输出格式 (FORMAT)</label>
        <div class="format-pills" id="formatPills">
          <div class="pill-btn active" data-format="png">PNG</div>
          <div class="pill-btn" data-format="webp">WebP (推荐)</div>
          <div class="pill-btn" data-format="svg">SVG (矢量)</div>
          <div class="pill-btn" data-format="jpeg">JPEG</div>
          <div class="pill-btn" data-format="base64">Base64</div>
        </div>
      </div>

      <!-- 开关项 -->
      <div class="toggles-grid">
        <label class="toggle-item">
          <span data-i18n="toggle-tp">透明背景</span>
          <div class="switch">
            <input type="checkbox" id="toggleTp">
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span data-i18n="toggle-dark">暗黑模式</span>
          <div class="switch">
            <input type="checkbox" id="toggleDark">
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span data-i18n="toggle-swap">颜色互换</span>
          <div class="switch">
            <input type="checkbox" id="toggleSwap">
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span data-i18n="toggle-center">垂直视觉居中</span>
          <div class="switch">
            <input type="checkbox" id="toggleCenter" checked>
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span data-i18n="toggle-behind">图标置底</span>
          <div class="switch">
            <input type="checkbox" id="toggleBehind">
            <span class="slider"></span>
          </div>
        </label>
      </div>
    </div>

    <!-- 右侧即时预览区 -->
    <div class="card preview-card">
      <div class="card-header">
        <div class="card-title" data-i18n="preview-title">实时渲染预览</div>
        <div class="meta-bar">
          <div class="meta-badge"><span data-i18n="meta-size">尺寸</span>: <strong id="metaSize">--</strong></div>
          <div class="meta-badge"><span data-i18n="meta-time">耗时</span>: <strong id="metaTime">--</strong></div>
        </div>
      </div>

      <!-- 画布视口 -->
      <div class="preview-canvas-box" id="previewBox">
        <img id="previewImg" class="preview-img" alt="Logo Preview" src="">
        <div class="preview-loading" id="previewLoading">
          <div class="spinner"></div>
          <div>即时渲染中...</div>
        </div>
      </div>

      <!-- Base64 文本展示区 (仅在 format=base64 时显示) -->
      <div id="base64Box"></div>

      <!-- 实时 API URL -->
      <div class="url-box-container">
        <div class="url-text" id="apiUrlText">/api/logo</div>
        <button class="copy-url-btn" id="btnCopyUrl" data-i18n="copy-api">复制 API 链接</button>
      </div>

      <!-- 动作按钮组 -->
      <div class="actions-grid">
        <button class="action-btn action-btn-primary" id="btnDownload">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span data-i18n="btn-download">下载图片文件</span>
        </button>
        <button class="action-btn action-btn-copy" id="btnCopyImage">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span data-i18n="btn-copy-img">复制图片</span>
        </button>
        <button class="action-btn action-btn-secondary" id="btnCopyMarkdown">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span data-i18n="btn-copy-md">复制 Markdown</span>
        </button>
        <button class="action-btn action-btn-secondary" id="btnResetAll">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          <span data-i18n="btn-reset-all">重置所有参数</span>
        </button>
      </div>
    </div>
  </main>

  <div id="toast">已成功复制到剪贴板！</div>

  <script>
    const I18N = {
      zh: {
        'nav-swagger': 'Swagger 交互文档',
        'nav-upstream': '原版前端',
        'console-title': 'Logo 参数控制台',
        'ep-restful': 'RESTful',
        'ep-legacy': '旧版兼容',
        'label-title': '标题文字 (LEFT / RIGHT)',
        'reset-text': '默认 ↺',
        'ph-left': '左文字（蓝色）',
        'ph-right': '右文字（黑色）',
        'label-sub': '副标题 (SUBTITLE，可选)',
        'reset-clear': '清空 ↺',
        'ph-sub': '例如：ブルーアーカイブ / Blue Archive',
        'label-sub-x': '副标题 X 轴偏移量 (SUBTITLE X OFFSET)',
        'label-sub-y': '副标题 Y 轴偏移量 (SUBTITLE Y OFFSET)',
        'reset-0': '默认 0 ↺',
        'label-accent': '强调色 (ACCENT COLOR - 左文字与十字)',
        'reset-accent': '默认蓝 ↺',
        'label-text-color': '文字主题色 (TEXT COLOR - 右文字与光环)',
        'reset-text-color': '默认灰 ↺',
        'label-cross-color': '十字独立颜色 (CROSS COLOR)',
        'ph-cross-color': '默认跟随强调色，可输 Hex 如 #FFD700',
        'label-halo-color': '光环独立颜色 (HALO COLOR)',
        'ph-halo-color': '默认跟随文字色，可输 Hex 如 #9C27B0',
        'reset-follow': '跟随 ↺',
        'label-x-offset': '光环 X 轴偏移量 (X OFFSET)',
        'reset-x': '默认 -15 ↺',
        'label-y-offset': '光环 Y 轴偏移量 (Y OFFSET)',
        'label-word-gap': '两词间距 (WORD GAP)',
        'label-padding': '留白边距 (PADDING - 支持 CSS 语法)',
        'reset-pad': '默认 2 ↺',
        'ph-padding': '默认 2px，或输入 CSS 边距如 10 20',
        'label-scale': '分辨率倍率 (SCALE)',
        'label-format': '输出格式 (FORMAT)',
        'toggle-tp': '透明背景',
        'toggle-dark': '暗黑模式',
        'toggle-swap': '颜色互换',
        'toggle-center': '垂直视觉居中',
        'toggle-behind': '图标置底',
        'preview-title': '实时渲染预览',
        'meta-size': '尺寸',
        'meta-time': '耗时',
        'copy-api': '复制 API 链接',
        'btn-download': '下载图片文件',
        'btn-copy-img': '复制图片',
        'btn-copy-md': '复制 Markdown 标签',
        'btn-reset-all': '重置所有参数',
        'toast-copied': '已成功复制到剪贴板！',
        'toast-img-copied': '图片已成功复制到剪贴板！',
        'toast-reset': '所有参数已恢复为默认值！',
        'toast-copy-failed': '复制失败，请检查浏览器权限',
        'toast-download': '图片下载已开始！',
      },
      'zh-tw': {
        'nav-swagger': 'Swagger 文件',
        'nav-upstream': '原版前端',
        'console-title': 'Logo 參數控制台',
        'ep-restful': 'RESTful',
        'ep-legacy': '舊版相容',
        'label-title': '標題文字 (LEFT / RIGHT)',
        'reset-text': '預設 ↺',
        'ph-left': '左文字（藍色）',
        'ph-right': '右文字（黑色）',
        'label-sub': '副標題 (SUBTITLE，可選)',
        'reset-clear': '清空 ↺',
        'ph-sub': '例如：ブルーアーカイブ / Blue Archive',
        'label-sub-x': '副標題 X 軸偏移量 (SUBTITLE X OFFSET)',
        'label-sub-y': '副標題 Y 軸偏移量 (SUBTITLE Y OFFSET)',
        'reset-0': '預設 0 ↺',
        'label-accent': '強調色 (ACCENT COLOR - 左文字與十字)',
        'reset-accent': '預設藍 ↺',
        'label-text-color': '文字主題色 (TEXT COLOR - 右文字與光環)',
        'reset-text-color': '預設灰 ↺',
        'label-cross-color': '十字獨立顏色 (CROSS COLOR)',
        'ph-cross-color': '預設跟隨強調色，可輸入 Hex 如 #FFD700',
        'label-halo-color': '光環獨立顏色 (HALO COLOR)',
        'ph-halo-color': '預設跟隨文字色，可輸入 Hex 如 #9C27B0',
        'reset-follow': '跟隨 ↺',
        'label-x-offset': '光環 X 軸偏移量 (X OFFSET)',
        'reset-x': '預設 -15 ↺',
        'label-y-offset': '光環 Y 軸偏移量 (Y OFFSET)',
        'label-word-gap': '兩詞間距 (WORD GAP)',
        'label-padding': '留白邊距 (PADDING - 支援 CSS 語法)',
        'reset-pad': '預設 2 ↺',
        'ph-padding': '預設 2px，或輸入 CSS 邊距如 10 20',
        'label-scale': '解析度倍率 (SCALE)',
        'label-format': '輸出格式 (FORMAT)',
        'toggle-tp': '透明背景',
        'toggle-dark': '深色模式',
        'toggle-swap': '顏色互換',
        'toggle-center': '垂直視覺置中',
        'toggle-behind': '圖標置底',
        'preview-title': '即時渲染預覽',
        'meta-size': '尺寸',
        'meta-time': '耗時',
        'copy-api': '複製 API 連結',
        'btn-download': '下載圖片檔案',
        'btn-copy-img': '複製圖片',
        'btn-copy-md': '複製 Markdown 標籤',
        'btn-reset-all': '重設所有參數',
        'toast-copied': '已成功複製到剪貼簿！',
        'toast-img-copied': '圖片已成功複製到剪貼簿！',
        'toast-reset': '所有參數已恢復為預設值！',
        'toast-copy-failed': '複製失敗，請檢查瀏覽器權限',
        'toast-download': '圖片下載已開始！',
      },
      en: {
        'nav-swagger': 'Swagger Docs',
        'nav-upstream': 'Original Web',
        'console-title': 'Logo Console',
        'ep-restful': 'RESTful',
        'ep-legacy': 'Legacy',
        'label-title': 'Title Text (LEFT / RIGHT)',
        'reset-text': 'Reset ↺',
        'ph-left': 'Left text (Blue)',
        'ph-right': 'Right text (Dark)',
        'label-sub': 'Subtitle (Optional)',
        'reset-clear': 'Clear ↺',
        'ph-sub': 'e.g. Blue Archive / ブルーアーカイブ',
        'label-sub-x': 'Subtitle X Offset',
        'label-sub-y': 'Subtitle Y Offset',
        'reset-0': '0px ↺',
        'label-accent': 'Accent Color (Left text & Cross)',
        'reset-accent': 'Default ↺',
        'label-text-color': 'Text Color (Right text & Halo)',
        'reset-text-color': 'Default ↺',
        'label-cross-color': 'Cross Color (Independent)',
        'ph-cross-color': 'Follows accent, or Hex like #FFD700',
        'label-halo-color': 'Halo Color (Independent)',
        'ph-halo-color': 'Follows text color, or Hex like #9C27B0',
        'reset-follow': 'Follow ↺',
        'label-x-offset': 'Halo X Offset',
        'reset-x': '-15px ↺',
        'label-y-offset': 'Halo Y Offset',
        'label-word-gap': 'Word Gap',
        'label-padding': 'Padding (Supports CSS syntax)',
        'reset-pad': '2px ↺',
        'ph-padding': 'Default 2px, or CSS like 10 20',
        'label-scale': 'Resolution Scale',
        'label-format': 'Export Format',
        'toggle-tp': 'Transparent BG',
        'toggle-dark': 'Dark Mode',
        'toggle-swap': 'Swap Colors',
        'toggle-center': 'Vertical Center',
        'toggle-behind': 'Motifs Behind',
        'preview-title': 'Live Preview',
        'meta-size': 'Size',
        'meta-time': 'Latency',
        'copy-api': 'Copy API URL',
        'btn-download': 'Download Image',
        'btn-copy-img': 'Copy Image',
        'btn-copy-md': 'Copy Markdown Tag',
        'btn-reset-all': 'Reset All Settings',
        'toast-copied': 'Copied to clipboard!',
        'toast-img-copied': 'Image copied to clipboard!',
        'toast-reset': 'All settings restored to defaults!',
        'toast-copy-failed': 'Copy failed, please check permissions',
        'toast-download': 'Image download started!',
      },
      ja: {
        'nav-swagger': 'Swagger ドキュメント',
        'nav-upstream': '元フロントエンド',
        'console-title': 'ロゴ設定コンソール',
        'ep-restful': 'RESTful',
        'ep-legacy': '旧版互換',
        'label-title': 'タイトル文字 (LEFT / RIGHT)',
        'reset-text': '既定 ↺',
        'ph-left': '左文字（青）',
        'ph-right': '右文字（黒）',
        'label-sub': 'サブタイトル (任意)',
        'reset-clear': 'クリア ↺',
        'ph-sub': '例：ブルーアーカイブ',
        'label-sub-x': 'サブタイトル X オフセット',
        'label-sub-y': 'サブタイトル Y オフセット',
        'reset-0': '0px ↺',
        'label-accent': 'アクセント色（左文字＆十字）',
        'reset-accent': '既定青 ↺',
        'label-text-color': 'テキスト色（右文字＆ヘイロー）',
        'reset-text-color': '既定灰 ↺',
        'label-cross-color': '十字独立カラー',
        'ph-cross-color': 'アクセント色連動、Hex可（例：#FFD700）',
        'label-halo-color': 'ヘイロー独立カラー',
        'ph-halo-color': 'テキスト色連動、Hex可（例：#9C27B0）',
        'reset-follow': '連動 ↺',
        'label-x-offset': 'ヘイロー X 軸オフセット',
        'reset-x': '-15px ↺',
        'label-y-offset': 'ヘイロー Y 轴オフセット',
        'label-word-gap': '単語間隔 (WORD GAP)',
        'label-padding': '余白 (PADDING - CSS記法対応)',
        'reset-pad': '2px ↺',
        'ph-padding': '既定 2px、または 10 20 等',
        'label-scale': '解像度スケール (SCALE)',
        'label-format': '出力フォーマット (FORMAT)',
        'toggle-tp': '透過背景',
        'toggle-dark': 'ダークモード',
        'toggle-swap': 'カラー入替',
        'toggle-center': '視覚中央揃え',
        'toggle-behind': 'モチーフ背面配置',
        'preview-title': 'リアルタイムプレビュー',
        'meta-size': 'サイズ',
        'meta-time': '生成時間',
        'copy-api': 'API URL をコピー',
        'btn-download': '画像をダウンロード',
        'btn-copy-img': '画像をコピー',
        'btn-copy-md': 'Markdown をコピー',
        'btn-reset-all': 'すべてリセット',
        'toast-copied': 'クリップボードにコピーしました！',
        'toast-img-copied': '画像をコピーしました！',
        'toast-reset': '全設定をデフォルトにリセットしました！',
        'toast-copy-failed': 'コピーに失敗しました。権限を確認してください',
        'toast-download': 'ダウンロードを開始しました！',
      },
    };

    const state = {
      lang: 'zh',
      endpoint: 'api', // 'api' | 'balogo'
      left: '蔚蓝',
      right: '档案',
      subtitle: '',
      subtitleColor: '',
      subX: 0,
      subY: 0,
      accent: '#128AFA',
      textColor: '#2B2B2B',
      crossColor: '',
      haloColor: '',
      behind: false,
      x: -15,
      y: 0,
      wordGap: 0,
      scale: 2,
      format: 'png',
      transparent: false,
      dark: false,
      swap: false,
      padding: '2',
      center: true
    };

    // DOM 元素引用
    const elLeft = document.getElementById('inputLeft');
    const elRight = document.getElementById('inputRight');
    const elSub = document.getElementById('inputSub');
    const elSubColor = document.getElementById('inputSubColor');
    const elSubX = document.getElementById('inputSubX');
    const elSubY = document.getElementById('inputSubY');
    const elAccent = document.getElementById('inputAccent');
    const elTextColor = document.getElementById('inputTextColor');
    const elCrossColor = document.getElementById('inputCrossColor');
    const pickerCrossColor = document.getElementById('pickerCrossColor');
    const elHaloColor = document.getElementById('inputHaloColor');
    const pickerHaloColor = document.getElementById('pickerHaloColor');
    const elX = document.getElementById('inputX');
    const elY = document.getElementById('inputY');
    const elWordGap = document.getElementById('inputWordGap');
    const elPadding = document.getElementById('inputPadding');
    const elTp = document.getElementById('toggleTp');
    const elDark = document.getElementById('toggleDark');
    const elSwap = document.getElementById('toggleSwap');
    const elCenter = document.getElementById('toggleCenter');
    const elBehind = document.getElementById('toggleBehind');

    const previewImg = document.getElementById('previewImg');
    const previewBox = document.getElementById('previewBox');
    const previewLoading = document.getElementById('previewLoading');
    const base64Box = document.getElementById('base64Box');
    const apiUrlText = document.getElementById('apiUrlText');
    const metaSize = document.getElementById('metaSize');
    const metaTime = document.getElementById('metaTime');
    const toast = document.getElementById('toast');
    const btnCopyImage = document.getElementById('btnCopyImage');
    const btnResetAll = document.getElementById('btnResetAll');

    let currentBlobUrl = null;
    let latestBase64 = '';

    function showToast(msg) {
      toast.innerText = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function buildUrl() {
      const params = new URLSearchParams();
      const isLegacy = state.endpoint === 'balogo';

      if (isLegacy) {
        // 旧版 /balogo 路由与参数命名
        params.set('l', state.left);
        params.set('r', state.right);
        if (state.x !== -15) params.set('x', state.x);
        if (state.y !== 0) params.set('y', state.y);
        if (state.wordGap !== 0) params.set('gap', state.wordGap);
        if (state.transparent) params.set('tp', 'true');
        if (state.scale !== 1) params.set('scale', state.scale);
        if (state.subtitle) {
          params.set('sub', state.subtitle);
          if (state.subX !== 0) params.set('subX', state.subX);
          if (state.subY !== 0) params.set('subY', state.subY);
        }
        if (state.accent && state.accent.toLowerCase() !== '#128afa') params.set('accent', state.accent.replace('#', ''));
        const defaultTxt = state.dark ? '#ffffff' : '#2b2b2b';
        if (state.textColor && state.textColor.toLowerCase() !== defaultTxt) {
          params.set('textColor', state.textColor.replace('#', ''));
        }
        if (state.crossColor) params.set('cross', state.crossColor.replace('#', ''));
        if (state.haloColor) params.set('halo', state.haloColor.replace('#', ''));
        if (state.behind) params.set('behind', 'true');
        if (state.dark) params.set('dark', 'true');
        if (state.swap) params.set('swap', 'true');
        if (state.format !== 'png') params.set('format', state.format);
        if (state.padding && state.padding !== '2' && state.padding !== 2) {
          params.set('padding', state.padding);
        }
        if (state.center !== !state.transparent) params.set('center', String(state.center));
        const qs = params.toString();
        return '/balogo' + (qs ? '?' + qs : '');
      }

      // 现代 RESTful /api/logo 路由
      params.set('left', state.left);
      params.set('right', state.right);
      if (state.subtitle) {
        params.set('subtitle', state.subtitle);
        if (state.subtitleColor) params.set('subtitleColor', state.subtitleColor.replace('#', ''));
        if (state.subX !== 0) params.set('subX', state.subX);
        if (state.subY !== 0) params.set('subY', state.subY);
      }
      if (state.accent && state.accent.toLowerCase() !== '#128afa') {
        params.set('accent', state.accent.replace('#', ''));
      }
      const defaultTxt = state.dark ? '#ffffff' : '#2b2b2b';
      if (state.textColor && state.textColor.toLowerCase() !== defaultTxt) {
        params.set('textColor', state.textColor.replace('#', ''));
      }
      if (state.crossColor) params.set('crossColor', state.crossColor.replace('#', ''));
      if (state.haloColor) params.set('haloColor', state.haloColor.replace('#', ''));
      if (state.behind) params.set('motifsBehindText', 'true');
      if (state.x !== -15) params.set('offsetX', state.x);
      if (state.y !== 0) params.set('offsetY', state.y);
      if (state.wordGap !== 0) params.set('wordGap', state.wordGap);
      if (state.scale !== 1) params.set('scale', state.scale);
      if (state.format !== 'png') params.set('format', state.format);
      if (state.transparent) params.set('transparent', 'true');
      if (state.dark) params.set('darkMode', 'true');
      if (state.swap) params.set('swapColors', 'true');
      if (state.padding && state.padding !== '2' && state.padding !== 2) {
        params.set('padding', state.padding);
      }
      if (state.center !== !state.transparent) {
        params.set('center', String(state.center));
      }

      const qs = params.toString();
      return '/api/logo' + (qs ? '?' + qs : '');
    }

    let debounceTimer = null;
    function updatePreview() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        previewLoading.classList.add('active');
        const url = buildUrl();
        apiUrlText.innerText = url;

        // 背景风格切换
        previewBox.classList.toggle('transparent-grid', state.transparent);
        previewBox.classList.toggle('dark-bg', state.dark && !state.transparent);

        const startTime = performance.now();
        try {
          const res = await fetch(url);
          const cost = (performance.now() - startTime).toFixed(1);

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            metaSize.innerText = '错误 ' + res.status;
            metaTime.innerText = cost + 'ms';
            previewLoading.classList.remove('active');
            showToast('请求校验失败: ' + (err.summary || err.message || res.statusText));
            return;
          }

          // 处理 Base64 格式响应
          if (state.format === 'base64') {
            const json = await res.json();
            latestBase64 = json.data.base64;
            base64Box.style.display = 'block';
            base64Box.innerText = json.data.dataUrl;

            previewImg.onload = () => {
              metaSize.innerText = json.data.width + ' × ' + json.data.height;
              metaTime.innerText = cost + 'ms';
              previewLoading.classList.remove('active');
            };
            previewImg.src = json.data.dataUrl;
            return;
          }

          base64Box.style.display = 'none';
          const blob = await res.blob();
          
          if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
          }
          currentBlobUrl = URL.createObjectURL(blob);
          
          previewImg.onload = () => {
            metaSize.innerText = previewImg.naturalWidth + ' × ' + previewImg.naturalHeight;
            metaTime.innerText = cost + 'ms';
            previewLoading.classList.remove('active');
          };
          previewImg.onerror = () => {
            metaSize.innerText = '加载失败';
            metaTime.innerText = '--';
            previewLoading.classList.remove('active');
          };
          previewImg.src = currentBlobUrl;
        } catch (err) {
          console.error(err);
          metaSize.innerText = '网络异常';
          metaTime.innerText = '--';
          previewLoading.classList.remove('active');
          showToast('无法连接后端 API');
        }
      }, 80);
    }

    // 输入框事件绑定（集成 IME 输入法防抖，防止拼音选词过程中误触发请求）
    let isComposing = false;
    [elLeft, elRight, elSub].forEach(input => {
      input.addEventListener('compositionstart', () => { isComposing = true; });
      input.addEventListener('compositionend', (e) => {
        isComposing = false;
        if (input === elLeft) state.left = e.target.value;
        if (input === elRight) state.right = e.target.value;
        if (input === elSub) state.subtitle = e.target.value;
        updatePreview();
      });
      input.addEventListener('input', (e) => {
        if (isComposing) return;
        if (input === elLeft) state.left = e.target.value;
        if (input === elRight) state.right = e.target.value;
        if (input === elSub) state.subtitle = e.target.value;
        updatePreview();
      });
    });

    elAccent.addEventListener('input', (e) => { state.accent = e.target.value; updatePreview(); });
    elSubColor.addEventListener('input', (e) => { state.subtitleColor = e.target.value; updatePreview(); });
    elSubX.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.subX = Number.isFinite(val) ? val : 0;
      updatePreview();
    });
    elSubY.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.subY = Number.isFinite(val) ? val : 0;
      updatePreview();
    });

    document.querySelectorAll('#accentPresets .color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const c = dot.dataset.color;
        elAccent.value = c;
        state.accent = c;
        updatePreview();
      });
    });

    elX.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.x = Number.isFinite(val) ? val : -15;
      updatePreview();
    });

    elY.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.y = Number.isFinite(val) ? val : 0;
      updatePreview();
    });

    elWordGap.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.wordGap = Number.isFinite(val) ? val : 0;
      updatePreview();
    });

    elPadding.addEventListener('input', (e) => {
      state.padding = e.target.value.trim() || '2';
      updatePreview();
    });

    elTextColor.addEventListener('input', (e) => {
      state.textColor = e.target.value;
      updatePreview();
    });

    document.querySelectorAll('#textColorPresets .color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const c = dot.dataset.color;
        elTextColor.value = c;
        state.textColor = c;
        updatePreview();
      });
    });

    elCrossColor.addEventListener('input', (e) => {
      state.crossColor = e.target.value.trim();
      if (state.crossColor.startsWith('#') && state.crossColor.length === 7) {
        pickerCrossColor.value = state.crossColor;
      }
      updatePreview();
    });
    pickerCrossColor.addEventListener('input', (e) => {
      state.crossColor = e.target.value;
      elCrossColor.value = e.target.value;
      updatePreview();
    });

    elHaloColor.addEventListener('input', (e) => {
      state.haloColor = e.target.value.trim();
      if (state.haloColor.startsWith('#') && state.haloColor.length === 7) {
        pickerHaloColor.value = state.haloColor;
      }
      updatePreview();
    });
    pickerHaloColor.addEventListener('input', (e) => {
      state.haloColor = e.target.value;
      elHaloColor.value = e.target.value;
      updatePreview();
    });

    elTp.addEventListener('change', (e) => {
      state.transparent = e.target.checked;
      // 开启透明背景时默认推荐贴边，关闭时推荐居中
      state.center = !state.transparent;
      elCenter.checked = state.center;
      updatePreview();
    });
    elDark.addEventListener('change', (e) => {
      state.dark = e.target.checked;
      if (state.dark && state.textColor.toLowerCase() === '#2b2b2b') {
        state.textColor = '#FFFFFF';
        elTextColor.value = '#FFFFFF';
      } else if (!state.dark && state.textColor.toLowerCase() === '#ffffff') {
        state.textColor = '#2B2B2B';
        elTextColor.value = '#2B2B2B';
      }
      updatePreview();
    });
    elSwap.addEventListener('change', (e) => { state.swap = e.target.checked; updatePreview(); });
    elCenter.addEventListener('change', (e) => { state.center = e.target.checked; updatePreview(); });
    elBehind.addEventListener('change', (e) => { state.behind = e.target.checked; updatePreview(); });

    // Endpoint Pills
    document.querySelectorAll('#endpointPills .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#endpointPills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.endpoint = btn.dataset.ep;
        updatePreview();
      });
    });

    // Scale Pills
    document.querySelectorAll('#scalePills .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#scalePills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.scale = Number(btn.dataset.scale);
        updatePreview();
      });
    });

    // Format Pills
    document.querySelectorAll('#formatPills .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#formatPills .pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.format = btn.dataset.format;
        updatePreview();
      });
    });

    // 复制与下载按钮
    document.getElementById('btnCopyUrl').addEventListener('click', () => {
      const fullUrl = window.location.origin + buildUrl();
      navigator.clipboard.writeText(fullUrl).then(() => showToast(I18N[state.lang]?.['toast-copied'] || '已复制完整 API 链接！'));
    });

    document.getElementById('btnCopyMarkdown').addEventListener('click', () => {
      const fullUrl = window.location.origin + buildUrl();
      const title = (state.left || 'Blue') + (state.right || 'Archive');
      const md = '![' + title + ' Logo](' + fullUrl + ')';
      navigator.clipboard.writeText(md).then(() => showToast(I18N[state.lang]?.['toast-copied'] || '已复制 Markdown 标签代码！'));
    });

    document.getElementById('btnDownload').addEventListener('click', () => {
      if (state.format === 'base64') {
        if (latestBase64) {
          navigator.clipboard.writeText(latestBase64).then(() => showToast('已复制 Base64 编码字符串！'));
        }
        return;
      }
      if (!currentBlobUrl) return;
      const a = document.createElement('a');
      a.href = currentBlobUrl;
      const title = (state.left || 'Blue') + (state.right || 'Archive');
      a.download = title + '_logo.' + state.format;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(I18N[state.lang]?.['toast-download'] || '图片下载已开始！');
    });

    // 复制图片到剪贴板
    btnCopyImage.addEventListener('click', async () => {
      try {
        let blob;
        if (state.format === 'png' && currentBlobUrl) {
          blob = await fetch(currentBlobUrl).then(r => r.blob());
        } else {
          const pngUrl = buildUrl().replace(/format=\w+/, 'format=png');
          const finalPngUrl = pngUrl.includes('format=png') ? pngUrl : pngUrl + (pngUrl.includes('?') ? '&' : '?') + 'format=png';
          blob = await fetch(finalPngUrl).then(r => r.blob());
        }
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showToast(I18N[state.lang]?.['toast-img-copied'] || '图片已成功复制到剪贴板！');
      } catch (err) {
        console.error('Clipboard image write failed:', err);
        showToast(I18N[state.lang]?.['toast-copy-failed'] || '复制失败，请检查浏览器权限');
      }
    });

    // 重置所有参数
    btnResetAll.addEventListener('click', () => {
      state.endpoint = 'api';
      state.left = '蔚蓝';
      state.right = '档案';
      state.subtitle = '';
      state.subtitleColor = '';
      state.subX = 0;
      state.subY = 0;
      state.accent = '#128AFA';
      state.textColor = '#2B2B2B';
      state.crossColor = '';
      state.haloColor = '';
      state.behind = false;
      state.x = -15;
      state.y = 0;
      state.wordGap = 0;
      state.scale = 2;
      state.format = 'png';
      state.transparent = false;
      state.dark = false;
      state.swap = false;
      state.padding = '2';
      state.center = true;

      elLeft.value = state.left;
      elRight.value = state.right;
      elSub.value = state.subtitle;
      elSubColor.value = '#2B2B2B';
      elSubX.value = state.subX;
      elSubY.value = state.subY;
      elAccent.value = state.accent;
      elTextColor.value = state.textColor;
      elCrossColor.value = '';
      pickerCrossColor.value = state.accent;
      elHaloColor.value = '';
      pickerHaloColor.value = state.textColor;
      elX.value = state.x;
      elY.value = state.y;
      elWordGap.value = state.wordGap;
      elPadding.value = state.padding;
      elTp.checked = state.transparent;
      elDark.checked = state.dark;
      elSwap.checked = state.swap;
      elCenter.checked = state.center;
      elBehind.checked = state.behind;

      document.querySelectorAll('#endpointPills .pill-btn').forEach(b => b.classList.toggle('active', b.dataset.ep === 'api'));
      document.querySelectorAll('#scalePills .pill-btn').forEach(b => b.classList.toggle('active', b.dataset.scale === '2'));
      document.querySelectorAll('#formatPills .pill-btn').forEach(b => b.classList.toggle('active', b.dataset.format === 'png'));

      updatePreview();
      showToast(I18N[state.lang]?.['toast-reset'] || '所有参数已恢复为默认值！');
    });

    // 独立微调项重置按钮
    document.querySelectorAll('.reset-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.preventDefault();
        const field = badge.dataset.reset;
        switch (field) {
          case 'text':
            state.left = '蔚蓝';
            state.right = '档案';
            elLeft.value = '蔚蓝';
            elRight.value = '档案';
            break;
          case 'subtitle':
            state.subtitle = '';
            elSub.value = '';
            break;
          case 'subX':
            state.subX = 0;
            elSubX.value = 0;
            break;
          case 'subY':
            state.subY = 0;
            elSubY.value = 0;
            break;
          case 'accent':
            state.accent = '#128AFA';
            elAccent.value = '#128AFA';
            break;
          case 'textColor':
            state.textColor = state.dark ? '#FFFFFF' : '#2B2B2B';
            elTextColor.value = state.textColor;
            break;
          case 'crossColor':
            state.crossColor = '';
            elCrossColor.value = '';
            pickerCrossColor.value = state.accent;
            break;
          case 'haloColor':
            state.haloColor = '';
            elHaloColor.value = '';
            pickerHaloColor.value = state.textColor;
            break;
          case 'x':
            state.x = -15;
            elX.value = -15;
            break;
          case 'y':
            state.y = 0;
            elY.value = 0;
            break;
          case 'wordGap':
            state.wordGap = 0;
            elWordGap.value = 0;
            break;
          case 'padding':
            state.padding = '2';
            elPadding.value = '2';
            break;
        }
        updatePreview();
      });
    });

    // 国际化语言切换
    function applyI18n(lang) {
      state.lang = lang;
      localStorage.setItem('ba_lang', lang);
      const dict = I18N[lang] || I18N.zh;
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (dict[key]) el.textContent = dict[key];
      });
      document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.dataset.i18nPh;
        if (dict[key]) el.placeholder = dict[key];
      });
      document.querySelectorAll('#langPills .pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
      });
      document.documentElement.lang = lang === 'en' ? 'en' : lang === 'ja' ? 'ja' : lang === 'zh-tw' ? 'zh-Hant' : 'zh-CN';
    }

    document.querySelectorAll('#langPills .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyI18n(btn.dataset.lang);
      });
    });

    const savedLang = localStorage.getItem('ba_lang');
    const browserLang = (navigator.language || '').toLowerCase();
    const defaultLang = savedLang ||
      (browserLang.startsWith('ja') ? 'ja' :
       browserLang.startsWith('en') ? 'en' :
       ['zh-tw', 'zh-hk', 'zh-mo', 'zh-hant'].includes(browserLang) ? 'zh-tw' : 'zh');
    applyI18n(defaultLang);

    // 初始化首次渲染
    updatePreview();
  </script>
</body>
</html>`;
}
