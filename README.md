# Blue Archive Logo API (蔚蓝档案风格 Logo 生成器)

<div align="center">

![Blue Archive Logo Preview](samples/02-official-en-jp-2x.png)

基于 **Bun 1.3.14+** + **ElysiaJS** + **Google Skia 原生渲染引擎** 重构的高性能、极低内存占用、高清晰度的蔚蓝档案风格 Logo 生成接口。

[![Bun](https://img.shields.io/badge/Bun-1.3.14+-black?logo=bun)](https://bun.sh)
[![ElysiaJS](https://img.shields.io/badge/ElysiaJS-1.4+-f06292)](https://elysiajs.com)
[![Skia Canvas](https://img.shields.io/badge/@napi--rs/canvas-1.1+-green)](https://github.com/Brooooooklyn/canvas)
[![CI](https://github.com/sf-yuzifu/ba-logo-api/actions/workflows/ci.yml/badge.svg)](https://github.com/sf-yuzifu/ba-logo-api/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[在线 WebUI 控制台](#-交互式-webui-控制台) • [Swagger 接口文档](#-swagger--openapi-文档) • [API 参数详解](#-api-参数详解) • [字体与技术说明](#-技术栈与字体资产说明) • [致谢](#-鸣谢与致敬)

</div>

---

## ✨ 核心特性

- ⚡ **极致性能跃迁**：彻底移除了 3 年前笨重的 Puppeteer / 无头 Chromium 方案，底层完全由 C++/Rust 预编译的原生 **Google Skia** 驱动。单次生成耗时在冷启动预热后降至 **8~15ms**（依宿主硬件略有浮动），较无头浏览器提速超 150 倍！
- 🪶 **极低内存占用**：告别浏览器沙箱 500MB~1GB 的恐怖内存开销，Linux 容器运行环境下常驻 RSS 仅约 **30MB~50MB**，JS 堆内存仅 **1.6MB~20MB**，1C1G 小内存轻量服务器也能轻松稳定运行。
- 🎨 **全矢量无损绘制**：
  - 光环（Halo）与十字架（Cross）采用高精度 **SVG Path2D** 矢量机制，摆脱位图像素毛边；
  - 配合 **`scale` 分辨率缩放参数**（支持 1x~8x），即便是 4K 印刷级大图也毫厘毕现。
- 🎯 **吸纳开源社区所有精髓**：
  - **副标题排版**：支持在右下端精准对齐倾斜副标题（如官方日文 `ブルーアーカイブ`）；
  - **色彩深度定制**：支持自定义任意强调色（`accentColor`），左右文字颜色互换（`swapColors`）；
  - **暗黑模式**：深灰底、纯白字与反向描边切除；
  - **双重裁切机制**：支持紧贴内容边缘 2px 的极致贴边（`padding: 2`），以及消除“头重脚轻”的**垂直视觉居中**（`center: true`）。
- 📦 **多格式原生支持**：直接提供 `png`（透明通道）、`webp`（体积更小，极度节省 Bot 流量）、`jpeg`、`svg`（纯矢量无损轮廓化 Path，无需客户端字体即可无损导入 Figma / AI 设计与印刷）以及 `base64`（带元数据 JSON）。
- 🚀 **100% 协议向后兼容**：保留了原有的 `GET /balogo` 路由与 `l, r, x, y, tp` 参数，历史调用方无需任何修改即可平滑迁移。
- 💎 **Blue Archive 风格 WebUI**：内置致敬蔚蓝档案操作界面的即时预览控制台与 Swagger UI 在线调参页。

---

## 🛠️ 快速开始

### 本地运行 (需要安装 [Bun](https://bun.sh))

要求 Bun **1.3.14 或更新版本**，当前验证基线为 **1.3.14**。CI 从 `.bun-version` 读取固定版本，Docker 使用同版本的 Alpine 镜像。升级基线时同步更新 `.bun-version`、`package.json` 中的 `packageManager` / `engines.bun` 和 Dockerfile 的 `BUN_VERSION`。

```bash
# 1. 克隆项目
git clone https://github.com/sf-yuzifu/ba-logo-api.git
cd ba-logo-api

# 2. 按锁文件安装依赖
bun install --frozen-lockfile

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
# 执行完整检查：类型检查 → 静态/格式检查 → 测试
bun run check

# 仅检查 TypeScript 类型（不输出编译产物）
bun run typecheck

# 检查 Biome 静态规则、导入顺序与代码格式（只读，警告也会失败）
bun run lint

# 格式化 TypeScript 与 JSON 文件
bun run format

# 运行单元与路由全量测试
bun test

# 一键批量生成各类风格的高清离线测试样图至 samples/ 目录
bun run samples

# 执行高并发与内存压测脚本
bun run bench
```

代码统一使用两空格缩进、UTF-8 和 LF 换行；TypeScript 开启严格模式及未使用代码检查。`bun test` 不执行类型检查，提交前建议运行 `bun run check`。Biome 支持安全自动修复：`bunx --no-install biome check --write .`。

GitHub Actions 在每次 push / pull request 时，分别在 Linux 与 Windows 执行冻结锁文件安装、类型检查、Biome 检查与测试。

---

## 📖 API 参数详解

接口同时支持现代 RESTful 路由 **`GET /api/logo`** 与旧版兼容路由 **`GET /balogo`**。

### Query 参数列表

| 参数名 | 简写别名 | 类型 | 默认值 | 示例 / 可选值 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `left` | `l` | string | `"蔚蓝"` | `Blue`, `碧蓝` | 左侧主要文字（主强调色） |
| `right` | `r` | string | `"档案"` | `Archive`, `航线` | 右侧主要文字（次要颜色） |
| `subtitle` | `sub` | string | `""` | `ブルーアーカイブ` | **可选副标题**，在右下方倾斜对齐显示 |
| `subtitleColor`| `subColor` | string | *跟随右文字* | `#2B2B2B`, `#FFFFFF` | 副标题颜色（支持 Hex） |
| `subtitleOffsetX`| `subX` | number | `0` | `20`, `-15` | **副标题 X 轴偏移量**（像素微调，支持正负数） |
| `subtitleOffsetY`| `subY` | number | `0` | `10`, `-5` | **副标题 Y 轴偏移量**（像素微调，支持正负数） |
| `accentColor` | `accent` | string | `"#128AFA"` | `FF5722`, `#00E5FF` | **主强调色**（影响左文字与十字架，支持 Hex） |
| `textColor` | `color`, `tc` | string | `"#2B2B2B"` | `000000`, `#FFFFFF` | **文字主题色**（影响右文字与光环，暗黑模式默认白） |
| `crossColor` | `cross` | string | *跟随强调色* | `FFD700`, `#FF5722` | **十字独立颜色**（可选独立着色，支持 Hex） |
| `haloColor` | `halo` | string | *跟随文字色* | `9C27B0`, `#000000` | **光环独立颜色**（可选独立着色，支持 Hex） |
| `motifsBehindText`| `behind`, `underText`| boolean | `false` | `true`, `false` | **图标置底**（将十字与光环置于文字图层下方，文字无镂空） |
| `scale` | `s` | number | `1` | `2`, `3`, `4` | **分辨率倍率**（1x=250p, 2x=500p, 4x=1000p，范围 0.1~8） |
| `format` | - | string | `"png"` | `png`, `webp`, `jpeg`, `svg`, `base64` | 输出格式（`svg` 纯矢量轮廓，`base64` 输出 JSON） |
| `transparent` | `tp` | boolean | `false` | `true`, `false`, `1`, `0` | 是否开启背景透明（透明模式将镂空切除光环与十字） |
| `darkMode` | `dark` | boolean | `false` | `true`, `false`, `1`, `0` | 是否开启暗黑模式（深灰底、白字、白光环） |
| `swapColors` | `swap` | boolean | `false` | `true`, `false`, `1`, `0` | 是否对调左右文字的主次颜色 |
| `offsetX` | `x` | number | `-15` | `0`, `10`, `-20` | 光环与十字 X 轴偏移量（像素） |
| `offsetY` | `y` | number | `0` | `5`, `-5` | 光环与十字 Y 轴偏移量（像素） |
| `wordGap` | `gap` | number | `0` | `20`, `-10`, `50` | **两词间距**（左右两词间距微调，支持正负数，范围 -100 ~ 300） |
| `padding` | `pad` | string / number | `2` | `10`, `10 20`, `10,20,30,40` | **留白边距**（上下左右全向加白，全面支持 **CSS 语法**：单值、双值、四值） |
| `paddingTop` | `pt` | number | - | `10`, `20` | 独立上边距留白（可选细粒度覆盖） |
| `paddingRight` | `pr` | number | - | `10`, `20` | 独立右边距留白（可选细粒度覆盖） |
| `paddingBottom`| `pb` | number | - | `10`, `20` | 独立下边距留白（可选细粒度覆盖） |
| `paddingLeft` | `pl` | number | - | `10`, `20` | 独立左边距留白（可选细粒度覆盖） |
| `center` | `vcenter`| boolean | *智能自适应* | `true`, `false` | **文本垂直视觉居中**（非透明模式默认 true，透明模式默认 false） |

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

## 🧰 技术栈与字体资产说明

### 🛠️ 所用主要技术与依赖库

| 类别 | 工具 / 库名 | 作用说明 |
| :--- | :--- | :--- |
| **运行时** | [Bun 1.3+](https://bun.sh) | 原生执行 TypeScript，秒级极速冷启动，内置高效 HTTP 服务与哈希算法 |
| **Web 框架** | [ElysiaJS 1.4+](https://elysiajs.com) | 基于 TypeBox 的全类型安全微框架，极高路由吞吐量 |
| **图形渲染内核** | [@napi-rs/canvas 1.1+](https://github.com/Brooooooklyn/canvas) | 基于 Rust 封装的 Google Skia 2D 图形引擎（与 Chromium 渲染内核一致） |
| **API 文档** | [@elysiajs/swagger](https://github.com/elysiajs/elysia-swagger) | 基于 OpenAPI 3.0 自动生成可视化交互调试控制台 |
| **跨域支持** | [@elysiajs/cors](https://github.com/elysiajs/elysia-cors) | 处理跨域 HTTP 资源共享 |
| **测试套件** | `bun:test` | 原生毫秒级单测框架，覆盖全量单元与路由集成测试 |

---

### 🔤 字体资产来源与构成说明

本项目内置的高质量合并字体位于 `assets/fonts/ba.ttf`（约 9.15 MB，总计 **30,479 个字形**），由社区字体工具合并构建，完整覆盖了英文字母、数字、日文假名、简体中文、繁体中文以及常见生僻字：

1. **官方英文与日文字体**：
   - [RoG2サンセリフStd B (RoG Sans Serif Std B)](https://www.morisawa.co.jp/fonts/specimen/1646) - Morisawa 出品的官方原版粗黑无衬线字体，负责所有英文字符、阿拉伯数字与日文平假名/片假名词条。
2. **中文字体补全**：
   - [未来荧黑 (Wêlai Glow Sans)](https://github.com/welai/glow-sans) Heavy 粗体版本 - 基于思源黑体改造的开源宽体无衬线字体，字形特征与官方 RoGSans 视觉比例高度契合，覆盖全量 CJK 汉字库。
3. **字体合并管线**：
   - 由开源工具 [Warcraft-Font-Merger](https://github.com/nowar-fonts/Warcraft-Font-Merger) 执行基线微调与字形合并，在服务启动时通过 Skia `GlobalFonts` 一次性常驻内存。

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
- 借鉴自个人项目 [BA-style-homepage](https://github.com/sf-yuzifu/BA-style-homepage) 与 [astroBlog](https://github.com/sf-yuzifu/astroBlog) 的 Kivotos / Schale HUD 设计美学；
- 实时防抖渲染更新；
- 一键复制实时 API 地址与 Markdown 代码；
- 本地一键下载生成图片。

---

## 📜 鸣谢与致敬

本项目采用 [MIT License](LICENSE) 协议开源。

特别感谢以下开源项目与贡献者为蔚蓝档案同人生态做出的杰出贡献：
- **[@nulla2011](https://github.com/nulla2011)**：创造了标杆级的 Canvas 前端项目 [nulla2011/bluearchive-logo](https://github.com/nulla2011/bluearchive-logo)（[原版在线页面](https://lab.nulla.top/ba-logo/)），奠定了排版与几何数学模型基础；
- **[@jozsefsallai](https://github.com/jozsefsallai)**（PR #6）：贡献了光环与十字架的高精度 SVG 矢量路径数据以及暗黑模式与色彩自定义概念；
- **[@WUGqnwvMQPzl](https://github.com/WUGqnwvMQPzl)**（PR #9）：提出了画布高分辨率等比例缩放的构想；
- **[@sf-yuzifu](https://github.com/sf-yuzifu)**（PR #12）：贡献了副标题排版对齐设计；
- **[@waterv](https://github.com/waterv)**（PR #1）：指出了原版长文本动态裁切溢出的计算问题；
- **[@RedBeanN](https://github.com/RedBeanN)**（[BALogo](https://github.com/RedBeanN/BALogo)）：提供了合并后极高完成度的 `ba.ttf` 全量字体资产。

---

*免责声明：Blue Archive (蔚蓝档案) 游戏资产、标识与相关知识产权归属于 NEXON Games Co., Ltd. 及 Yostar, Inc. 所有。本项目仅供技术学习交流与非商业同人衍生创作使用。*
