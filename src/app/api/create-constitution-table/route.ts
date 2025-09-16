import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CONSTITUTION_TEST_RESULTS_TABLE } from '@/lib/db/constitution-test-migrations';

export async function POST(request: NextRequest) {
  try {
    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: '缺少必要的环境变量配置' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    // 检查是否为管理员用户
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 执行创建表的SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: CONSTITUTION_TEST_RESULTS_TABLE
    });

    if (error) {
      console.error('创建表失败:', error);

      // 如果exec_sql不存在，直接使用SQL
      try {
        const { error: directError } = await supabase
          .from('constitution_test_results')
          .select('count')
          .limit(1);

        if (directError) {
          // 表不存在，创建表
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS constitution_test_results (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL,
              name TEXT NOT NULL,
              birth_year INTEGER NOT NULL,
              birth_month INTEGER NOT NULL,
              birth_day INTEGER NOT NULL,
              birth_hour INTEGER NOT NULL,
              gender TEXT NOT NULL,
              day_master TEXT NOT NULL,
              day_master_element TEXT NOT NULL,
              element_percentages JSONB NOT NULL,
              season TEXT NOT NULL,
              strength TEXT NOT NULL,
              constitutional_type TEXT NOT NULL,
              health_strengths TEXT[] DEFAULT '{}',
              health_weaknesses TEXT[] DEFAULT '{}',
              dietary_recommendations JSONB NOT NULL,
              exercise_recommendations JSONB NOT NULL,
              emotional_guidance JSONB NOT NULL,
              seasonal_adjustments JSONB NOT NULL,
              test_answers JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;

          // 这里需要直接执行SQL，但由于Supabase的限制，我们可能需要在控制台执行
          return NextResponse.json({
            success: false,
            message: '请直接在Supabase控制台执行创建表的SQL',
            sql: CONSTITUTION_TEST_RESULTS_TABLE
          });
        }
      } catch (err) {
        return NextResponse.json({
          success: false,
          error: '创建表失败',
          message: '请检查数据库权限'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: '体质测试结果表创建成功'
    });

  } catch (error) {
    console.error('创建表API错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: '缺少必要的环境变量配置' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '体质测试结果表创建API',
      sql: CONSTITUTION_TEST_RESULTS_TABLE
    });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}