# Blue Archive Logo API (蔚蓝档案风格 Logo 生成器)

<div align="center">

![Blue Archive Logo Preview](samples/02-official-en-jp-2x.png)

基于 **Bun 1.3+** + **ElysiaJS** + **Google Skia 原生渲染引擎** 重构的高性能、极低内存占用、高清晰度的蔚蓝档案风格 Logo 生成接口。

[![Bun](https://img.shields.io/badge/Bun-1.3+-black?logo=bun)](https://bun.sh)
[![ElysiaJS](https://img.shields.io/badge/ElysiaJS-1.4+-f06292)](https://elysiajs.com)
[![Skia Canvas](https://img.shields.io/badge/@napi--rs/canvas-1.1+-green)](https://github.com/Brooooooklyn/canvas)
[![Tests](https://img.shields.io/badge/tests-15%20passed-brightgreen)](#-自动化测试)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[在线 WebUI 控制台](#-交互式-webui-控制台) • [Swagger 接口文档](#-swagger--openapi-文档) • [API 参数详解](#-api-参数详解) • [Docker 部署](#-docker-容器化部署)

</div>

---

## ✨ 核心特性

- ⚡ **极致性能跃迁**：彻底移除了 3 年前笨重的 Puppeteer / 无头 Chromium 方案，底层完全由 C++/Rust 预编译的原生 **Google Skia** 驱动。单次生成耗时从 **2000ms+ 降至 8~15ms**，提速超 150 倍！
- 🪶 **极低内存占用**：告别浏览器沙箱 500MB~1GB 的恐怖内存开销，服务常驻仅需 **30MB~50MB**，1C1G 小内存轻量服务器也能轻松稳定运行。
- 🎨 **全矢量无损绘制**：
  - 光环（Halo）与十字架（Cross）采用高精度 **SVG Path2D** 矢量机制，摆脱位图像素毛边；
  - 配合 **`scale` 分辨率缩放参数**（支持 1x~8x），即便是 4K 印刷级大图也毫厘毕现。
- 🎯 **吸纳开源社区所有精髓**：
  - **副标题排版**：支持在右下端精准对齐倾斜副标题（如官方日文 `ブルーアーカイブ`）；
  - **色彩深度定制**：支持自定义任意强调色（`accentColor`），左右文字颜色互换（`swapColors`）；
  - **暗黑模式**：深灰底、纯白字与反向描边切除；
  - **自适应安全裁切**：修复原版长文本被截断、短文本光环被剪切的 Bug，无论文本长短均紧凑自适应。
- 📦 **多格式原生支持**：直接提供 `png`（透明通道）、`webp`（体积仅为 PNG 的一半，极度节省 Bot 流量）、`jpeg` 以及 `base64`（带元数据 JSON）。
- 🚀 **100% 协议向后兼容**：保留了原有的 `GET /balogo` 路由与 `l, r, x, y, tp` 参数，历史调用方无需任何修改即可平滑迁移。
- 💎 **Blue Archive 风格 WebUI**：内置致敬蔚蓝档案操作界面的即时预览控制台与 Swagger UI 在线调参页。

---

## 🛠️ 快速开始

### 本地运行 (需要安装 [Bun](https://bun.sh))

```bash
# 1. 克隆项目
git clone https://github.com/sf-yuzifu/ba-logo-api.git
cd ba-logo-api

# 2. 安装依赖
bun install

# 3. 启动开发模式（支持毫秒级热重载）
bun dev

# 生产模式启动
bun start
```

服务启动后：
- 访问 **`http://localhost:3000/`**：进入 Kivotos HUD 交互式控制台；
- 访问 **`http://localhost:3000/swagger`**：打开 Swagger API 交互调试文档；
- 访问 **`http://localhost:3000/api/logo?left=蔚蓝&right=档案`**：直接获取图片。

### 🧪 自动化测试与离线样图生成

```bash
# 运行单元与路由全量测试 (15 tests, 67 assertions)
bun test

# 一键批量生成各类风格的高清离线测试样图至 samples/ 目录
bun run samples
```

---

## 📖 API 参数详解

接口同时支持现代 RESTful 路由 **`GET /api/logo`** 与旧版兼容路由 **`GET /balogo`**。

### Query 参数列表

| 参数名 | 简写别名 | 类型 | 默认值 | 示例 / 可选值 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `left` | `l` | string | `"蔚蓝"` | `Blue`, `碧蓝` | 左侧主要文字（主强调色） |
| `right` | `r` | string | `"档案"` | `Archive`, `航线` | 右侧主要文字（次要颜色） |
| `subtitle` | `sub` | string | `""` | `ブルーアーカイブ` | **可选副标题**，在右下方倾斜对齐显示 |
| `subtitleColor`| `subColor` | string | *跟随右文字* | `#2B2B2B`, `#FFFFFF` | 副标题颜色 |
| `accentColor` | `accent` | string | `"#128AFA"` | `FF5722`, `#00E5FF` | **主强调色**（影响左文字与十字架，支持 Hex） |
| `scale` | `s` | number | `1` | `2`, `3`, `4` | **分辨率倍率**（1x=250p, 2x=500p, 4x=1000p，范围 0.1~8） |
| `format` | - | string | `"png"` | `png`, `webp`, `jpeg`, `base64` | 输出图片格式（`base64` 将输出 JSON 结构体） |
| `transparent` | `tp` | boolean | `false` | `true`, `false`, `1`, `0` | 是否开启背景透明（透明模式将镂空切除光环与十字） |
| `darkMode` | `dark` | boolean | `false` | `true`, `false`, `1`, `0` | 是否开启暗黑模式（深灰底、白字、白光环） |
| `swapColors` | `swap` | boolean | `false` | `true`, `false`, `1`, `0` | 是否对调左右文字的主次颜色 |
| `offsetX` | `x` | number | `-15` | `0`, `10`, `-20` | 光环与十字 X 轴偏移量（像素） |
| `offsetY` | `y` | number | `0` | `5`, `-5` | 光环与十字 Y 轴偏移量（像素） |
| `crop` | - | boolean | `true` | `true`, `false` | 是否自动紧凑裁切两端空白（默认自动贴合内容） |

---

## 💡 调用示例

### 1. 经典官方 Logo 风格（带副标题，2x 高清）
```http
GET /api/logo?left=Blue&right=Archive&subtitle=%E3%83%96%E3%83%AB%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AB%E3%82%A4%E3%83%96&scale=2
```
![Official](samples/02-official-en-jp-2x.png)

### 2. 暗黑模式（Dark Mode，2x 高清）
```http
GET /api/logo?left=Blue&right=Archive&subtitle=%E3%83%96%E3%83%AB%E3%83%BC%E3%82%A2%E3%83%BC%E3%82%AB%E3%82%A4%E3%83%96&dark=true&scale=2
```
![Dark Mode](samples/03-dark-mode-2x.png)

### 3. 自定义橙红强调色 + 颜色对调
```http
GET /api/logo?left=碧蓝&right=航线&accent=FF5722&swap=true&scale=2
```
![Custom](samples/04-custom-color-swap-2x.png)

### 4. 4K 印刷级超高分辨率（4x 缩放）
```http
GET /api/logo?left=超高&right=清4K&scale=4
```

### 5. 获取 Base64 编码 JSON（适合程序内部集成）
```http
GET /api/logo?left=蔚蓝&right=档案&format=base64
```
**响应数据：**
```json
{
  "code": 200,
  "data": {
    "base64": "iVBORw0KGgoAAAANSUhEUg...",
    "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    "width": 780,
    "height": 500,
    "mimeType": "image/png"
  }
}
```

### 6. 在 Markdown 中直接引用
```markdown
![Logo](https://your-domain.com/api/logo?left=Blue&right=Archive&scale=2)
```

---

## 🐳 Docker 容器化部署

本项目提供了基于官方 `oven/bun:1-alpine` 的多阶段轻量构建 Dockerfile，**完全抛弃了 Chrome 依赖，镜像体积仅约 90MB**。

### 使用 Docker Compose（推荐）

```bash
# 启动容器
docker compose up -d

# 查看日志
docker compose logs -f
```

### 使用 Docker CLI 构建运行

```bash
# 构建镜像
docker build -t ba-logo-api:latest .

# 运行容器
docker run -d \
  --name ba-logo-api \
  --restart unless-stopped \
  -p 3000:3000 \
  ba-logo-api:latest
```

---

## 🖥️ 交互式 WebUI 控制台

在浏览器中直接访问服务根地址 `http://localhost:3000/`，即可使用专为本项目定制的交互式测试控制台：
- 模仿了一下下 `Blue Archive` 的设计风格；
- 实时防抖渲染更新；
- 一键复制实时 API 地址与 Markdown 代码；
- 本地一键下载生成图片。

---

## 📜 开源许可与鸣谢

本项目采用 [MIT License](LICENSE) 协议开源。

**鸣谢开源社区优秀工作：**
- [nulla2011/bluearchive-logo](https://github.com/nulla2011/bluearchive-logo)：原版 Canvas 前端实现与排版灵感来源；
- PR #6 by [@jozsefsallai](https://github.com/jozsefsallai)：SVG 矢量路径及色彩自定义概念；
- PR #9 by [@WUGqnwvMQPzl](https://github.com/WUGqnwvMQPzl)：Canvas 分辨率等比例缩放构想；
- PR #12 by [@sf-yuzifu](https://github.com/sf-yuzifu)：副标题排版机制；
- PR #1 by [@waterv](https://github.com/waterv)：长文本动态尺寸裁切修复。

*注：Blue Archive (蔚蓝档案) 相关版权归 NEXON Games Co., Ltd. 及 Yostar, Inc. 所有。本项目仅供技术学习交流与非商业同人二创使用。*
