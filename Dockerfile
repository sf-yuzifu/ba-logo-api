# ==========================================
# 阶段 1: 依赖安装阶段
# ==========================================
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# 拷贝依赖配置并安装纯生产依赖
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ==========================================
# 阶段 2: 极简运行镜像
# ==========================================
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# 拷贝生产依赖、核心源码与字体资产
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY assets ./assets
COPY src ./src

# 安全基线：切换至内置的非 root 用户 bun
USER bun

EXPOSE 3000

# 容器健康检查探针
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# 启动服务
CMD ["bun", "run", "src/index.ts"]
