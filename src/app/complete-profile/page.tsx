'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ArrowLeft, User, Calendar, Activity, CheckCircle, Heart } from 'lucide-react';

interface ProfileData {
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  birth_hour: number | null;
  gender: 'male' | 'female' | null;
  constitution?: string;
  constitution_test_type?: string;
  constitution_answers: Record<string, string>;
}

interface ConstitutionData {
  basic: {
    title: string;
    description: string;
    questions: Array<{
      id: string;
      question: string;
      options: Array<{
        id: string;
        text: string;
        type: string;
        weight: number;
      }>;
    }>;
  };
}

type Step = 'check' | 'birth_info' | 'constitution_test' | 'complete';

export default function CompleteProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('check');
  
  // 用户当前信息状态
  const [missingInfo, setMissingInfo] = useState({
    birthInfo: false,
    constitution: false
  });

  // 表单数据
  const [data, setData] = useState<ProfileData>({
    birth_year: null,
    birth_month: null,
    birth_day: null,
    birth_hour: null,
    gender: null,
    constitution_answers: {}
  });

  const [constitutionData, setConstitutionData] = useState<ConstitutionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // 体质测试结果
  const [constitutionResult, setConstitutionResult] = useState<{
    primary: string;
    primaryType: string;
    secondary?: string;
    secondaryType?: string;
    scores: Record<string, number>;
    characteristics: string[];
    recommendations: string[];
  } | null>(null);

  useEffect(() => {
    if (user) {
      checkUserProfile();
      loadConstitutionData();
    }
  }, [user]);

  const checkUserProfile = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: profile } = await supabase
        .from('profiles')
        .select('birth_year, birth_month, birth_day, birth_hour, gender, constitution')
        .eq('id', user?.id)
        .single();

      const missing = {
        birthInfo: !profile?.birth_year || !profile?.birth_month || !profile?.birth_day || !profile?.gender,
        constitution: !profile?.constitution || profile?.constitution === '待测'
      };

      setMissingInfo(missing);

      // 如果都不缺失，直接返回主页
      if (!missing.birthInfo && !missing.constitution) {
        router.push('/');
        return;
      }

      // 设置当前数据
      if (profile) {
        setData(prev => ({
          ...prev,
          birth_year: profile.birth_year || prev.birth_year,
          birth_month: profile.birth_month || prev.birth_month,
          birth_day: profile.birth_day || prev.birth_day,
          birth_hour: profile.birth_hour || prev.birth_hour,
          gender: profile.gender || prev.gender,
          constitution: profile.constitution
        }));
      }

      // 确定起始步骤
      if (missing.birthInfo) {
        setStep('birth_info');
      } else if (missing.constitution) {
        setStep('constitution_test');
      }

    } catch (error) {
      console.error('Error checking profile:', error);
      setError('加载用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const loadConstitutionData = async () => {
    try {
      const response = await fetch('/constitution_questions.json');
      const data = await response.json();
      setConstitutionData(data);
    } catch (error) {
      console.error('Error loading constitution data:', error);
    }
  };

  const handleNext = async () => {
    setError('');

    if (step === 'birth_info') {
      // 验证生辰信息
      if (!data.birth_year || !data.birth_month || !data.birth_day || data.birth_hour === null || !data.gender) {
        setError('请完整填写所有生辰信息');
        return;
      }

      const birthDate = new Date(data.birth_year, data.birth_month - 1, data.birth_day);
      if (birthDate > new Date()) {
        setError('出生日期不能为未来时间');
        return;
      }

      // 保存生辰信息
      await saveBirthInfo();

      // 检查是否还需要体质测试
      if (missingInfo.constitution) {
        setStep('constitution_test');
      } else {
        setStep('complete');
      }
    } else if (step === 'constitution_test') {
      // 验证体质测试
      if (!constitutionData) {
        setError('体质测试数据未加载');
        return;
      }

      const questions = constitutionData.basic.questions;
      const answeredQuestions = Object.keys(data.constitution_answers).length;
      if (answeredQuestions < questions.length) {
        setError('请完成所有体质测试问题');
        return;
      }

      // 计算并保存体质测试结果
      await saveConstitutionTest();
      setStep('complete');
    } else if (step === 'complete') {
      router.push('/');
    }
  };

  const saveBirthInfo = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('profiles')
        .update({
          birth_year: data.birth_year,
          birth_month: data.birth_month,
          birth_day: data.birth_day,
          birth_hour: data.birth_hour,
          gender: data.gender,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving birth info:', error);
      throw new Error('保存生辰信息失败');
    } finally {
      setSaving(false);
    }
  };

  const saveConstitutionTest = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // 计算体质结果
      const constitution = calculateConstitution();

      // 设置体质结果状态
      setConstitutionResult(constitution);

      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('profiles')
        .update({
          constitution: constitution.primary,
          constitution_test_type: 'basic',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving constitution test:', error);
      throw new Error('保存体质测试结果失败');
    } finally {
      setSaving(false);
    }
  };

  const calculateConstitution = () => {
    // 简化的体质计算逻辑
    const scores: Record<string, number> = {
      balanced: 0,
      qi_deficiency: 0,
      yang_deficiency: 0,
      yin_deficiency: 0,
      phlegm_dampness: 0,
      damp_heat: 0,
      blood_stasis: 0,
      qi_stagnation: 0,
      special_constitution: 0
    };

    // 根据答案计算得分
    Object.values(data.constitution_answers).forEach(answer => {
      if (answer.includes('精力充沛') || answer.includes('正常')) {
        scores.balanced += 1;
      } else if (answer.includes('疲劳') || answer.includes('不足')) {
        scores.qi_deficiency += 1;
      } else if (answer.includes('怕冷')) {
        scores.yang_deficiency += 1;
      } else if (answer.includes('怕热') || answer.includes('失眠')) {
        scores.yin_deficiency += 1;
      } else if (answer.includes('痰多') || answer.includes('肥胖')) {
        scores.phlegm_dampness += 1;
      }
    });

    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
    const primary = sortedScores[0][0];
    const secondary = sortedScores[1] && sortedScores[1][1] > 0 ? sortedScores[1][0] : undefined;

    const constitutionMap: Record<string, string> = {
      balanced: '平和质',
      qi_deficiency: '气虚质',
      yang_deficiency: '阳虚质',
      yin_deficiency: '阴虚质',
      phlegm_dampness: '痰湿质',
      damp_heat: '湿热质',
      blood_stasis: '血瘀质',
      qi_stagnation: '气郁质',
      special_constitution: '特禀质'
    };

    const characteristicsMap: Record<string, string[]> = {
      balanced: ['体形匀称健壮', '面色润泽', '精力充沛', '睡眠良好', '性格开朗'],
      qi_deficiency: ['容易疲劳', '气短懒言', '容易出汗', '舌淡苔白', '脉象虚弱'],
      yang_deficiency: ['畏寒怕冷', '手足不温', '精神不振', '大便溏薄', '小便清长'],
      yin_deficiency: ['形体偏瘦', '手足心热', '面颊潮红', '眼干口燥', '失眠多梦'],
      phlegm_dampness: ['形体肥胖', '腹部肥满', '胸闷痰多', '面部油腻', '容易困倦']
    };

    const recommendationsMap: Record<string, string[]> = {
      balanced: ['保持规律作息', '适量运动', '均衡饮食', '心情愉悦', '定期体检'],
      qi_deficiency: ['多食补气食物', '避免过度劳累', '适当运动', '保证充足睡眠', '可食用人参、黄芪等'],
      yang_deficiency: ['温阳散寒', '多食温热食物', '避免生冷', '适当运动', '可食用肉桂、干姜等'],
      yin_deficiency: ['滋阴润燥', '多食甘凉食物', '避免熬夜', '保持心情平静', '可食用枸杞、百合等'],
      phlegm_dampness: ['健脾化湿', '控制体重', '少食肥甘厚味', '多运动', '可食用薏米、茯苓等']
    };

    const primaryName = constitutionMap[primary] || '平和质';
    const secondaryName = secondary ? constitutionMap[secondary] : undefined;

    return {
      primary: primaryName,
      primaryType: primary,
      secondary: secondaryName,
      secondaryType: secondary,
      scores,
      characteristics: characteristicsMap[primary] || characteristicsMap.balanced,
      recommendations: recommendationsMap[primary] || recommendationsMap.balanced
    };
  };

  const handleSkip = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
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
              onClick={() => router.back()}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1 mx-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>完善信息</span>
                <span>
                  {step === 'birth_info' ? '生辰信息' :
                   step === 'constitution_test' ? '体质测试' : '完成'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: step === 'birth_info' ? '33%' :
                           step === 'constitution_test' ? '66%' : '100%'
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
          {step === 'birth_info' && (
            <div className="p-6 space-y-6">
              {/* 标题 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">补充生辰信息</h2>
                <p className="text-gray-600">为了提供更准确的健康建议，请填写您的出生信息</p>
              </div>

              {/* 出生年份 */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  出生年份 <span className="text-red-500">*</span>
                </label>
                <select
                  value={data.birth_year ?? ''}
                  onChange={(e) => setData(prev => ({ ...prev, birth_year: e.target.value ? parseInt(e.target.value) : null }))}
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
                  onChange={(e) => setData(prev => ({ ...prev, birth_month: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">请选择出生月份</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}月</option>
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
                  onChange={(e) => setData(prev => ({ ...prev, birth_day: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={!data.birth_year || !data.birth_month}
                >
                  <option value="">请选择出生日期</option>
                  {data.birth_year && data.birth_month && Array.from({ length: new Date(data.birth_year, data.birth_month, 0).getDate() }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}日</option>
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
                  onChange={(e) => setData(prev => ({ ...prev, birth_hour: e.target.value !== '' ? parseInt(e.target.value) : null }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">请选择出生时辰</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i}时</option>
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
                  onChange={(e) => setData(prev => ({ ...prev, gender: e.target.value ? e.target.value as 'male' | 'female' : null }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">请选择性别</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
            </div>
          )}

          {step === 'constitution_test' && constitutionData && (
            <div className="p-6 space-y-6">
              {/* 标题 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">体质测试</h2>
                <p className="text-gray-600">请回答以下问题，帮助我们了解您的体质特点</p>
              </div>

              {/* 进度条 */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>进度</span>
                  <span>{Object.keys(data.constitution_answers).length} / {constitutionData.basic.questions.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(Object.keys(data.constitution_answers).length / constitutionData.basic.questions.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* 问题列表 */}
              <div className="space-y-6">
                {constitutionData.basic.questions.map((question, index) => (
                  <div key={question.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <h3 className="font-medium text-gray-900 mb-3">
                      {index + 1}. {question.question}
                    </h3>
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setData(prev => ({
                            ...prev,
                            constitution_answers: {
                              ...prev.constitution_answers,
                              [question.id]: option.text
                            }
                          }))}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            data.constitution_answers[question.id] === option.text
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {option.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'complete' && (
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
        <div className="flex space-x-3">
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                保存中...
              </>
            ) : (
              <>
                {step === 'complete' ? '开始使用' : '下一步'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>

          {step !== 'complete' && (
            <button
              onClick={handleSkip}
              disabled={saving}
              className="px-6 py-3 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              跳过
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
