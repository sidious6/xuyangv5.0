-- 更新用户档案表以支持新的体质测试系统
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS constitution_type TEXT, -- 体质类型代码
ADD COLUMN IF NOT EXISTS constitution_test_type TEXT CHECK (constitution_test_type IN ('basic', 'professional', NULL)), -- 体质测试类型
ADD COLUMN IF NOT EXISTS constitution_scores JSONB, -- 体质测试得分
ADD COLUMN IF NOT EXISTS constitution_characteristics TEXT[], -- 体质特征
ADD COLUMN IF NOT EXISTS constitution_recommendations TEXT[]; -- 调理建议

-- 更新五行分析表以存储详细的体质分析结果
ALTER TABLE public.five_elements_analysis
ADD COLUMN IF NOT EXISTS constitution_scores JSONB, -- 体质得分分布
ADD COLUMN IF NOT EXISTS constitution_characteristics TEXT[], -- 体质特征
ADD COLUMN IF NOT EXISTS constitution_recommendations TEXT[]; -- 调理建议

-- 更新体质约束以支持更多体质类型
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS check_constitution;

ALTER TABLE public.profiles
ADD CONSTRAINT check_constitution
CHECK (constitution IN (
  '平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质',
  '湿热质', '血瘀质', '气郁质', '特禀质', '脾虚质',
  '肝气郁结质', '轻度失调质', '待测'
));

-- 为体质类型添加约束
ALTER TABLE public.profiles
ADD CONSTRAINT check_constitution_type
CHECK (constitution_type IN (
  'balanced', 'qi_deficiency', 'yang_deficiency', 'yin_deficiency',
  'phlegm_dampness', 'damp_heat', 'blood_stasis', 'qi_stagnation',
  'special_constitution', 'spleen_deficiency', 'liver_qi_stagnation',
  'mild_imbalance', NULL
));

-- 创建体质测试记录表
CREATE TABLE IF NOT EXISTS public.constitution_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('basic', 'professional')), -- 测试类型
  test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 测试时间
  answers JSONB NOT NULL, -- 测试答案
  scores JSONB NOT NULL, -- 体质得分
  primary_constitution TEXT NOT NULL, -- 主要体质
  primary_constitution_type TEXT NOT NULL, -- 主要体质类型
  secondary_constitution TEXT, -- 次要体质
  secondary_constitution_type TEXT, -- 次要体质类型
  characteristics TEXT[], -- 体质特征
  recommendations TEXT[], -- 调理建议
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.constitution_tests ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能访问自己的体质测试记录
CREATE POLICY "Users can only access their own constitution tests" ON public.constitution_tests
  FOR ALL USING (auth.uid() = user_id);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_constitution_tests_user_id ON public.constitution_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_constitution_tests_test_type ON public.constitution_tests(test_type);
CREATE INDEX IF NOT EXISTS idx_constitution_tests_test_date ON public.constitution_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_constitution_tests_primary_constitution ON public.constitution_tests(primary_constitution);

-- 添加注释
COMMENT ON TABLE public.constitution_tests IS '体质测试记录表';
COMMENT ON COLUMN public.constitution_tests.test_type IS '测试类型：basic(基础版)或professional(专业版)';
COMMENT ON COLUMN public.constitution_tests.answers IS '测试答案，JSON格式存储';
COMMENT ON COLUMN public.constitution_tests.scores IS '体质得分，JSON格式存储';
COMMENT ON COLUMN public.constitution_tests.primary_constitution IS '主要体质名称';
COMMENT ON COLUMN public.constitution_tests.primary_constitution_type IS '主要体质类型代码';
COMMENT ON COLUMN public.constitution_tests.characteristics IS '体质特征数组';
COMMENT ON COLUMN public.constitution_tests.recommendations IS '调理建议数组';

-- 更新profiles表的注释
COMMENT ON COLUMN public.profiles.constitution_type IS '体质类型代码';
COMMENT ON COLUMN public.profiles.constitution_test_type IS '体质测试类型';
COMMENT ON COLUMN public.profiles.constitution_scores IS '体质测试得分';
COMMENT ON COLUMN public.profiles.constitution_characteristics IS '体质特征';
COMMENT ON COLUMN public.profiles.constitution_recommendations IS '调理建议';

-- 更新five_elements_analysis表的注释
COMMENT ON COLUMN public.five_elements_analysis.constitution_scores IS '体质得分分布';
COMMENT ON COLUMN public.five_elements_analysis.constitution_characteristics IS '体质特征';
COMMENT ON COLUMN public.five_elements_analysis.constitution_recommendations IS '调理建议';