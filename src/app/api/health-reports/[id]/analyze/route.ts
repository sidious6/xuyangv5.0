import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Initialize OpenAI client
function getOpenAIClient() {
  const arkApiKey = process.env.ARK_API_KEY;
  const arkModelId = process.env.ARK_MODEL_ID || 'ep-20250815171625-dzp9s';

  if (!arkApiKey) {
    throw new Error('Missing ARK API key');
  }

  const client = new OpenAI({
    apiKey: arkApiKey,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  });

  return { client, modelId: arkModelId };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's token
    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await getSupabaseClient().auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the health report
    const { data: report, error: reportError } = await getSupabaseClient()
      .from('health_reports')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update status to processing
    await getSupabaseClient()
      .from('health_reports')
      .update({ status: 'processing' })
      .eq('id', params.id);

    // Read the file
    const filePath = path.join(process.cwd(), 'uploads', 'health-reports', path.basename(report.file_url));

    try {
      const fileBuffer = await fs.readFile(filePath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = report.file_type;

      // For images, use vision capabilities
      if (mimeType.startsWith('image/')) {
        const analysisPrompt = `请分析这张体检报告图片，提取以下信息：

1. 报告类型和基本信息
2. 各项检查指标的具体数值和单位
3. 参考范围
4. 异常指标标记
5. 医生建议或结论

请以JSON格式返回，包含以下字段：
{
  "report_type": "报告类型",
  "basic_info": "基本信息",
  "indicators": [
    {
      "name": "指标名称",
      "value": "数值",
      "unit": "单位",
      "reference_range": "参考范围",
      "status": "normal/high/low/critical",
      "category": "类别"
    }
  ],
  "abnormal_findings": "异常发现",
  "doctor_recommendations": "医生建议"
}`;

        try {
          const { client: visionClient, modelId: visionModelId } = getOpenAIClient();
          const response = await visionClient.chat.completions.create({
            model: visionModelId,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: analysisPrompt },
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                ]
              }
            ],
            max_tokens: 2000,
          });

          const analysisText = response.choices[0].message.content;

          // Try to parse JSON from the response
          let extractedData;
          try {
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              extractedData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (parseError) {
            console.error('Failed to parse analysis JSON:', parseError);
            extractedData = {
              raw_analysis: analysisText,
              indicators: [],
              abnormal_findings: '',
              doctor_recommendations: ''
            };
          }

          // Generate TCM interpretation
          const tcmPrompt = `基于以下西医体检报告数据，请用中医理论进行解读并提供调理建议：

用户基本信息：体质为${user.user_metadata?.constitution || '未知体质'}

体检报告数据：
${JSON.stringify(extractedData, null, 2)}

请提供：
1. 中医辨证分析：从中医角度分析这些指标异常可能反映的身体状况
2. 五行失衡分析：分析当前五行状态的失衡情况
3. 调理建议：提供具体的食疗、穴位按摩、生活方式调整等建议
4. 注意事项：需要特别关注的健康提醒

请以JSON格式返回：
{
  "tcm_diagnosis": "中医辨证分析",
  "five_elements_analysis": {
    "wood": "分析结果",
    "fire": "分析结果",
    "earth": "分析结果",
    "metal": "分析结果",
    "water": "分析结果"
  },
  "recommendations": [
    "具体建议1",
    "具体建议2"
  ],
  "precautions": "注意事项"
}`;

          const { client: tcmClient, modelId: tcmModelId } = getOpenAIClient();
          const tcmResponse = await tcmClient.chat.completions.create({
            model: tcmModelId,
            messages: [
              { role: 'user', content: tcmPrompt }
            ],
            max_tokens: 2000,
          });

          const tcmText = tcmResponse.choices[0].message.content;

          let tcmInterpretation;
          try {
            const jsonMatch = tcmText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              tcmInterpretation = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found in TCM response');
            }
          } catch (parseError) {
            console.error('Failed to parse TCM JSON:', parseError);
            tcmInterpretation = {
              tcm_diagnosis: tcmText,
              five_elements_analysis: {},
              recommendations: [],
              precautions: ''
            };
          }

          // Update the report with analysis results
          await getSupabaseClient()
            .from('health_reports')
            .update({
              status: 'completed',
              extracted_data: extractedData,
              ai_analysis: analysisText,
              tcm_interpretation: JSON.stringify(tcmInterpretation),
              recommendations: tcmInterpretation.recommendations
            })
            .eq('id', params.id);

          return NextResponse.json({
            ok: true,
            analysis: {
              extracted_data: extractedData,
              tcm_interpretation: tcmInterpretation,
              status: 'completed'
            }
          });

        } catch (aiError) {
          console.error('AI analysis error:', aiError);

          // Update status to failed
          await getSupabaseClient()
            .from('health_reports')
            .update({ status: 'failed' })
            .eq('id', params.id);

          return NextResponse.json({
            error: 'Failed to analyze report with AI',
            details: aiError instanceof Error ? aiError.message : 'Unknown error'
          }, { status: 500 });
        }

      } else {
        // For non-image files, provide a generic response
        return NextResponse.json({
          error: 'Currently only image files are supported for AI analysis'
        }, { status: 400 });
      }

    } catch (fileError) {
      console.error('File read error:', fileError);

      // Update status to failed
      await getSupabaseClient()
        .from('health_reports')
        .update({ status: 'failed' })
        .eq('id', params.id);

      return NextResponse.json({
        error: 'Failed to read report file'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}