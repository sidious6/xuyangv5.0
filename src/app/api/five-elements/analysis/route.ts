import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateFiveElementsAnalysis } from '@/lib/five-elements-analysis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 创建带认证的Supabase客户端
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authentication token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // 获取用户档案
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 });
    }

    // 获取前一日记录
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const [sleepResult, mealResult, emotionResult, symptomResult] = await Promise.all([
      supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', yesterdayStr)
        .maybeSingle(),
      supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', yesterdayStr)
        .order('created_at', { ascending: true }),
      supabase
        .from('emotion_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', yesterdayStr)
        .order('created_at', { ascending: true }),
      supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', yesterdayStr)
        .order('created_at', { ascending: true })
    ]);

    // 整理每日数据
    const dailyData = {
      sleep: sleepResult.data,
      meals: mealResult.data || [],
      emotions: emotionResult.data || [],
      symptoms: symptomResult.data || []
    };

    // 构建生辰数据（如果没有用户档案，使用默认值）
    const birthData = userProfile?.birth_year ? {
      birth_year: userProfile.birth_year,
      birth_month: userProfile.birth_month || 1,
      birth_day: userProfile.birth_day || 1,
      birth_hour: userProfile.birth_hour,
      gender: (userProfile.gender || 'female') as 'male' | 'female'
    } : {
      birth_year: 1990,
      birth_month: 1,
      birth_day: 1,
      gender: 'female' as 'male' | 'female'
    };

    // 生成五行分析
    const analysis = generateFiveElementsAnalysis(userId, birthData, dailyData, date);

    // 保存到数据库
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('five_elements_analysis')
      .upsert({
        user_id: userId,
        date,
        basic_five_elements: analysis.basic_five_elements,
        dynamic_five_elements: analysis.dynamic_five_elements,
        balance_score: analysis.balance_score,
        primary_constitution: analysis.primary_constitution,
        secondary_constitution: analysis.secondary_constitution,
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save five elements analysis:', saveError);
      // 即使保存失败也返回生成的分析结果
      return NextResponse.json({
        success: true,
        data: analysis,
        message: 'Analysis generated but not saved'
      });
    }

    return NextResponse.json({
      success: true,
      data: savedAnalysis,
      message: 'Five elements analysis completed'
    });

  } catch (error) {
    console.error('Error in five elements analysis:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}