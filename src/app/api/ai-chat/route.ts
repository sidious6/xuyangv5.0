import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// 通用AI聊天API - 替代Dify
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, conversation_id, context } = body as {
      message: string;
      conversation_id?: string;
      context?: string;
    };

    // 检查开发模式配置
    const useMockResponses = process.env.NEXT_PUBLIC_MOCK_AI_RESPONSES === 'true';

    // 验证输入
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty' },
        { status: 400 }
      );
    }

    // 如果启用模拟响应，返回模拟数据
    if (useMockResponses) {
      return createMockAIResponse(message, context);
    }

    // 验证ARK API配置
    if (!process.env.ARK_API_KEY || !process.env.ARK_MODEL_ID) {
      return NextResponse.json(
        { error: 'ARK API not configured' },
        { status: 500 }
      );
    }

    // 初始化ARK API客户端
    const openai = new OpenAI({
      apiKey: process.env.ARK_API_KEY,
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    });

    // 根据上下文构建系统提示
    const systemPrompt = getSystemPrompt(context);

    // 调用ARK API
    const response = await openai.chat.completions.create({
      model: process.env.ARK_MODEL_ID!,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          
          // 添加结束标记
          const endData = {
            conversation_id: conversation_id || 'ai-conversation-' + Date.now(),
            message_id: 'ai-message-' + Date.now()
          };
          controller.enqueue(encoder.encode(`\n<<<END:${JSON.stringify(endData)}:END>>>`));
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
          return;
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error: any) {
    console.error('AI chat API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// 根据上下文获取系统提示
function getSystemPrompt(context?: string): string {
  const basePrompt = `你是小煦，一个专业的中医养生AI助手。你具备丰富的中医理论知识和现代养生科学知识，能够为用户提供个性化的健康建议。

请遵循以下原则：
1. 基于中医理论（如五行、阴阳、气血等）提供建议
2. 结合现代营养学和运动科学
3. 给出具体可行的建议，避免空泛的理论
4. 如果涉及疾病诊断，建议用户咨询专业医师
5. 保持温和、专业的语调`;

  if (context === 'shunshi') {
    return basePrompt + `

当前上下文：顺时养生
你正在为用户解答关于节气养生、五行体质调理相关的问题。请重点关注：
- 当前节气的养生要点
- 五行体质的特点和调理方法
- 饮食、运动、作息的具体建议
- 情志调养的方法`;
  }

  return basePrompt;
}

// 创建模拟AI响应
function createMockAIResponse(message: string, context?: string) {
  const mockResponses = [
    '根据中医理论，您提到的问题可能与体质有关。',
    '建议您注意饮食调理，多食用温性食物。',
    '从中医角度来看，这种情况通常需要调理气血。',
    '建议您保持规律作息，适当运动有助于改善体质。',
    '中医认为这可能是由于脾胃虚弱导致的，建议温补脾胃。'
  ];

  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  const contextText = context === 'shunshi' ? '结合当前节气特点，' : '';
  const fullResponse = `针对您的问题「${message}」，${contextText}${randomResponse}\n\n具体建议：\n1. 保持良好的作息习惯\n2. 注意饮食调理\n3. 适当进行运动\n4. 如症状持续，建议咨询专业中医师`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 模拟打字效果
        for (let i = 0; i < fullResponse.length; i++) {
          const char = fullResponse[i];
          controller.enqueue(encoder.encode(char));
          // 添加延迟以模拟真实的流式输出
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        // 添加结束标记
        const endData = {
          conversation_id: 'mock-conversation-' + Date.now(),
          message_id: 'mock-message-' + Date.now()
        };
        controller.enqueue(encoder.encode(`\n<<<END:${JSON.stringify(endData)}:END>>>`));
      } catch (error) {
        controller.error(error);
        return;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
