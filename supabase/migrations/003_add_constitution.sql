-- 为用户档案表添加体质字段
ALTER TABLE public.profiles 
ADD COLUMN constitution TEXT DEFAULT '待测';

-- 添加体质字段的约束，限制为常见的中医体质类型
ALTER TABLE public.profiles 
ADD CONSTRAINT check_constitution 
CHECK (constitution IN (
  '平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', 
  '湿热质', '血瘀质', '气郁质', '特禀质', '阴虚', '阳虚', '待测'
));

-- 为现有用户设置默认体质为阴虚
UPDATE public.profiles 
SET constitution = '阴虚' 
WHERE constitution IS NULL;

-- 创建顺时养生建议表
CREATE TABLE IF NOT EXISTS public.daily_wellness_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  constitution TEXT NOT NULL, -- 用户体质
  location TEXT, -- 地理位置
  weather JSONB, -- 天气信息
  solar_term TEXT, -- 节气
  content JSONB NOT NULL, -- 养生建议内容
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date) -- 每天只能有一条记录
);

-- 启用RLS
ALTER TABLE public.daily_wellness_plans ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能访问自己的养生计划
CREATE POLICY "Users can only access their own wellness plans" ON public.daily_wellness_plans
  FOR ALL USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE TRIGGER daily_wellness_plans_updated_at
  BEFORE UPDATE ON public.daily_wellness_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
