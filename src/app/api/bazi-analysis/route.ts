import { NextRequest, NextResponse } from 'next/server';
import { calculateAdvancedBazi, getAdvancedBaziDescription } from '@/lib/advanced-bazi-calculator';
import { analyzeComprehensiveFiveElements, generateComprehensiveReport } from '@/lib/comprehensive-five-elements';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthYear, birthMonth, birthDay, birthHour, analysisType = 'basic' } = body;

    // 验证输入参数
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

    // 根据分析类型选择分析函数
    if (analysisType === 'comprehensive') {
      // 综合分析
      const comprehensiveAnalysis = analyzeComprehensiveFiveElements(
        birthYear,
        birthMonth,
        birthDay,
        birthHour
      );

      const report = generateComprehensiveReport(comprehensiveAnalysis);

      return NextResponse.json({
        success: true,
        data: comprehensiveAnalysis,
        report,
        analysisType: 'comprehensive'
      });
    } else {
      // 基础分析
      const baziAnalysis = calculateAdvancedBazi(
        birthYear,
        birthMonth,
        birthDay,
        birthHour
      );

      const description = getAdvancedBaziDescription(baziAnalysis);

      return NextResponse.json({
        success: true,
        data: baziAnalysis,
        description,
        analysisType: 'basic'
      });
    }
  } catch (error) {
    console.error('八字分析错误:', error);
    return NextResponse.json(
      { error: '八字分析过程中发生错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '八字分析API',
    version: '1.0.0',
    endpoints: {
      'POST /api/bazi-analysis': '进行八字分析',
      parameters: {
        birthYear: '出生年份 (1900-2100)',
        birthMonth: '出生月份 (1-12)',
        birthDay: '出生日期 (1-31)',
        birthHour: '出生小时 (0-23)',
        analysisType: '分析类型 (basic/comprehensive, 默认basic)'
      }
    }
  });
}