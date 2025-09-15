import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'month';

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

    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'quarter':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // 获取五行分析数据
    const { data: analysisData, error: analysisError } = await supabase
      .from('five_elements_analysis')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    if (analysisError) {
      console.error('Error fetching five elements analysis:', analysisError);
      return NextResponse.json({ error: 'Failed to fetch analysis data' }, { status: 500 });
    }

    if (!analysisData || analysisData.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No analysis data found for the selected period'
      });
    }

    // 转换数据格式
    const formattedData = analysisData.map(item => ({
      date: item.date,
      basic_wood: item.basic_five_elements.wood,
      basic_fire: item.basic_five_elements.fire,
      basic_earth: item.basic_five_elements.earth,
      basic_metal: item.basic_five_elements.metal,
      basic_water: item.basic_five_elements.water,
      dynamic_wood: item.dynamic_five_elements.wood,
      dynamic_fire: item.dynamic_five_elements.fire,
      dynamic_earth: item.dynamic_five_elements.earth,
      dynamic_metal: item.dynamic_five_elements.metal,
      dynamic_water: item.dynamic_five_elements.water,
      balance_score: item.balance_score,
      primary_constitution: item.primary_constitution
    }));

    // 计算统计摘要
    const avgBalance = Math.round(
      formattedData.reduce((sum, item) => sum + item.balance_score, 0) / formattedData.length
    );

    // 计算趋势
    const firstHalf = formattedData.slice(0, Math.floor(formattedData.length / 2));
    const secondHalf = formattedData.slice(Math.floor(formattedData.length / 2));

    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, item) => sum + item.balance_score, 0) / firstHalf.length
      : 0;
    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, item) => sum + item.balance_score, 0) / secondHalf.length
      : 0;

    const trendDirection = secondHalfAvg > firstHalfAvg + 5 ? 'improving' :
                          secondHalfAvg < firstHalfAvg - 5 ? 'declining' : 'stable';

    // 找出最常见的体质
    const constitutionCounts = formattedData.reduce((acc, item) => {
      acc[item.primary_constitution] = (acc[item.primary_constitution] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequentConstitution = Object.entries(constitutionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '未知';

    const summary = {
      avg_balance: avgBalance,
      trend_direction: trendDirection,
      most_frequent_constitution: mostFrequentConstitution
    };

    return NextResponse.json({
      success: true,
      data: {
        data: formattedData,
        summary
      },
      message: 'Stats retrieved successfully'
    });

  } catch (error) {
    console.error('Error in five elements stats:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}