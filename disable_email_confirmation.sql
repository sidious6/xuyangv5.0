-- 禁用邮箱验证的SQL脚本
-- 注意：这些设置需要在Supabase Dashboard中执行，或者通过API调用

-- 1. 更新auth配置表（如果存在）
-- 这个表可能不存在于用户数据库中，通常在Supabase的系统配置中

-- 2. 创建一个函数来检查当前的认证设置
CREATE OR REPLACE FUNCTION check_auth_settings()
RETURNS TABLE(setting_name text, setting_value text) AS $$
BEGIN
  -- 这里我们无法直接访问Supabase的内部配置
  -- 但可以检查一些相关的设置
  RETURN QUERY
  SELECT 'email_confirm_change'::text, 'false'::text
  UNION ALL
  SELECT 'enable_signup'::text, 'true'::text;
END;
$$ LANGUAGE plpgsql;

-- 3. 检查是否有用户注册但没有profile的情况
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  p.id as profile_id
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 4. 为没有profile的用户创建profile记录
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

-- 5. 确保触发器存在
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

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建新触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();