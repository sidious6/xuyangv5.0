import { NextRequest, NextResponse } from 'next/server';
import { calculateAdvancedBazi } from '@/lib/advanced-bazi-calculator';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, birthYear, birthMonth, birthDay, birthHour } = body;

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
    const baziAnalysis = calculateAdvancedBazi(
      birthYear,
      birthMonth,
      birthDay,
      birthHour
    );

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

    // 更新用户档案中的五行比例
    const { data, error } = await supabase
      .from('profiles')
      .update({
        five_elements_ratio: fiveElementsRatio,
        birth_year: birthYear,
        birth_month: birthMonth,
        birth_day: birthDay,
        birth_hour: birthHour,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('更新用户档案失败:', error);
      return NextResponse.json(
        { error: '保存五行比例失败' },
        { status: 500 }
      );
    }

    // 返回计算结果
    return NextResponse.json({
      success: true,
      data: {
        userId,
        fiveElementsRatio,
        baziChart: `${baziAnalysis.chart.year.stem}${baziAnalysis.chart.year.branch} ${baziAnalysis.chart.month.stem}${baziAnalysis.chart.month.branch} ${baziAnalysis.chart.day.stem}${baziAnalysis.chart.day.branch} ${baziAnalysis.chart.hour.stem}${baziAnalysis.chart.hour.branch}`,
        dayMaster: baziAnalysis.dayMaster,
        dayMasterElement: elementNameMap[baziAnalysis.dayMasterElement as keyof typeof elementNameMap],
        strength: baziAnalysis.strength,
        season: baziAnalysis.season
      },
      message: '五行比例计算并保存成功'
    });

  } catch (error) {
    console.error('五行比例计算错误:', error);
    return NextResponse.json(
      { error: '五行比例计算过程中发生错误' },
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

    // 查询用户的五行比例
    const { data, error } = await supabase
      .from('profiles')
      .select('id, five_elements_ratio, birth_year, birth_month, birth_day, birth_hour')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('查询用户档案失败:', error);
      return NextResponse.json(
        { error: '查询用户五行比例失败' },
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
        fiveElementsRatio: data.five_elements_ratio,
        birthInfo: {
          year: data.birth_year,
          month: data.birth_month,
          day: data.birth_day,
          hour: data.birth_hour
        }
      }
    });

  } catch (error) {
    console.error('查询五行比例错误:', error);
    return NextResponse.json(
      { error: '查询过程中发生错误' },
      { status: 500 }
    );
  }
}
