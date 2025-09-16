'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Camera, Mic, MicOff, Stethoscope, Loader2, MessageSquare, Upload, History } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/supabase';
import TypewriterText from '@/components/TypewriterText';
import WeChatThinkingAnimation from '@/components/WeChatThinkingAnimation';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  isNewMessage?: boolean; // 标记是否为新消息，用于控制流式输出
  imageUrl?: string; // 添加图片URL字段
}

export default function ConsultationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'chat' | 'diagnosis'>('chat');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isEnteringDiagnosis, setIsEnteringDiagnosis] = useState(false);
  const [inlineQuickReplyFor, setInlineQuickReplyFor] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // 问诊模式相关状?
  const [currentStep, setCurrentStep] = useState<'tongue' | 'questions' | 'analysis'>('tongue');
  const [questionCount, setQuestionCount] = useState(0); // 当前问题数量
  const [diagnosisData, setDiagnosisData] = useState<{
    tongueImage?: string;
    answers: Array<{ question: string; answer: string; timestamp: Date }>;
  }>({ answers: [] }); // 存储问诊过程中的所有数?
  const [isGeneratingFinalAnalysis, setIsGeneratingFinalAnalysis] = useState(false);
  const [autoSendQuestion, setAutoSendQuestion] = useState<string | null>(null);

  const systemPrompt = `你是小煦，一名温和专业的中医 AI 助手，请用中文交流。

在回答时，请使用以下结构化的格式来组织你的回复，让内容更清晰易读：

1. 对于复杂的分析或建议，使用以下格式：
   - 使用 ## 作为主要章节标题
   - 使用 ### 作为子章节标题
   - 使用 • 作为列表项目符号
   - 使用 **文字** 来强调重要内容
   - 使用 ⚠️ 来标记重要提醒或注意事项
   - 使用【】来包围关键术语或概念

2. 对于简单的回复，可以使用自然的对话形式，但仍要注意：
   - 重要信息用 **粗体** 强调
   - 注意事项用 ⚠️ 标记
   - 专业术语用【】包围

请确保回复结构清晰，便于用户阅读和理解。`;

  // 格式化AI消息内容
  const formatAIMessage = (content: string) => {
    // 将结构化的markdown格式转换为美观的HTML格式
    let formatted = content
      // 处理二级标题 (##)
      .replace(/^## (.+)$/gm, '<div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 px-4 py-3 mt-6 mb-4 rounded-r-lg"><h2 class="text-lg font-bold text-blue-800 flex items-center"><span class="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>$1</h2></div>')
      // 处理三级标题 (###)
      .replace(/^### (.+)$/gm, '<div class="mt-4 mb-3"><h3 class="text-base font-semibold text-gray-700 flex items-center border-b border-gray-200 pb-2"><span class="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>$1</h3></div>')
      // 处理警告标记 (⚠️)
      .replace(/^⚠️ (.+)$/gm, '<div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3 mb-3 flex items-start"><span class="text-amber-500 mr-2 mt-0.5">⚠️</span><span class="text-amber-800 font-medium flex-1">$1</span></div>')
      // 处理列表项（• 开头的行）
      .replace(/^• (.+)$/gm, '<div class="ml-6 mb-2 flex items-start group"><span class="text-blue-500 mr-3 mt-1.5 group-hover:text-blue-600 transition-colors">•</span><span class="flex-1 text-gray-700 leading-relaxed">$1</span></div>')
      // 处理粗体文字（**文字**）
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-gray-800 font-semibold">$1</strong>')
      // 处理重要提醒（【】包围的内容）
      .replace(/【([^】]+)】/g, '<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-sm font-medium border border-orange-200">$1</span>')
      // 处理引用内容（来源：...）
      .replace(/（来源：([^）]+)）/g, '<span class="text-gray-500 text-xs italic ml-1 opacity-75">(来源：$1)</span>')
      // 处理空行（连续的换行符）
      .replace(/\n\s*\n/g, '<div class="h-3"></div>')
      // 处理单个换行
      .replace(/\n/g, '<br>');

    return formatted;
  };
  const [latestQuickReplies, setLatestQuickReplies] = useState<Record<string, string[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasProcessedUrlParams = useRef(false);
  const [healthRecords, setHealthRecords] = useState<any>(null);
  const hasProcessedHealthRecords = useRef(false);

  // Hydration-safe time rendering
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // 初始化或恢复会话
  const initializeSession = useCallback(async () => {
    if (!user) return;

    setIsLoadingSession(true);

    try {
      console.log('开始创?获取会话...');

      // 首先尝试获取活跃会话
      console.log('正在获取活跃会话...');
      const { data: activeSession, error: sessionError } = await db.getActiveSession(user.id);
      console.log('活跃会话查询结果:', { activeSession, sessionError });

      let sessionId = activeSession?.id;

      // 如果没有活跃会话，创建新会话
      if (!sessionId) {
        console.log('没有活跃会话，正在创建新会话...');
        const { data: newSession, error: createError } = await db.createChatSession(user.id, mode);
        console.log('新会话创建结?', { newSession, createError });

        if (createError) {
          console.error('Failed to create session:', createError);
          setIsLoadingSession(false);
          return;
        }
        sessionId = newSession.id;
      }

      console.log('会话ID确定:', sessionId);
      setCurrentSessionId(sessionId);

      // 加载会话的历史消?
      const { data: historyMessages, error: messagesError } = await db.getSessionMessages(sessionId);

      if (messagesError) {
        console.error('Failed to load messages:', messagesError);
        return;
      }

      // 转换数据库消息格式为前端格式
      const formattedMessages: Message[] = historyMessages?.map(msg => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        imageUrl: msg.metadata?.imageUrl,
      })) || [];

      // 如果没有历史消息，添加欢迎消?
      if (formattedMessages.length === 0) {
        const welcomeMessage: Message = {
          id: 'welcome',
          type: 'ai',
          content: '你好呀～我是小煦，你的中医健康问诊助手😊很高兴见到你！\n\n如果你有任何关于身体调理、养生保健的困惑都可以告诉我。我会结合中医理论帮你分析可能的原因，并分享一些温和、安全的调理方法。当然，如果你只是想了解一些中医小知识，我也很乐意和你聊聊～\n',
          timestamp: new Date(),
          isNewMessage: true
        };

        // 保存欢迎消息到数据库
        await db.saveMessage(sessionId, user.id, 'assistant', welcomeMessage.content);
        formattedMessages.push(welcomeMessage);
      }

      setMessages(formattedMessages);



      // 如果有健康记录数据且未处理过，自动发?
      if (healthRecords && !hasProcessedHealthRecords.current) {
        console.log('检测到健康记录，准备自动发?..');
        hasProcessedHealthRecords.current = true;

        // 格式化记录数据为可读文本
        const formatRecordData = (records: any) => {
          let summary = '以下是我今日的健康记录：\n\n';

          // 睡眠记录
          if (records.sleep) {
            summary += '🌙 **睡眠记录**\n';
            if (records.sleep.duration) summary += `- 睡眠时长?{records.sleep.duration}\n`;
            if (records.sleep.feeling) summary += `- 醒来感觉?{records.sleep.feeling}\n`;
            if (records.sleep.wakeup_times) summary += `- 惊醒次数?{records.sleep.wakeup_times}\n`;
            summary += '\n';
          }

          // 情绪记录
          if (records.emotions && records.emotions.length > 0) {
            summary += '❤️ **情绪记录**\n';
            records.emotions.forEach((emotion: any) => {
              summary += `- ${emotion.emoji} 强度?{emotion.intensity}/10`;
              if (emotion.description) summary += ` (${emotion.description})`;
              summary += '\n';
            });
            summary += '\n';
          }

          // 饮食记录
          if (records.meals && records.meals.length > 0) {
            summary += '🍽?**饮食记录**\n';
            records.meals.forEach((meal: any) => {
              const mealType = meal.meal_type === 'breakfast' ? '早餐' :
                meal.meal_type === 'lunch' ? '午餐' :
                  meal.meal_type === 'dinner' ? '晚餐' : '加餐';
              summary += `- ${mealType}`;
              if (meal.feeling) summary += ` 感受?{meal.feeling}`;
              if (meal.description) summary += ` (${meal.description})`;
              summary += '\n';
            });
            summary += '\n';
          }

          // 症状记录
          if (records.symptoms && records.symptoms.length > 0) {
            summary += '🩺 **症状记录**\n';
            records.symptoms.forEach((symptom: any) => {
              summary += `- ${symptom.body_part} 严重程度?{symptom.severity}/10`;
              if (symptom.description) summary += ` (${symptom.description})`;
              summary += '\n';
            });
            summary += '\n';
          }

          summary += '请根据以上记录，为我提供中医角度的健康分析和调理建议。';
          return summary;
        };

        const formattedContent = formatRecordData(healthRecords);
        console.log('格式化的内容:', formattedContent);

        // 直接调用addMessage和AI请求，绕过sendText的状态依?
        const sendHealthRecords = async () => {
          console.log('正在发送健康记录到AI...', { sessionId });

          // 添加用户消息
          const userMessage: Message = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            type: 'user',
            content: formattedContent,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, userMessage]);

          // 保存用户消息到数据库
          if (user) {
            try {
              console.log('保存用户消息到数据库:', { sessionId, userId: user.id });
              await db.saveMessage(sessionId, user.id, 'user', formattedContent);
              console.log('用户消息保存成功');
            } catch (error) {
              console.error('保存用户消息失败:', error);
            }
          }

          // 添加AI正在输入的消?
          const typingMessage: Message = {
            id: `typing-${Date.now()}`,
            type: 'ai',
            content: '',
            timestamp: new Date(),
            isTyping: true,
          };
          setMessages(prev => [...prev, typingMessage]);

          // 发送到AI
          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [
                  ...formattedMessages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })),
                  { role: 'user', content: formattedContent }
                ],
                contextType: 'default',
              }),
            });

            if (!response.ok || !response.body) throw new Error('network');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let acc = '';

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              acc += chunk;

              // 更新AI消息内容
              setMessages(prev => prev.map(msg =>
                msg.isTyping ? { ...msg, content: acc } : msg
              ));
            }

            // 移除typing状态，添加最终AI消息
            setMessages(prev => prev.filter(msg => !msg.isTyping));

            const aiMessage: Message = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: 'ai',
              content: acc || '抱歉，我现在有点忙，请稍后再试～',
              timestamp: new Date(),
              isNewMessage: true
            };

            setMessages(prev => [...prev, aiMessage]);

            // 保存AI消息到数据库
            if (user) {
              try {
                console.log('保存AI消息到数据库:', { sessionId, userId: user.id });
                await db.saveMessage(sessionId, user.id, 'assistant', aiMessage.content);
                console.log('AI消息保存成功');
              } catch (error) {
                console.error('保存AI消息失败:', error);
              }
            }

          } catch (error) {
            console.error('AI请求失败:', error);
            setMessages(prev => prev.filter(msg => !msg.isTyping));
            setMessages(prev => [...prev, {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              type: 'ai',
              content: '网络出错了，请稍后再试～',
              timestamp: new Date(),
              isNewMessage: true
            }]);
          }
        };

        // 延迟一下确保状态更新完?
        setTimeout(sendHealthRecords, 100);
      }

    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      setIsLoadingSession(false);
    }
  }, [user, mode, healthRecords]);

  // 认证检查和会话初始化
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user && !currentSessionId) {
      initializeSession();
    }
  }, [user, loading, currentSessionId]);

  // 滚动到底部函?
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 滚动到底?
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // 处理从首页传递过来的记录数据
  useEffect(() => {
    if (hasProcessedUrlParams.current || typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlMode = urlParams.get('mode');
    const data = urlParams.get('data');
    const question = urlParams.get('question');
    const context = urlParams.get('context');

    console.log('URL参数检查', { urlMode, data: data ? 'exists' : 'missing', question, context });
    console.log('完整URL:', window.location.href);
    console.log('URL参数字符串', window.location.search);

    // 处理问题参数
    if (question) {
      hasProcessedUrlParams.current = true;
      setMode('chat');
      const decodedQuestion = decodeURIComponent(question);
      setInputText(decodedQuestion);
      
      // 如果有上下文信息，可以在这里处理
      if (context === 'shunshi') {
        console.log('来自顺时页面的问题:', decodedQuestion);
      }
      
      // 清理URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // 设置自动发送的问题
      setAutoSendQuestion(decodedQuestion);
      
      return;
    }

    if (urlMode === 'summary' && data) {
      try {
        console.log('原始data参数:', data);
        const recordData = JSON.parse(data);
        console.log('解析的记录数?', recordData);
        console.log('记录数据详细内容:', {
          sleep: recordData.sleep,
          emotions: recordData.emotions,
          meals: recordData.meals,
          symptoms: recordData.symptoms,
          date: recordData.date
        });
        hasProcessedUrlParams.current = true;

        // 确保mode设置为chat模式以便正确处理AI总结
        setMode('chat');

        // 设置健康记录数据，让会话初始化时处理
        setHealthRecords(recordData);
        console.log('设置健康记录数据:', recordData);

      } catch (error) {
        console.error('解析记录数据失败:', error);
      }
    }
  }, []); // 只在组件挂载时执行一次

  // 处理自动发送问题
  useEffect(() => {
    if (autoSendQuestion && !isLoadingSession && currentSessionId && mode === 'chat') {
      console.log('自动发送问题:', autoSendQuestion);
      // 延迟一下确保所有状态都已更新
      setTimeout(() => {
        sendText(autoSendQuestion);
        setAutoSendQuestion(null); // 清除自动发送状态
      }, 500);
    }
  }, [autoSendQuestion, isLoadingSession, currentSessionId, mode]);

  // 创建舌诊会话
  const createSession = async () => {
    if (!user) {
      // 为未登录用户创建临时会话ID
      const tempSessionId = 'temp-session-' + Date.now();
      setCurrentSessionId(tempSessionId);
      return tempSessionId;
    }
    const { data, error } = await db.createTongueSession(user.id);
    if (error) {
      console.error('Failed to create session:', error);
      return null;
    }
    setCurrentSessionId(data.id);
    return data.id;
  };

  // 新建会话
  const startNewSession = useCallback(async () => {
    try {
      // 将当前会话标记为完成（仅在用户登录时?
      if (currentSessionId && user) {
        await db.updateSessionStatus(currentSessionId, 'completed');
      }

      let newSession: any;
      if (user) {
        // 为登录用户创建新会话
        const { data: sessionData, error } = await db.createChatSession(user.id, mode);
        if (error) {
          console.error('Failed to create new session:', error);
          return;
        }
        newSession = sessionData;
        setCurrentSessionId(newSession.id);
      } else {
        // 为未登录用户创建临时会话ID
        const tempSessionId = 'temp-session-' + Date.now();
        setCurrentSessionId(tempSessionId);
      }

      // 清空当前消息并添加欢迎消息
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: '你好呀～我是小煦，你的中医健康问诊助手😊\n\n很高兴见到你！如果你有任何关于身体调理、养生保健的困惑，比如睡眠不好、容易疲劳、胃口差之类的问题，都可以告诉我。我会用中医的知识，帮你分析可能的原因，并分享一些温和、安全的调理方法。当然，如果你只是想了解一些中医小知识，我也很乐意和你聊聊～\n',
        timestamp: new Date(),
        isNewMessage: true
      };

      setMessages([welcomeMessage]);

      // 保存欢迎消息到数据库（仅在用户登录时?
      if (user && newSession) {
        await db.saveMessage(newSession.id, user.id, 'assistant', welcomeMessage.content);
      }

    } catch (error) {
      console.error('Failed to start new session:', error);
    }
  }, [user, currentSessionId, mode]);

  // Helper functions
  function formatTime(d: Date) {
    try {
      return new Date(d).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  }

  // Strip any embedded quick-reply markers from text
  function stripQrMarkers(input: string): string {
    if (!input) return input;
    let buf = input;
    let out = '';
    while (true) {
      const start = buf.indexOf('<<<QR:');
      if (start === -1) { out += buf; break; }
      const end = buf.indexOf(':QR>>>', start);
      if (end === -1) { out += buf.slice(0, start); break; }
      out += buf.slice(0, start);
      buf = buf.slice(end + 6);
    }
    return out;
  }





  const addMessage = async (content: string, type: 'user' | 'ai', imageUrl?: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      imageUrl,
      isNewMessage: type === 'ai' // 只有AI消息才标记为新消息
    };

    // 立即更新UI
    setMessages(prev => [...prev, newMessage]);

    // 保存到数据库
    if (currentSessionId && user) {
      try {
        console.log('保存消息到数据库:', { currentSessionId, userId: user.id, type, content: content.substring(0, 100) + '...' });
        const metadata = imageUrl ? { imageUrl } : undefined;
        await db.saveMessage(
          currentSessionId,
          user.id,
          type === 'user' ? 'user' : 'assistant',
          content,
          imageUrl ? 'image' : 'text',
          metadata
        );
        console.log('消息保存成功');
      } catch (error) {
        console.error('Failed to save message:', error);
      }
    } else {
      console.warn('无法保存消息 - 缺少会话ID或用户信?', { currentSessionId, user: !!user });
    }

    return newMessage.id;
  };

  const addTypingMessage = () => {
    const typingMessage: Message = {
      id: `typing-${Date.now()}`, // 使用唯一ID避免key冲突
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);
  };

  const removeTypingMessage = () => {
    setMessages(prev => prev.filter(msg => !msg.isTyping));
  };

  const stopStreaming = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsStreaming(false);
    removeTypingMessage();
  };

  // Helpers
  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadToSupabase(file: File): Promise<{ publicUrl: string; path: string }> {
    console.log('开始上传文?', file.name, file.size, file.type);

    // 检查用户登录状?
    if (!user?.id) {
      console.log('用户未登录，无法上传到Supabase存储');
      throw new Error('请先登录后再上传图片');
    }

    // 使用用户ID作为文件夹路?
    const userId = user.id;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/tongue/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    console.log('上传路径:', path);

    // 获取签名上传URL
    console.log('获取签名上传URL...');
    const { data, error } = await storage.getSignedUploadUrl(path, file.type || 'image/jpeg');
    if (error) {
      console.error('获取签名URL失败:', error);
      throw new Error(`获取签名URL失败: ${error.message}`);
    }
    if (!data) {
      console.error('签名URL数据为空');
      throw new Error('获取签名URL失败: 返回数据为空');
    }
    console.log('签名URL获取成功:', data.signedUrl);

    // 上传文件
    console.log('开始上传文件到Supabase...');
    const putResp = await fetch(data.signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'content-type': file.type || 'image/jpeg' }
    });

    if (!putResp.ok) {
      const errorText = await putResp.text();
      console.error('文件上传失败:', putResp.status, putResp.statusText, errorText);
      throw new Error(`文件上传失败: ${putResp.status} ${putResp.statusText}`);
    }
    console.log('文件上传成功');

    // 获取公共URL
    const publicUrl = storage.getPublicUrl(path);
    console.log('获取公共URL:', publicUrl);
    return { publicUrl, path };
  }

  // Unified send function so quick replies also go through the model
  const sendText = useCallback(async (text: string, opts?: { echoUser?: boolean }) => {
    if (!text.trim() || isStreaming) return;
    const echoUser = opts?.echoUser ?? true;
    // 在聊天模式下回显用户消息；诊疗模式由下方逻辑统一添加
    if (echoUser && mode === 'chat') addMessage(text, 'user');
    setInputText('');

    // 仅在需要流式对话时开?streaming ?AbortController（chat ?dify 模式?

    if (mode === 'chat') {
      setIsStreaming(true);
      const controller = new AbortController();
      setAbortController(controller);
      addTypingMessage();
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }))
            .concat([{ role: 'user', content: text }]),
          contextType: 'default',
        }),
        signal: controller.signal,
      })
        .then(async res => {
          if (!res.ok || !res.body) throw new Error('network');
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let acc = '';
          let qrBuf = '';
          let qrForThisMessage: string[] | null = null;
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // detect and strip QR markers safely, avoiding duplicate text
            qrBuf += chunk;
            while (true) {
              const markerStart = qrBuf.indexOf('<<<QR:');
              if (markerStart === -1) {
                // no marker -> flush all
                acc += qrBuf;
                qrBuf = '';
                break;
              }
              const end = qrBuf.indexOf(':QR>>>', markerStart);
              if (end === -1) {
                // incomplete marker -> flush before and keep remainder
                acc += qrBuf.slice(0, markerStart);
                qrBuf = qrBuf.slice(markerStart);
                break;
              }
              // complete marker
              acc += qrBuf.slice(0, markerStart);
              const payload = qrBuf.slice(markerStart + 6, end);
              try {
                const data = JSON.parse(payload);
                if (data && Array.isArray(data.quick_replies)) qrForThisMessage = data.quick_replies;
              } catch { }
              // cut processed part and continue loop (may have multiple markers)
              qrBuf = qrBuf.slice(end + 6);
            }
            setMessages(prev => prev.map(msg => msg.isTyping ? { ...msg, content: acc } : msg));
          }
          removeTypingMessage();
          const clean = stripQrMarkers(acc);
          const id = await addMessage(clean || '抱歉，我现在有点忙，请稍后再试～', 'ai');
          if (qrForThisMessage) {
            setLatestQuickReplies(prev => ({ ...prev, [id]: qrForThisMessage }));
          }
          setInlineQuickReplyFor(id);
        })
        .catch((err) => {
          if (err.name === 'AbortError') {
            addMessage('已停止回复。', 'ai');
          } else {
            removeTypingMessage();
            addMessage('网络出错了，请稍后再试～', 'ai');
          }
        })
        .finally(() => {
          setIsStreaming(false);
          setAbortController(null);
        });
      return;
    }



    // diagnosis mode - 收集问答数据，不立即回复
    if (mode === 'diagnosis') {
      // 防止重复提交
      if (isStreaming) return;

      // 先添加用户消?
      await addMessage(text, 'user');

      // 如果是问题阶段且还没达到10个问?
      if (currentStep === 'questions' && questionCount < 10) {
        // 保存用户回答
        const lastAiMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];
        const question = lastAiMessage?.content || '问题';

        setDiagnosisData(prev => ({
          ...prev,
          answers: [...prev.answers, {
            question,
            answer: text,
            timestamp: new Date()
          }]
        }));

        setQuestionCount(prev => prev + 1);

        // 如果达到10个问题，开始最终分?
        if (questionCount + 1 >= 10) {
          setCurrentStep('analysis');
          generateFinalAnalysis();
          return;
        }

        // 否则继续问下一个问?
        const nextQuestionIndex = questionCount + 1;
        if (nextQuestionIndex < 10) {
          setTimeout(async () => {
            const currentQuestion = tenQuestions[nextQuestionIndex];
            const questionText = `问题${nextQuestionIndex + 1}?{currentQuestion.question}`;

            // 直接显示问题，不调用AI
            const id = await addMessage(questionText, 'ai');

            // 设置快速回复选项
            setLatestQuickReplies(prev => ({
              ...prev,
              [id]: currentQuestion.options
            }));
            setInlineQuickReplyFor(id);
          }, 3000);
        }
        return;
      }

      // 如果是舌诊阶段，提示用户先上传舌诊图?
      if (currentStep === 'tongue') {
        await addMessage('请先上传舌诊图片，然后我们开始问诊。您可以点击上方的"拍摄"按钮。', 'ai');
        return;
      }
    }

    // 普通聊天模式的处理保持不变
    addTypingMessage();
    setIsStreaming(true);
    const controller = new AbortController();
    setAbortController(controller);

    const diagMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: text },
      { role: 'system', content: `当前为问诊模式，步骤${currentStep}。请继续提出下一条问诊问题，或在足够信息时生成结论。请话术温和、简洁，适合移动端短段落。必要时给出3个简短可选项（不需要加"快速回复"四个字）。` },
    ];
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: diagMessages, contextType: 'diagnosis' }),
      signal: controller.signal,
    })
      .then(async res => {
        if (!res.ok || !res.body) throw new Error('network');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = '';
        let qrBuf = '';
        let qrForThisMessage: string[] | null = null;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // detect and strip QR markers safely, avoiding duplicate text
          qrBuf += chunk;
          while (true) {
            const markerStart = qrBuf.indexOf('<<<QR:');
            if (markerStart === -1) {
              acc += qrBuf;
              qrBuf = '';
              break;
            }
            const end = qrBuf.indexOf(':QR>>>', markerStart);
            if (end === -1) {
              acc += qrBuf.slice(0, markerStart);
              qrBuf = qrBuf.slice(markerStart);
              break;
            }
            acc += qrBuf.slice(0, markerStart);
            const payload = qrBuf.slice(markerStart + 6, end);
            try {
              const data = JSON.parse(payload);
              if (data && Array.isArray(data.quick_replies)) qrForThisMessage = data.quick_replies;
            } catch { }
            qrBuf = qrBuf.slice(end + 6);
          }
          setMessages(prev => prev.map(msg => msg.isTyping ? { ...msg, content: acc } : msg));
        }
        removeTypingMessage();
        const clean = stripQrMarkers(acc);
        const id = await addMessage(clean || '我们稍后再继续～', 'ai');
        if (qrForThisMessage) {
          setLatestQuickReplies(prev => ({ ...prev, [id]: qrForThisMessage }));
        }
        setInlineQuickReplyFor(id);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          addMessage('已修复的字符串', 'ai');
        } else {
          removeTypingMessage();
          addMessage('网络出错了，请稍后再试～', 'ai');
        }
      })
      .finally(() => {
        setIsStreaming(false);
        setAbortController(null);
      });
  }, [messages, mode, currentStep, isStreaming, questionCount]);

  // 十问歌的固定问题
  const tenQuestions = [
    {
      question: "您平时怕冷还是怕热？",
      options: ["怕冷", "怕热", "不怕冷热"]
    },
    {
      question: "您容易出汗吗？什么时候出汗？",
      options: ["容易出汗", "不易出汗", "夜间盗汗"]
    },
    {
      question: "您有头痛、头晕或身体疼痛吗？",
      options: ["经常头痛", "偶尔头晕", "身体疼痛", "都没有"]
    },
    {
      question: "您的大小便情况如何？",
      options: ["大便干燥", "大便稀溏", "小便频繁", "都正常"]
    },
    {
      question: "您的食欲和饮食偏好如何？",
      options: ["食欲很好", "食欲不振", "喜欢热食", "喜欢冷食"]
    },
    {
      question: "您有胸闷、腹胀等不适吗？",
      options: ["经常胸闷", "腹部胀满", "都没有"]
    },
    {
      question: "您的听力和耳朵有什么问题吗？",
      options: ["听力正常", "耳鸣", "听力下降"]
    },
    {
      question: "您平时口渴吗？喜欢喝什么？",
      options: ["经常口渴", "不怎么渴", "喜欢热水", "喜欢冷水"]
    },
    {
      question: "您有什么慢性疾病或既往病史吗？",
      options: ["有慢性病", "偶尔生病", "身体健康"]
    },
    {
      question: "您的睡眠质量如何？",
      options: ["睡眠很好", "入睡困难", "容易醒", "多梦"]
    }
  ];

  // 生成下一个问?
  const generateNextQuestion = useCallback(async () => {
    if (isStreaming || questionCount >= 10) return;

    const currentQuestion = tenQuestions[questionCount];
    const questionText = `问题${questionCount + 1}?{currentQuestion.question}`;

    // 直接显示问题，不调用AI
    const id = await addMessage(questionText, 'ai');

    // 设置快速回复选项
    setLatestQuickReplies(prev => ({
      ...prev,
      [id]: currentQuestion.options
    }));
    setInlineQuickReplyFor(id);

  }, [questionCount, isStreaming, addMessage, setLatestQuickReplies, setInlineQuickReplyFor]);



  // 生成最终分?
  const generateFinalAnalysis = useCallback(async () => {
    if (isGeneratingFinalAnalysis) return;

    setIsGeneratingFinalAnalysis(true);
    addTypingMessage();

    try {
      // 构建完整的问诊数?
      const fullContext = diagnosisData.answers.map(qa =>
        `问：${qa.question}\n答：${qa.answer}`
      ).join('\n\n');

      const tongueInfo = diagnosisData.tongueImage ?
        `已提供舌诊图片：${diagnosisData.tongueImage}` :
        '未提供舌诊图片';

      const analysisPrompt = `作为专业的中医AI助手，请基于以下完整的问诊信息，给出综合的体质分析和健康建议：

舌诊信息：${tongueInfo}

问诊记录?
${fullContext}

请提供：
1. 体质类型判断（如气虚质、阳虚质、阴虚质等）
2. 主要健康问题分析
3. 生活调理建议（饮食、作息、运动等?
4. 注意事项

要求?
- 基于中医理论，结合现代养生理?
- 语言温和亲切，易于理?
- 建议具体可行
- 适合手机阅读的段落格式`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: analysisPrompt },
            { role: 'user', content: '请给出完整的体质分析报告' }
          ],
          contextType: 'diagnosis'
        }),
      });

      if (!response.ok || !response.body) throw new Error('network');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        setMessages(prev => prev.map(msg => msg.isTyping ? { ...msg, content: acc } : msg));
      }

      removeTypingMessage();
      const clean = stripQrMarkers(acc);
      const analysisResult = clean || '分析完成，感谢您的配合！';
      await addMessage(analysisResult, 'ai');

      // 保存问诊记录到数据库（仅在用户登录时?
      if (user) {
        const consultationRecord = {
          userId: user.id,
          timestamp: new Date().toISOString(),
          tongueImage: diagnosisData.tongueImage,
          questions: diagnosisData.answers,
          analysis: analysisResult,
          sessionId: currentSessionId
        };

        try {
          // 获取用户token
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            console.error('No valid session');
          } else {
            const response = await fetch('/api/consultations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify(consultationRecord)
            });

            if (response.ok) {
              console.log('问诊记录保存成功');
            } else {
              const errorData = await response.text();
              console.error('问诊记录保存失败:', response.status, errorData);
              console.error('发送的数据:', consultationRecord);
            }
          }
        } catch (error) {
          console.error('保存问诊记录时出?', error);
          console.error('发送的数据:', consultationRecord);
        }
      } else {
        console.log('未登录用户，跳过问诊记录保存');
      }

      // 添加退出问诊模式的提示
      setTimeout(async () => {
        await addMessage('已修复的字符串', 'ai');
      }, 1000);

      // 重置问诊状态并退出问诊模?
      setCurrentStep('tongue');
      setQuestionCount(0);
      setDiagnosisData({ answers: [] });
      setMode('chat'); // 退出问诊模式，回到聊天模式

    } catch (err) {
      removeTypingMessage();
      addMessage('分析过程中出现错误，请稍后重试～', 'ai');
    } finally {
      setIsGeneratingFinalAnalysis(false);
    }
  }, [diagnosisData, isGeneratingFinalAnalysis, addTypingMessage, removeTypingMessage, addMessage, stripQrMarkers]);



  const handleSendMessage = async () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      await sendText(inputText);
    }
  };

  // 处理历史情况总结
  const handleHistorySummary = async () => {
    if (!user) return;

    try {
      // 获取最近7天的日期
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      console.log('获取最近7天记录:', dates);

      // 获取用户token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // 并行获取所有日期的记录
      const recordPromises = dates.map(async (date) => {
        try {
          const response = await fetch(`/api/records/daily-summary?date=${date}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (response.ok) {
            const result = await response.json();
            return { date, data: result.data };
          }
          return { date, data: null };
        } catch (error) {
          console.error(`获取${date}记录失败:`, error);
          return { date, data: null };
        }
      });

      const weeklyRecords = await Promise.all(recordPromises);
      console.log('一周记录数据:', weeklyRecords);

      // 获取用户体质信息
      let constitutionInfo = '';
      try {
        const constitutionResponse = await fetch('/api/constitution-test', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        if (constitutionResponse.ok) {
          const constitutionResult = await constitutionResponse.json();
          if (constitutionResult.results && constitutionResult.results.length > 0) {
            const latestResult = constitutionResult.results[0];
            constitutionInfo = `用户体质类型：${latestResult.constitution_type}，得分：${latestResult.score}分`;
          }
        }
      } catch (error) {
        console.error('获取体质信息失败:', error);
      }

      // 构建总结内容
      let summaryContent = '请根据以下用户最近一周的健康记录和体质信息，进行综合分析和建议：\n\n';
      
      if (constitutionInfo) {
        summaryContent += `【体质信息】\n${constitutionInfo}\n\n`;
      }

      summaryContent += '【最近一周健康记录】\n';
      weeklyRecords.forEach(({ date, data }) => {
        if (data) {
          summaryContent += `\n${date}：\n`;
          if (data.sleep) {
            summaryContent += `睡眠：${data.sleep.bedtime || '未记录'} - ${data.sleep.wake_time || '未记录'}，质量：${data.sleep.quality || '未记录'}\n`;
          }
          if (data.meals && data.meals.length > 0) {
            summaryContent += `饮食：${data.meals.map(m => `${m.meal_type}: ${m.description}`).join('，')}\n`;
          }
          if (data.emotions && data.emotions.length > 0) {
            summaryContent += `情绪：${data.emotions.map(e => `${e.emotion_type}(${e.intensity})`).join('，')}\n`;
          }
          if (data.symptoms && data.symptoms.length > 0) {
            summaryContent += `症状：${data.symptoms.map(s => `${s.symptom_type}: ${s.description}`).join('，')}\n`;
          }
        } else {
          summaryContent += `\n${date}：无记录\n`;
        }
      });

      summaryContent += '\n\n请基于以上信息进行综合健康分析。请严格按照以下格式输出，使用清晰的标题和分点说明：\n\n' +
      '## 整体健康状态评估\n' +
      '[在这里进行整体评估]\n\n' +
      '## 发现的问题和风险\n' +
      '### 主要问题\n' +
      '• [问题1描述]\n' +
      '• [问题2描述]\n\n' +
      '### 潜在风险\n' +
      '• [风险1描述]\n' +
      '• [风险2描述]\n\n' +
      '## 针对性调理建议\n' +
      '### 饮食调理\n' +
      '• [具体建议1]\n' +
      '• [具体建议2]\n\n' +
      '### 起居调理\n' +
      '• [具体建议1]\n' +
      '• [具体建议2]\n\n' +
      '### 情志调理\n' +
      '• [具体建议1]\n' +
      '• [具体建议2]\n\n' +
      '## 生活方式改善建议\n' +
      '### 运动锻炼\n' +
      '• [具体建议]\n\n' +
      '### 作息调整\n' +
      '• [具体建议]\n\n' +
      '### 注意事项\n' +
      '⚠️ [重要提醒内容]\n\n' +
      '请严格按照以上格式输出，确保结构清晰，便于阅读。';

      console.log('发送给AI的总结内容:', summaryContent);

      // 在前端显示简洁的用户消息
      addMessage('帮我总结一下近期的状况', 'user');
      
      // 发送完整的数据给AI进行分析（不显示在前端）
      await sendText(summaryContent, { echoUser: false });

    } catch (error) {
      console.error('历史情况总结失败:', error);
      await sendText('抱歉，获取历史记录时出现错误，请稍后再试。');
    }
  };

  const handleTonguePhoto = () => {
    // 直接打开文件选择器，让用户选择图片
    fileInputRef.current?.click();
  };



  // Refs and handlers for photo and long-press voice


  const handlePhotoClick = () => {
    // 统一打开系统相机/相册，由 onChange 决定后续行为
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    // 检查用户登录状?- 为未登录用户提供本地预览
    if (!user?.id) {
      // 为未登录用户提供本地图片预览功能
      const localImageUrl = await readFileAsDataUrl(file);

      if (mode === 'diagnosis' && currentStep === 'tongue') {
        // 本地回显上传提示，并显示图片
        addMessage('我已上传舌诊照片（本地预览）', 'user', localImageUrl);

        // 提示用户登录以获得完整功?
        await addMessage('已修复的字符串', 'ai');

        // 保存本地图片并进入问题阶?
        setDiagnosisData(prev => ({
          ...prev,
          tongueImage: localImageUrl
        }));
        setCurrentStep('questions');

        // 开始第一个问?
        setTimeout(() => {
          generateNextQuestion();
        }, 3000);

        return;
      } else {
        // 聊天模式下的本地图片预览
        addMessage('我已上传图片（本地预览）', 'user', localImageUrl);
        addMessage('已修复的字符串', 'ai');
        return;
      }
    }

    // 上传?Supabase，得到真实的可访?URL
    let uploadResult: { publicUrl: string; path: string } | null = null;
    try {
      uploadResult = await uploadToSupabase(file);
    } catch (e: any) {
      console.error('图片上传失败:', e);
      const errorMessage = e?.message || '未知错误';
      addMessage(`上传失败: ${errorMessage}，请重试~`, 'ai');
      return;
    }

    if (mode === 'diagnosis' && currentStep === 'tongue') {
      // 本地回显上传提示，并显示图片
      addMessage('我已上传舌诊照片', 'user', uploadResult.publicUrl);

      // 直接回复收到图片，不调用AI分析
      await addMessage('已修复的字符串', 'ai');

      // 保存舌诊图片并进入问题阶?
      setDiagnosisData(prev => ({
        ...prev,
        tongueImage: uploadResult.publicUrl
      }));
      setCurrentStep('questions');

      // 开始第一个问?
      setTimeout(() => {
        generateNextQuestion();
      }, 3000);

      return; // 直接返回，不执行后面的fetch逻辑
    } else if (false) { // 注释掉原来的逻辑
      // 本地回显上传提示，并显示图片
      addMessage('我已上传舌诊照片', 'user', uploadResult.publicUrl);
      // 发送“多模态”消息：文本 + 图片
      setIsStreaming(true);
      const controller = new AbortController();
      setAbortController(controller);
      addTypingMessage();

      const diagMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })),
        // 发送包含图片的用户消息（真实URL）
        { role: 'user', content: '已上传舌诊照片', image_url: uploadResult.publicUrl },
        { role: 'system', content: `当前为问诊模式，步骤：tongue。请先基于图片进行舌诊观察（若无法解析，则提示用户重拍），再继续提出下一条问诊问题，并可附带不超过3个quick_replies。` },
      ];

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: diagMessages, contextType: 'diagnosis' }),
        signal: controller.signal,
      })
        .then(async res => {
          if (!res.ok || !res.body) throw new Error('network');
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let acc = '';
          let qrBuf = '';
          let qrForThisMessage: string[] | null = null;
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // 复用已修复的 QR 剥离逻辑
            qrBuf += chunk;
            while (true) {
              const s = qrBuf.indexOf('<<<QR:');
              if (s === -1) { acc += qrBuf; qrBuf = ''; break; }
              const eidx = qrBuf.indexOf(':QR>>>', s);
              if (eidx === -1) { acc += qrBuf.slice(0, s); qrBuf = qrBuf.slice(s); break; }
              acc += qrBuf.slice(0, s);
              const payload = qrBuf.slice(s + 6, eidx);
              try {
                const data = JSON.parse(payload);
                if (data && Array.isArray(data.quick_replies)) qrForThisMessage = data.quick_replies;
              } catch { }
              qrBuf = qrBuf.slice(eidx + 6);
            }
            setMessages(prev => prev.map(msg => msg.isTyping ? { ...msg, content: acc } : msg));
          }
          removeTypingMessage();
          const clean = stripQrMarkers(acc);
          const id = await addMessage(clean || '我们稍后再继续～', 'ai');
          if (qrForThisMessage) setLatestQuickReplies(prev => ({ ...prev, [id]: qrForThisMessage }));
          setInlineQuickReplyFor(id);
        })
        .catch((err) => {
          if (err.name === 'AbortError') addMessage('已修复的字符串', 'ai');
          else { removeTypingMessage(); addMessage('网络出错了，请稍后再试～', 'ai'); }
        })
        .finally(() => {
          setIsStreaming(false);
          setAbortController(null);
          // 保存舌诊图片并进入问题阶?
          setDiagnosisData(prev => ({
            ...prev,
            tongueImage: uploadResult.publicUrl
          }));
          setCurrentStep('questions');
          // 开始第一个问?
          setTimeout(() => {
            generateNextQuestion();
          }, 1000);
        });
    } else {
      // 普通聊天模式：显示图片并提?
      addMessage('我已选择照片', 'user', uploadResult.publicUrl);
      addTypingMessage();
      setTimeout(() => {
        removeTypingMessage();
        addMessage('已修复的字符串', 'ai');
      }, 800);
    }

    // 清空 input 以便下次选择同一张也能触?onChange
    e.target.value = '';
  };

  const handleMicPressStart = () => {
    setIsRecording(true);
  };

  const handleMicPressEnd = () => {
    if (!isRecording) return;
    setIsRecording(false);
    addMessage('【语音】（已录入）', 'user');
    if (mode === 'chat') {
      addTypingMessage();
      setTimeout(() => {
        removeTypingMessage();
        addMessage('已收到你的语音消息～', 'ai');
      }, 800);
    }
  };

  // 如果正在加载，显示加载状?
  if (loading || isLoadingSession) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">
            {loading ? '加载?..' : isLoadingSession ? '正在恢复对话...' : '加载?..'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm h-screen bg-gray-50 relative flex flex-col overflow-hidden">
        {/* Fixed Status Bar */}
        <div className="flex-shrink-0 bg-white px-4 py-1 flex items-center justify-between text-sm font-medium">
          <div className="text-gray-900">9:41</div>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
            </div>
            <svg className="w-6 h-3 ml-1" viewBox="0 0 24 12" fill="none">
              <rect x="1" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1" />
              <rect x="2" y="3" width="18" height="6" rx="1" fill="currentColor" />
              <rect x="21" y="4" width="2" height="4" rx="1" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Fixed Header */}
        <header className="flex-shrink-0 bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link href="/">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">小</span>
                </div>
                <div>
                  <h1 className="text-lg font-medium text-gray-900">
                    {mode === 'diagnosis' ? '小煦AI问诊' : '小煦聊天'}
                  </h1>
                  <p className="text-xs text-green-500">在线</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {/* 测试思考动画按钮 */}
              <button
                onClick={() => {
                  addTypingMessage();
                  setTimeout(() => {
                    removeTypingMessage();
                    addMessage('这是测试消息，用来展示思考动画效果！', 'ai');
                  }, 3000);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="测试思考动画"
              >
                🤔
              </button>
              
              {/* 新建会话按钮 */}
              <button
                onClick={startNewSession}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="新建会话"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>

          {mode === 'diagnosis' && (
            <>
              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: currentStep === 'tongue' ? '9%' :
                        currentStep === 'questions' ? `${9 + (questionCount / 10) * 82}%` :
                          '100%'
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {currentStep === 'tongue' ? '舌诊' :
                    currentStep === 'questions' ? `问诊 ${questionCount}/10` :
                      '分析'}
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                {currentStep === 'tongue' ? '望诊阶段' : currentStep === 'questions' ? '问诊阶段' : '分析阶段'}
              </p>
            </>
          )}
        </header>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-4 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                    }`}
                >
                  {message.isTyping ? (
                    <WeChatThinkingAnimation className="text-sm leading-relaxed" />
                  ) : (
                    <div>
                      {message.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={message.imageUrl}
                            alt="上传的图片"
                            className="max-w-full h-auto rounded-lg border border-gray-200"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      )}
                      {message.type === 'ai' && message.isNewMessage ? (
                        <div className="text-sm leading-relaxed">
                          <TypewriterText
                            text={message.content}
                            speed={50}
                            className="whitespace-pre-line"
                            onComplete={() => {
                              // 打字完成后，将isNewMessage设为false，触发重新渲染以应用格式化
                              setTimeout(() => {
                                setMessages(prev => prev.map(msg => 
                                  msg.id === message.id ? { ...msg, isNewMessage: false } : msg
                                ));
                              }, 100);
                            }}
                          />
                        </div>
                      ) : message.type === 'ai' ? (
                        <div 
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatAIMessage(message.content) }}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                      )}
                    </div>
                  )}
                  {!message.isTyping && (
                    <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {isMounted ? formatTime(message.timestamp) : ''}
                    </p>
                  )}
                </div>

                {/* Inline quick replies below the latest AI question (dynamic) */}
                {mode === 'diagnosis' && currentStep === 'questions' && inlineQuickReplyFor === message.id && message.type === 'ai' && !message.isTyping && (
                  <div className="flex justify-start">
                    <div className="w-full">
                      <div className="mt-2">
                        <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap overflow-visible">
                          {latestQuickReplies[message.id]?.map((opt, idx) => (
                            <button
                              key={`${message.id}-${idx}`}
                              onClick={() => {
                                if (!isStreaming) {
                                  sendText(opt);
                                }
                              }}
                              disabled={isStreaming}
                              className={`shrink-0 px-2 py-1 rounded-full text-xs border ${isStreaming
                                ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ))}

            {/* 舌诊指导 */}
            {mode === 'diagnosis' && currentStep === 'tongue' && (
              <div className="sticky top-0 z-10 px-4 py-2 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                  <div className="text-sm text-blue-800">请拍摄一张清晰的舌头照片</div>
                  <button
                    onClick={handleTonguePhoto}
                    className="ml-3 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded-lg"
                  >
                    <Camera className="w-4 h-4" /> 拍摄
                  </button>
                </div>
              </div>
            )}

            {/* 问诊模式提示 */}
            {mode === 'diagnosis' && currentStep === 'questions' && questionCount === 0 && (
              <div className="px-4 py-2">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <div className="text-sm text-blue-800 mb-1">🩺 中医体质问诊</div>
                  <div className="text-xs text-blue-600">基于中医十问，为您分析体质类型</div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Quick Actions and Input Area */}
        <div className="bg-white">
          {/* Action buttons above input when in chat mode */}
          {mode === 'chat' && (
            <div className="px-4 pt-1 pb-0">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // 触发文件上传
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="h-8 px-3 rounded-full border text-xs flex items-center gap-1 transition-colors bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传报告</span>
                </button>
                <button
                  onClick={handleHistorySummary}
                  className="h-8 px-3 rounded-full border text-xs flex items-center gap-1 transition-colors bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>历史情况总结</span>
                </button>
              </div>
            </div>
          )}

          {/* Exit diagnosis CTA when in diagnosis mode */}
          {mode === 'diagnosis' && (
            <div className="px-4 pt-1 pb-0">
              <div className="flex">
                <button
                  onClick={() => {
                    setMode('chat');
                  }}
                  className="h-8 px-3 rounded-full border text-xs flex items-center gap-1 transition-colors bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>退出问诊模式</span>
                </button>
              </div>
            </div>
          )}







          {/* Input Area */}
          <div className="px-4 pt-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center bg-gray-100 rounded-full px-2 py-1.5">
                  <button
                    onClick={handlePhotoClick}
                    className="p-2 rounded-full text-gray-600 hover:bg-gray-200"
                    aria-label="拍照"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={mode === 'diagnosis' ? '输入您的回答...' : '和小煦聊点什么吧'}
                    className="flex-1 bg-transparent px-2 py-1.5 text-sm focus:outline-none"
                    disabled={isStreaming}
                  />
                  <button
                    onMouseDown={handleMicPressStart}
                    onMouseUp={handleMicPressEnd}
                    onMouseLeave={handleMicPressEnd}
                    onTouchStart={handleMicPressStart}
                    onTouchEnd={handleMicPressEnd}
                    className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    aria-label="按住说话"
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!isStreaming && !inputText.trim()}
                className={`p-3 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isStreaming
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                aria-label={isStreaming ? "停止" : "发送"}
              >
                {isStreaming ? (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                  </div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




