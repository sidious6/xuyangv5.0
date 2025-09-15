-- 完整的认证修复SQL脚本
-- 请在Supabase Dashboard的SQL编辑器中执行此脚本

-- 1. 创建或更新用户注册触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, constitution)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    '阴虚'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. 创建新触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 检查并修复现有用户的profile（防止重复执行）
INSERT INTO public.profiles (id, email, full_name, constitution)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  '阴虚'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. 验证修复结果
SELECT 
  'Users without profiles' as check_type,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Total users' as check_type,
  COUNT(*) as count
FROM auth.users

UNION ALL

SELECT 
  'Total profiles' as check_type,
  COUNT(*) as count
FROM public.profiles;

-- 完成提示
SELECT 'SQL脚本执行完成！现在需要在Authentication > Settings中关闭邮箱验证' as message;