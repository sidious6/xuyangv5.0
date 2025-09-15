'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Calendar,
  Clock,
  User,
  TrendingUp,
  ArrowLeft,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

interface TestRecord {
  id: string;
  name: string;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number;
  gender: string;
  day_master: string;
  day_master_element: string;
  element_percentages: Record<string, number>;
  season: string;
  strength: string;
  constitutional_type: string;
  created_at: string;
}

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

const getElementColor = (element: string) => {
  const colors = {
    wood: 'bg-green-100 text-green-800',
    fire: 'bg-red-100 text-red-800',
    earth: 'bg-yellow-100 text-yellow-800',
    metal: 'bg-gray-100 text-gray-800',
    water: 'bg-blue-100 text-blue-800'
  };
  return colors[element as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export default function ConstitutionTestHistory() {
  const router = useRouter();
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  useEffect(() => {
    loadTestRecords();
  }, []);

  const loadTestRecords = async () => {
    try {
      setLoading(true);
      // 模拟数据 - 实际应用中应该从API获取
      const mockRecords: TestRecord[] = [
        {
          id: '1',
          name: '张三',
          birth_year: 1990,
          birth_month: 10,
          birth_day: 25,
          birth_hour: 14,
          gender: 'male',
          day_master: '癸',
          day_master_element: 'water',
          element_percentages: {
            wood: 16.8,
            fire: 11.9,
            earth: 23.1,
            metal: 18.2,
            water: 30.1
          },
          season: '秋季',
          strength: 'balanced',
          constitutional_type: '水型体质',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: '李四',
          birth_year: 1988,
          birth_month: 3,
          birth_day: 15,
          birth_hour: 8,
          gender: 'female',
          day_master: '己',
          day_master_element: 'earth',
          element_percentages: {
            wood: 8.0,
            fire: 18.1,
            earth: 64.0,
            metal: 4.4,
            water: 5.4
          },
          season: '春季',
          strength: 'strong',
          constitutional_type: '土型体质',
          created_at: '2024-01-10T14:20:00Z'
        }
      ];
      setTestRecords(mockRecords);
    } catch (error) {
      console.error('加载测试记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (recordId: string) => {
    router.push(`/constitution-test/result/${recordId}`);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (confirm('确定要删除这条测试记录吗？')) {
      try {
        // 实际应用中应该调用删除API
        setTestRecords(prev => prev.filter(record => record.id !== recordId));
      } catch (error) {
        console.error('删除记录失败:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载测试记录...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">体质测试历史</h1>
          <p className="text-gray-600">查看您的所有体质测试记录和健康趋势</p>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总测试次数</p>
                <p className="text-2xl font-bold text-gray-800">{testRecords.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">最新测试</p>
                <p className="text-2xl font-bold text-gray-800">
                  {testRecords.length > 0 ?
                    new Date(testRecords[0].created_at).toLocaleDateString('zh-CN') :
                    '无'
                  }
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">主要体质类型</p>
                <p className="text-2xl font-bold text-gray-800">
                  {testRecords.length > 0 ?
                    testRecords[0].constitutional_type :
                    '未知'
                  }
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* 测试记录列表 */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">测试记录</h2>
          </div>

          {testRecords.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">还没有体质测试记录</p>
              <Link
                href="/constitution-test"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                开始测试
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {testRecords.map((record) => (
                <div key={record.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-medium text-gray-800">{record.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${getElementColor(record.day_master_element)}`}>
                          {record.constitutional_type}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{record.birth_year}年{record.birth_month}月{record.birth_day}日</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(record.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>日主：{record.day_master}（{getElementName(record.day_master_element)}）</span>
                        </div>
                      </div>

                      {/* 五行分布 */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-gray-600">五行分布：</span>
                        {Object.entries(record.element_percentages).map(([element, percentage]) => (
                          <span key={element} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {getElementName(element)}{percentage}%
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewResult(record.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="查看结果"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="删除记录"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-md" title="下载报告">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/constitution-test"
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Activity className="w-5 h-5 mr-2" />
            进行新的体质测试
          </Link>
        </div>
      </div>
    </div>
  );
}