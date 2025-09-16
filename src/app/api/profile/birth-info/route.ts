import { NextRequest, NextResponse } from 'next/server';
import { calculateAdvancedBazi } from '@/lib/advanced-bazi-calculator';
import { createClient } from '@supabase/supabase-js';

// 在函数内部创建 supabase 客户端，确保环境变量正确读取
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
  
  console.log('环境变量检查:', {
    url: supabaseUrl ? '已设置' : '未设置',
    serviceKey: supabaseServiceKey ? '已设置' : '未设置'
  });
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少必要的环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, birthYear, birthMonth, birthDay, birthHour, gender, name } = body;

    // 验证输入参数
    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID参数' },
        { status: 400 }
      );
    }

    if (!birthYear || !birthMonth || !birthDay || birthHour === undefined) {
      return NextResponse.json(
        { error: '缺少必要的出生信息参数' },
        { status: 400 }
      );
    }

    // 验证参数范围
    if (birthYear < 1900 || birthYear > 2100) {
      return NextResponse.json(
        { error: '出生年份必须在1900-2100之间' },
        { status: 400 }
      );
    }

    if (birthMonth < 1 || birthMonth > 12) {
      return NextResponse.json(
        { error: '出生月份必须在1-12之间' },
        { status: 400 }
      );
    }

    if (birthDay < 1 || birthDay > 31) {
      return NextResponse.json(
        { error: '出生日期必须在1-31之间' },
        { status: 400 }
      );
    }

    if (birthHour < 0 || birthHour > 23) {
      return NextResponse.json(
        { error: '出生小时必须在0-23之间' },
        { status: 400 }
      );
    }

    // 计算八字和五行分析
    console.log('开始计算八字:', { birthYear, birthMonth, birthDay, birthHour });
    const baziAnalysis = calculateAdvancedBazi(
      birthYear,
      birthMonth,
      birthDay,
      birthHour
    );
    console.log('八字计算结果:', baziAnalysis);

    // 将英文五行名称转换为中文
    const elementNameMap = {
      'wood': '木',
      'fire': '火',
      'earth': '土',
      'metal': '金',
      'water': '水'
    };

    // 构建五行比例对象（中文）
    const fiveElementsRatio = {
      木: baziAnalysis.elementPercentages.wood,
      火: baziAnalysis.elementPercentages.fire,
      土: baziAnalysis.elementPercentages.earth,
      金: baziAnalysis.elementPercentages.metal,
      水: baziAnalysis.elementPercentages.water
    };
    console.log('五行比例:', fiveElementsRatio);

    // 准备更新数据
    const updateData: any = {
      birth_year: birthYear,
      birth_month: birthMonth,
      birth_day: birthDay,
      birth_hour: birthHour,
      five_elements_ratio: fiveElementsRatio,
      day_master: baziAnalysis.dayMaster,
      day_master_element: baziAnalysis.dayMasterElement,
      updated_at: new Date().toISOString()
    };

    // 如果提供了姓名和性别，也一并更新
    if (name) {
      updateData.full_name = name;
    }
    if (gender) {
      updateData.gender = gender;
    }

    // 更新用户档案中的生日信息和五行比例
    console.log('准备更新数据库，用户ID:', userId);
    console.log('更新数据:', updateData);
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('更新用户档案失败:', error);
      return NextResponse.json(
        { error: '保存生日信息和五行比例失败', details: error.message },
        { status: 500 }
      );
    }

    console.log('数据库更新成功:', data);

    // 返回计算结果
    return NextResponse.json({
      success: true,
      data: {
        userId,
        birthInfo: {
          year: birthYear,
          month: birthMonth,
          day: birthDay,
          hour: birthHour
        },
        fiveElementsRatio,
        baziInfo: {
          chart: `${baziAnalysis.chart.year.stem}${baziAnalysis.chart.year.branch} ${baziAnalysis.chart.month.stem}${baziAnalysis.chart.month.branch} ${baziAnalysis.chart.day.stem}${baziAnalysis.chart.day.branch} ${baziAnalysis.chart.hour.stem}${baziAnalysis.chart.hour.branch}`,
          dayMaster: baziAnalysis.dayMaster,
          dayMasterElement: elementNameMap[baziAnalysis.dayMasterElement as keyof typeof elementNameMap],
          strength: baziAnalysis.strength,
          season: baziAnalysis.season
        }
      },
      message: '生日信息和五行比例保存成功'
    });

  } catch (error) {
    console.error('保存生日信息错误:', error);
    return NextResponse.json(
      { error: '保存生日信息过程中发生错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID参数' },
        { status: 400 }
      );
    }

    // 查询用户的生日信息和五行比例
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, gender, birth_year, birth_month, birth_day, birth_hour, five_elements_ratio')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('查询用户档案失败:', error);
      return NextResponse.json(
        { error: '查询用户信息失败' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: data.id,
        name: data.full_name,
        gender: data.gender,
        birthInfo: {
          year: data.birth_year,
          month: data.birth_month,
          day: data.birth_day,
          hour: data.birth_hour
        },
        fiveElementsRatio: data.five_elements_ratio
      }
    });

  } catch (error) {
    console.error('查询生日信息错误:', error);
    return NextResponse.json(
      { error: '查询过程中发生错误' },
      { status: 500 }
    );
  }
}
