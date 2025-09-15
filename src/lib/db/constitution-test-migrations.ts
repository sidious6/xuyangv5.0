// 体质测试结果数据库表结构
export const CONSTITUTION_TEST_RESULTS_TABLE = `
  CREATE TABLE IF NOT EXISTS constitution_test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birth_year INTEGER NOT NULL,
    birth_month INTEGER NOT NULL,
    birth_day INTEGER NOT NULL,
    birth_hour INTEGER NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),

    -- 八字分析结果
    day_master TEXT NOT NULL,
    day_master_element TEXT NOT NULL CHECK (day_master_element IN ('wood', 'fire', 'earth', 'metal', 'water')),
    element_percentages JSONB NOT NULL,
    season TEXT NOT NULL,
    strength TEXT NOT NULL CHECK (strength IN ('strong', 'weak', 'balanced')),

    -- 体质分析
    constitutional_type TEXT NOT NULL,
    health_strengths TEXT[] DEFAULT '{}',
    health_weaknesses TEXT[] DEFAULT '{}',

    -- 个性化建议
    dietary_recommendations JSONB NOT NULL,
    exercise_recommendations JSONB NOT NULL,
    emotional_guidance JSONB NOT NULL,
    seasonal_adjustments JSONB NOT NULL,

    -- 测试答案
    test_answers JSONB DEFAULT '{}',

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_constitution_test_user_id ON constitution_test_results(user_id);
  CREATE INDEX IF NOT EXISTS idx_constitution_test_created_at ON constitution_test_results(created_at);
  CREATE INDEX IF NOT EXISTS idx_constitution_test_element ON constitution_test_results(day_master_element);

  -- 更新触发器
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  CREATE TRIGGER update_constitution_test_updated_at
    BEFORE UPDATE ON constitution_test_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- 添加注释
  COMMENT ON TABLE constitution_test_results IS '体质测试结果表';
  COMMENT ON COLUMN constitution_test_results.element_percentages IS '五行元素百分比分布';
  COMMENT ON COLUMN constitution_test_results.constitutional_type IS '体质类型';
  COMMENT ON COLUMN constitution_test_results.dietary_recommendations IS '饮食建议';
  COMMENT ON COLUMN constitution_test_results.exercise_recommendations IS '运动建议';
  COMMENT ON COLUMN constitution_test_results.emotional_guidance IS '情绪指导';
  COMMENT ON COLUMN constitution_test_results.seasonal_adjustments IS '季节调整建议';
  COMMENT ON COLUMN constitution_test_results.test_answers IS '测试问题答案';
`;

// 删除表的SQL（用于回滚）
export const DROP_CONSTITUTION_TEST_RESULTS_TABLE = `
  DROP TABLE IF EXISTS constitution_test_results CASCADE;
`;

// 查询用户最新测试结果的函数
export const GET_LATEST_TEST_RESULT = `
  CREATE OR REPLACE FUNCTION get_latest_constitution_test(user_id UUID)
  RETURNS TABLE (
    id UUID,
    name TEXT,
    birth_year INTEGER,
    birth_month INTEGER,
    birth_day INTEGER,
    birth_hour INTEGER,
    gender TEXT,
    day_master TEXT,
    day_master_element TEXT,
    element_percentages JSONB,
    season TEXT,
    strength TEXT,
    constitutional_type TEXT,
    health_strengths TEXT[],
    health_weaknesses TEXT[],
    dietary_recommendations JSONB,
    exercise_recommendations JSONB,
    emotional_guidance JSONB,
    seasonal_adjustments JSONB,
    created_at TIMESTAMP WITH TIME ZONE
  ) AS $$
  BEGIN
    RETURN QUERY
    SELECT
      ctr.id,
      ctr.name,
      ctr.birth_year,
      ctr.birth_month,
      ctr.birth_day,
      ctr.birth_hour,
      ctr.gender,
      ctr.day_master,
      ctr.day_master_element,
      ctr.element_percentages,
      ctr.season,
      ctr.strength,
      ctr.constitutional_type,
      ctr.health_strengths,
      ctr.health_weaknesses,
      ctr.dietary_recommendations,
      ctr.exercise_recommendations,
      ctr.emotional_guidance,
      ctr.seasonal_adjustments,
      ctr.created_at
    FROM constitution_test_results ctr
    WHERE ctr.user_id = get_latest_constitution_test.user_id
    ORDER BY ctr.created_at DESC
    LIMIT 1;
  END;
  $$ LANGUAGE plpgsql;
`;

// 获取测试统计信息的函数
export const GET_TEST_STATISTICS = `
  CREATE OR REPLACE FUNCTION get_constitution_test_statistics()
  RETURNS TABLE (
    total_tests BIGINT,
    average_scores JSONB,
    element_distribution JSONB,
    seasonal_distribution JSONB
  ) AS $$
  DECLARE
    total_count BIGINT;
    avg_scores JSONB;
    element_dist JSONB;
    seasonal_dist JSONB;
  BEGIN
    -- 总测试次数
    SELECT COUNT(*) INTO total_count FROM constitution_test_results;

    -- 平均五行分布
    SELECT jsonb_build_object(
      'wood', AVG((element_percentages->>'wood')::FLOAT),
      'fire', AVG((element_percentages->>'fire')::FLOAT),
      'earth', AVG((element_percentages->>'earth')::FLOAT),
      'metal', AVG((element_percentages->>'metal')::FLOAT),
      'water', AVG((element_percentages->>'water')::FLOAT)
    ) INTO avg_scores
    FROM constitution_test_results;

    -- 体质类型分布
    SELECT jsonb_object_agg(day_master_element, count)
    INTO element_dist
    FROM (
      SELECT day_master_element, COUNT(*) as count
      FROM constitution_test_results
      GROUP BY day_master_element
    ) t;

    -- 季节分布
    SELECT jsonb_object_agg(season, count)
    INTO seasonal_dist
    FROM (
      SELECT season, COUNT(*) as count
      FROM constitution_test_results
      GROUP BY season
    ) t;

    RETURN QUERY SELECT total_count, avg_scores, element_dist, seasonal_dist;
  END;
  $$ LANGUAGE plpgsql;
`;