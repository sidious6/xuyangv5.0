# 部署指南

## 🚀 Vercel 部署（推荐）

### 1. 准备工作
- 确保项目已推送到 GitHub
- 注册 Vercel 账号

### 2. 连接项目
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择你的 GitHub 仓库
4. 点击 "Import"

### 3. 配置环境变量
在 Vercel 项目设置中添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ARK_API_KEY=your_ark_api_key
ARK_MODEL_ID=your_ark_model_id
```

### 4. 部署
- Vercel 会自动检测 Next.js 项目并进行部署
- 每次推送到主分支都会自动重新部署

## 🗄️ Supabase 配置

### 1. 创建项目
1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 记录项目 URL 和 API Keys

### 2. 运行数据库迁移
1. 在 Supabase Dashboard 中，进入 SQL Editor
2. 依次执行 `supabase/migrations/` 目录下的 SQL 文件：
   - `001_tongue_analysis.sql`
   - `002_daily_records.sql`
   - `003_add_constitution.sql`

### 3. 配置存储
1. 在 Storage 中创建 `user-media` 桶
2. 设置为 Public 访问

### 4. 配置认证
1. 启用 Email 认证
2. 设置重定向 URLs：
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/auth/callback`

## 🔑 ARK API 配置

1. 访问 [ARK API 控制台](https://ark.cn-beijing.volces.com)
2. 创建 API Key
3. 获取模型 ID
4. 在环境变量中配置

## 🔍 验证部署

部署完成后，访问你的应用并测试：
- [ ] 用户注册/登录
- [ ] 健康记录功能
- [ ] AI 问诊功能
- [ ] 养生计划生成

## 🐛 常见问题

### 环境变量未生效
- 确保在 Vercel 中正确配置了所有环境变量
- 重新部署项目

### 数据库连接失败
- 检查 Supabase URL 和 API Key 是否正确
- 确保数据库迁移已正确执行

### AI 功能不可用
- 检查 ARK API Key 和 Model ID 是否正确
- 确认 API 配额是否充足
