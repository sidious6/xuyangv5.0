import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/supabase';

// POST /api/records/meal - 创建饮食记录
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
      meal_type,
      images,
      description,
      feeling
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
    if (!date || !meal_type) {
      return NextResponse.json({ error: 'Date and meal_type are required' }, { status: 400 });
    }

    // 直接使用Supabase客户端创建饮食记录
    const { data, error } = await userSupabase
      .from('meal_logs')
      .insert({
        user_id: user.id,
        date,
        meal_type,
        images,
        description,
        feeling,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving meal log:', error);
      return NextResponse.json({ error: 'Failed to save meal log' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Meal log API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/records/meal?date=2025-08-17 - 获取指定日期的饮食记录
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

    // 获取饮食记录
    const { data, error } = await db.getMealLogsByDate(user.id, date);

    if (error) {
      console.error('Error fetching meal logs:', error);
      return NextResponse.json({ error: 'Failed to fetch meal logs' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Meal log GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
