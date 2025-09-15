import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/supabase';

// POST /api/records/sleep - 创建或更新睡眠记录
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
      duration,
      feeling,
      wakeup_times,
      notes
    } = await req.json();

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

    // 验证必填字段
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // 先检查是否已存在记录
    const { data: existingRecord } = await userSupabase
      .from('sleep_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();

    let data, error;
    if (existingRecord) {
      // 更新现有记录
      ({ data, error } = await userSupabase
        .from('sleep_logs')
        .update({
          duration,
          feeling,
          wakeup_times,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRecord.id)
        .select()
        .single());
    } else {
      // 创建新记录
      ({ data, error } = await userSupabase
        .from('sleep_logs')
        .insert({
          user_id: user.id,
          date,
          duration,
          feeling,
          wakeup_times,
          notes,
        })
        .select()
        .single());
    }

    if (error) {
      console.error('Error saving sleep log:', error);
      return NextResponse.json({ error: 'Failed to save sleep log' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Sleep log API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/records/sleep?date=2025-08-17 - 获取指定日期的睡眠记录
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取睡眠记录
    const { data, error } = await db.getSleepLogByDate(user.id, date);

    if (error && error.code !== 'PGRST116') { // PGRST116 是 "not found" 错误
      console.error('Error fetching sleep log:', error);
      return NextResponse.json({ error: 'Failed to fetch sleep log' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch (error) {
    console.error('Sleep log GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
