-- 创建健康报告相关表
CREATE TABLE IF NOT EXISTS health_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('blood_test', 'urine_test', 'imaging', 'general', 'other')),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    upload_date DATE NOT NULL,
    extracted_data JSONB,
    ai_analysis TEXT,
    tcm_interpretation TEXT,
    recommendations TEXT[],
    status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建健康报告指标表
CREATE TABLE IF NOT EXISTS health_report_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES health_reports(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    unit TEXT,
    reference_range TEXT,
    status TEXT NOT NULL CHECK (status IN ('normal', 'high', 'low', 'critical')),
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_health_reports_user_id ON health_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_status ON health_reports(status);
CREATE INDEX IF NOT EXISTS idx_health_reports_created_at ON health_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_report_indicators_report_id ON health_report_indicators(report_id);
CREATE INDEX IF NOT EXISTS idx_health_report_indicators_status ON health_report_indicators(status);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为健康报告表创建触发器
DROP TRIGGER IF EXISTS handle_health_reports_updated_at ON health_reports;
CREATE TRIGGER handle_health_reports_updated_at
    BEFORE UPDATE ON health_reports
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 启用行级安全性
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_report_indicators ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own health reports" ON health_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health reports" ON health_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health reports" ON health_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health reports" ON health_reports
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view indicators of their own health reports" ON health_report_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM health_reports hr
            WHERE hr.id = report_id AND hr.user_id = auth.uid()
        )
    );

-- 添加注释
COMMENT ON TABLE health_reports IS '用户体检报告表';
COMMENT ON TABLE health_report_indicators IS '体检报告指标详情表';
COMMENT ON COLUMN health_reports.report_type IS '报告类型：blood_test(血液检查), urine_test(尿液检查), imaging(影像检查), general(常规体检), other(其他)';
COMMENT ON COLUMN health_reports.status IS '处理状态：uploading(上传中), processing(处理中), completed(已完成), failed(失败)';
COMMENT ON COLUMN health_report_indicators.status IS '指标状态：normal(正常), high(偏高), low(偏低), critical(异常)';