# 数据库设置说明

## 问题描述
当前Supabase数据库中没有任何表，需要手动创建所有必要的表结构。

## 解决方案

### 步骤1：打开Supabase控制台
1. 访问 [Supabase控制台](https://supabase.com/dashboard)
2. 登录您的账户
3. 选择您的项目

### 步骤2：打开SQL编辑器
1. 在左侧导航栏中点击 "SQL Editor"
2. 点击 "New query" 创建新查询

### 步骤3：执行数据库创建脚本
1. 打开项目中的 `database/create_all_tables.sql` 文件
2. 复制整个文件内容
3. 粘贴到Supabase SQL编辑器中
4. 点击 "Run" 按钮执行脚本

### 步骤4：验证表创建
执行以下查询来验证表是否创建成功：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

应该看到以下表：
- consultations
- consultation_messages
- daily_wellness_plans
- emotion_logs
- meal_logs
- profiles
- sleep_logs
- symptom_logs
- tongue_analyses
- tongue_sessions

### 步骤5：测试数据库连接
表创建完成后，可以通过以下API端点测试连接：
- `GET /api/test-db` - 测试基本连接
- `POST /api/create-tables` - 检查表状态

## 表结构说明

### 核心表
1. **profiles** - 用户档案表，包含用户基本信息和体质类型
2. **consultations** - 问诊记录表，存储问诊结果和分析
3. **tongue_sessions** - 舌诊会话表
4. **tongue_analyses** - 舌苔分析表
5. **consultation_messages** - 问诊对话表

### 健康记录表
6. **daily_wellness_plans** - 顺时养生建议表
7. **sleep_logs** - 睡眠记录表
8. **meal_logs** - 饮食记录表
9. **emotion_logs** - 情绪记录表
10. **symptom_logs** - 症状记录表

## 安全策略
所有表都启用了行级安全策略（RLS），确保用户只能访问自己的数据。

## 注意事项
- 确保您有Supabase项目的管理员权限
- 执行脚本前请备份现有数据（如果有）
- 如果遇到权限错误，请检查您的Supabase服务角色密钥配置

## 故障排除
如果执行脚本时遇到错误：
1. 检查SQL语法是否正确
2. 确认您有足够的权限
3. 查看Supabase控制台的错误日志
4. 可以分段执行脚本，逐个创建表