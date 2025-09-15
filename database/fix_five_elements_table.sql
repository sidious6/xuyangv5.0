-- 修复五行分析表结构
-- 确保所有必要的字段都存在

-- 检查并添加缺失的字段到 five_elements_analysis 表
ALTER TABLE public.five_elements_analysis
ADD COLUMN IF NOT EXISTS constitution_scores JSONB,
ADD COLUMN IF NOT EXISTS constitution_characteristics TEXT[],
ADD COLUMN IF NOT EXISTS constitution_recommendations TEXT[];

-- 检查并添加缺失的字段到 profiles 表
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS constitution_type TEXT,
ADD COLUMN IF NOT EXISTS constitution_test_type TEXT CHECK (constitution_test_type IN ('basic', 'professional', NULL)),
ADD COLUMN IF NOT EXISTS constitution_scores JSONB,
ADD COLUMN IF NOT EXISTS constitution_characteristics TEXT[],
ADD COLUMN IF NOT EXISTS constitution_recommendations TEXT[];

-- 确保 five_elements_analysis 表的 RLS 策略存在
ALTER TABLE public.five_elements_analysis ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（如果不存在）
DO $$
BEGIN
    -- 检查策略是否存在
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'five_elements_analysis' 
        AND policyname = 'Users can view own five elements analysis'
    ) THEN
        CREATE POLICY "Users can view own five elements analysis" 
        ON public.five_elements_analysis
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'five_elements_analysis' 
        AND policyname = 'Users can insert own five elements analysis'
    ) THEN
        CREATE POLICY "Users can insert own five elements analysis" 
        ON public.five_elements_analysis
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'five_elements_analysis' 
        AND policyname = 'Users can update own five elements analysis'
    ) THEN
        CREATE POLICY "Users can update own five elements analysis" 
        ON public.five_elements_analysis
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 验证表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'five_elements_analysis' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 显示完成信息
SELECT '五行分析表结构修复完成！' as message;
