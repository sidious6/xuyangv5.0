-- 为新版专业体质测试添加数据库字段
-- 执行此脚本来支持九体质量表的转化分存储

-- 添加体质测试版本字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS constitution_test_type text DEFAULT 'basic';

-- 添加体质维度转化分字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS constitution_scores_json jsonb DEFAULT '{}';

-- 添加日干相关字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS day_master text,
ADD COLUMN IF NOT EXISTS day_master_element text;

-- 添加字段注释
COMMENT ON COLUMN public.profiles.constitution_test_type IS '体质测试版本类型：basic(基础版), professional(旧专业版), professional_v2(新九体质量表)';
COMMENT ON COLUMN public.profiles.constitution_scores_json IS '体质维度转化分，格式：{"平和质": 72.5, "气虚质": 38.2, "阳虚质": 15.0, ...}';
COMMENT ON COLUMN public.profiles.day_master IS '日干，如：甲、乙、丙、丁、戊、己、庚、辛、壬、癸';
COMMENT ON COLUMN public.profiles.day_master_element IS '日干对应的五行属性，如：wood、fire、earth、metal、water';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_constitution_test_type ON public.profiles (constitution_test_type);
CREATE INDEX IF NOT EXISTS idx_profiles_constitution_scores ON public.profiles USING GIN (constitution_scores_json);
CREATE INDEX IF NOT EXISTS idx_profiles_day_master ON public.profiles (day_master);
CREATE INDEX IF NOT EXISTS idx_profiles_day_master_element ON public.profiles (day_master_element);

-- 示例查询：查找平和质转化分高于60的用户
-- SELECT id, full_name, constitution, 
--        (constitution_scores_json->>'平和质')::numeric as 平和质转化分
-- FROM public.profiles 
-- WHERE constitution_test_type = 'professional_v2' 
--   AND (constitution_scores_json->>'平和质')::numeric > 60;

-- 查看九种体质的转化分分布
-- SELECT 
--   constitution,
--   (constitution_scores_json->>'平和质')::numeric as 平和质,
--   (constitution_scores_json->>'气虚质')::numeric as 气虚质,
--   (constitution_scores_json->>'阳虚质')::numeric as 阳虚质,
--   (constitution_scores_json->>'阴虚质')::numeric as 阴虚质,
--   (constitution_scores_json->>'痰湿质')::numeric as 痰湿质,
--   (constitution_scores_json->>'湿热质')::numeric as 湿热质,
--   (constitution_scores_json->>'血瘀质')::numeric as 血瘀质,
--   (constitution_scores_json->>'气郁质')::numeric as 气郁质,
--   (constitution_scores_json->>'特禀质')::numeric as 特禀质
-- FROM public.profiles 
-- WHERE constitution_test_type = 'professional_v2';

-- 查询特定日干的用户
-- SELECT id, full_name, day_master, day_master_element, constitution
-- FROM public.profiles 
-- WHERE day_master = '甲';  -- 查找日干为甲木的用户

-- 按五行属性统计用户分布
-- SELECT day_master_element, COUNT(*) as 用户数量
-- FROM public.profiles 
-- WHERE day_master_element IS NOT NULL
-- GROUP BY day_master_element
-- ORDER BY 用户数量 DESC;
