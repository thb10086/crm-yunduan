FROM node:20-alpine AS base

# 构建阶段
FROM base AS builder
WORKDIR /app

# 设置构建时需要的环境变量
ENV DATABASE_URL="file:./dev.db"

COPY package*.json ./
RUN npm ci
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL="file:./prisma/dev.db"

# 安装运行时依赖（prisma migrate 和 tsx 需要）
RUN npm install -g prisma tsx

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 复制启动脚本
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# 创建数据目录并设置权限
RUN mkdir -p /app/prisma && chmod 777 /app/prisma

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 使用启动脚本
CMD ["/app/docker-entrypoint.sh"]
