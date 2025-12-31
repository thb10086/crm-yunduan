# 云端 CRM - 智能客户管理系统

全方位客户资源管理平台，助您高效管理销售流程。

## 功能特性

- ✅ 用户登录（验证码防刷）
- ✅ 三级角色权限（管理员/经理/销售）
- ✅ 客户资源管理（私海/公海）
- ✅ 跟进记录时间轴
- ✅ 合同与回款管理
- ✅ 数据统计报表

## 技术栈

- **框架:** Next.js 16 (App Router)
- **UI:** Tailwind CSS + Shadcn/UI + Framer Motion
- **数据库:** SQLite + Prisma ORM
- **认证:** NextAuth.js v5
- **图表:** Recharts

## 快速开始

### 方式一：Docker 部署（推荐，开箱即用）

```bash
# 克隆项目
git clone https://github.com/your-repo/crm-yunduan.git
cd crm-yunduan

# 一键启动（自动初始化数据库和种子数据）
docker-compose up -d --build

# 查看日志
docker-compose logs -f
```

启动后访问 http://localhost:8080

### 方式二：本地开发

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npx prisma migrate dev
npm run db:seed

# 3. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 经理 | manager | manager123 |
| 销售 | sales1 | sales123 |

## 生产部署

### 方式一：直接部署

```bash
# 构建
npm run build

# 启动
npm run start
```

### 方式二：Docker 部署

```bash
# 构建镜像
docker build -t crm-yunduan .

# 运行容器
docker run -d -p 3000:3000 --name crm crm-yunduan
```

### 方式三：Docker Compose

```bash
docker-compose up -d
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 生产运行 |
| `npm run db:seed` | 填充种子数据 |
| `npm run db:studio` | Prisma 数据库管理 |

## 环境变量

在 `.env` 文件中配置：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 许可证

MIT
