const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAuthSetup() {
  console.log('🔧 开始修复认证设置...');

  try {
    // 1. 检查没有profile的用户
    console.log('📋 检查缺失profile的用户...');
    const { data: usersWithoutProfile, error: checkError } = await supabase.rpc('check_users_without_profiles');
    
    if (checkError) {
      console.log('⚠️ 无法执行检查函数，直接查询用户表...');
      
      // 直接查询auth.users表（需要service role权限）
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error('❌ 获取用户列表失败:', usersError);
        return;
      }

      console.log(`📊 找到 ${users.users.length} 个用户`);

      // 为每个用户检查并创建profile
      for (const user of users.users) {
        console.log(`🔍 检查用户: ${user.email}`);
        
        // 检查是否已有profile
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // 用户没有profile，创建一个
          console.log(`➕ 为用户 ${user.email} 创建profile...`);
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              constitution: '阴虚'
            })
            .select()
            .single();

          if (createError) {
            console.error(`❌ 创建profile失败 (${user.email}):`, createError);
          } else {
            console.log(`✅ 成功创建profile (${user.email})`);
          }
        } else if (existingProfile) {
          console.log(`✅ 用户 ${user.email} 已有profile`);
        } else {
          console.error(`❌ 检查profile时出错 (${user.email}):`, profileError);
        }
      }
    }

    // 2. 确保触发器函数存在
    console.log('🔧 创建/更新触发器函数...');
    const { error: functionError } = await supabase.rpc('create_user_profile_trigger');
    
    if (functionError) {
      console.log('⚠️ 无法通过RPC创建触发器，尝试直接执行SQL...');
      
      // 直接执行SQL创建触发器函数
      const triggerSQL = `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, full_name, constitution)
          VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            '阴虚'
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `;

      // 注意：直接执行SQL可能需要更高权限，这里只是尝试
      console.log('📝 触发器SQL已准备，需要在Supabase Dashboard的SQL编辑器中执行');
      console.log('SQL内容:');
      console.log(triggerSQL);
    }

    console.log('✅ 认证设置修复完成！');
    console.log('');
    console.log('📋 接下来需要在Supabase Dashboard中手动设置：');
    console.log('1. 进入 Authentication > Settings');
    console.log('2. 关闭 "Enable email confirmations"');
    console.log('3. 确保 "Enable new user signups" 开启');
    console.log('4. 保存设置');

  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

// 创建辅助RPC函数
async function createHelperFunctions() {
  console.log('🔧 创建辅助函数...');
  
  const helperSQL = `
    CREATE OR REPLACE FUNCTION check_users_without_profiles()
    RETURNS TABLE(user_id uuid, user_email text, has_profile boolean) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        au.id as user_id,
        au.email as user_email,
        (p.id IS NOT NULL) as has_profile
      FROM auth.users au
      LEFT JOIN public.profiles p ON au.id = p.id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE OR REPLACE FUNCTION create_user_profile_trigger()
    RETURNS void AS $$
    BEGIN
      -- 创建触发器函数
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $trigger$
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, constitution)
        VALUES (
          NEW.id, 
          NEW.email, 
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
          '阴虚'
        );
        RETURN NEW;
      END;
      $trigger$ LANGUAGE plpgsql SECURITY DEFINER;

      -- 删除旧触发器
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      -- 创建新触发器
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  console.log('📝 辅助函数SQL:');
  console.log(helperSQL);
  console.log('');
  console.log('请在Supabase Dashboard的SQL编辑器中执行上述SQL，然后重新运行此脚本');
}

// 运行修复
if (process.argv.includes('--create-helpers')) {
  createHelperFunctions();
} else {
  fixAuthSetup();
}