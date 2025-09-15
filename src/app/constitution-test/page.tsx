'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Step = 'basic' | 'questionnaire' | 'result';

interface BasicInfo {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  gender: 'male' | 'female';
}

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; element?: string }[];
}

interface TestResult {
  basicInfo: BasicInfo;
  answers: Record<string, string>;
  baziAnalysis: any;
  recommendations: any;
}

export default function ConstitutionTest() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: '',
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12,
    gender: 'male'
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 体质测试问卷
  const questions: Question[] = [
    {
      id: 'body_type',
      question: '您的身材特点是什么？',
      options: [
        { value: 'thin_tall', label: '身材修长，体型偏瘦', element: 'wood' },
        { value: 'medium', label: '身材适中，比例协调', element: 'earth' },
        { value: 'strong', label: '身材健壮，肌肉发达', element: 'metal' },
        { value: 'plump', label: '身材丰满，体型偏胖', element: 'water' }
      ]
    },
    {
      id: 'complexion',
      question: '您的面色特点是什么？',
      options: [
        { value: 'pale', label: '面色偏白，皮肤白皙', element: 'metal' },
        { value: 'red', label: '面色红润，有光泽', element: 'fire' },
        { value: 'yellow', label: '面色偏黄，暗沉', element: 'earth' },
        { value: 'dark', label: '面色偏黑，黧黑', element: 'water' }
      ]
    },
    {
      id: 'personality',
      question: '您的性格特点是什么？',
      options: [
        { value: 'impatient', label: '急躁易怒，性急', element: 'fire' },
        { value: 'calm', label: '温和稳重，有耐心', element: 'earth' },
        { value: 'sensitive', label: '敏感多思，易忧虑', element: 'metal' },
        { value: 'gentle', label: '温和柔顺，适应性强', element: 'water' }
      ]
    },
    {
      id: 'sleep_pattern',
      question: '您的睡眠特点是什么？',
      options: [
        { value: 'light', label: '睡眠浅，易惊醒', element: 'fire' },
        { value: 'deep', label: '睡眠深沉，不易醒', element: 'earth' },
        { value: 'irregular', label: '睡眠不规律，时差倒不过来', element: 'metal' },
        { value: 'heavy', label: '睡眠时间长，但质量不高', element: 'water' }
      ]
    },
    {
      id: 'digestion',
      question: '您的消化功能如何？',
      options: [
        { value: 'strong', label: '消化能力强，不易积食', element: 'fire' },
        { value: 'normal', label: '消化正常，偶尔不适', element: 'earth' },
        { value: 'weak', label: '消化较弱，易腹胀', element: 'metal' },
        { value: 'sensitive', label: '消化敏感，易腹泻', element: 'water' }
      ]
    },
    {
      id: 'temperature',
      question: '您对冷热的敏感度如何？',
      options: [
        { value: 'heat', label: '怕热，不耐热', element: 'fire' },
        { value: 'normal', label: '对冷热感觉正常', element: 'earth' },
        { value: 'cold', label: '怕冷，手脚冰冷', element: 'water' },
        { value: 'mixed', label: '忽冷忽热，不稳定', element: 'metal' }
      ]
    },
    {
      id: 'energy',
      question: '您的精力充沛程度如何？',
      options: [
        { value: 'high', label: '精力充沛，活力四射', element: 'fire' },
        { value: 'stable', label: '精力稳定，持久', element: 'earth' },
        { value: 'fluctuating', label: '精力波动较大', element: 'metal' },
        { value: 'low', label: '精力不足，易疲劳', element: 'water' }
      ]
    },
    {
      id: 'emotion',
      question: '您的情绪特点是什么？',
      options: [
        { value: 'excited', label: '情绪易激动，兴奋', element: 'fire' },
        { value: 'stable', label: '情绪稳定，不易波动', element: 'earth' },
        { value: 'anxious', label: '容易焦虑，多思多虑', element: 'metal' },
        { value: 'calm', label: '情绪平和，不易激动', element: 'water' }
      ]
    }
  ];

  const handleBasicInfoSubmit = () => {
    if (!basicInfo.name) {
      alert('请输入姓名');
      return;
    }
    setCurrentStep('questionnaire');
  };

  const handleAnswerSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleQuestionnaireSubmit = async () => {
    // 检查是否所有问题都已回答
    const unansweredQuestions = questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      alert('请完成所有问题');
      return;
    }

    setIsLoading(true);
    try {
      // 调用八字分析API
      const baziResponse = await fetch('/api/bazi-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          birthYear: basicInfo.birthYear,
          birthMonth: basicInfo.birthMonth,
          birthDay: basicInfo.birthDay,
          birthHour: basicInfo.birthHour,
          analysisType: 'comprehensive'
        })
      });

      const baziData = await baziResponse.json();

      if (!baziData.success) {
        throw new Error('八字分析失败');
      }

      // 保存测试结果到数据库
      const testResult = {
        basicInfo,
        answers,
        baziAnalysis: baziData.data,
        recommendations: baziData.data
      };

      setResult(testResult);
      setCurrentStep('result');

      // 异步保存结果（不阻塞用户界面）
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetch('/api/constitution-test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: session.user.id,
              basicInfo,
              answers,
              baziAnalysis: baziData.data
            })
          });
        }
      } catch (saveError) {
        console.error('保存测试结果失败:', saveError);
        // 不影响用户体验，只记录错误
      }
    } catch (error) {
      console.error('分析失败:', error);
      alert('分析失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const resetTest = () => {
    setCurrentStep('basic');
    setAnswers({});
    setResult(null);
  };

  const getProgress = () => {
    const answeredCount = Object.keys(answers).length;
    return (answeredCount / questions.length) * 100;
  };

  const getElementName = (element: string) => {
    const map = {
      wood: '木型',
      fire: '火型',
      earth: '土型',
      metal: '金型',
      water: '水型'
    };
    return map[element as keyof typeof map] || '未知';
  };

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

        {/* 进度条 */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex-1 mx-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>体质测试</span>
                  <span>
                    {currentStep === 'basic' ? '基本信息' :
                     currentStep === 'questionnaire' ? '问卷测试' : '测试结果'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: currentStep === 'basic' ? '33%' :
                             currentStep === 'questionnaire' ? '66%' : '100%'
                    }}
                  ></div>
                </div>
              </div>

              <div className="w-8"></div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>

          {currentStep === 'basic' && (
            <div className="p-6 space-y-6">
              {/* 标题 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">基本信息</h2>
                <p className="text-gray-600">请填写您的基本信息，用于体质分析</p>
              </div>
              {/* 姓名 */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="请输入您的姓名"
                />
              </div>

              {/* 性别 */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  性别 <span className="text-red-500">*</span>
                </label>
                <select
                  value={basicInfo.gender}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>

              {/* 出生信息 */}
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    出生日期
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={basicInfo.birthYear}
                      onChange={(e) => setBasicInfo(prev => ({ ...prev, birthYear: parseInt(e.target.value) }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 100 }, (_, i) => 1940 + i).map(year => (
                        <option key={year} value={year}>{year}年</option>
                      ))}
                    </select>
                    <select
                      value={basicInfo.birthMonth}
                      onChange={(e) => setBasicInfo(prev => ({ ...prev, birthMonth: parseInt(e.target.value) }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month}月</option>
                      ))}
                    </select>
                    <select
                      value={basicInfo.birthDay}
                      onChange={(e) => setBasicInfo(prev => ({ ...prev, birthDay: parseInt(e.target.value) }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}日</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    出生时间
                  </label>
                  <select
                    value={basicInfo.birthHour}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, birthHour: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                      <option key={hour} value={hour}>{hour}时</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleBasicInfoSubmit}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  开始测试
                  <ArrowRight className="inline w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'questionnaire' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">体质测试问卷</h2>
                <span className="text-sm text-gray-600">
                  {Object.keys(answers).length} / {questions.length}
                </span>
              </div>

              {/* 进度条 */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>

              <div className="space-y-8">
                {questions.map((question, index) => (
                  <div key={question.id} className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      {index + 1}. {question.question}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question.options.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleAnswerSelect(question.id, option.value)}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            answers[question.id] === option.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep('basic')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="inline w-4 h-4 mr-2" />
                  返回
                </button>
                <button
                  onClick={handleQuestionnaireSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? '分析中...' : '查看结果'}
                  <ArrowRight className="inline w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'result' && result && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">测试结果</h2>
                <p className="text-gray-600">基于您的个人信息和测试问卷的分析结果</p>
              </div>

              {/* 基本信息 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">基本信息</h3>
                <div className="text-sm text-gray-600">
                  <p>姓名：{result.basicInfo.name}</p>
                  <p>出生日期：{result.basicInfo.birthYear}年{result.basicInfo.birthMonth}月{result.basicInfo.birthDay}日{result.basicInfo.birthHour}时</p>
                </div>
              </div>

              {/* 八字分析结果 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">八字分析</h3>
                <div className="text-sm text-gray-700">
                  <p>日主：{result.baziAnalysis.baziAnalysis.dayMaster}（{getElementName(result.baziAnalysis.baziAnalysis.dayMasterElement)}）</p>
                  <p>五行分布：{Object.entries(result.baziAnalysis.baziAnalysis.elementPercentages)
                    .map(([element, percentage]) => `${getElementName(element)}${percentage}%`)
                    .join('、')}</p>
                </div>
              </div>

              {/* 体质类型 */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">体质类型</h3>
                <p className="text-sm text-gray-700">
                  {result.baziAnalysis.healthImplications.constitutionalType}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>健康优势：</strong>{result.baziAnalysis.healthImplications.healthStrengths.join('、')}</p>
                  <p><strong>注意事项：</strong>{result.baziAnalysis.healthImplications.healthWeaknesses.join('、')}</p>
                </div>
              </div>

              {/* 个性化建议 */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">个性化建议</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <div>
                    <strong>推荐食物：</strong>
                    <p>{result.baziAnalysis.dietaryRecommendations.foodsToAdd.join('、')}</p>
                  </div>
                  <div>
                    <strong>推荐运动：</strong>
                    <p>{result.baziAnalysis.exerciseRecommendations.bestActivities.join('、')}</p>
                  </div>
                  <div>
                    <strong>运动时间：</strong>
                    <p>{result.baziAnalysis.exerciseRecommendations.optimalTime}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={resetTest}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  重新测试
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  返回主页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}