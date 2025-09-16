'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Activity,
  Heart,
  CheckCircle,
  Leaf,
  Sun,
  Moon,
  Wind,
  Droplets,
  Mountain,
  BookOpen,
  Target,
  Timer
} from 'lucide-react';
import { calculateBazi } from '@/lib/bazi-calculator';
import { analyzePostnatalFiveElements } from '@/lib/postnatal-five-elements';
import { BirthData } from '@/types/five-elements';

interface ConstitutionQuestion {
  id: string;
  question: string;
  // 对于基础版：使用 { id, text, type, weight }
  // 对于专业版：使用 { id?, text, score }，并在题目层包含 dimension
  options: Array<{
    id?: string;      // 基础版必有；专业版渲染时可用索引生成
    text: string;
    type?: string;    // 基础版计算使用
    weight?: number;  // 基础版计算使用
    score?: number;   // 专业版计算使用
  }>;
  dimension?: string; // 专业版：所属体质维度（如“平和质/气虚质/…”）
}

interface ConstitutionData {
  basic: {
    title: string;
    description: string;
    questions: ConstitutionQuestion[];
  };
  professional: {
    title: string;
    description: string;
    questions: ConstitutionQuestion[];
  };
  constitution_types: {
    [key: string]: {
      name: string;
      description: string;
      characteristics: string[];
      recommendations: string[];
    };
  };
  constitution_types_map?: {
    [key: string]: {
      name: string;
      description: string;
      characteristics: string[];
      recommendations: string[];
    };
  };
}

interface OnboardingData {
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  birth_hour: number | null;
  gender: 'male' | 'female' | null;
  constitutionTestType: 'basic' | 'professional' | null;
  constitutionAnswers: Record<string, string>;
}


const GENDER_OPTIONS = [
  { value: 'male', label: '男性', icon: '👨' },
  { value: 'female', label: '女性', icon: '👩' }
];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // 检查URL参数，支持直接跳转到特定步骤
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    if (stepParam && ['1', '2', '3', '4'].includes(stepParam)) {
      setStep(parseInt(stepParam));
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [constitutionData, setConstitutionData] = useState<ConstitutionData | null>(null);
  // 专业版新版题库（维度+score）
  const [professionalQuestions, setProfessionalQuestions] = useState<ConstitutionQuestion[] | null>(null);

  const [data, setData] = useState<OnboardingData>({
    birth_year: null,
    birth_month: null,
    birth_day: null,
    birth_hour: null,
    gender: null,
    constitutionTestType: null,
    constitutionAnswers: {}
  });

  const [constitutionResult, setConstitutionResult] = useState<{
    primary: string;
    primaryType: string;
    secondary?: string;
    secondaryType?: string;
    scores: Record<string, number>;
    characteristics: string[];
    recommendations: string[];
  } | null>(null);

  // 当前显示的题目索引（用于逐题显示）
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    // 加载体质测试数据
    loadConstitutionData();

    // 移除自动检查引导完成状态的逻辑
    // 让用户主动选择是否完善信息
  }, [user, authLoading, router]);

  const loadConstitutionData = async () => {
    try {
      const response = await fetch('/constitution_questions.json');
      const data = await response.json();
      setConstitutionData(data);

      // 同步加载专业版新版题库（若存在）
      try {
        const resp2 = await fetch('/professional_questions_v2.json');
        if (resp2.ok) {
          const q = await resp2.json();
          setProfessionalQuestions(q);
        }
      } catch (_) {
        // 忽略：如果文件不存在则回退到旧题库
      }
    } catch (error) {
      console.error('Error loading constitution data:', error);
      setError('加载体质测试数据失败');
    }
  };

  const checkIfOnboardingCompleted = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: profile } = await supabase
        .from('profiles')
        .select('birth_year, constitution')
        .eq('id', user?.id)
        .single();

      if (profile?.birth_year && profile?.constitution) {
        // 已经完成引导，跳转到主页
        router.push('/');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };



  const handleConstitutionAnswer = (questionId: string, optionId: string) => {
    updateData('constitutionAnswers', {
      ...data.constitutionAnswers,
      [questionId]: optionId
    });

    // 自动跳转到下一题
    setTimeout(() => {
      const useProfessionalV2 = data.constitutionTestType === 'professional' && professionalQuestions && professionalQuestions.length > 0;
      const questions = useProfessionalV2
        ? professionalQuestions!
        : (constitutionData?.[data.constitutionTestType!]?.questions || []);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 300); // 300ms延迟，让用户看到选择反馈
  };

  const calculateConstitution = () => {
    if (!constitutionData || !data.constitutionTestType) {
      return null;
    }

    const useProfessionalV2 = data.constitutionTestType === 'professional' && professionalQuestions && professionalQuestions.length > 0;
    const questions = useProfessionalV2
      ? professionalQuestions!
      : constitutionData[data.constitutionTestType].questions;
    const scores: Record<string, number> = {};

    // 初始化所有体质类型分数
    Object.keys(constitutionData.constitution_types).forEach(type => {
      scores[type] = 0;
    });

    if (useProfessionalV2) {
      // 新版专业题库：按维度聚合原始分
      const rawByDim: Record<string, number> = {};
      const countByDim: Record<string, number> = {};
      questions.forEach((q, idx) => {
        const stored = data.constitutionAnswers[q.id];
        // 存储的是选项索引或自定义id，这里用索引匹配
        const option = q.options.find(o => o.id === stored) ?? q.options[Number(stored)] ?? null;
        if (!option || !q.dimension) return;
        rawByDim[q.dimension] = (rawByDim[q.dimension] || 0) + (option.score || 0);
        countByDim[q.dimension] = (countByDim[q.dimension] || 0) + 1;
      });

      // 转化分：8题和7题两种
      const transform = (raw: number, cnt: number) => {
        if (cnt === 8) return ((raw - 8) / (8 * 4)) * 100;
        if (cnt === 7) return ((raw - 7) / (7 * 4)) * 100;
        // 兜底：按题数归一
        return ((raw - cnt) / (cnt * 4)) * 100;
      };

      const transformed: Record<string, number> = {};
      Object.keys(rawByDim).forEach(dim => {
        transformed[dim] = Math.max(0, Math.min(100, transform(rawByDim[dim], countByDim[dim])));
      });

      // 选择主次体质（可根据阈值微调）
      const sorted = Object.entries(transformed).sort(([,a],[,b])=>b-a);
      const primaryTypeKey = (sorted[0]?.[0]) || 'balanced';
      const secondaryTypeKey = (sorted[1]?.[1] ?? 0) >= 40 ? sorted[1][0] : undefined;

      const primaryData = constitutionData!.constitution_types_map?.[primaryTypeKey] ?? constitutionData!.constitution_types[primaryTypeKey] ?? { name: primaryTypeKey, characteristics: [], recommendations: [] } as any;
      const secondaryData = secondaryTypeKey ? (constitutionData!.constitution_types_map?.[secondaryTypeKey] ?? constitutionData!.constitution_types[secondaryTypeKey]) : null;

      const result = {
        primary: primaryData.name || primaryTypeKey,
        primaryType: primaryTypeKey,
        secondary: secondaryData?.name,
        secondaryType: secondaryTypeKey,
        scores: transformed,
        characteristics: primaryData.characteristics || [],
        recommendations: primaryData.recommendations || []
      };

      setConstitutionResult(result);
      return result;
    } else {
      // 旧版：按type+weight计分
      questions.forEach(question => {
        const answerId = data.constitutionAnswers[question.id];
        const selectedOption = question.options.find(opt => opt.id === answerId);
        if (selectedOption && selectedOption.type && typeof selectedOption.weight === 'number') {
          scores[selectedOption.type] = (scores[selectedOption.type] || 0) + selectedOption.weight;
        }
      });

      // 添加基于生辰八字的先天体质调整（仅对旧版）
      try {
        if (data.birth_year && data.birth_month && data.birth_day && data.birth_hour !== null) {
          const baziResult = calculateBazi(
            data.birth_year,
            data.birth_month,
            data.birth_day,
            data.birth_hour
          );

        // 根据八字结果调整体质得分
        const sortedElements = Object.entries(baziResult.elementScores)
          .sort(([,a], [,b]) => b - a)
          .map(([element]) => element);

        // 将五行映射到体质类型
        const elementToConstitution = {
          wood: 'liver_qi_stagnation',
          fire: 'yin_deficiency',
          earth: 'spleen_deficiency',
          metal: 'qi_deficiency',
          water: 'yang_deficiency'
        };

        if (sortedElements[0] && elementToConstitution[sortedElements[0] as keyof typeof elementToConstitution]) {
          scores[elementToConstitution[sortedElements[0] as keyof typeof elementToConstitution]] += 2;
        }
        if (sortedElements[1] && elementToConstitution[sortedElements[1] as keyof typeof elementToConstitution]) {
          scores[elementToConstitution[sortedElements[1] as keyof typeof elementToConstitution]] += 1;
        }
        }
      } catch (error) {
        console.error('Error calculating Bazi:', error);
      }

      // 确定主要体质
      const sortedConstitutions = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
        .map(([type]) => type);

      const primaryType = sortedConstitutions[0];
      const secondaryType = sortedConstitutions[1] && scores[sortedConstitutions[1]] > 0
        ? sortedConstitutions[1]
        : undefined;

      const primaryData = constitutionData.constitution_types[primaryType];
      const secondaryData = secondaryType ? constitutionData.constitution_types[secondaryType] : null;

      const result = {
        primary: primaryData.name,
        primaryType,
        secondary: secondaryData?.name,
        secondaryType,
        scores,
        characteristics: primaryData.characteristics,
        recommendations: primaryData.recommendations
      };

      setConstitutionResult(result);
      return result;
    }
  };

  const saveToDatabase = async () => {
    if (!user) return;

    try {
      const { supabase } = await import('@/lib/supabase');

      // 准备更新数据，只更新有值的字段
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // 如果有生辰信息，添加到更新数据中
      if (data.birth_year && data.birth_month && data.birth_day && data.gender) {
        updateData.birth_year = data.birth_year;
        updateData.birth_month = data.birth_month;
        updateData.birth_day = data.birth_day;
        updateData.birth_hour = data.birth_hour;
        updateData.gender = data.gender;
      }

      // 如果有体质测试结果，添加到更新数据中
      if (constitutionResult?.primary) {
        updateData.constitution = constitutionResult.primary;
        updateData.constitution_type = constitutionResult.primaryType;
        updateData.constitution_test_type = data.constitutionTestType === 'professional' && professionalQuestions 
          ? 'professional_v2' 
          : data.constitutionTestType;
        
        // 如果是新版专业测试，保存维度转化分
        if (data.constitutionTestType === 'professional' && professionalQuestions && constitutionResult.scores) {
          updateData.constitution_scores_json = constitutionResult.scores;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // 保存体质分析结果
      if (constitutionResult) {
        const { error: analysisError } = await supabase
          .from('five_elements_analysis')
          .insert({
            user_id: user.id,
            date: new Date().toISOString().split('T')[0],
            basic_five_elements: {
              wood: Math.floor(Math.random() * 30) + 10,
              fire: Math.floor(Math.random() * 30) + 10,
              earth: Math.floor(Math.random() * 30) + 10,
              metal: Math.floor(Math.random() * 30) + 10,
              water: Math.floor(Math.random() * 30) + 10
            },
            dynamic_five_elements: constitutionResult.scores,
            balance_score: Math.floor(Math.random() * 40) + 60,
            primary_constitution: constitutionResult.primary,
            secondary_constitution: constitutionResult.secondary
          });

        if (analysisError) {
          console.error('Error saving analysis:', analysisError);
          // 不抛出错误，因为这不是关键功能
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      // 提供更详细的错误信息
      if (error instanceof Error) {
        throw new Error(`保存数据失败: ${error.message}`);
      } else {
        throw new Error('保存数据时发生未知错误');
      }
    }
  };

  const handleNext = async () => {
    setError('');

    if (step === 1) {
      // 验证生辰信息
      if (!data.birth_year || !data.birth_month || !data.birth_day || !data.birth_hour || !data.gender) {
        setError('请完整填写所有生辰信息');
        return;
      }

      const birthDate = new Date(data.birth_year, data.birth_month - 1, data.birth_day);
      if (birthDate > new Date()) {
        setError('出生日期不能为未来时间');
        return;
      }

      // 提交生日后直接计算并保存八字/五行比例
      try {
        if (user) {
          await fetch('/api/profile/birth-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              birthYear: data.birth_year,
              birthMonth: data.birth_month,
              birthDay: data.birth_day,
              birthHour: data.birth_hour,
              gender: data.gender
            })
          });
        }
      } catch (e) {
        console.error('保存生日并计算八字失败:', e);
        // 不阻塞用户继续流程
      }

      setStep(2);
    } else if (step === 2) {
      // 验证体质测试类型选择
      if (!data.constitutionTestType) {
        setError('请选择体质测试类型');
        return;
      }
      // 重置题目索引
      setCurrentQuestionIndex(0);
      setStep(3);
    } else if (step === 3) {
      // 验证体质测试是否完成
      if (!constitutionData) {
        setError('体质测试数据未加载');
        return;
      }

      const useProfessionalV2 = data.constitutionTestType === 'professional' && professionalQuestions && professionalQuestions.length > 0;
      const questions = useProfessionalV2
        ? professionalQuestions!
        : constitutionData[data.constitutionTestType!].questions;
      const answeredQuestions = Object.keys(data.constitutionAnswers).length;
      if (answeredQuestions < questions.length) {
        setError('请完成所有体质测试问题');
        return;
      }

      const result = calculateConstitution();
      if (result) {
        setStep(4);
      }
    } else if (step === 4) {
      // 保存数据
      setLoading(true);
      try {
        await saveToDatabase();
        router.push('/');
      } catch (error) {
        console.error('保存失败:', error);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('保存失败，请重试');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // 跳过当前步骤
  const handleSkip = async () => {
    if (step === 4) {
      // 最后一步不能跳过，直接进入主页
      router.push('/');
      return;
    }

    if (step === 1) {
      // 跳过生辰信息，直接到体质测试选择
      setStep(2);
    } else if (step === 2) {
      // 跳过体质测试类型选择，直接到最后一步
      setStep(4);
    } else if (step === 3) {
      // 跳过体质测试，直接到最后一步
      setStep(4);
    }
  };

  // 跳过所有步骤，直接进入主页
  const handleSkipAll = () => {
    router.push('/');
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push('/auth/login');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // 会重定向到登录页
  }

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
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handlePrevious}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1 mx-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>步骤 {step} / 4</span>
                <span>{step === 1 ? '生辰信息' : step === 2 ? '测试选择' : step === 3 ? '体质测试' : '完成'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="w-8"></div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {step === 1 && (
          <div className="p-6 space-y-6">
            {/* 标题 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">完善您的生辰信息</h2>
              <p className="text-gray-600">用于五行分析和个性化健康建议</p>
            </div>

            {/* 出生年份 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                出生年份 <span className="text-red-500">*</span>
              </label>
              <select
                value={data.birth_year ?? ''}
                onChange={(e) => updateData('birth_year', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">请选择出生年份</option>
                {Array.from({ length: 80 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>{year}年</option>
                  );
                })}
              </select>
            </div>

            {/* 出生月份 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                出生月份 <span className="text-red-500">*</span>
              </label>
              <select
                value={data.birth_month ?? ''}
                onChange={(e) => updateData('birth_month', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">请选择出生月份</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
            </div>

            {/* 出生日期 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                出生日期 <span className="text-red-500">*</span>
              </label>
              <select
                value={data.birth_day ?? ''}
                onChange={(e) => updateData('birth_day', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={!data.birth_year || !data.birth_month}
              >
                <option value="">请选择出生日期</option>
                {data.birth_year && data.birth_month && Array.from({ length: new Date(data.birth_year, data.birth_month, 0).getDate() }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}日</option>
                ))}
              </select>
              {(!data.birth_year || !data.birth_month) && (
                <p className="text-xs text-gray-500 mt-1">请先选择出生年份和月份</p>
              )}
            </div>

            {/* 出生时辰 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                出生时辰 <span className="text-red-500">*</span>
              </label>
              <select
                value={data.birth_hour ?? ''}
                onChange={(e) => updateData('birth_hour', e.target.value !== '' ? parseInt(e.target.value) : null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">请选择出生时辰</option>
                {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                  <option key={hour} value={hour}>{hour}时</option>
                ))}
              </select>
            </div>

            {/* 性别 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                性别 <span className="text-red-500">*</span>
              </label>
              <select
                value={data.gender ?? ''}
                onChange={(e) => updateData('gender', e.target.value ? e.target.value as 'male' | 'female' : null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">请选择性别</option>
                {GENDER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-6">
            {/* 标题 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">选择体质测试</h2>
              <p className="text-gray-600">选择适合您的测试版本，了解您的体质类型</p>
            </div>

            {/* 测试类型选择 */}
            <div className="space-y-4">
              {constitutionData && (
                <>
                  <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                       onClick={() => updateData('constitutionTestType', 'basic')}>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {constitutionData.basic.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {constitutionData.basic.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Timer className="w-4 h-4" />
                            <span>约 2-3 分钟</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>{constitutionData.basic.questions.length} 道题目</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-transparent hover:border-purple-200 transition-colors cursor-pointer"
                       onClick={() => updateData('constitutionTestType', 'professional')}>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Activity className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {constitutionData.professional.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {constitutionData.professional.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Timer className="w-4 h-4" />
                            <span>约 8-10 分钟</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>{constitutionData.professional.questions.length} 道题目</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 选择状态显示 */}
            {data.constitutionTestType && (
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-900 font-medium">
                    已选择：{data.constitutionTestType === 'basic' ? '基础版' : '专业版'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="p-6 space-y-6">
            {/* 标题 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">体质测试</h2>
              <p className="text-gray-600">回答以下问题，了解您的体质类型</p>
            </div>

            {/* 当前题目显示 */}
            {constitutionData && data.constitutionTestType && (() => {
              const useProfessionalV2 = data.constitutionTestType === 'professional' && professionalQuestions && professionalQuestions.length > 0;
              const questions = useProfessionalV2
                ? professionalQuestions!
                : constitutionData[data.constitutionTestType].questions;
              
              const currentQuestion = questions[currentQuestionIndex];
              if (!currentQuestion) return null;

              return (
                <div className="space-y-6">
                  {/* 题目卡片 */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-blue-600 font-bold">{currentQuestionIndex + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{currentQuestion.question}</h3>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {currentQuestion.options.map((option, optIdx) => {
                        const optionKey = option.id ?? String(optIdx);
                        const selected = data.constitutionAnswers[currentQuestion.id] === optionKey;
                        return (
                          <button
                            key={optionKey}
                            onClick={() => handleConstitutionAnswer(currentQuestion.id, optionKey)}
                            className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                              selected
                                ? 'bg-blue-100 border-2 border-blue-500 shadow-md'
                                : 'bg-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-900 font-medium">{option.text}</span>
                              {option.score && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {option.score}分
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 导航按钮 */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      上一题
                    </button>
                    
                    <div className="text-sm text-gray-500">
                      {currentQuestionIndex + 1} / {questions.length}
                    </div>

                    <button
                      onClick={() => {
                        if (currentQuestionIndex < questions.length - 1) {
                          setCurrentQuestionIndex(prev => prev + 1);
                        }
                      }}
                      disabled={currentQuestionIndex >= questions.length - 1}
                      className="px-4 py-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      下一题
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 进度显示 */}
            {constitutionData && data.constitutionTestType && (() => {
              const useProfessionalV2 = data.constitutionTestType === 'professional' && professionalQuestions && professionalQuestions.length > 0;
              const questions = useProfessionalV2
                ? professionalQuestions!
                : constitutionData[data.constitutionTestType].questions;
              const answeredCount = Object.keys(data.constitutionAnswers).length;
              const totalCount = questions.length;
              
              return (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">答题进度</span>
                    <span className="text-sm text-blue-700">
                      {answeredCount} / {totalCount}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: totalCount > 0 ? `${(answeredCount / totalCount) * 100}%` : '0%'
                      }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    当前：第 {currentQuestionIndex + 1} 题
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {step === 4 && (
          <div className="p-6 space-y-6">
            {/* 标题 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">完成！</h2>
              <p className="text-gray-600">您的体质分析结果</p>
            </div>

            {/* 分析结果 */}
            {constitutionResult && (
              <div className="space-y-4">
                {/* 主要体质 */}
                <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">您的体质类型</h3>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {constitutionResult.primary}
                  </div>
                  {constitutionResult.secondary && (
                    <div className="text-sm text-gray-600">
                      次要体质：{constitutionResult.secondary}
                    </div>
                  )}
                </div>

                {/* 体质特征 */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">体质特征</h3>
                  <ul className="space-y-2">
                    {constitutionResult.characteristics.map((characteristic, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span className="text-gray-700">{characteristic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 调理建议 */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">调理建议</h3>
                  <ul className="space-y-2">
                    {constitutionResult.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 体质得分分布 */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">体质得分分布</h3>
                  <div className="space-y-3">
                    {Object.entries(constitutionResult.scores).map(([type, score]) => {
                      if (score === 0) return null;

                      const typeNames = {
                        balanced: '平和质',
                        qi_deficiency: '气虚质',
                        yang_deficiency: '阳虚质',
                        yin_deficiency: '阴虚质',
                        phlegm_dampness: '痰湿质',
                        damp_heat: '湿热质',
                        blood_stasis: '血瘀质',
                        qi_stagnation: '气郁质',
                        special_constitution: '特禀质',
                        spleen_deficiency: '脾虚质',
                        liver_qi_stagnation: '肝气郁结质',
                        mild_imbalance: '轻度失调质'
                      };

                      const typeName = typeNames[type as keyof typeof typeNames] || type;
                      const maxScore = Math.max(...Object.values(constitutionResult.scores).filter(s => s > 0));
                      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

                      return (
                        <div key={type} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700">{typeName}</span>
                              <span className="text-sm text-gray-600">{score}分</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 建议卡片 */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">欢迎使用小煦</h3>
                  <p className="text-gray-700 mb-4">
                    现在您可以开始使用我们的健康管理系统了。基于您的体质分析，我们将为您提供个性化的健康建议和养生指导。
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">📊</div>
                      <div className="text-sm text-gray-700">健康数据</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">🧘</div>
                      <div className="text-sm text-gray-700">养生建议</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">💬</div>
                      <div className="text-sm text-gray-700">AI咨询</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">📈</div>
                      <div className="text-sm text-gray-700">健康报告</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="space-y-3">
          {step === 3 ? (
            // 第3步：显示"完成测试"按钮
            (() => {
              const useProfessionalV2 = data.constitutionTestType === 'professional' && professionalQuestions && professionalQuestions.length > 0;
              const questions = useProfessionalV2
                ? professionalQuestions!
                : (constitutionData?.[data.constitutionTestType!]?.questions || []);
              const allAnswered = Object.keys(data.constitutionAnswers).length >= questions.length;
              
              return (
                <button
                  onClick={handleNext}
                  disabled={loading || !allAnswered}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    allAnswered
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      计算中...
                    </>
                  ) : allAnswered ? (
                    <>
                      完成测试
                      <CheckCircle className="w-5 h-5 ml-2" />
                    </>
                  ) : (
                    <>
                      请完成所有题目 ({Object.keys(data.constitutionAnswers).length}/{questions.length})
                    </>
                  )}
                </button>
              );
            })()
          ) : (
            // 其他步骤：正常的下一步按钮
            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  保存中...
                </>
              ) : (
                <>
                  {step === 4 ? '开始使用' : '下一步'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          )}

          {/* 跳过按钮 - 只在前3步显示 */}
          {step < 4 && (
            <button
              onClick={handleSkip}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {step === 1 ? '跳过生辰信息' : step === 2 ? '跳过体质测试' : '跳过'}
            </button>
          )}

          {/* 跳过所有按钮 - 只在前3步显示 */}
          {step < 4 && (
            <button
              onClick={handleSkipAll}
              disabled={loading}
              className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              跳过所有，直接开始使用
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}