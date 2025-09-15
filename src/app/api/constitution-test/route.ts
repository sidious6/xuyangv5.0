import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服务端客户端，支持用户认证
async function getSupabaseClient(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 从请求头获取认证信息
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    return { supabase, user };
  }

  return { supabase, user: null };
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseClient(request);
    const body = await request.json();
    const {
      basicInfo,
      answers,
      baziAnalysis
    } = body;

    // 验证用户认证
    if (!user) {
      return NextResponse.json(
        { error: '用户未认证' },
        { status: 401 }
      );
    }

    // 验证输入
    if (!basicInfo || !baziAnalysis) {
      return NextResponse.json(
        { error: '缺少必要参数：basicInfo 和 baziAnalysis' },
        { status: 400 }
      );
    }

    // 验证basicInfo必要字段
    const requiredBasicFields = ['birthYear', 'birthMonth', 'birthDay', 'gender'];
    for (const field of requiredBasicFields) {
      if (!basicInfo[field]) {
        return NextResponse.json(
          { error: `缺少必要的基本信息字段：${field}` },
          { status: 400 }
        );
      }
    }

    // 验证baziAnalysis结构
    if (!baziAnalysis.baziAnalysis || !baziAnalysis.healthImplications) {
      return NextResponse.json(
        { error: '八字分析数据结构不完整' },
        { status: 400 }
      );
    }

    // 使用认证用户的ID，而不是传入的userId
    const actualUserId = user.id;

    // 准备插入数据
    const insertData = {
      user_id: actualUserId,
      name: basicInfo.name || null,
      birth_year: parseInt(basicInfo.birthYear),
      birth_month: parseInt(basicInfo.birthMonth),
      birth_day: parseInt(basicInfo.birthDay),
      birth_hour: basicInfo.birthHour ? parseInt(basicInfo.birthHour) : null,
      gender: basicInfo.gender,
      day_master: baziAnalysis.baziAnalysis?.dayMaster || null,
      day_master_element: baziAnalysis.baziAnalysis?.dayMasterElement || null,
      element_percentages: baziAnalysis.baziAnalysis?.elementPercentages || null,
      season: baziAnalysis.baziAnalysis?.season || null,
      strength: baziAnalysis.baziAnalysis?.strength || null,
      constitutional_type: baziAnalysis.healthImplications?.constitutionalType || null,
      health_strengths: baziAnalysis.healthImplications?.healthStrengths || null,
      health_weaknesses: baziAnalysis.healthImplications?.healthWeaknesses || null,
      dietary_recommendations: baziAnalysis.dietaryRecommendations || null,
      exercise_recommendations: baziAnalysis.exerciseRecommendations || null,
      emotional_guidance: baziAnalysis.emotionalGuidance || null,
      seasonal_adjustments: baziAnalysis.seasonalAdjustments || null,
      test_answers: answers || {},
      created_at: new Date().toISOString()
    };

    // 保存体质测试结果
    const { data: testResult, error: insertError } = await supabase
      .from('constitution_test_results')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('保存测试结果失败:', insertError);
      return NextResponse.json(
        {
          error: '保存测试结果失败',
          details: insertError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: testResult,
      message: '体质测试结果保存成功'
    });

  } catch (error) {
    console.error('体质测试API错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseClient(request);
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('id');

    // 验证用户认证
    if (!user) {
      return NextResponse.json(
        { error: '用户未认证' },
        { status: 401 }
      );
    }

    if (testId) {
      // 获取单个测试结果（只能获取自己的）
      const { data: testResult, error } = await supabase
        .from('constitution_test_results')
        .select('*')
        .eq('id', testId)
        .eq('user_id', user.id)  // 确保只能获取自己的测试结果
        .single();

      if (error) {
        return NextResponse.json(
          { error: '未找到测试结果或无权限访问' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: testResult
      });
    }

    // 默认获取当前用户的所有测试结果
    const { data: testResults, error } = await supabase
      .from('constitution_test_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: '获取测试结果失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: testResults
    });

  } catch (error) {
    console.error('获取体质测试结果错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}