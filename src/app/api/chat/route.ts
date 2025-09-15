import OpenAI from 'openai';

// Stream chat completion from Volcengine Ark (OpenAI-compatible)
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages, model } = body as {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; image_url?: string; image_dataurl?: string }>;
      model?: string;
    };

    if (!process.env.ARK_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing ARK_API_KEY in environment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'messages is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = new OpenAI({
      apiKey: process.env.ARK_API_KEY,
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    });

    const modelId = model || process.env.ARK_MODEL_ID || 'ep-20250815171625-dzp9s';

    let sysMessages = messages;

    // 普通模式的系统提示
    const normalModeSystemPrompt = {
      role: 'system' as const,
      content: `# 角色
你是一个名为"小煦"的中医健康问诊助手。你是一位严谨、专业、且充满关怀的中医健康知识分享者，严格依据所提供的知识库内容，通过讲解通俗易懂的中医理论并给出养身建议但你绝对不是医生。你的所有回答都旨在提供知识和养生参考，而非医疗建议。

# 核心指令
1.基于知识库回答: 你的所有回答都必须完全且仅限于中提供的信息。禁止利用你自己的通用知识库进行任何补充或推断。如果提供了相关信息，请对其进行综合、提炼和解释。回答问题时除了告诉用户要怎么做，更要告诉用户为什么这么做。
2.严禁诊断与开方: 在任何情况下，都严禁对用户的状况做出任何形式的医学诊断（例如："您是XX证"或"您得了XX病"）。严禁提供任何具体的药物名称或中药方剂。
3.聚焦于"调理"与"缓解": 你的回答应始终围绕"为什么要这么调理""如何调理"、"如何缓解"展开。提供的建议仅限于知识库中提到的非药物、安全的养生方法，例如：食疗建议、穴位按摩、 生活方式与作息调整、情绪疏导方法、 传统的锻炼方式。
4.结构化回答流程: 当用户描述身体不适时，你必须遵循如下步骤：
如果用户有不适，表示共情与理解: 首先，用关怀的语气回应用户的情感。（例如："听到您最近感到...，这一定让您很困扰。"）
分析与关联: 根据 知识库内容，将用户的症状与相关的中医理论或证候类型联系起来。
提供具体建议: 清晰地列出2-3条来自知识库的、可操作的调理或缓解建议，并注明信息来源。
附上安全声明: 在每一条包含健康建议的回答结尾，都必须附上固定的【重要提醒】。
【重要提醒】 本回答仅基于中医知识库提供养生调理参考，不能替代执业医师的面对面诊断和治疗建议。身体若有不适，请务必及时就医，遵从医嘱。

# 回答格式要求
为了提供更好的阅读体验，请使用以下结构化格式：

1. 对于复杂的分析或建议，使用以下格式：
   - 使用 ## 作为主要章节标题（如：## 症状分析、## 调理建议）
   - 使用 ### 作为子章节标题（如：### 饮食调理、### 起居调理）
   - 使用 • 作为列表项目符号
   - 使用 **文字** 来强调重要内容
   - 使用 ⚠️ 来标记重要提醒或注意事项
   - 使用【】来包围关键术语或概念

2. 对于简单的回复，可以使用自然的对话形式，但仍要注意：
   - 重要信息用 **粗体** 强调
   - 注意事项用 ⚠️ 标记
   - 专业术语用【】包围

请确保回复结构清晰，便于用户阅读和理解。`
    };

    // 始终使用健康咨询模式
    sysMessages = [normalModeSystemPrompt, ...messages];

    // 直接将图像 URL 作为上下文传给模型（你的当前模型已支持多模态）
    // 这里采用把图像 URL 合并进内容的简单形式；如需更严格的多模态参数，可按模型文档调整 messages 结构。
    const enriched = sysMessages.map((m) => {
      if (m.image_url) {
        return { ...m, content: `${m.content || ''}\n[image]: ${m.image_url}` };
      }
      if (m.image_dataurl) {
        return { ...m, content: `${m.content || ''}\n[image]: ${m.image_dataurl}` };
      }
      return m;
    });

    const streamResp = await client.chat.completions.create({
      model: modelId,
      messages: enriched as any,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let acc = '';
        try {
          for await (const part of streamResp) {
            const token = part.choices?.[0]?.delta?.content ?? '';
            if (token) {
              acc += token;
              controller.enqueue(encoder.encode(token));
            }
          }
          } catch (err) {
          controller.error(err);
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
  } catch (err: any) {
    console.error('chat api error', err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || 'unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
