import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface SummaryData {
  sleep?: {
    duration?: string;
    feeling?: string;
    wakeup_times?: string;
  };
  emotions?: Array<{
    emoji: string;
    intensity: number;
    description?: string;
  }>;
  meals?: Array<{
    meal_type: string;
    feeling?: string;
    description?: string;
  }>;
  symptoms?: Array<{
    body_part: string;
    severity: number;
    description?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 });
    }

    // 验证认证
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authentication token' }, { status: 401 });
    }

    const summaryData = data as SummaryData;

    // 检查是否启用模拟响应
    const useMockResponses = process.env.NEXT_PUBLIC_MOCK_AI_RESPONSES === 'true';
    
    if (useMockResponses) {
      // 使用原有的模拟逻辑
      return generateMockResponse(summaryData);
    }

    // 使用真正的AI生成总结
    const aiResult = await generateAISummary(summaryData);

    return NextResponse.json({
      success: true,
      data: aiResult
    });

  } catch (error) {
    console.error('Error generating neiguan summary:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 使用真正的AI生成健康总结
async function generateAISummary(data: SummaryData) {
  // 验证ARK API配置
  if (!process.env.ARK_API_KEY || !process.env.ARK_MODEL_ID) {
    console.error('ARK API not configured, falling back to mock response');
    return generateMockResponseData(data);
  }

  // 初始化ARK API客户端
  const openai = new OpenAI({
    apiKey: process.env.ARK_API_KEY,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  });

  // 构建用户数据描述
  const userDataDescription = buildUserDataDescription(data);

  // 构建AI提示词
  const prompt = `
你是一名专业的中医养生专家和健康顾问。请基于用户的今日健康记录，生成一份个性化的健康总结。

用户今日记录：
${userDataDescription}

请严格按照以下JSON格式返回结果，不要添加任何其他文字：

{
  "status": "用一句话简洁总结用户今日的整体状态，包含睡眠、饮食、情绪、身体等关键信息",
  "summary": "基于中医养生理论，深入分析用户的健康状态，解释各项记录之间的关联性，给出专业而温暖的评价。约100-150字。",
  "suggestions": [
    "针对性建议1：基于具体记录给出可操作的养生建议",
    "针对性建议2：结合中医理论提供调理方法"
  ],
  "generatedAt": "${new Date().toISOString()}"
}

要求：
1. 语言温和专业，体现中医养生智慧
2. 建议具体可操作，避免空泛的建议
3. 分析要有逻辑性，体现各项记录之间的关联
4. 保持积极正面的态度，给用户信心和动力
5. 建议数量控制在1-3条之间
`;

  try {
    console.log('🚀 开始调用ARK API生成健康总结...');
    
    const response = await Promise.race([
      openai.chat.completions.create({
        model: process.env.ARK_MODEL_ID!,
        messages: [
          {
            role: 'system',
            content: '你是一名专业的中医养生专家，擅长分析用户的健康记录并提供个性化的养生建议。请严格按照JSON格式返回结果，不要添加解释文本。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI调用超时')), 30000)
      ),
    ]);

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('AI响应为空');
    }

    // 尝试解析JSON响应
    try {
      const parsedResponse = JSON.parse(aiResponse);
      console.log('✅ AI生成健康总结成功');
      return parsedResponse;
    } catch (parseError) {
      console.error('JSON解析失败，AI响应:', aiResponse);
      throw new Error('AI响应格式不正确');
    }

  } catch (error) {
    console.error('❌ AI生成健康总结失败:', error);
    // 如果AI调用失败，使用备用的模拟响应
    const mockResponse = generateMockResponseData(data);
    return mockResponse;
  }
}

// 构建用户数据描述
function buildUserDataDescription(data: SummaryData): string {
  const descriptions = [];

  // 睡眠记录
  if (data.sleep) {
    const sleepDesc = `睡眠记录：时长${data.sleep.duration || '未记录'}，感受${data.sleep.feeling || '未记录'}${data.sleep.wakeup_times ? `，夜间醒来${data.sleep.wakeup_times}` : ''}`;
    descriptions.push(sleepDesc);
  }

  // 情绪记录
  if (data.emotions && data.emotions.length > 0) {
    const emotionDescs = data.emotions.map(e => 
      `${e.emoji} 强度${e.intensity}/10${e.description ? ` (${e.description})` : ''}`
    );
    descriptions.push(`情绪记录：${emotionDescs.join('，')}`);
  }

  // 饮食记录
  if (data.meals && data.meals.length > 0) {
    const mealDescs = data.meals.map(m => 
      `${m.meal_type}${m.feeling ? ` 感受${m.feeling}` : ''}${m.description ? ` (${m.description})` : ''}`
    );
    descriptions.push(`饮食记录：${mealDescs.join('，')}`);
  }

  // 症状记录
  if (data.symptoms && data.symptoms.length > 0) {
    const symptomDescs = data.symptoms.map(s => 
      `${s.body_part} 严重程度${s.severity}/10${s.description ? ` (${s.description})` : ''}`
    );
    descriptions.push(`身体症状：${symptomDescs.join('，')}`);
  }

  return descriptions.join('\n') || '今日暂无详细记录';
}

// 生成模拟响应数据（只返回数据，不包装NextResponse）
function generateMockResponseData(summaryData: SummaryData) {
  // 构建用户状态总结
  const statusParts = [];

  if (summaryData.sleep) {
    const sleepQuality = summaryData.sleep.feeling === '精力充沛' || summaryData.sleep.feeling === '神清气爽' ? '良好' : '一般';
    const sleepDuration = summaryData.sleep.duration;
    statusParts.push(`睡眠质量${sleepQuality}${sleepDuration ? '，时长' + sleepDuration : ''}`);
  }

  if (summaryData.meals && summaryData.meals.length > 0) {
    const mealCount = summaryData.meals.length;
    const averageFeeling = summaryData.meals.reduce((acc, meal) => {
      if (meal.feeling === '很满足' || meal.feeling === '刚刚好') return acc + 1;
      return acc;
    }, 0) / mealCount;

    const dietStatus = averageFeeling > 0.5 ? '合理' : '待改善';
    statusParts.push(`饮食${dietStatus}，已记录${mealCount}餐`);
  }

  if (summaryData.emotions && summaryData.emotions.length > 0) {
    const avgIntensity = summaryData.emotions.reduce((acc, emotion) => acc + emotion.intensity, 0) / summaryData.emotions.length;
    const emotionStatus = avgIntensity > 7 ? '强烈' : avgIntensity < 4 ? '平静' : '中等';
    const lastEmotion = summaryData.emotions[summaryData.emotions.length - 1];
    statusParts.push(`情绪${emotionStatus}${lastEmotion.emoji}`);
  }

  if (summaryData.symptoms && summaryData.symptoms.length > 0) {
    const avgSeverity = summaryData.symptoms.reduce((acc, symptom) => acc + symptom.severity, 0) / summaryData.symptoms.length;
    const symptomStatus = avgSeverity > 6 ? '需要关注' : '轻微';
    statusParts.push(`身体${symptomStatus}不适，${summaryData.symptoms.length}处症状`);
  }

  const userSummary = statusParts.length > 0 ? statusParts.join('；') : '各项指标正常';

  // 生成个性化养生建议
  const suggestions = generateMockSuggestions(summaryData);

  // 生成总结
  const aiSummary = generateMockAISummary(userSummary, suggestions);

  return {
    summary: aiSummary,
    status: userSummary,
    suggestions: suggestions,
    generatedAt: new Date().toISOString()
  };
}

// 模拟响应函数（保持原有逻辑作为备用）
function generateMockResponse(summaryData: SummaryData) {
  const mockData = generateMockResponseData(summaryData);
  return NextResponse.json({
    success: true,
    data: mockData
  });
}

function generateMockSuggestions(data: SummaryData): string[] {
  const suggestions = [];

  // 基于睡眠的建议
  if (data.sleep) {
    if (data.sleep.duration?.includes('小于6h')) {
      suggestions.push('建议增加睡眠时间，保证每天7-8小时充足睡眠');
    }
    if (data.sleep.feeling === '昏昏沉沉' || data.sleep.feeling === '略感疲惫') {
      suggestions.push('可以尝试睡前冥想或听轻音乐来改善睡眠质量');
    }
    if (data.sleep.wakeup_times && data.sleep.wakeup_times !== '无') {
      suggestions.push('夜间易醒可能与情绪或消化有关，建议晚餐宜清淡');
    }
  }

  // 基于情绪的建议
  if (data.emotions && data.emotions.length > 0) {
    const negativeEmotions = data.emotions.filter(e => e.emoji === '😔' || e.emoji === '😤' || e.emoji === '🤯');
    if (negativeEmotions.length > 0) {
      suggestions.push('情绪波动较大，建议适当运动或与朋友聊天来缓解压力');
    }
    const highIntensity = data.emotions.filter(e => e.intensity > 7);
    if (highIntensity.length > 0) {
      suggestions.push('情绪强度较高，可以尝试深呼吸或正念练习');
    }
  }

  // 基于饮食的建议
  if (data.meals && data.meals.length > 0) {
    const overEating = data.meals.filter(m => m.feeling === '有点撑');
    if (overEating.length > 0) {
      suggestions.push('饮食过量可能影响消化和睡眠，建议七分饱即可');
    }
    const underEating = data.meals.filter(m => m.feeling === '还想吃');
    if (underEating.length > 0) {
      suggestions.push('饮食不足可能导致营养不均衡，建议合理搭配三餐');
    }
  }

  // 基于症状的建议
  if (data.symptoms && data.symptoms.length > 0) {
    const severeSymptoms = data.symptoms.filter(s => s.severity > 6);
    if (severeSymptoms.length > 0) {
      suggestions.push('身体不适症状较明显，建议适当休息，如持续不改善请及时就医');
    }

    const headSymptoms = data.symptoms.filter(s => s.body_part === '头部');
    if (headSymptoms.length > 0) {
      suggestions.push('头部不适可能与睡眠不足或压力过大有关，建议保证充足睡眠');
    }

    const abdominalSymptoms = data.symptoms.filter(s => s.body_part === '腹部');
    if (abdominalSymptoms.length > 0) {
      suggestions.push('腹部不适可能与饮食有关，建议饮食清淡，避免辛辣刺激食物');
    }
  }

  // 默认建议
  if (suggestions.length === 0) {
    suggestions.push('各项指标良好，继续保持健康的生活方式');
  }

  return suggestions.slice(0, 3); // 返回最多3条建议
}

function generateMockAISummary(userStatus: string, suggestions: string[]): string {
  const templates = [
    `根据您的今日记录分析，${userStatus}。${suggestions.join('；')}。建议您保持规律作息，注意情绪调节，让身心得到充分休息。`,
    `您的健康状态${userStatus.includes('良好') ? '整体良好' : '需要适当关注'}。${suggestions[0] || '继续保持当前的健康习惯'}。记住，身体和心灵的平衡是健康的基础。`,
    `从您的记录来看，${userStatus}。${suggestions.length > 1 ? suggestions.slice(0, 2).join('，') : suggestions[0] || '请继续关注身体信号'}。养生之道贵在坚持，从小事做起。`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}