# Vercel 部署指南

## 部署步骤

### 1. 准备工作
确保你的项目已经推送到 GitHub 仓库：`https://github.com/sidious6/xuyangv5.0`

### 2. 连接 Vercel
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库 `sidious6/xuyangv5.0`

### 3. 配置环境变量
在 Vercel 项目设置中添加以下环境变量：

#### 必需的环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE`: Supabase 服务角色密钥
- `NEXT_PUBLIC_SITE_URL`: 你的 Vercel 应用域名 (例如: https://your-app.vercel.app)

#### 可选的环境变量：
- `ARK_API_KEY`: 字节跳动 ARK API 密钥
- `ARK_MODEL_ID`: ARK 模型 ID (默认: doubao-seed-1-6-flash-250828)
- `DIFY_API_KEY`: Dify API 密钥
- `DIFY_API_URL`: Dify API URL (默认: https://api.dify.ai/v1)
- `NEXT_PUBLIC_DEV_MODE`: 开发模式 (生产环境设为 false)
- `NEXT_PUBLIC_MOCK_AI_RESPONSES`: 模拟 AI 响应 (生产环境设为 false)

### 4. 部署配置
项目已经配置了以下文件来优化 Vercel 部署：

- `vercel.json`: Vercel 部署配置
- `next.config.ts`: Next.js 优化配置
- `.vercelignore`: 排除不必要的文件

### 5. 自动部署
配置完成后，每次推送到 `master` 分支都会自动触发部署。

### 6. 域名配置
部署成功后，你可以：
1. 使用 Vercel 提供的默认域名
2. 配置自定义域名

### 7. 数据库迁移
确保 Supabase 数据库已经运行了必要的迁移脚本：
- `database/create_all_tables.sql`
- `database/consultations.sql`
- 其他相关的数据库脚本

## 故障排除

### 常见问题：
1. **构建失败**: 检查环境变量是否正确配置
2. **API 路由错误**: 确保所有 API 密钥都已正确设置
3. **数据库连接问题**: 验证 Supabase 配置和网络访问

### 调试步骤：
1. 查看 Vercel 构建日志
2. 检查函数日志
3. 验证环境变量设置
4. 测试 API 端点

## 性能优化

项目已经包含以下优化：
- 图片优化配置
- 服务器组件外部包配置
- 静态资源缓存
- API 路由 CORS 配置

## 监控和分析

建议启用：
- Vercel Analytics
- 错误监控
- 性能监控
