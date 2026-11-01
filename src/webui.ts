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

    /* 滑块控件 */
    .range-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    input[type="range"] {
      flex: 1;
      accent-color: var(--primary);
    }

    .range-val {
      font-size: 0.85rem;
      font-weight: 800;
      width: 44px;
      text-align: right;
      color: var(--primary);
      font-family: monospace;
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
      <a href="/swagger" class="nav-btn nav-btn-primary" target="_blank">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Swagger 交互文档
      </a>
      <a href="https://github.com/nulla2011/bluearchive-logo" target="_blank" class="nav-btn nav-btn-default">
        原版前端
      </a>
    </div>
  </header>

  <!-- 主体工作区 -->
  <main>
    <!-- 左侧控制面板 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Logo 参数控制台</div>
        <!-- 路由模式切换 -->
        <div class="format-pills" id="endpointPills" style="width: 180px;">
          <div class="pill-btn active" data-ep="api">RESTful</div>
          <div class="pill-btn" data-ep="balogo">旧版兼容</div>
        </div>
      </div>

      <!-- 文字配置 -->
      <div class="form-group">
        <label class="form-label">
          <span>标题文字 (LEFT / RIGHT)</span>
          <span style="font-weight: 500; font-size: 0.75rem;">支持清空或单字</span>
        </label>
        <div class="form-row">
          <input type="text" id="inputLeft" class="input-text" value="蔚蓝" placeholder="左文字（蓝色）">
          <input type="text" id="inputRight" class="input-text" value="档案" placeholder="右文字（黑色）">
        </div>
      </div>

      <!-- 副标题配置 -->
      <div class="form-group">
        <label class="form-label">
          <span>副标题 (SUBTITLE，可选)</span>
          <span style="font-weight: 500; font-size: 0.75rem;">右下方对齐</span>
        </label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="inputSub" class="input-text" value="" placeholder="例如：ブルーアーカイブ / Blue Archive">
          <input type="color" id="inputSubColor" value="#2B2B2B" title="自定义副标题颜色">
        </div>
      </div>

      <!-- 主题色彩 -->
      <div class="form-group">
        <label class="form-label">强调色 (ACCENT COLOR - 左文字与十字)</label>
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
        <label class="form-label">文字主题色 (TEXT COLOR - 右文字与光环)</label>
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

      <!-- 坐标偏移 -->
      <div class="form-group">
        <label class="form-label">光环 X 轴偏移量 (X OFFSET)</label>
        <div class="range-group">
          <input type="range" id="inputX" min="-60" max="60" value="-15">
          <span class="range-val" id="valX">-15</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">光环 Y 轴偏移量 (Y OFFSET)</label>
        <div class="range-group">
          <input type="range" id="inputY" min="-40" max="40" value="0">
          <span class="range-val" id="valY">0</span>
        </div>
      </div>

      <!-- 紧凑边距 -->
      <div class="form-group" id="paddingGroup" style="transition: opacity 0.2s ease;">
        <label class="form-label">
          <span>边缘留白边距 (PADDING)</span>
          <span id="paddingHint" style="font-weight: 500; font-size: 0.75rem;">默认 2px 贴边</span>
        </label>
        <div class="range-group">
          <input type="range" id="inputPadding" min="0" max="60" value="2">
          <span class="range-val" id="valPadding">2px</span>
        </div>
      </div>

      <!-- 分辨率倍率 -->
      <div class="form-group">
        <label class="form-label">分辨率倍率 (SCALE)</label>
        <div class="format-pills" id="scalePills">
          <div class="pill-btn" data-scale="1">1x (250p)</div>
          <div class="pill-btn active" data-scale="2">2x (500p)</div>
          <div class="pill-btn" data-scale="3">3x (750p)</div>
          <div class="pill-btn" data-scale="4">4x (1000p)</div>
        </div>
      </div>

      <!-- 导出格式 -->
      <div class="form-group">
        <label class="form-label">输出格式 (FORMAT)</label>
        <div class="format-pills" id="formatPills">
          <div class="pill-btn active" data-format="png">PNG</div>
          <div class="pill-btn" data-format="webp">WebP (推荐)</div>
          <div class="pill-btn" data-format="jpeg">JPEG</div>
          <div class="pill-btn" data-format="base64">Base64</div>
        </div>
      </div>

      <!-- 开关项 -->
      <div class="toggles-grid">
        <label class="toggle-item">
          <span>透明背景</span>
          <div class="switch">
            <input type="checkbox" id="toggleTp">
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span>暗黑模式</span>
          <div class="switch">
            <input type="checkbox" id="toggleDark">
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span>颜色互换</span>
          <div class="switch">
            <input type="checkbox" id="toggleSwap">
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span>自动紧凑裁切</span>
          <div class="switch">
            <input type="checkbox" id="toggleCrop" checked>
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span>垂直视觉居中</span>
          <div class="switch">
            <input type="checkbox" id="toggleCenter" checked>
            <span class="slider"></span>
          </div>
        </label>
      </div>
    </div>

    <!-- 右侧即时预览区 -->
    <div class="card preview-card">
      <div class="card-header">
        <div class="card-title">实时渲染预览</div>
        <div class="meta-bar">
          <div class="meta-badge">尺寸: <strong id="metaSize">--</strong></div>
          <div class="meta-badge">耗时: <strong id="metaTime">--</strong></div>
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
        <button class="copy-url-btn" id="btnCopyUrl">复制 API 链接</button>
      </div>

      <!-- 动作按钮组 -->
      <div class="actions-grid">
        <button class="action-btn action-btn-primary" id="btnDownload">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          下载图片文件
        </button>
        <button class="action-btn action-btn-secondary" id="btnCopyMarkdown">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          复制 Markdown 标签
        </button>
      </div>
    </div>
  </main>

  <div id="toast">已成功复制到剪贴板！</div>

  <script>
    const state = {
      endpoint: 'api', // 'api' | 'balogo'
      left: '蔚蓝',
      right: '档案',
      subtitle: '',
      subtitleColor: '',
      accent: '#128AFA',
      textColor: '#2B2B2B',
      x: -15,
      y: 0,
      scale: 2,
      format: 'png',
      transparent: false,
      dark: false,
      swap: false,
      crop: true,
      padding: 2,
      center: true
    };

    // DOM 元素引用
    const elLeft = document.getElementById('inputLeft');
    const elRight = document.getElementById('inputRight');
    const elSub = document.getElementById('inputSub');
    const elSubColor = document.getElementById('inputSubColor');
    const elAccent = document.getElementById('inputAccent');
    const elTextColor = document.getElementById('inputTextColor');
    const elX = document.getElementById('inputX');
    const elY = document.getElementById('inputY');
    const valX = document.getElementById('valX');
    const valY = document.getElementById('valY');
    const elPadding = document.getElementById('inputPadding');
    const valPadding = document.getElementById('valPadding');
    const elTp = document.getElementById('toggleTp');
    const elDark = document.getElementById('toggleDark');
    const elSwap = document.getElementById('toggleSwap');
    const elCrop = document.getElementById('toggleCrop');
    const elCenter = document.getElementById('toggleCenter');

    const previewImg = document.getElementById('previewImg');
    const previewBox = document.getElementById('previewBox');
    const previewLoading = document.getElementById('previewLoading');
    const base64Box = document.getElementById('base64Box');
    const apiUrlText = document.getElementById('apiUrlText');
    const metaSize = document.getElementById('metaSize');
    const metaTime = document.getElementById('metaTime');
    const toast = document.getElementById('toast');

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
        if (state.transparent) params.set('tp', 'true');
        if (state.scale !== 1) params.set('scale', state.scale);
        if (state.subtitle) params.set('sub', state.subtitle);
        if (state.accent && state.accent.toLowerCase() !== '#128afa') params.set('accent', state.accent.replace('#', ''));
        const defaultTxt = state.dark ? '#ffffff' : '#2b2b2b';
        if (state.textColor && state.textColor.toLowerCase() !== defaultTxt) {
          params.set('textColor', state.textColor.replace('#', ''));
        }
        if (state.dark) params.set('dark', 'true');
        if (state.swap) params.set('swap', 'true');
        if (state.format !== 'png') params.set('format', state.format);
        if (!state.crop) params.set('crop', 'false');
        if (state.crop && state.padding !== 2) params.set('padding', state.padding);
        if (state.center !== !state.transparent) params.set('center', String(state.center));
        const qs = params.toString();
        return '/balogo' + (qs ? '?' + qs : '');
      }

      // 现代 RESTful /api/logo 路由
      params.set('left', state.left);
      params.set('right', state.right);
      if (state.subtitle) params.set('subtitle', state.subtitle);
      if (state.subtitleColor) params.set('subtitleColor', state.subtitleColor.replace('#', ''));
      if (state.accent && state.accent.toLowerCase() !== '#128afa') {
        params.set('accent', state.accent.replace('#', ''));
      }
      const defaultTxt = state.dark ? '#ffffff' : '#2b2b2b';
      if (state.textColor && state.textColor.toLowerCase() !== defaultTxt) {
        params.set('textColor', state.textColor.replace('#', ''));
      }
      if (state.x !== -15) params.set('offsetX', state.x);
      if (state.y !== 0) params.set('offsetY', state.y);
      if (state.scale !== 1) params.set('scale', state.scale);
      if (state.format !== 'png') params.set('format', state.format);
      if (state.transparent) params.set('transparent', 'true');
      if (state.dark) params.set('darkMode', 'true');
      if (state.swap) params.set('swapColors', 'true');
      if (!state.crop) params.set('crop', 'false');
      if (state.crop && state.padding !== 2) params.set('padding', state.padding);
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

    document.querySelectorAll('#accentPresets .color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const c = dot.dataset.color;
        elAccent.value = c;
        state.accent = c;
        updatePreview();
      });
    });

    elX.addEventListener('input', (e) => {
      state.x = Number(e.target.value);
      valX.innerText = state.x;
      updatePreview();
    });

    elY.addEventListener('input', (e) => {
      state.y = Number(e.target.value);
      valY.innerText = state.y;
      updatePreview();
    });

    elPadding.addEventListener('input', (e) => {
      state.padding = Number(e.target.value);
      valPadding.innerText = state.padding + 'px';
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
    elCrop.addEventListener('change', (e) => {
      state.crop = e.target.checked;
      elPadding.disabled = !state.crop;
      const padGroup = document.getElementById('paddingGroup');
      const padHint = document.getElementById('paddingHint');
      if (padGroup) padGroup.style.opacity = state.crop ? '1' : '0.4';
      if (padHint) padHint.innerText = state.crop ? '默认 2px 贴边' : '(裁切已关闭，留白不生效)';
      updatePreview();
    });
    elCenter.addEventListener('change', (e) => { state.center = e.target.checked; updatePreview(); });

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
      navigator.clipboard.writeText(fullUrl).then(() => showToast('已复制完整 API 链接！'));
    });

    document.getElementById('btnCopyMarkdown').addEventListener('click', () => {
      const fullUrl = window.location.origin + buildUrl();
      const title = (state.left || 'Blue') + (state.right || 'Archive');
      const md = '![' + title + ' Logo](' + fullUrl + ')';
      navigator.clipboard.writeText(md).then(() => showToast('已复制 Markdown 标签代码！'));
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
      showToast('图片下载已开始！');
    });

    // 初始化首次渲染
    updatePreview();
  </script>
</body>
</html>`;
}
