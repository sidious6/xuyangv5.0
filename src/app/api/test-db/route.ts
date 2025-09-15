import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // 检查环境变量
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        message: '缺少必要的环境变量',
        data: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }

    // 使用service role key创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 测试数据库连接 - 执行简单的查询
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(0); // 不返回任何行，只测试连接

    if (error) {
      console.error('数据库连接错误:', error);
      return NextResponse.json({
        success: false,
        message: '数据库连接失败',
        error: error.message,
        details: error
      }, { status: 500 });
    }

    // 测试五行分析表
    const { data: fiveElementsData, error: fiveElementsError } = await supabase
      .from('five_elements_analysis')
      .select('count')
      .limit(0);

    const tests = {
      profiles_table: !error,
      five_elements_table: !fiveElementsError,
      five_elements_error: fiveElementsError?.message || null
    };
    
    return NextResponse.json({
        success: true,
        message: '数据库连接成功！',
        data: {
          supabaseUrl: supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          tests: tests
        }
      });
    
  } catch (error: any) {
    console.error('测试数据库连接时发生错误:', error);
    return NextResponse.json({
      success: false,
      message: '测试数据库连接时发生错误',
      error: error.message
    }, { status: 500 });
  }
}