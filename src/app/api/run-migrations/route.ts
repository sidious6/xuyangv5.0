import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
    
    // 获取迁移文件路径
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    
    // 读取所有迁移文件
    const migrationFiles = [
      '001_tongue_analysis.sql',
      '002_consultations.sql', 
      '002_daily_records.sql',
      '003_add_constitution.sql'
    ];
    
    const results = [];
    
    for (const fileName of migrationFiles) {
      try {
        const filePath = path.join(migrationsDir, fileName);
        
        if (!fs.existsSync(filePath)) {
          results.push({
            file: fileName,
            success: false,
            error: '文件不存在'
          });
          continue;
        }
        
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // 分割SQL语句（按分号分割，但要小心函数定义中的分号）
        const statements = sqlContent
          .split(/;\s*(?=\n|$)/)
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        let statementResults = [];
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
              
              if (error) {
                // 如果RPC不存在，尝试直接执行
                console.log('RPC failed, trying direct execution:', error.message);
                statementResults.push({
                  statement: statement.substring(0, 100) + '...',
                  success: false,
                  error: error.message
                });
              } else {
                statementResults.push({
                  statement: statement.substring(0, 100) + '...',
                  success: true
                });
              }
            } catch (err: any) {
              statementResults.push({
                statement: statement.substring(0, 100) + '...',
                success: false,
                error: err.message
              });
            }
          }
        }
        
        results.push({
          file: fileName,
          success: statementResults.every(r => r.success),
          statementCount: statementResults.length,
          statementResults
        });
        
      } catch (err: any) {
        results.push({
          file: fileName,
          success: false,
          error: err.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      success: successCount > 0,
      message: `迁移执行完成: ${successCount}/${results.length} 个文件成功`,
      data: {
        results,
        totalFiles: results.length,
        successfulFiles: successCount
      }
    });
    
  } catch (error: any) {
    console.error('运行迁移错误:', error);
    return NextResponse.json({
      success: false,
      message: '运行迁移时发生错误',
      error: error.message
    }, { status: 500 });
  }
}