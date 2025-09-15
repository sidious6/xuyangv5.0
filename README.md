# 煦养 - 中医智慧健康管理应用

这是一个基于中医智慧的现代化健康管理应用，集成了AI问诊、健康记录、养生指导等功能。

## ✨ 功能特点

### 🏠 主要功能
- **📱 移动端优先设计** - 完全适配手机端的用户体验
- **🤖 AI智能问诊** - 基于中医理论的智能健康分析
- **📊 健康数据记录** - 睡眠、情绪、饮食、症状全方位记录
- **🌿 顺时养生** - 根据节气、体质、天气的个性化养生建议
- **💭 内观日记** - 个人健康数据的可视化展示
- **👤 用户认证** - 安全的用户注册和登录系统

### 🎯 核心模块
1. **顺时养生** - AI生成的个性化养生计划
2. **内观记录** - 健康数据的记录和查看
3. **智能问诊** - 基于中医的AI健康咨询
4. **用户管理** - 个人资料和体质管理

## 🛠 技术栈

- **前端框架**: Next.js 15 (App Router)
- **样式系统**: Tailwind CSS
- **开发语言**: TypeScript
- **UI组件**: Lucide React Icons
- **数据库**: Supabase (PostgreSQL)
- **认证系统**: Supabase Auth
- **AI服务**: 字节跳动 ARK API
- **部署平台**: Vercel

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd health-app
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
复制环境变量模板并配置：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的配置：
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ARK API 配置
ARK_API_KEY=your_ark_api_key
ARK_MODEL_ID=your_ark_model_id
```

### 4. 数据库设置
参考 `docs/SETUP.md` 文件进行 Supabase 数据库配置。

### 5. 启动开发服务器
```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
health-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── records/       # 健康记录相关 API
│   │   │   └── wellness-plan/ # 养生计划 API
│   │   ├── auth/              # 认证页面
│   │   │   ├── login/         # 登录页面
│   │   │   └── register/      # 注册页面
│   │   ├── consultation/      # 问诊页面
│   │   ├── profile/           # 个人资料页面
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 主页面
│   ├── components/            # 可复用组件
│   ├── contexts/              # React Context
│   │   └── AuthContext.tsx   # 认证上下文
│   ├── lib/                   # 工具库
│   │   └── supabase.ts       # Supabase 客户端
│   └── types/                 # TypeScript 类型定义
├── supabase/                  # 数据库迁移文件
│   └── migrations/
├── docs/                      # 项目文档
├── .env.example              # 环境变量模板
└── README.md                 # 项目说明
```

## 🎨 界面设计

应用采用现代化的移动端设计，主要界面包含：

### 主页面
- **状态栏**: 显示时间和电池状态
- **导航栏**: 应用标题和菜单
- **AI助手横幅**: 智能问诊入口
- **顺时模块**: 基于节气的个性化养生建议
- **内观模块**: 健康记录的可视化展示
- **底部导航**: 记录、社区、我的三个主要功能
- **浮动按钮**: 快速添加健康记录

### 功能页面
- **问诊页面**: AI智能对话界面
- **记录页面**: 睡眠、情绪、饮食、症状记录
- **个人页面**: 用户资料和设置

## 🔧 开发说明

### 技术特点
- **类型安全**: 使用 TypeScript 确保代码质量
- **样式管理**: Tailwind CSS 原子化样式
- **响应式设计**: 适配不同屏幕尺寸
- **中文优化**: 支持中文字体和本地化
- **认证安全**: Supabase Auth 安全认证
- **数据持久化**: PostgreSQL 数据库存储

### 开发规范
- 使用 ESLint 进行代码检查
- 采用 App Router 架构
- API 路由统一错误处理
- 组件化开发模式

## 🚀 部署

### Vercel 部署（推荐）
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

### 手动构建
```bash
npm run build
npm start
```

## 📝 开发计划

- [ ] 添加更多健康记录类型
- [ ] 优化 AI 问诊体验
- [ ] 增加数据可视化图表
- [ ] 添加社区功能
- [ ] 支持多语言

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
