-- 在profiles表中添加五行占比字段
-- 执行此脚本来更新用户档案表结构

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS five_elements_ratio JSONB DEFAULT '{"木": 0, "火": 0, "土": 0, "金": 0, "水": 0}';

-- 添加注释
COMMENT ON COLUMN public.profiles.five_elements_ratio IS '用户五行占比，基于出生年月日时计算，格式：{"木": 20.5, "火": 15.3, "土": 25.1, "金": 18.7, "水": 20.4}';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_five_elements ON public.profiles USING GIN (five_elements_ratio);
