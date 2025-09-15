-- 五行分析表
CREATE TABLE IF NOT EXISTS five_elements_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- 基于生辰的基本五行分布（JSON格式存储）
    basic_five_elements JSONB NOT NULL DEFAULT '{"wood": 10, "fire": 10, "earth": 10, "metal": 10, "water": 10}',

    -- 基于当日身体状态的动态五行分布（JSON格式存储）
    dynamic_five_elements JSONB NOT NULL DEFAULT '{"wood": 10, "fire": 10, "earth": 10, "metal": 10, "water": 10}',

    -- 五行平衡度 (0-100)
    balance_score INTEGER NOT NULL DEFAULT 50,

    -- 主要体质倾向
    primary_constitution TEXT NOT NULL DEFAULT 'balanced',

    -- 次要体质倾向
    secondary_constitution TEXT,

    -- 创建和更新时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 唯一约束：每个用户每天只能有一条记录
    CONSTRAINT user_date_unique UNIQUE (user_id, date)
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_five_elements_user_date ON five_elements_analysis(user_id, date);
CREATE INDEX IF NOT EXISTS idx_five_elements_date ON five_elements_analysis(date);
CREATE INDEX IF NOT EXISTS idx_five_elements_constitution ON five_elements_analysis(primary_constitution);

-- 添加用户生辰信息字段到profiles表
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birth_year INTEGER,
ADD COLUMN IF NOT EXISTS birth_month INTEGER CHECK (birth_month >= 1 AND birth_month <= 12),
ADD COLUMN IF NOT EXISTS birth_day INTEGER CHECK (birth_day >= 1 AND birth_day <= 31),
ADD COLUMN IF NOT EXISTS birth_hour INTEGER CHECK (birth_hour >= 0 AND birth_hour <= 23),
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- 添加comments
COMMENT ON TABLE five_elements_analysis IS '五行分析记录表';
COMMENT ON COLUMN five_elements_analysis.basic_five_elements IS '基于生辰的基本五行分布';
COMMENT ON COLUMN five_elements_analysis.dynamic_five_elements IS '基于当日身体状态的动态五行分布';
COMMENT ON COLUMN five_elements_analysis.balance_score IS '五行平衡度 (0-100)';
COMMENT ON COLUMN five_elements_analysis.primary_constitution IS '主要体质倾向';
COMMENT ON COLUMN five_elements_analysis.secondary_constitution IS '次要体质倾向';

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_five_elements_updated_at ON five_elements_analysis;
CREATE TRIGGER update_five_elements_updated_at
    BEFORE UPDATE ON five_elements_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();