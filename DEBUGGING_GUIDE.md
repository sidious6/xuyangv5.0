# 五行比例显示为0的调试指南

## 问题现象
用户填写生日信息后，数据库中的 `five_elements_ratio` 字段显示为 `{"木": 0, "火": 0, "土": 0, "金": 0, "水": 0}`

## 可能原因和解决方案

### 1. 环境变量问题
**检查方法：**
```bash
# 查看 .env.local 文件
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

**解决方案：**
确保 `.env.local` 中有正确的服务角色密钥：
```
SUPABASE_SERVICE_ROLE_KEY=sbp_xxxxx...
```

### 2. 数据库字段问题
**检查方法：**
在Supabase SQL编辑器中运行：
```sql
-- 检查字段是否存在
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'five_elements_ratio';

-- 查看具体用户数据
SELECT id, five_elements_ratio, birth_year, birth_month, birth_day, birth_hour 
FROM profiles 
WHERE five_elements_ratio IS NOT NULL;
```

**解决方案：**
如果字段不存在，运行迁移脚本：
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS five_elements_ratio JSONB DEFAULT '{"木": 0, "火": 0, "土": 0, "金": 0, "水": 0}';
```

### 3. API调用问题
**检查方法：**
1. 打开浏览器开发者工具
2. 访问 `/test-five-elements` 页面
3. 点击"测试五行计算"
4. 查看Network标签页的API请求

**解决方案：**
- 检查API响应状态码
- 查看响应内容是否包含错误信息
- 确认请求数据格式正确

### 4. 计算逻辑问题
**检查方法：**
查看服务器日志中的计算结果：
```
开始计算八字: { birthYear: 2003, birthMonth: 2, birthDay: 13, birthHour: 4 }
八字计算结果: { elementPercentages: { wood: 0, fire: 0, ... } }
```

**解决方案：**
如果计算结果都是0，可能是八字算法有问题，需要检查：
- `calculateAdvancedBazi` 函数的实现
- 天干地支映射表
- 五行权重计算

### 5. 权限问题
**检查方法：**
在Supabase中查看RLS（Row Level Security）策略：
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**解决方案：**
确保服务角色有更新profiles表的权限，或临时禁用RLS：
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

## 调试步骤

### 第一步：快速验证
1. 访问 `/test-five-elements` 页面
2. 点击"测试五行计算"按钮
3. 查看结果和控制台日志

### 第二步：检查API日志
1. 查看服务器控制台输出
2. 寻找以下日志：
   - "开始计算八字"
   - "八字计算结果"
   - "五行比例"
   - "准备更新数据库"
   - "数据库更新成功"

### 第三步：验证数据库
1. 在Supabase中查询用户数据
2. 确认 `five_elements_ratio` 字段已更新
3. 检查数据格式是否正确

### 第四步：手动测试计算
使用测试脚本验证计算逻辑：
```bash
node test-five-elements.js
```

## 常见错误和解决方案

### 错误1：API返回500错误
- 检查环境变量
- 查看服务器日志详细错误信息
- 确认数据库连接正常

### 错误2：计算结果为NaN或undefined
- 检查输入参数类型
- 确认日期参数在有效范围内
- 验证八字计算函数

### 错误3：数据库更新失败
- 检查字段名是否正确
- 确认数据类型匹配
- 验证权限设置

### 错误4：前端没有调用API
- 检查体质测试流程
- 确认用户已登录
- 验证API路径正确

## 成功标志

当所有问题解决后，你应该看到：
1. 测试页面显示正确的五行比例（不全是0）
2. 数据库中 `five_elements_ratio` 字段有实际数值
3. 控制台显示完整的计算和更新日志
4. 体质测试完成后自动保存五行比例

## 联系支持

如果按照以上步骤仍无法解决问题，请提供：
1. 测试页面的截图
2. 浏览器控制台的错误日志
3. 服务器日志输出
4. 数据库查询结果
