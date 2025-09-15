-- 创建基础记录表

-- 睡眠记录表
CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  duration TEXT, -- 睡眠时长：'小于6h', '6-8h', '8-10h', '10h以上'
  feeling TEXT, -- 醒来感觉：'精力充沛', '神清气爽', '略感疲惫', '昏昏沉沉'
  wakeup_times TEXT, -- 惊醒次数：'无', '1次', '2次', '3次以上'
  notes TEXT, -- 额外备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date) -- 每天只能有一条记录
);

-- 饮食记录表
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')), -- 早餐、午餐、晚餐、加餐
  description TEXT, -- 食物描述
  images TEXT[], -- 食物图片URL数组
  feeling TEXT, -- 用餐后感觉：'很满足', '有点撑', '刚刚好', '还想吃'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 情绪记录表
CREATE TABLE IF NOT EXISTS public.emotion_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  emoji TEXT, -- 情绪表情：'😊', '😐', '😔', '😤', '🤯', '😌'
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10), -- 情绪强度 1-10
  description TEXT, -- 情绪原因描述
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 症状记录表
CREATE TABLE IF NOT EXISTS public.symptom_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  body_part TEXT, -- 身体部位：'头部', '胸部', '腹部', '四肢', '腰背', '其他'
  severity INTEGER CHECK (severity >= 1 AND severity <= 10), -- 严重程度 1-10
  description TEXT, -- 症状描述
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON public.sleep_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON public.meal_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_user_date ON public.emotion_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date ON public.symptom_logs(user_id, date DESC);

-- 启用行级安全策略
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能访问自己的记录
CREATE POLICY "Users can only access their own sleep logs" ON public.sleep_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own meal logs" ON public.meal_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own emotion logs" ON public.emotion_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own symptom logs" ON public.symptom_logs
  FOR ALL USING (auth.uid() = user_id);
