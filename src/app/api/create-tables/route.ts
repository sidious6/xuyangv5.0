import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        message: '缺少必要的环境变量'
      }, { status: 500 });
    }

    // 使用服务角色密钥创建客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const results = [];
    
    // 尝试创建基本的consultations表（这是我们在代码中使用的主要表）
    try {
      // 先检查表是否已存在
      const { data: existingData, error: existingError } = await supabase
        .from('consultations')
        .select('*')
        .limit(0);
        
      if (!existingError) {
        results.push({
          table: 'consultations',
          action: 'check',
          success: true,
          message: '表已存在'
        });
      } else {
        // 表不存在，尝试通过插入操作来触发表创建（如果启用了自动表创建）
        results.push({
          table: 'consultations',
          action: 'check',
          success: false,
          message: '表不存在: ' + existingError.message
        });
      }
    } catch (err: any) {
      results.push({
        table: 'consultations',
        action: 'check',
        success: false,
        error: err.message
      });
    }
    
    // 检查其他重要表
    const tablesToCheck = [
      'profiles',
      'tongue_sessions', 
      'tongue_analyses',
      'consultation_messages',
      'daily_wellness_plans',
      'sleep_logs',
      'meal_logs', 
      'emotion_logs',
      'symptom_logs'
    ];
    
    const tableCheckResults = [];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
          
        tableCheckResults.push({
          table: tableName,
          exists: !error,
          error: error?.message || null
        });
      } catch (err: any) {
        tableCheckResults.push({
          table: tableName,
          exists: false,
          error: err.message
        });
      }
    }
    
    const existingTables = tableCheckResults.filter(r => r.exists).map(r => r.table);
    const missingTables = tableCheckResults.filter(r => !r.exists).map(r => r.table);
    
    return NextResponse.json({
      success: true,
      message: '数据库表状态检查完成',
      data: {
        existingTables,
        missingTables,
        tableCheckResults,
        summary: {
          totalTables: tablesToCheck.length,
          existingCount: existingTables.length,
          missingCount: missingTables.length,
          needsMigration: missingTables.length > 0
        },
        recommendation: missingTables.length > 0 
          ? '需要运行数据库迁移来创建缺失的表'
          : '所有表都已存在'
      }
    });
    
  } catch (error: any) {
    console.error('检查表状态错误:', error);
    return NextResponse.json({
      success: false,
      message: '检查表状态时发生错误',
      error: error.message
    }, { status: 500 });
  }
}