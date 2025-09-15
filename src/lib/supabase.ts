import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// 获取当前站点根地址（用于 Supabase 邮件回跳）
function getSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (envUrl) return envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
  return 'http://localhost:3000';
}


// 获取本地日期字符串（YYYY-MM-DD格式）
export function getLocalDateString(date?: Date): string {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取指定天数前的日期字符串
export function getDateStringDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getLocalDateString(date);
}

// 认证相关函数
export const auth = {
  // 注册
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // 不设置 emailRedirectTo，因为不需要邮箱验证
      },
    });
    return { data, error };
  },

  // 登录
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // 登出
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // 获取当前用户
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // 监听认证状态变化
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// 数据库操作函数
export const db = {
  // 创建舌诊会话
  async createTongueSession(userId: string) {
    const { data, error } = await supabase
      .from('tongue_sessions')
      .insert({ user_id: userId })
      .select()
      .single();
    return { data, error };
  },

  // 创建舌苔分析记录
  async createTongueAnalysis(sessionId: string, userId: string, imageUrl: string, imagePath: string) {
    const { data, error } = await supabase
      .from('tongue_analyses')
      .insert({
        session_id: sessionId,
        user_id: userId,
        image_url: imageUrl,
        image_path: imagePath,
      })
      .select()
      .single();
    return { data, error };
  },

  // 睡眠记录相关
  async createOrUpdateSleepLog(userId: string, date: string, sleepData: {
    duration?: string;
    feeling?: string;
    wakeup_times?: string;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('sleep_logs')
      .upsert({
        user_id: userId,
        date,
        ...sleepData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  },

  async getSleepLogByDate(userId: string, date: string) {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    return { data, error };
  },

  // 饮食记录相关
  async createMealLog(userId: string, mealData: {
    date: string;
    meal_type: string;
    images?: string[];
    description?: string;
    feeling?: string;
  }) {
    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: userId,
        ...mealData,
      })
      .select()
      .single();
    return { data, error };
  },

  async getMealLogsByDate(userId: string, date: string) {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  // 情绪记录相关
  async createEmotionLog(userId: string, emotionData: {
    date: string;
    emoji?: string;
    intensity?: number;
    description?: string;
  }) {
    const { data, error } = await supabase
      .from('emotion_logs')
      .insert({
        user_id: userId,
        ...emotionData,
      })
      .select()
      .single();
    return { data, error };
  },

  async getEmotionLogsByDate(userId: string, date: string) {
    const { data, error } = await supabase
      .from('emotion_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  // 症状记录相关
  async createSymptomLog(userId: string, symptomData: {
    date: string;
    body_part?: string;
    severity?: number;
    description?: string;
  }) {
    const { data, error } = await supabase
      .from('symptom_logs')
      .insert({
        user_id: userId,
        ...symptomData,
      })
      .select()
      .single();
    return { data, error };
  },

  async getSymptomLogsByDate(userId: string, date: string) {
    const { data, error } = await supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  // 获取用户所有记录（用于统计）
  async getAllUserLogs(userId: string, date: string) {
    // 获取指定日期的所有记录
    const [sleepLogs, mealLogs, emotionLogs, symptomLogs] = await Promise.all([
      this.getSleepLogByDate(userId, date),
      this.getMealLogsByDate(userId, date),
      this.getEmotionLogsByDate(userId, date),
      this.getSymptomLogsByDate(userId, date),
    ]);

    return {
      sleep: sleepLogs.data,
      meals: mealLogs.data || [],
      emotions: emotionLogs.data || [],
      symptoms: symptomLogs.data || [],
    };
  },

  // 获取某日的所有记录
  async getDayRecords(userId: string, date: string) {
    const [sleepResult, mealResult, emotionResult, symptomResult, summaryResult, wellnessPlanResult] = await Promise.all([
      this.getSleepLogByDate(userId, date),
      this.getMealLogsByDate(userId, date),
      this.getEmotionLogsByDate(userId, date),
      this.getSymptomLogsByDate(userId, date),
      this.getDailySummary(userId, date),
      this.getDailyWellnessPlan(userId, date),
    ]);

    return {
      sleep: sleepResult.data,
      meals: mealResult.data || [],
      emotions: emotionResult.data || [],
      symptoms: symptomResult.data || [],
      summary: summaryResult.data,
      wellness_plan: wellnessPlanResult.data,
      errors: {
        sleep: sleepResult.error,
        meals: mealResult.error,
        emotions: emotionResult.error,
        symptoms: symptomResult.error,
        summary: summaryResult.error,
        wellness_plan: wellnessPlanResult.error,
      }
    };
  },

  // 更新舌苔分析结果
  async updateTongueAnalysis(id: string, analysis: {
    ai_analysis?: any;
    analysis_text?: string;
    confidence_score?: number;
    tags?: string[];
    status?: 'processing' | 'completed' | 'failed';
  }) {
    const { data, error } = await supabase
      .from('tongue_analyses')
      .update(analysis)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // 保存对话消息
  async saveMessage(sessionId: string, userId: string, role: 'user' | 'assistant' | 'system', content: string, messageType: 'text' | 'image' | 'quick_reply' = 'text', metadata?: any) {
    const { data, error } = await supabase
      .from('consultation_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role,
        content,
        message_type: messageType,
        metadata,
      })
      .select()
      .single();
    return { data, error };
  },

  // 获取会话消息
  async getSessionMessages(sessionId: string) {
    const { data, error } = await supabase
      .from('consultation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  // 获取用户的舌诊会话列表
  async getUserSessions(userId: string) {
    const { data, error } = await supabase
      .from('tongue_sessions')
      .select(`
        *,
        tongue_analyses(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // 创建聊天会话（通用，不仅限于舌诊）
  async createChatSession(userId: string, mode: 'chat' | 'diagnosis' = 'chat') {
    const { data, error } = await supabase
      .from('tongue_sessions')
      .insert({
        user_id: userId,
        status: 'active'
      })
      .select()
      .single();
    return { data, error };
  },

  // 获取用户的最新活跃会话
  async getActiveSession(userId: string) {
    const { data, error } = await supabase
      .from('tongue_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { data, error };
  },

  // 获取用户的所有会话（包括消息预览）
  async getUserChatSessions(userId: string) {
    const { data, error } = await supabase
      .from('tongue_sessions')
      .select(`
        *,
        consultation_messages(
          content,
          role,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    return { data, error };
  },

  // 更新会话状态
  async updateSessionStatus(sessionId: string, status: 'active' | 'completed' | 'cancelled') {
    const { data, error } = await supabase
      .from('tongue_sessions')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();
    return { data, error };
  },

  // 获取用户档案
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // 更新用户体质
  async updateUserConstitution(userId: string, constitution: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ constitution })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  // 创建或更新每日养生计划
  async upsertDailyWellnessPlan(userId: string, planData: {
    date: string;
    constitution: string;
    location?: string;
    weather?: any;
    solar_term?: string;
    content: any;
  }) {
    const { data, error } = await supabase
      .from('daily_wellness_plans')
      .upsert({
        user_id: userId,
        ...planData,
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();
    return { data, error };
  },

  // 获取用户某日的养生计划
  async getDailyWellnessPlan(userId: string, date: string) {
    const { data, error } = await supabase
      .from('daily_wellness_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();
    return { data, error };
  },

  // 检查用户今日是否已有养生计划
  async checkTodayWellnessPlan(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.getDailyWellnessPlan(userId, today);
  },

  // 获取每日总结（暂时返回空，待实现）
  async getDailySummary(userId: string, date: string) {
    // 这个函数目前只是为了避免错误，实际功能待实现
    return { data: null, error: null };
  },
};

// 存储相关函数
export const storage = {
  // 获取签名上传 URL
  async getSignedUploadUrl(path: string, contentType: string) {
    const { data, error } = await supabase.storage
      .from('user-media')
      .createSignedUploadUrl(path, {
        upsert: true
      });
    return { data, error };
  },

  // 获取公共 URL
  getPublicUrl(path: string) {
    const { data } = supabase.storage
      .from('user-media')
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // 删除文件
  async deleteFile(path: string) {
    const { data, error } = await supabase.storage
      .from('user-media')
      .remove([path]);
    return { data, error };
  },
};
