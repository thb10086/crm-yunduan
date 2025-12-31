#!/bin/sh
set -e

echo "🚀 启动 CRM 系统..."

# 检查数据库文件是否存在
if [ ! -f /app/prisma/dev.db ]; then
    echo "📦 首次启动，初始化数据库..."
    
    # 运行数据库迁移
    npx prisma migrate deploy
    
    # 填充种子数据
    npx tsx prisma/seed.ts
    
    echo "✅ 数据库初始化完成！"
else
    echo "✅ 数据库已存在，跳过初始化"
fi

echo "🌐 启动 Web 服务器..."
exec node server.js
