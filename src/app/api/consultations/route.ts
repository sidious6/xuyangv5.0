import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  });
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function POST(request: NextRequest) {
  try {
    console.log('Received consultation save request');
    const body = await request.json();
    console.log('Request body:', body);

    const { userId, timestamp, tongueImage, questions, analysis, sessionId } = body;

    if (!userId) {
      console.error('Missing userId in request');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 获取用户认证信息
    const authHeader = request.headers.get('authorization');
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

    // 验证用户身份
    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Attempting to save to Supabase...');
    // 保存问诊记录到 Supabase
    const { data, error } = await userSupabase
      .from('consultations')
      .insert({
        user_id: userId,
        consultation_date: timestamp,
        tongue_image: tongueImage,
        questions_answers: questions,
        analysis_result: analysis,
        session_id: sessionId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: 'Failed to save consultation', details: error.message }, { status: 500 });
    }

    console.log('Successfully saved consultation:', data);
    return NextResponse.json({
      success: true,
      consultationId: data.id
    });

  } catch (error) {
    console.error('Error saving consultation:', error);
    return NextResponse.json(
      { error: 'Failed to save consultation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 获取用户认证信息
    const authHeader = request.headers.get('authorization');
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

    // 验证用户身份
    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取用户的问诊记录，按时间倒序排列
    const { data, error } = await userSupabase
      .from('consultations')
      .select('*')
      .eq('user_id', userId)
      .order('consultation_date', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
    }

    // 转换数据格式以匹配前端期望的格式
    const consultations = (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      timestamp: item.consultation_date,
      tongueImage: item.tongue_image,
      questions: item.questions_answers,
      analysis: item.analysis_result,
      sessionId: item.session_id,
      createdAt: item.created_at
    }));

    return NextResponse.json({ consultations });

  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultations' },
      { status: 500 }
    );
  }
}
