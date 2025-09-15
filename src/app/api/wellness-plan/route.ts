import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// 获取本地日期字符串（YYYY-MM-DD格式）
function getLocalDateString(date?: Date): string {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 获取节气信息的简单函数
function getCurrentSolarTerm(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // 简化的节气判断，实际应该使用更精确的算法
  if (month === 8) {
    if (day < 8) return '立秋';
    if (day < 23) return '处暑';
    return '白露';
  }
  // 可以扩展更多节气
  return '处暑'; // 默认返回处暑
}

// 获取天气信息（模拟，实际应该调用天气API）
async function getWeatherInfo(location?: string) {
  // 这里应该调用真实的天气API
  // 暂时返回模拟数据
  return {
    temperature: 28,
    condition: '晴',
    humidity: 65,
    location: location || '上海'
  };
}

// 检查开发模式配置
const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
const useMockResponses = process.env.NEXT_PUBLIC_MOCK_AI_RESPONSES === 'true';

// 检查可用的API
const hasArkAPI = !!(process.env.ARK_API_KEY && process.env.ARK_MODEL_ID);

// 初始化ARK API客户端（如果可用）
let openai: OpenAI | null = null;
if (hasArkAPI) {
  openai = new OpenAI({
    apiKey: process.env.ARK_API_KEY,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  });
}

// 生成模拟养生建议
function generateMockWellnessAdvice(params: {
  constitution: string;
  location: string;
  weather: any;
  solarTerm: string;
}) {
  const { constitution, location, weather, solarTerm } = params;
  
  return {
    title: "温养调理",
    subtitle: `${new Date().toLocaleDateString()} ${location} ${weather.condition} ${weather.temperature}°C`,
    description: `针对${constitution}体质，结合${solarTerm}节气特点的养生建议`,
    sections: [
      {
        title: "节气特点",
        content: `${solarTerm}时节，天气${weather.condition}，温度${weather.temperature}°C。此时应注意调养身体，顺应自然规律。`
      },
      {
        title: "养生要点",
        items: [
          { category: "饮食", advice: "温补脾胃，多食温性食物，避免生冷" },
          { category: "起居", advice: "早睡早起，保持规律作息，适当午休" },
          { category: "运动", advice: "适度运动，如散步、太极，避免剧烈运动" }
        ]
      },
      {
        title: "今日建议",
        timeSlots: [
          { time: "辰时(7-9点)", advice: "温水洗漱，进食温热早餐，可饮温开水" },
          { time: "午时(11-13点)", advice: "适量午餐，餐后稍作休息，避免过饱" },
          { time: "酉时(17-19点)", advice: "清淡晚餐，饭后散步，准备入睡" }
        ]
      }
    ],
    generatedBy: 'mock',
    generatedAt: new Date().toISOString()
  };
}



// 生成养生建议的函数
async function generateWellnessAdvice(params: {
  constitution: string;
  location: string;
  weather: any;
  solarTerm: string;
}) {
  const { constitution, location, weather, solarTerm } = params;

  // 如果启用模拟响应，直接返回模拟数据
  if (useMockResponses) {
    console.log('🔧 Using mock wellness advice');
    return generateMockWellnessAdvice(params);
  }

  // 使用ARK API
  if (!hasArkAPI || !openai) {
    throw new Error('ARK API not available');
  }

  const prompt = `作为一名专业的中医养生专家，请根据以下信息为用户生成今日的个性化养生建议：

用户信息：
- 体质：${constitution}
- 所在地：${location}
- 当前节气：${solarTerm}
- 天气：${weather.condition}，温度${weather.temperature}°C，湿度${weather.humidity}%

请生成包含以下内容的养生建议，格式为JSON：
{
  "title": "四字今日养生主题",
  "subtitle": "日期 地点 天气图标",
  "description": "针对体质和天气的简要说明",
  "sections": [
    {
      "title": "节气特点",
      "content": "当前节气的特点和养生要点"
    },
    {
      "title": "养生要点",
      "items": [
        { "category": "两字建议", "advice": "具体建议" },
        { "category": "两字建议", "advice": "具体建议" },
        { "category": "两字建议", "advice": "具体建议" }
      ]
    },
    {
      "title": "今日建议",
      "timeSlots": [
        { "time": "辰时(7-9点)", "advice": "具体建议" },
        { "time": "午时(11-13点)", "advice": "具体建议" },
        { "time": "酉时(17-19点)", "advice": "具体建议" }
      ]
    }
  ]
}

要求：
1. 针对${constitution}体质的特点给出专业建议
2. 结合${solarTerm}节气的养生要点
3. 考虑当前天气条件
4. 语言温和专业，适合移动端阅读
5. 建议具体可操作`;

  try {
    const modelId = process.env.ARK_MODEL_ID;

    if (!modelId) {
      throw new Error('ARK_MODEL_ID is not configured');
    }

    console.log('🔧 Calling ARK API with model:', modelId);
    console.log('🔧 API Key exists:', !!process.env.ARK_API_KEY);
    console.log('🔧 API Key (first 10 chars):', process.env.ARK_API_KEY?.substring(0, 10));
    console.log('🔧 Base URL:', 'https://ark.cn-beijing.volces.com/api/v3');
    console.log('🔧 Prompt length:', prompt.length);

    console.log('🚀 开始调用OpenAI API...');

    const TIMEOUT_MS = 60000; // 增加超时时间以提高成功率
    const MAX_TOKENS = 800;   // 控制生成长度，避免过长导致超时

    let response: any;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const maxTokensThisTry = attempt === 1 ? MAX_TOKENS : Math.floor(MAX_TOKENS / 2);
        console.log(`Attempt ${attempt} with max_tokens=${maxTokensThisTry}`);

        response = await Promise.race([
          openai.chat.completions.create({
            model: modelId,
            messages: [
              {
                role: 'system',
                content:
                  '你是一名专业的中医养生专家，擅长根据个人体质、节气和天气条件提供个性化的养生建议。请只返回JSON，不要附加解释文本。',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: maxTokensThisTry,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('API调用超时')), TIMEOUT_MS)
          ),
        ]);

        console.log('✅ OpenAI API调用成功');
        break; // 成功则跳出重试循环
      } catch (err) {
        console.error(`Attempt ${attempt} failed:`, err);
        if (attempt === 2) throw err; // 最后一次失败则抛出
        // 简单退避后重试
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    console.log('🔧 Response choices length:', response.choices?.length);

    const content = response.choices[0]?.message?.content;
    console.log('🔧 Generated content length:', content?.length);
    console.log('🔧 Generated content preview:', content?.substring(0, 200));

    if (!content) {
      throw new Error('No content generated');
    }

    // 尝试解析JSON，如果失败则返回默认结构
    try {
      console.log('🔧 尝试解析JSON...');
      const parsed = JSON.parse(content);
      console.log('✅ JSON解析成功');
      return parsed;
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.error('❌ Raw content that failed to parse:', content);
      // 返回默认结构
      return {
        title: "解析失败",
        subtitle: `${new Date().toLocaleDateString()} ${location} ${weather.condition}`,
        description: `时处${solarTerm}，${constitution}体质宜调养身心。`,
        sections: [
          {
            title: "节气特点",
            content: `${solarTerm}时节，{一句话建议}。`
          },
          {
            title: "养生要点",
            items: [
              { category: "{两字建议}", advice: "{说明}" },
              { category: "{两字建议}", advice: "{说明}" },
              { category: "{两字建议}", advice: "{说明}" }
            ]
          },
          {
            title: "今日建议",
            timeSlots: [
              { time: "辰时(7-9点)", advice: "{建议}" },
              { time: "午时(11-13点)", advice: "{建议}" },
              { time: "酉时(17-19点)", advice: "{建议}" }
            ]
          }
        ]
      };
    }
  } catch (error) {
    console.error('Error generating wellness advice:', error);

    // 检查具体的错误类型
    if (error instanceof Error) {
      if (error.message.includes('API调用超时')) {
        console.error('API timeout occurred');
      } else if (error.message.includes('401')) {
        console.error('API authentication failed - check API key');
      } else if (error.message.includes('404')) {
        console.error('API endpoint not found - check model ID');
      } else {
        console.error('Other API error:', error.message);
      }
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/wellness-plan - Starting request');
    const { userId, date, location } = await request.json();
    console.log('Request data:', { userId, date, location });

    // 验证必需的环境变量
    console.log('Checking environment variables...');
    console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('ARK_API_KEY exists:', !!process.env.ARK_API_KEY);

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

    const targetDate = date || getLocalDateString();
    console.log('Target date:', targetDate);

    // 检查是否已有今日的养生计划
    console.log('Checking existing plan...');
    const { data: existingPlan, error: planError } = await supabase
      .from('daily_wellness_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .maybeSingle();
    console.log('Existing plan result:', { data: existingPlan, error: planError });

    // 如果已有计划且是 AI 生成的，直接返回；如果是 fallback，则继续尝试重新生成并覆盖
    if (existingPlan && existingPlan.content?.generatedBy === 'ai') {
      console.log('AI plan already exists, returning existing plan');
      return NextResponse.json({
        success: true,
        data: existingPlan,
        message: 'Plan already exists'
      });
    } else if (existingPlan) {
      console.log('Fallback plan exists, will attempt to regenerate and overwrite');
    }

    // 获取用户档案（包含体质信息）
    console.log('Getting user profile...');
    let { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    console.log('User profile result:', { data: userProfile, error: profileError });
    
    // 如果用户档案不存在，自动创建一个
    if (!userProfile && profileError?.code === 'PGRST116') {
      console.log('User profile not found, creating new profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          constitution: '阴虚'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create user profile:', createError);
      } else {
        console.log('Created new user profile:', newProfile);
        userProfile = newProfile;
      }
    }
    
    let constitution = '阴虚'; // 默认体质
    if (userProfile) {
      constitution = userProfile.constitution || '阴虚';
      console.log('User constitution:', constitution);
    } else {
      console.log('User profile not found, using default constitution:', constitution);
    }
    const solarTerm = getCurrentSolarTerm();
    const weather = await getWeatherInfo(location);

    // 生成养生建议
    console.log('Generating wellness advice with params:', {
      constitution,
      location: weather.location,
      weather,
      solarTerm
    });
    
    let wellnessContent;
    try {
      console.log('🚀 开始调用AI生成养生建议...');
      wellnessContent = await generateWellnessAdvice({
        constitution,
        location: weather.location,
        weather,
        solarTerm
      });
      console.log('✅ AI生成成功 - Generated wellness content:', JSON.stringify(wellnessContent, null, 2));
    } catch (adviceError: any) {
      console.error('❌ AI生成失败 - Error generating wellness advice:', adviceError);
      console.error('❌ Error stack:', adviceError?.stack);
      try { console.error('❌ Error details:', JSON.stringify(adviceError, null, 2)); } catch {}
      // 如果AI生成失败，使用默认内容
      wellnessContent = {
        title: "🔧 默认内容（AI生成失败）",
        subtitle: `${new Date().toLocaleDateString()} ${weather.location} ${weather.condition} [默认模式]`,
        description: `⚠️ AI服务暂时不可用，以下为默认养生建议。时处${solarTerm}，${constitution}体质宜调养身心。`,
        sections: [
          {
            title: "节气特点",
            content: `${solarTerm}时节，天地阳气渐收，人体应顺应自然，调养身心。[默认内容]`
          },
          {
            title: "养生要点", 
            items: [
              { category: "润燥", advice: "多食梨、百合、银耳等滋阴润燥之品 [默认建议]" },
              { category: "养肺", advice: "早睡早起，深呼吸，练习八段锦 [默认建议]" },
              { category: "调神", advice: "保持心境平和，避免悲秋情绪 [默认建议]" }
            ]
          },
          {
            title: "今日建议",
            timeSlots: [
              { time: "辰时(7-9点)", advice: "温粥养胃，可食百合粥 [默认建议]" },
              { time: "午时(11-13点)", advice: "小憩片刻，养心安神 [默认建议]" },
              { time: "酉时(17-19点)", advice: "适量运动，散步或太极 [默认建议]" }
            ]
          }
        ]
      };
    }

    // 保存到数据库
    const planData = {
      date: targetDate,
      constitution,
      location: weather.location,
      weather,
      solar_term: solarTerm,
      content: {
        ...wellnessContent,
        generatedBy: wellnessContent.title.includes('默认内容') ? 'fallback' : 'ai' // 添加生成方式标识
      }
    };

    console.log('Attempting to save wellness plan with data:', planData);
    const { data: savedPlan, error: saveError } = await supabase
      .from('daily_wellness_plans')
      .upsert({
        user_id: userId,
        ...planData,
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();
    console.log('Save result:', { data: savedPlan, error: saveError });
    
    if (saveError) {
      console.error('Failed to save wellness plan:', saveError);
      console.error('Error details:', JSON.stringify(saveError, null, 2));
      return NextResponse.json({ 
        error: 'Failed to save wellness plan',
        details: saveError
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: savedPlan,
      message: 'Wellness plan generated successfully'
    });

  } catch (error) {
    console.error('Error in wellness plan API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date') || getLocalDateString();

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

    const { data, error } = await supabase
      .from('daily_wellness_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();
    
    if (error) {
      return NextResponse.json({ error: 'Failed to get wellness plan' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data 
    });

  } catch (error) {
    console.error('Error getting wellness plan:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
