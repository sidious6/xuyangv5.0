'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Heart,
  Activity,
  Utensils,
  Dumbbell,
  Brain,
  Calendar,
  Clock,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  ArrowLeft,
  Download,
  Share2
} from 'lucide-react';

interface TestResult {
  basicInfo: {
    name: string;
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    birthHour: number;
    gender: 'male' | 'female';
  };
  baziAnalysis: {
    baziAnalysis: {
      dayMaster: string;
      dayMasterElement: string;
      elementPercentages: Record<string, number>;
      season: string;
      strength: string;
      chart: {
        year: { stem: string; branch: string };
        month: { stem: string; branch: string };
        day: { stem: string; branch: string };
        hour: { stem: string; branch: string };
      };
    };
    healthImplications: {
      constitutionalType: string;
      healthStrengths: string[];
      healthWeaknesses: string[];
      lifestyleRecommendations: string[];
    };
    dietaryRecommendations: {
      foodsToAdd: string[];
      foodsToReduce: string[];
      cookingMethods: string[];
      mealTiming: string;
    };
    exerciseRecommendations: {
      bestActivities: string[];
      activitiesToAvoid: string[];
      optimalTime: string;
      intensity: string;
    };
    emotionalGuidance: {
      emotionalTendencies: string[];
      stressManagement: string[];
      meditationFocus: string;
    };
    seasonalAdjustments: {
      spring: string;
      summer: string;
      autumn: string;
      winter: string;
    };
  };
}

const getElementIcon = (element: string) => {
  const icons = {
    wood: '🌳',
    fire: '🔥',
    earth: '🌍',
    metal: '⚪',
    water: '💧'
  };
  return icons[element as keyof typeof icons] || '❓';
};

const getElementColor = (element: string) => {
  const colors = {
    wood: 'text-green-600 bg-green-50 border-green-200',
    fire: 'text-red-600 bg-red-50 border-red-200',
    earth: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    metal: 'text-gray-600 bg-gray-50 border-gray-200',
    water: 'text-blue-600 bg-blue-50 border-blue-200'
  };
  return colors[element as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
};

const getElementName = (element: string) => {
  const names = {
    wood: '木型',
    fire: '火型',
    earth: '土型',
    metal: '金型',
    water: '水型'
  };
  return names[element as keyof typeof names] || '未知';
};

export default function ConstitutionTestResult() {
  const router = useRouter();
  const params = useParams();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 这里应该从API获取测试结果
    // 为了演示，我们使用mock数据
    const mockResult: TestResult = {
      basicInfo: {
        name: '张三',
        birthYear: 1990,
        birthMonth: 10,
        birthDay: 25,
        birthHour: 14,
        gender: 'male'
      },
      baziAnalysis: {
        baziAnalysis: {
          dayMaster: '癸',
          dayMasterElement: 'water',
          elementPercentages: {
            wood: 16.8,
            fire: 11.9,
            earth: 23.1,
            metal: 18.2,
            water: 30.1
          },
          season: '秋季',
          strength: 'balanced',
          chart: {
            year: { stem: '庚', branch: '午' },
            month: { stem: '戊', branch: '戌' },
            day: { stem: '癸', branch: '未' },
            hour: { stem: '乙', branch: '未' }
          }
        },
        healthImplications: {
          constitutionalType: '水型体质',
          healthStrengths: ['肾功能强', '生殖系统好', '耐力强'],
          healthWeaknesses: ['畏寒怕冷', '易水肿', '腰膝酸软', '记忆力减退'],
          lifestyleRecommendations: ['保持规律作息', '适当运动', '保持心情愉悦', '定期体检']
        },
        dietaryRecommendations: {
          foodsToAdd: ['黑色食物', '海鲜', '核桃', '黑芝麻', '枸杞', '黑木耳'],
          foodsToReduce: ['生冷食物', '咸味过重', '寒凉食物', '冰品'],
          cookingMethods: ['温煮', '炖汤', '温炒'],
          mealTiming: '温热饮食，避免过晚进餐'
        },
        exerciseRecommendations: {
          bestActivities: ['太极', '瑜伽', '温热瑜伽', '慢走', '水中运动'],
          activitiesToAvoid: ['寒冷环境运动', '剧烈运动', '长时间静止'],
          optimalTime: '上午7-9点，下午5-7点',
          intensity: '低中强度，温热性运动'
        },
        emotionalGuidance: {
          emotionalTendencies: ['温和', '适应性强', '易敏感', '需要安全感'],
          stressManagement: ['冥想', '温水浴', '社交活动', '规律作息'],
          meditationFocus: '关注肾脏健康，练习安全感冥想'
        },
        seasonalAdjustments: {
          spring: '水生木，新陈代谢开始活跃，注意调整作息',
          summer: '水克火，注意防暑降温，多喝水',
          autumn: '金生水，呼吸系统相对稳定，增加有氧运动',
          winter: '水旺于冬，注意保暖，增加温补食物'
        }
      }
    };

    setTimeout(() => {
      setResult(mockResult);
      setLoading(false);
    }, 1000);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载测试结果...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">未找到测试结果</p>
            <button
              onClick={() => router.push('/constitution-test')}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              重新测试
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { basicInfo, baziAnalysis } = result;
  const { baziAnalysis: bazi } = baziAnalysis;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 头部 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">体质测试结果</h1>
          <p className="text-gray-600">
            基于{basicInfo.name}的八字分析和体质测评生成的个性化健康报告
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end mb-6 space-x-4">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            下载报告
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Share2 className="w-4 h-4 mr-2" />
            分享
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：基本信息和五行分析 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 基本信息 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                基本信息
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">姓名</span>
                  <span className="font-medium">{basicInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">性别</span>
                  <span className="font-medium">{basicInfo.gender === 'male' ? '男' : '女'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">出生日期</span>
                  <span className="font-medium">
                    {basicInfo.birthYear}年{basicInfo.birthMonth}月{basicInfo.birthDay}日
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">出生时间</span>
                  <span className="font-medium">{basicInfo.birthHour}时</span>
                </div>
              </div>
            </div>

            {/* 八字信息 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                八字信息
              </h2>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-blue-600">
                  {bazi.chart.year.stem}{bazi.chart.year.branch}{' '}
                  {bazi.chart.month.stem}{bazi.chart.month.branch}{' '}
                  {bazi.chart.day.stem}{bazi.chart.day.branch}{' '}
                  {bazi.chart.hour.stem}{bazi.chart.hour.branch}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  日主：{bazi.dayMaster}（{getElementName(bazi.dayMasterElement)}）
                </p>
              </div>
            </div>

            {/* 五行分布 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">五行分布</h2>
              <div className="space-y-3">
                {Object.entries(bazi.elementPercentages).map(([element, percentage]) => (
                  <div key={element} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{getElementIcon(element)}</span>
                      <span className="font-medium">{getElementName(element)}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            element === 'wood' ? 'bg-green-500' :
                            element === 'fire' ? 'bg-red-500' :
                            element === 'earth' ? 'bg-yellow-500' :
                            element === 'metal' ? 'bg-gray-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：详细分析 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 体质类型 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                体质类型
              </h2>
              <div className={`inline-block px-4 py-2 rounded-lg border-2 ${getElementColor(bazi.dayMasterElement)}`}>
                <span className="text-lg font-bold">{baziAnalysis.healthImplications.constitutionalType}</span>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2">健康优势</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    {baziAnalysis.healthImplications.healthStrengths.map((strength, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2">注意事项</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {baziAnalysis.healthImplications.healthWeaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 饮食建议 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Utensils className="w-5 h-5 mr-2" />
                饮食建议
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-green-700 mb-2">推荐食物</h3>
                  <div className="flex flex-wrap gap-2">
                    {baziAnalysis.dietaryRecommendations.foodsToAdd.map((food, index) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-red-700 mb-2">减少食物</h3>
                  <div className="flex flex-wrap gap-2">
                    {baziAnalysis.dietaryRecommendations.foodsToReduce.map((food, index) => (
                      <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>烹饪方式：</strong>{baziAnalysis.dietaryRecommendations.cookingMethods.join('、')}</p>
                <p><strong>进餐时间：</strong>{baziAnalysis.dietaryRecommendations.mealTiming}</p>
              </div>
            </div>

            {/* 运动建议 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Dumbbell className="w-5 h-5 mr-2" />
                运动建议
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-blue-700 mb-2">推荐运动</h3>
                  <div className="flex flex-wrap gap-2">
                    {baziAnalysis.exerciseRecommendations.bestActivities.map((activity, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-orange-700 mb-2">避免运动</h3>
                  <div className="flex flex-wrap gap-2">
                    {baziAnalysis.exerciseRecommendations.activitiesToAvoid.map((activity, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>最佳时间：</strong>{baziAnalysis.exerciseRecommendations.optimalTime}</p>
                <p><strong>运动强度：</strong>{baziAnalysis.exerciseRecommendations.intensity}</p>
              </div>
            </div>

            {/* 情绪指导 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                情绪指导
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-purple-700 mb-2">情绪特点</h3>
                  <div className="flex flex-wrap gap-2">
                    {baziAnalysis.emotionalGuidance.emotionalTendencies.map((tendency, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {tendency}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-pink-700 mb-2">压力管理</h3>
                  <div className="flex flex-wrap gap-2">
                    {baziAnalysis.emotionalGuidance.stressManagement.map((method, index) => (
                      <span key={index} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>冥想重点：</strong>{baziAnalysis.emotionalGuidance.meditationFocus}</p>
              </div>
            </div>

            {/* 季节调整 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">季节调整</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2">春季</h3>
                  <p className="text-sm text-green-700">{baziAnalysis.seasonalAdjustments.spring}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2">夏季</h3>
                  <p className="text-sm text-red-700">{baziAnalysis.seasonalAdjustments.summer}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-medium text-orange-800 mb-2">秋季</h3>
                  <p className="text-sm text-orange-700">{baziAnalysis.seasonalAdjustments.autumn}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">冬季</h3>
                  <p className="text-sm text-blue-700">{baziAnalysis.seasonalAdjustments.winter}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}