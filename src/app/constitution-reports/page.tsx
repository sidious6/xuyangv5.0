'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, FileText, Eye, Plus, User, Activity } from 'lucide-react';

interface ConstitutionTestRecord {
  id: string;
  created_at: string;
  basic_info: {
    name: string;
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    birthHour: number;
    gender: 'male' | 'female';
  };
  constitution_result: string;
  test_answers: Record<string, string>;
  five_elements_ratio?: {
    木: number;
    火: number;
    土: number;
    金: number;
    水: number;
  };
}

export default function ConstitutionReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [constitutionTests, setConstitutionTests] = useState<ConstitutionTestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<ConstitutionTestRecord | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchConstitutionTests();
    }
  }, [user, loading, router]);

  const fetchConstitutionTests = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No valid session');
        return;
      }

      // 获取用户的体质测试记录
      const { data: profile } = await supabase
        .from('profiles')
        .select('constitution, birth_year, birth_month, birth_day, birth_hour, gender, full_name, five_elements_ratio, created_at')
        .eq('id', user.id)
        .single();

      if (profile) {
        // 构造体质测试记录
        const testRecord: ConstitutionTestRecord = {
          id: user.id,
          created_at: profile.created_at,
          basic_info: {
            name: profile.full_name || '用户',
            birthYear: profile.birth_year || 1990,
            birthMonth: profile.birth_month || 1,
            birthDay: profile.birth_day || 1,
            birthHour: profile.birth_hour || 12,
            gender: profile.gender || 'male'
          },
          constitution_result: profile.constitution || '未测试',
          test_answers: {}, // TODO: 从数据库获取测试答案
          five_elements_ratio: profile.five_elements_ratio
        };

        setConstitutionTests([testRecord]);
      }
    } catch (error) {
      console.error('获取体质测试记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConstitutionSummary = (constitution: string) => {
    if (!constitution || constitution === '未测试') return '尚未完成体质测试';
    return `体质类型：${constitution}`;
  };

  const getBirthDateString = (basicInfo: ConstitutionTestRecord['basic_info']) => {
    return `${basicInfo.birthYear}年${basicInfo.birthMonth}月${basicInfo.birthDay}日 ${basicInfo.birthHour}时`;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (selectedTest) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm h-screen bg-gray-50 relative flex flex-col overflow-hidden">
          <header className="flex-shrink-0 bg-white px-4 py-4 border-b">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedTest(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">体质测试详情</h1>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">测试时间：{formatDate(selectedTest.created_at)}</span>
                </div>

                {/* 基本信息 */}
                <div className="mb-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    基本信息
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p><span className="text-gray-600">姓名：</span>{selectedTest.basic_info.name}</p>
                    <p><span className="text-gray-600">性别：</span>{selectedTest.basic_info.gender === 'male' ? '男' : '女'}</p>
                    <p><span className="text-gray-600">出生时间：</span>{getBirthDateString(selectedTest.basic_info)}</p>
                  </div>
                </div>

                {/* 体质结果 */}
                <div className="mb-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    体质类型
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-blue-900 font-medium text-lg">{selectedTest.constitution_result}</p>
                  </div>
                </div>

                {/* 五行比例 */}
                {selectedTest.five_elements_ratio && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">五行比例</h3>
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-3">
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {Object.entries(selectedTest.five_elements_ratio).map(([element, ratio]) => (
                          <div key={element} className="bg-white rounded-lg p-2">
                            <div className="text-sm font-medium text-gray-700">{element}</div>
                            <div className="text-lg font-bold text-blue-600">{ratio.toFixed(1)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 建议 */}
                <div>
                  <h3 className="font-medium mb-2">调理建议</h3>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-green-800 text-sm">
                      根据您的{selectedTest.constitution_result}体质特点，建议在日常生活中注意饮食调理、作息规律，
                      并可参考五行养生法进行针对性调养。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm h-screen bg-gray-50 relative flex flex-col overflow-hidden">
        <header className="flex-shrink-0 bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="p-1 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">体质报告</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
            {constitutionTests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无体质测试记录</h3>
                <p className="text-gray-600 mb-6">您还没有完成过体质测试，快去测试一下吧！</p>
                <button
                  onClick={() => router.push('/constitution-test')}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  开始测试
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium">我的体质测试</h2>
                  <button
                    onClick={() => router.push('/constitution-test')}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    重新测试
                  </button>
                </div>
                
                {constitutionTests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedTest(test)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDate(test.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{test.basic_info.name}</span>
                          <span className="text-sm text-gray-500">
                            ({test.basic_info.gender === 'male' ? '男' : '女'})
                          </span>
                        </div>
                        <p className="text-gray-800 mb-2">{getConstitutionSummary(test.constitution_result)}</p>
                        {test.five_elements_ratio && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>五行比例：</span>
                            {Object.entries(test.five_elements_ratio).map(([element, ratio]) => (
                              <span key={element} className="bg-gray-100 px-2 py-1 rounded">
                                {element}{ratio.toFixed(0)}%
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="w-6 h-6 text-blue-600" />
                        </div>
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
