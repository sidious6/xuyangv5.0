import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/records/daily-summary?date=2025-08-17 - 获取指定日期的每日汇总
export async function GET(req: Request) {
  try {
    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
        !(process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return NextResponse.json(
        { error: '缺少必要的环境变量配置' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    // 获取用户信息
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // 创建带有用户token的Supabase客户端
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 直接使用Supabase客户端获取当日所有记录
    const [sleepResult, mealResult, emotionResult, symptomResult] = await Promise.all([
      // 获取睡眠记录
      userSupabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .single(),

      // 获取饮食记录
      userSupabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: true }),

      // 获取情绪记录
      userSupabase
        .from('emotion_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: true }),

      // 获取症状记录
      userSupabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: true })
    ]);

    const dayRecords = {
      sleep: sleepResult.data,
      meals: mealResult.data || [],
      emotions: emotionResult.data || [],
      symptoms: symptomResult.data || [],
      summary: null, // 暂时没有实现每日总结功能
      wellness_plan: null, // 暂时没有实现健康计划功能
      errors: {
        sleep: sleepResult.error,
        meals: mealResult.error,
        emotions: emotionResult.error,
        symptoms: symptomResult.error,
        summary: null,
        wellness_plan: null,
      }
    };

    return NextResponse.json({ success: true, data: dayRecords });
  } catch (error) {
    console.error('Daily summary GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/records/daily-summary - 创建或更新每日汇总
export async function POST(req: Request) {
  try {
    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
        !(process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return NextResponse.json(
        { error: '缺少必要的环境变量配置' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      date,
      sleep_summary,
      meal_summary,
      emotion_summary,
      symptom_summary,
      overall_summary,
      ai_feedback
    } = await req.json();

    // 获取用户信息
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 验证必填字段
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // TODO: 实现每日汇总的创建或更新功能
    // 目前暂时返回成功，实际功能待实现
    console.log('Daily summary data received:', {
      user_id: user.id,
      date,
      sleep_summary,
      meal_summary,
      emotion_summary,
      symptom_summary,
      overall_summary,
      ai_feedback,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Daily summary functionality not yet implemented',
        received_data: { date, sleep_summary, meal_summary, emotion_summary, symptom_summary }
      }
    });
  } catch (error) {
    console.error('Daily summary API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


