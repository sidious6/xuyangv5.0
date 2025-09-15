'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, MapPin, Calendar, BookOpen, Heart, Activity, Utensils, Moon, TrendingUp, Send, Share2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import FiveElementsRelation from '@/components/FiveElementsRelation';
import ShareModal from '@/components/ShareModal';
import { getFiveElementsAdvice } from '@/lib/five-elements-analysis';
import { FiveElementsAdvice } from '@/types/five-elements';

interface ShunshiContent {
  title: string;
  subtitle: string;
  description: string;
  sections: Array<{
    title: string;
    content?: string;
    items?: Array<{
      category: string;
      advice: string;
    }>;
    timeSlots?: Array<{
      time: string;
      advice: string;
    }>;
  }>;
}

interface DailySummary {
  date: string;
  overall_summary: string;
  sleep_summary?: string;
  emotion_summary?: string;
  meal_summary?: string;
  symptom_summary?: string;
}

export default function ShunshiPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [shunshiContent, setShunshiContent] = useState<ShunshiContent | null>(null);
  const [microSuggestions, setMicroSuggestions] = useState<string>('');
  const [yesterdaySummary, setYesterdaySummary] = useState<DailySummary | null>(null);

  // 五行分析相关状态
  const [fiveElementsData, setFiveElementsData] = useState({
    basic: { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 },
    dynamic: { wood: 20, fire: 20, earth: 20, metal: 20, water: 20 }
  });
  const [selectedElement, setSelectedElement] = useState<'wood' | 'fire' | 'earth' | 'metal' | 'water' | null>(null);
  const [elementsAdvice, setElementsAdvice] = useState<FiveElementsAdvice | null>(null);
  const [activeTab, setActiveTab] = useState<'advice' | 'elements'>('advice');

  // AI咨询相关状态
  const [aiInput, setAiInput] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [presetQuestions, setPresetQuestions] = useState<string[]>([
    '今天的养生建议适合我的体质吗？',
    '这个节气我需要注意什么？'
  ]);
  const [isGeneratingPresetQuestions, setIsGeneratingPresetQuestions] = useState(false);

  // 获取顺时详情
  const fetchShunshiDetail = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabase');
      const today = new Date().toISOString().split('T')[0];

      // 获取用户token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // 获取今日养生计划
      const wellnessResponse = await fetch(`/api/wellness-plan?userId=${user.id}&date=${today}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (wellnessResponse.ok) {
        const wellnessResult = await wellnessResponse.json();
        if (wellnessResult.success && wellnessResult.data?.content) {
          setShunshiContent(wellnessResult.data.content);
        }
      }

      // 获取前一日总结
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const summaryResponse = await fetch(`/api/records/daily-summary?date=${yesterdayStr}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (summaryResponse.ok) {
        const summaryResult = await summaryResponse.json();
        if (summaryResult.success && summaryResult.data) {
          const summaryData = {
            sleep: summaryResult.data.sleep,
            meals: summaryResult.data.meals || [],
            emotions: summaryResult.data.emotions || [],
            symptoms: summaryResult.data.symptoms || [],
          };

          setYesterdaySummary({
            date: yesterdayStr,
            overall_summary: generateSummaryText(summaryData),
            sleep_summary: summaryData.sleep ? `睡眠${summaryData.sleep.duration || '未记录'}` : undefined,
            emotion_summary: summaryData.emotions?.[0] ? `${summaryData.emotions[0].emoji} 强度${summaryData.emotions[0].intensity}/10` : undefined,
            meal_summary: summaryData.meals?.[0] ? `已记录${summaryData.meals.length}餐` : undefined,
            symptom_summary: summaryData.symptoms?.length ? `${summaryData.symptoms.length}个症状` : undefined,
          });

          // 生成微观建议
          await generateMicroSuggestions(summaryData);
        }
      }
    } catch (error) {
      console.error('Error fetching shunshi detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成预设问题
  const generatePresetQuestions = async () => {
    if (!user || !shunshiContent || !elementsAdvice) return;

    try {
      setIsGeneratingPresetQuestions(true);

      // 生成基于当前内容的预设问题
      const mockQuestions = [
        `针对${elementsAdvice.element_name}型体质，今天应该注意什么？`,
        '根据当前节气，有什么特别的养生建议吗？',
        '我的五行分析结果说明了什么？',
        '如何根据体质调整饮食习惯？',
        '什么运动最适合我的体质？'
      ];

      setPresetQuestions(mockQuestions);
    } catch (error) {
      console.error('生成预设问题失败:', error);
      // 设置默认问题
      setPresetQuestions([
        '为什么今日推荐这样的养生建议？',
        '这些调理建议有什么科学依据吗？',
        '我应该从哪些方面开始调整？',
        '这样的建议适合长期坚持吗？',
        '有没有简单易行的替代方案？'
      ]);
    } finally {
      setIsGeneratingPresetQuestions(false);
    }
  };

  // 处理预设问题点击
  const handlePresetQuestionClick = (question: string) => {
    // 跳转到聊天页面并传递问题
    router.push(`/consultation?question=${encodeURIComponent(question)}&context=shunshi`);
  };

  // 处理AI输入发送
  const handleAiInputSend = () => {
    if (aiInput.trim()) {
      // 跳转到聊天页面并传递问题
      router.push(`/consultation?question=${encodeURIComponent(aiInput.trim())}&context=shunshi`);
    }
  };

  // 直接打开分享模态框
  const handleOpenShareModal = () => {
    setShowShareModal(true);
  };

  // 生成微观建议
  const generateMicroSuggestions = async (summaryData: any) => {
    if (!user) return;

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/shunshi', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'micro_suggestion',
          input: {
            previous_summary: generateSummaryText(summaryData),
            sleep: summaryData.sleep,
            emotions: summaryData.emotions,
            meals: summaryData.meals,
            symptoms: summaryData.symptoms,
          },
          messages: [
            {
              role: 'user',
              content: `根据用户前一日记录生成50-100字的个性化养生建议。用户状态：${generateSummaryText(summaryData)}`
            }
          ]
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.message) {
          setMicroSuggestions(result.data.message);
        }
      }
    } catch (error) {
      console.error('Error generating micro suggestions:', error);
    }
  };

  // 处理五行元素点击
  const handleElementClick = (element: 'wood' | 'fire' | 'earth' | 'metal' | 'water') => {
    setSelectedElement(element);
    const advice = getFiveElementsAdvice(element);
    setElementsAdvice(advice);
  };

  // 获取五行分析数据
  const fetchFiveElementsData = async () => {
    if (!user) return;

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/five-elements/analysis', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setFiveElementsData({
            basic: result.data.basic_five_elements,
            dynamic: result.data.dynamic_five_elements
          });
        }
      }
    } catch (error) {
      console.error('Error fetching five elements data:', error);
    }
  };

  // 生成汇总文本
  const generateSummaryText = (data: any) => {
    const parts = [];
    if (data.sleep) {
      parts.push(`睡眠${data.sleep.duration || '未记录'}`);
    }
    if (data.meals && data.meals.length > 0) {
      parts.push(`已记录${data.meals.length}餐`);
    }
    if (data.emotions && data.emotions.length > 0) {
      parts.push(`情绪${data.emotions[0].emoji || '😐'}`);
    }
    if (data.symptoms && data.symptoms.length > 0) {
      parts.push(`${data.symptoms.length}个症状`);
    }
    return parts.length > 0 ? parts.join('，') : '无记录';
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchShunshiDetail();
      fetchFiveElementsData();
    }
  }, [user, authLoading, router]);

  // 当数据加载完成后生成预设问题
  useEffect(() => {
    if (shunshiContent && elementsAdvice && fiveElementsData && presetQuestions.length === 0) {
      generatePresetQuestions();
    }
  }, [shunshiContent, elementsAdvice, fiveElementsData]);


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm h-screen bg-gray-50 relative flex flex-col overflow-hidden">
        {/* 状态栏 */}
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
              <rect x="1" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1"/>
              <rect x="2" y="3" width="18" height="6" rx="1" fill="currentColor"/>
              <rect x="21" y="4" width="2" height="4" rx="1" fill="currentColor"/>
            </svg>
          </div>
        </div>

        {/* 头部 */}
        <header className="flex-shrink-0 bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-medium text-gray-900">顺时养生</h1>
          </div>
          
          {/* 分享按钮 */}
          <button
            onClick={handleOpenShareModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        {/* 标签页切换 */}
        <div className="flex-shrink-0 bg-white px-4 py-2 flex gap-2 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('advice')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'advice'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          养生建议
        </button>
        <button
          onClick={() => setActiveTab('elements')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'elements'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          五行分析
        </button>
      </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : activeTab === 'advice' ? (
          // 养生建议标签页
          shunshiContent ? (
            <div className="p-4 space-y-6">
              {/* 基本信息卡片 */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-medium text-gray-900">{shunshiContent.title}</h2>
                  <span className="text-sm text-gray-600">{shunshiContent.subtitle}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{shunshiContent.description}</p>
              </div>

              {/* 详细建议 */}
              {shunshiContent.sections?.map((section, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-4">
                  <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                    {section.title === '节气特点' && <Calendar className="w-5 h-5 mr-2 text-blue-600" />}
                    {section.title === '养生要点' && <Heart className="w-5 h-5 mr-2 text-red-600" />}
                    {section.title === '今日建议' && <Clock className="w-5 h-5 mr-2 text-green-600" />}
                    {section.title}
                  </h3>

                  {section.content && (
                    <p className="text-gray-700 leading-relaxed mb-3">{section.content}</p>
                  )}

                  {section.items && (
                    <div className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">{item.category}</div>
                            <div className="text-gray-700 text-sm">{item.advice}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.timeSlots && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="space-y-2">
                        {section.timeSlots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-start gap-3">
                            <div className="font-medium text-gray-900 min-w-[100px]">{slot.time}</div>
                            <div className="text-gray-700 text-sm">{slot.advice}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* 前一日总结建议 */}
              {microSuggestions && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm p-4">
                  <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                    前日内观建议
                  </h3>
                  {yesterdaySummary && (
                    <div className="mb-3 bg-white/50 rounded-lg p-3">
                      <div className="text-sm text-gray-600 mb-2">前一日记录：</div>
                      <div className="text-sm text-gray-800 space-y-1">
                        {yesterdaySummary.sleep_summary && (
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4 text-blue-600" />
                            <span>{yesterdaySummary.sleep_summary}</span>
                          </div>
                        )}
                        {yesterdaySummary.emotion_summary && (
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-600" />
                            <span>{yesterdaySummary.emotion_summary}</span>
                          </div>
                        )}
                        {yesterdaySummary.meal_summary && (
                          <div className="flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-green-600" />
                            <span>{yesterdaySummary.meal_summary}</span>
                          </div>
                        )}
                        {yesterdaySummary.symptom_summary && (
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-orange-600" />
                            <span>{yesterdaySummary.symptom_summary}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-gray-700 leading-relaxed">{microSuggestions}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-4xl mb-4">🌿</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无养生建议</h3>
                <p className="text-gray-600">请完善个人信息后重试</p>
              </div>
            </div>
          )
        ) : (
          // 五行分析标签页
          <div className="p-4 space-y-6">

            {/* 五行相克关系 */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">五行相克关系</h3>
              <div className="flex justify-center">
                <FiveElementsRelation onElementClick={handleElementClick} size={280} />
              </div>
            </div>

            {/* 选中元素的调理建议 */}
            {selectedElement && elementsAdvice && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {elementsAdvice.element_name}行调理建议
                  </h3>
                  <button
                    onClick={() => setSelectedElement(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 饮食建议 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Utensils className="w-4 h-4 mr-2 text-green-600" />
                      饮食建议
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {elementsAdvice.advice_categories.diet.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 运动建议 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-blue-600" />
                      运动建议
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {elementsAdvice.advice_categories.exercise.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 生活建议 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                      生活建议
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {elementsAdvice.advice_categories.lifestyle.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 宜忌 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">宜</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        {elementsAdvice.recommendations.beneficial.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">忌</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        {elementsAdvice.recommendations.avoid.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-600 mt-1">✗</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </div>

        {/* AI咨询对话框 */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="p-4">

            {/* 预设问题按钮 */}
            <div className="mb-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {presetQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetQuestionClick(question)}
                    className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* 输入框区域 */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="有什么问题想问我吗？"
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAiInputSend();
                    }
                  }}
                />
                {/* 发送按钮 */}
                <button
                  onClick={handleAiInputSend}
                  disabled={!aiInput.trim()}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                    aiInput.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* 分享模态框 */}
        {shunshiContent && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            shareData={{
              title: shunshiContent.title,
              subtitle: shunshiContent.subtitle,
              description: shunshiContent.description,
              advice: microSuggestions,
              userName: user?.user_metadata?.full_name || user?.email || '用户'
            }}
          />
        )}
      </div>
    </div>
  );
}