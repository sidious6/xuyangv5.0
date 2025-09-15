'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Bot, User, Clock, Upload, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import HealthReportUpload from '@/components/HealthReportUpload';
import HealthReportDisplay from '@/components/HealthReportDisplay';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'text' | 'health_report';
  healthReportId?: string;
}

interface ChatContentProps {
  user: any;
  router: any;
}

export default function ChatContent({ user, router }: ChatContentProps) {
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReportUpload, setShowReportUpload] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  // 从URL参数获取初始问题和上下文
  const initialQuestion = searchParams.get('question') || '';
  const context = searchParams.get('context') || '';

  useEffect(() => {
    // 如果有初始问题，自动发送
    if (initialQuestion && messages.length === 0) {
      handleSendMessage(initialQuestion, true);
    }
  }, [initialQuestion]);

  useEffect(() => {
    // 滚动到底部
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReportUpload = async (report: any) => {
    setShowReportUpload(false);

    const userMessage: Message = {
      role: 'user',
      content: `我上传了一份体检报告：${report.title}`,
      timestamp: new Date().toISOString(),
      type: 'health_report',
      healthReportId: report.id
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentReportId(report.id);

    // Add a system message about the report
    const systemMessage: Message = {
      role: 'assistant',
      content: `我已收到您的体检报告"${report.title}"。报告正在AI分析中，分析完成后我会为您提供详细的中医解读和健康建议。`,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  const handleSendMessage = async (content: string, isInitial = false) => {
    if (!content.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('未授权');
      }

      // 构建消息历史
      const messageHistory: Array<{role: string; content: string}> = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // 添加当前用户消息
      messageHistory.push({
        role: 'user',
        content: content.trim()
      });

      // 添加养生咨询系统提示
      if (context === 'shunshi') {
        messageHistory.unshift({
          role: 'system',
          content: `用户正在询问关于今日养生建议的问题。请基于中医五行理论和养生知识，结合用户的实际情况给出专业、易懂的回答。重点关注调理方法的原理和实施建议。`
        });
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messageHistory
        }),
      });

      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      const result = await response.json();

      if (result.ok && result.choices?.[0]?.message?.content) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.choices[0].message.content,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || '回复生成失败');
      }

    } catch (error) {
      console.error('Error sending message:', error);

      // 添加错误消息
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，我暂时无法回复您的问题。请稍后再试或检查网络连接。',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 状态栏 */}
      <div className="bg-white px-4 py-1 flex items-center justify-between text-sm font-medium">
        <div className="text-gray-900">9:41</div>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
          </div>
          <svg className="w-6 h-3 ml-1" viewBox="0 0 24 12" fill="none">
            <rect x="1" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1"/>
            <rect x="2" y="3" width="18" height="6" rx="1" fill="currentColor"/>
            <rect x="21" y="4" width="2" height="4" rx="1" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* 头部 */}
      <header className="bg-white px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-medium text-gray-900">健康咨询</h1>
          <p className="text-sm text-gray-600">小煦 - 您的中医健康顾问</p>
        </div>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
      </header>

      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isProcessing && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">您好，我是小煦</h3>
            <p className="text-gray-600">您的中医健康顾问，有什么健康问题或养生建议都可以问我～</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}

            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
              {message.type === 'health_report' && message.healthReportId ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">体检报告</span>
                  </div>
                  <p className="text-sm text-gray-700">{message.content}</p>
                  <HealthReportDisplay reportId={message.healthReportId} />
                </div>
              ) : (
                <div
                  className={`p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              )}
              <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <Clock className="w-3 h-3" />
                <span>{formatTime(message.timestamp)}</span>
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200">
        {/* Health Report Upload Modal */}
        {showReportUpload && (
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">上传体检报告</h3>
              <button
                onClick={() => setShowReportUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <HealthReportUpload onUploadComplete={handleReportUpload} />
          </div>
        )}

        {/* Main Input Area */}
        <div className="p-4">
          <div className="flex gap-3 items-end">
            <button
              onClick={() => setShowReportUpload(!showReportUpload)}
              className={`p-3 rounded-full transition-colors flex-shrink-0 ${
                showReportUpload
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={isProcessing}
            >
              <Upload className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="描述您的健康问题或询问养生建议..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={1}
                disabled={isProcessing}
              />
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isProcessing}
                className={`absolute right-2 bottom-2 p-2 rounded-full transition-colors ${
                  inputMessage.trim() && !isProcessing
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Health Report Upload Hint */}
          {!showReportUpload && (
            <div className="mt-2 text-center">
              <button
                onClick={() => setShowReportUpload(true)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                <Upload className="w-4 h-4 inline mr-1" />
                上传体检报告获取中医解读
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}