-- 创建问诊记录表
CREATE TABLE IF NOT EXISTS consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  consultation_date TIMESTAMPTZ NOT NULL,
  tongue_image TEXT,
  questions_answers JSONB NOT NULL DEFAULT '[]',
  analysis_result TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_consultation_date ON consultations(consultation_date);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consultations_updated_at 
    BEFORE UPDATE ON consultations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加行级安全策略（RLS）
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的问诊记录
CREATE POLICY "Users can view own consultations" ON consultations
    FOR SELECT USING (auth.uid()::text = user_id);

-- 用户只能插入自己的问诊记录
CREATE POLICY "Users can insert own consultations" ON consultations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 用户只能更新自己的问诊记录
CREATE POLICY "Users can update own consultations" ON consultations
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 用户只能删除自己的问诊记录
CREATE POLICY "Users can delete own consultations" ON consultations
    FOR DELETE USING (auth.uid()::text = user_id);
