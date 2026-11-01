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
      grid-template-columns: 460px 1fr;
      gap: 2rem;
    }

    @media (max-width: 1024px) {
      main {
        grid-template-columns: 1fr;
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
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
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
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
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
      gap: 12px;
      margin-top: 1.25rem;
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
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 22px;
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
      border-radius: 22px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
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
      padding: 8px 0;
      text-align: center;
      font-size: 0.85rem;
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
      gap: 1.5rem;
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
      padding: 2rem;
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
      height: auto;
      object-fit: contain;
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.08));
      transition: opacity 0.2s ease;
    }

    .preview-loading {
      position: absolute;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(4px);
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: var(--primary);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .preview-loading.active {
      opacity: 1;
      pointer-events: auto;
    }

    /* 元数据徽章 */
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
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
      padding: 12px;
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
    }

    .url-text {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 0.85rem;
      color: var(--text-muted);
      overflow-x: auto;
      white-space: nowrap;
      text-overflow: ellipsis;
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
      transition: all 0.2s ease;
    }

    .copy-url-btn:hover {
      background: var(--primary-hover);
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
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">LIVE CONFIG</span>
      </div>

      <!-- 文字配置 -->
      <div class="form-group">
        <label class="form-label">标题文字 (LEFT / RIGHT)</label>
        <div class="form-row">
          <input type="text" id="inputLeft" class="input-text" value="蔚蓝" placeholder="左文字（默认蔚蓝）">
          <input type="text" id="inputRight" class="input-text" value="档案" placeholder="右文字（默认档案）">
        </div>
      </div>

      <!-- 副标题配置 -->
      <div class="form-group">
        <label class="form-label">副标题 (SUBTITLE，可选)</label>
        <input type="text" id="inputSub" class="input-text" value="" placeholder="例如：ブルーアーカイブ / Blue Archive">
      </div>

      <!-- 主题色彩 -->
      <div class="form-group">
        <label class="form-label">强调色 (ACCENT COLOR)</label>
        <div class="color-picker-row">
          <input type="color" id="inputAccent" value="#128AFA">
          <div class="color-presets">
            <div class="color-dot" style="background: #128AFA;" data-color="#128AFA" title="官方经典蓝"></div>
            <div class="color-dot" style="background: #FF5722;" data-color="#FF5722" title="阿里乌斯橙红"></div>
            <div class="color-dot" style="background: #00E5FF;" data-color="#00E5FF" title="千年数码青"></div>
            <div class="color-dot" style="background: #9C27B0;" data-color="#9C27B0" title="格黑娜暗紫"></div>
            <div class="color-dot" style="background: #FFB300;" data-color="#FFB300" title="三一金色"></div>
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
        <div class="preview-loading" id="previewLoading">渲染中...</div>
      </div>

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
      left: '蔚蓝',
      right: '档案',
      subtitle: '',
      accent: '#128AFA',
      x: -15,
      y: 0,
      scale: 2,
      format: 'png',
      transparent: false,
      dark: false,
      swap: false,
      crop: true
    };

    // DOM 元素引用
    const elLeft = document.getElementById('inputLeft');
    const elRight = document.getElementById('inputRight');
    const elSub = document.getElementById('inputSub');
    const elAccent = document.getElementById('inputAccent');
    const elX = document.getElementById('inputX');
    const elY = document.getElementById('inputY');
    const valX = document.getElementById('valX');
    const valY = document.getElementById('valY');
    const elTp = document.getElementById('toggleTp');
    const elDark = document.getElementById('toggleDark');
    const elSwap = document.getElementById('toggleSwap');
    const elCrop = document.getElementById('toggleCrop');

    const previewImg = document.getElementById('previewImg');
    const previewBox = document.getElementById('previewBox');
    const previewLoading = document.getElementById('previewLoading');
    const apiUrlText = document.getElementById('apiUrlText');
    const metaSize = document.getElementById('metaSize');
    const metaTime = document.getElementById('metaTime');
    const toast = document.getElementById('toast');

    function showToast(msg) {
      toast.innerText = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function buildUrl() {
      const params = new URLSearchParams();
      if (state.left) params.set('left', state.left);
      if (state.right) params.set('right', state.right);
      if (state.subtitle) params.set('subtitle', state.subtitle);
      if (state.accent && state.accent.toLowerCase() !== '#128afa') params.set('accent', state.accent.replace('#', ''));
      if (state.x !== -15) params.set('x', state.x);
      if (state.y !== 0) params.set('y', state.y);
      if (state.scale !== 1) params.set('scale', state.scale);
      if (state.format !== 'png') params.set('format', state.format);
      if (state.transparent) params.set('transparent', 'true');
      if (state.dark) params.set('dark', 'true');
      if (state.swap) params.set('swap', 'true');
      if (!state.crop) params.set('crop', 'false');

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
          const blob = await res.blob();
          const cost = (performance.now() - startTime).toFixed(1);
          const objUrl = URL.createObjectURL(blob);
          
          previewImg.onload = () => {
            metaSize.innerText = previewImg.naturalWidth + ' × ' + previewImg.naturalHeight;
            metaTime.innerText = cost + 'ms';
            previewLoading.classList.remove('active');
          };
          previewImg.src = objUrl;
        } catch (err) {
          console.error(err);
          previewLoading.classList.remove('active');
        }
      }, 100);
    }

    // 事件绑定
    elLeft.addEventListener('input', (e) => { state.left = e.target.value; updatePreview(); });
    elRight.addEventListener('input', (e) => { state.right = e.target.value; updatePreview(); });
    elSub.addEventListener('input', (e) => { state.subtitle = e.target.value; updatePreview(); });
    elAccent.addEventListener('input', (e) => { state.accent = e.target.value; updatePreview(); });

    document.querySelectorAll('.color-dot').forEach(dot => {
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

    elTp.addEventListener('change', (e) => { state.transparent = e.target.checked; updatePreview(); });
    elDark.addEventListener('change', (e) => { state.dark = e.target.checked; updatePreview(); });
    elSwap.addEventListener('change', (e) => { state.swap = e.target.checked; updatePreview(); });
    elCrop.addEventListener('change', (e) => { state.crop = e.target.checked; updatePreview(); });

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
      const md = '![' + (state.left + state.right) + ' Logo](' + fullUrl + ')';
      navigator.clipboard.writeText(md).then(() => showToast('已复制 Markdown 标签代码！'));
    });

    document.getElementById('btnDownload').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = buildUrl();
      a.download = (state.left + state.right) + '_logo.' + state.format;
      a.click();
    });

    // 初始化渲染
    updatePreview();
  </script>
</body>
</html>`;
}
