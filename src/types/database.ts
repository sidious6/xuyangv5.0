// 基础数据库类型定义

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  constitution?: string; // 用户体质
  // 生辰信息
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  birth_hour?: number;
  gender?: 'male' | 'female';
  created_at: string;
  updated_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  date: string;
  duration?: string; // '小于6h', '6-8h', '8-10h', '10h以上'
  feeling?: string; // '精力充沛', '神清气爽', '略感疲惫', '昏昏沉沉'
  wakeup_times?: string; // '无', '1次', '2次', '3次以上'
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description?: string;
  images?: string[];
  feeling?: string; // '很满足', '有点撑', '刚刚好', '还想吃'
  created_at: string;
  updated_at: string;
}

export interface EmotionLog {
  id: string;
  user_id: string;
  date: string;
  emoji?: string; // '😊', '😐', '😔', '😤', '🤯', '😌'
  intensity?: number; // 1-10
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SymptomLog {
  id: string;
  user_id: string;
  date: string;
  body_part?: string; // '头部', '胸部', '腹部', '四肢', '腰背', '其他'
  severity?: number; // 1-10
  description?: string;
  created_at: string;
  updated_at: string;
}

// 舌诊相关类型
export interface TongueSession {
  id: string;
  user_id: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface TongueAnalysis {
  id: string;
  session_id: string;
  user_id: string;
  image_url: string;
  image_path: string;
  ai_analysis?: any;
  analysis_text?: string;
  confidence_score?: number;
  tags?: string[];
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface ConsultationMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: 'text' | 'image' | 'quick_reply';
  metadata?: any;
  created_at: string;
}

// 顺时养生计划类型
export interface DailyWellnessPlan {
  id: string;
  user_id: string;
  date: string;
  constitution: string; // 用户体质
  location?: string; // 地理位置
  weather?: any; // 天气信息
  solar_term?: string; // 节气
  content: any; // 养生建议内容
  generated_at: string;
  created_at: string;
  updated_at: string;
}

// 五行分析记录
export interface FiveElementsAnalysis {
  id: string;
  user_id: string;
  date: string;
  // 基于生辰的基本五行分布（固定值）
  basic_five_elements: {
    wood: number;     // 木
    fire: number;     // 火
    earth: number;    // 土
    metal: number;    // 金
    water: number;    // 水
  };
  // 基于当日身体状态的动态五行分布
  dynamic_five_elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  // 五行平衡度 (0-100)
  balance_score: number;
  // 主要体质倾向
  primary_constitution: string;
  // 次要体质倾向
  secondary_constitution?: string;
  // 分析时间
  created_at: string;
  updated_at: string;
}

// 体检报告相关类型
export interface HealthReport {
  id: string;
  user_id: string;
  title: string;
  report_type: 'blood_test' | 'urine_test' | 'imaging' | 'general' | 'other';
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  upload_date: string;
  extracted_data?: any;
  ai_analysis?: any;
  tcm_interpretation?: string;
  recommendations?: string[];
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface HealthReportIndicator {
  id: string;
  report_id: string;
  name: string;
  value: string;
  unit?: string;
  reference_range?: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  category: string;
  created_at: string;
}

// 用于前端组件的聚合类型
export interface DailyLogs {
  sleep?: SleepLog;
  meals: MealLog[];
  emotions: EmotionLog[];
  symptoms: SymptomLog[];
  wellness_plan?: DailyWellnessPlan; // 添加养生计划
}
