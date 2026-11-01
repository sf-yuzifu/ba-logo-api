# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-11-01

### Added
- **Native Skia Rendering Engine**: Completely replaced Puppeteer and Headless Chromium with `@napi-rs/canvas` (powered by Google Skia in C++/Rust), dropping latency from ~2000ms to ~10ms.
- **Pure Vector SVG Direct Export (`format=svg`)**:
  - Full glyph path vectorization using Skia's `convertSVGTextToPath`, eliminating all client font dependencies.
  - Native SVG vector cutout via `<mask id="...">`, matching raster cutout behavior without rasterization.
  - Directly importable into Figma, Adobe Illustrator, and Inkscape with infinite lossless scaling.
- **Modern RESTful API (`GET /api/logo`)**: Comprehensive query validation via TypeBox schema with full OpenAPI / Swagger interactive documentation at `/swagger`.
- **Advanced Layout & Typography**:
  - Word gap adjustment (`wordGap` / `gap`, -100px to 300px) for tight or wide kerning.
  - Independent subtitle position offsets (`subX` / `subY`).
  - Full CSS box-model padding parser (`padding`: 1-value, 2-value, 3-value, 4-value) with directional overrides (`paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`).
  - Dynamic canvas bounding boxes preventing clipping on long or shifted subtitles.
- **Decoupled Coloring & Layer Controls**:
  - Independent Cross coloring (`crossColor` / `cross`) and Halo coloring (`haloColor` / `halo`).
  - Motif bottom layer mode (`motifsBehindText` / `underText` / `behind`) for non-cutout artwork layering.
  - Dark mode (`darkMode` / `dark`) and color swapping (`swapColors` / `swap`).
- **Interactive Vue 3 WebUI**:
  - Modularized frontend powered by Vue 3, Vite, and TypeScript.
  - Kivotos / Schale HUD design with glassmorphic cards and dot grid.
  - Real-time preview with request sequence debouncing and `AbortController` cancellation.
  - Multi-language support (i18n) for Simplified Chinese, Traditional Chinese, English, and Japanese.
  - Direct PNG image copy to system clipboard via Web Clipboard API.
  - Field-level and global setting resets bound to immutable `DEFAULT_STATE`.
- **HTTP Caching**: Weak `ETag` generation using `Bun.hash` and `304 Not Modified` conditional requests via `If-None-Match`.
- **Engineering Baseline**:
  - Multi-stage Docker build producing an ~90MB container.
  - Cross-platform CI with GitHub Actions on Linux and Windows.
  - Biome linter and formatter integration with strict TypeScript checking.

### Changed
- Refactored rendering core into modular components: `options.ts`, `layout.ts`, and `bounds.ts`.
- Switched bounding-box detection to transparent alpha-channel scanning, fixing white-on-white detection issues.
- Optimized `RenderResult` by implementing lazy on-demand Base64 and DataURL getters, eliminating unnecessary base64 allocations on binary requests.
- Synchronized version information dynamically from `package.json`.

### Removed
- Removed legacy `puppeteer` dependency and heavy Chromium process.
- Removed legacy `crop` parameter in favor of unconditional tight cropping with CSS `padding`.
- Removed legacy static font slices and deprecated web assets.

### Fixed
- Fixed missing subtitle color parameter (`subColor`) in legacy `/balogo` endpoint mapping.
- Fixed 1px rounding discrepancies between SVG viewBox and raster dimensions across multiple padding and offset combinations.
