-- 完整的数据库表创建脚本
-- 请在Supabase SQL编辑器中执行此脚本

-- 1. 创建用户档案表
-- 如果表已存在但结构不同，先删除
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  constitution TEXT DEFAULT '待测',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加体质字段的约束
ALTER TABLE public.profiles 
ADD CONSTRAINT check_constitution 
CHECK (constitution IN (
  '平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', 
  '湿热质', '血瘀质', '气郁质', '特禀质', '阴虚', '阳虚', '待测'
));

-- 2. 创建问诊记录表
-- 如果表已存在但结构不同，先删除
DROP TABLE IF EXISTS public.consultations CASCADE;
CREATE TABLE public.consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  consultation_date TIMESTAMPTZ NOT NULL,
  tongue_image TEXT,
  questions_answers JSONB NOT NULL DEFAULT '[]',
  analysis_result TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建舌诊会话表
DROP TABLE IF EXISTS public.tongue_sessions CASCADE;
CREATE TABLE public.tongue_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建舌苔分析表
DROP TABLE IF EXISTS public.tongue_analyses CASCADE;
CREATE TABLE public.tongue_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.tongue_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  ai_analysis JSONB,
  analysis_text TEXT,
  confidence_score DECIMAL(3,2),
  tags TEXT[],
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建问诊对话表
DROP TABLE IF EXISTS public.consultation_messages CASCADE;
CREATE TABLE public.consultation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.tongue_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'quick_reply')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建顺时养生建议表
DROP TABLE IF EXISTS public.daily_wellness_plans CASCADE;
CREATE TABLE public.daily_wellness_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  constitution TEXT NOT NULL,
  location TEXT,
  weather JSONB,
  solar_term TEXT,
  content JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 7. 创建睡眠记录表
DROP TABLE IF EXISTS public.sleep_logs CASCADE;
CREATE TABLE public.sleep_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  duration TEXT,
  feeling TEXT,
  wakeup_times TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 8. 创建饮食记录表
DROP TABLE IF EXISTS public.meal_logs CASCADE;
CREATE TABLE public.meal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  description TEXT,
  images TEXT[],
  feeling TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 创建情绪记录表
DROP TABLE IF EXISTS public.emotion_logs CASCADE;
CREATE TABLE public.emotion_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  emoji TEXT,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 创建症状记录表
DROP TABLE IF EXISTS public.symptom_logs CASCADE;
CREATE TABLE public.symptom_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  body_part TEXT,
  severity INTEGER CHECK (severity >= 1 AND severity <= 10),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_consultation_date ON public.consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_tongue_sessions_user_id ON public.tongue_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tongue_analyses_user_id ON public.tongue_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_session_id ON public.consultation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_wellness_plans_user_date ON public.daily_wellness_plans(user_id, date);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER consultations_updated_at
    BEFORE UPDATE ON public.consultations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tongue_sessions_updated_at
    BEFORE UPDATE ON public.tongue_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tongue_analyses_updated_at
    BEFORE UPDATE ON public.tongue_analyses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER daily_wellness_plans_updated_at
    BEFORE UPDATE ON public.daily_wellness_plans
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER sleep_logs_updated_at
    BEFORE UPDATE ON public.sleep_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER meal_logs_updated_at
    BEFORE UPDATE ON public.meal_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER emotion_logs_updated_at
    BEFORE UPDATE ON public.emotion_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER symptom_logs_updated_at
    BEFORE UPDATE ON public.symptom_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 启用行级安全策略（RLS）
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tongue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tongue_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_wellness_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- Profiles策略
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Consultations策略
CREATE POLICY "Users can view own consultations" ON public.consultations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consultations" ON public.consultations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consultations" ON public.consultations
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own consultations" ON public.consultations
    FOR DELETE USING (auth.uid() = user_id);

-- 其他表的策略（用户只能访问自己的数据）
CREATE POLICY "Users can only access their own tongue sessions" ON public.tongue_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own tongue analyses" ON public.tongue_analyses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own consultation messages" ON public.consultation_messages
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own wellness plans" ON public.daily_wellness_plans
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own sleep logs" ON public.sleep_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own meal logs" ON public.meal_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own emotion logs" ON public.emotion_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own symptom logs" ON public.symptom_logs
    FOR ALL USING (auth.uid() = user_id);