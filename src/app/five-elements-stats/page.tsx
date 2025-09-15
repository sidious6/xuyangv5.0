'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Calendar, Crown, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LineChart from '@/components/LineChart';

interface FiveElementsData {
  date: string;
  basic_wood: number;
  basic_fire: number;
  basic_earth: number;
  basic_metal: number;
  basic_water: number;
  dynamic_wood: number;
  dynamic_fire: number;
  dynamic_earth: number;
  dynamic_metal: number;
  dynamic_water: number;
  balance_score: number;
  primary_constitution: string;
  [key: string]: string | number; // 添加索引签名以兼容LineChart组件
}

export default function FiveElementsStatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [stats, setStats] = useState<{
    data: FiveElementsData[];
    summary: {
      avg_balance: number;
      trend_direction: 'improving' | 'declining' | 'stable';
      most_frequent_constitution: string;
    };
  } | null>(null);
  const [isPro, setIsPro] = useState(false); // 模拟用户是否为Pro用户

  // 获取五行统计数据
  const fetchStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/five-elements/stats?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchStats();
    }
  }, [user, authLoading, router, period]);

  // 图表配置
  const elementLines = [
    { key: 'dynamic_wood', name: '木', color: '#4ade80' },
    { key: 'dynamic_fire', name: '火', color: '#f87171' },
    { key: 'dynamic_earth', name: '土', color: '#fbbf24' },
    { key: 'dynamic_metal', name: '金', color: '#94a3b8' },
    { key: 'dynamic_water', name: '水', color: '#60a5fa' },
  ];

  const balanceLine = [
    { key: 'balance_score', name: '平衡度', color: '#8b5cf6' },
  ];

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <Crown className="w-12 h-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">升级至Pro版本</h2>
          <p className="text-gray-600 mb-6">
            五行统计分析功能需要Pro版本才能使用。升级后您可以：
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-2">
            <li className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              查看五行变化趋势图表
            </li>
            <li className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              获得个性化体质分析报告
            </li>
            <li className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              导出健康数据报告
            </li>
            <li className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              无限制使用所有功能
            </li>
          </ul>
          <button
            onClick={() => setIsPro(true)} // 模拟升级到Pro
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-medium py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all"
          >
            立即升级至Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
        <h1 className="text-xl font-medium text-gray-900">五行统计分析</h1>
        <div className="ml-auto flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
          <Crown className="w-4 h-4 text-yellow-600" />
          <span className="text-xs font-medium text-yellow-700">Pro</span>
        </div>
      </header>

      {/* 内容区域 */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : stats ? (
          <div className="p-4 space-y-6">
            {/* 时间段选择 */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                分析时间范围
              </h3>
              <div className="flex gap-2">
                {[
                  { value: 'week', label: '最近7天' },
                  { value: 'month', label: '最近30天' },
                  { value: 'quarter', label: '最近90天' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPeriod(option.value as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === option.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 统计摘要 */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                统计摘要
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.summary.avg_balance}%
                  </div>
                  <div className="text-sm text-gray-600">平均平衡度</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {stats.summary.trend_direction === 'improving' ? '改善' :
                     stats.summary.trend_direction === 'declining' ? '下降' : '稳定'}
                  </div>
                  <div className="text-sm text-gray-600">整体趋势</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {stats.summary.most_frequent_constitution}
                  </div>
                  <div className="text-sm text-gray-600">主要体质</div>
                </div>
              </div>
            </div>

            {/* 五行趋势图 */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                五行动态变化趋势
              </h3>
              <div className="overflow-x-auto">
                <LineChart
                  data={stats.data}
                  lines={elementLines}
                  width={600}
                  height={300}
                />
              </div>
            </div>

            {/* 平衡度趋势图 */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                五行平衡度变化
              </h3>
              <div className="overflow-x-auto">
                <LineChart
                  data={stats.data}
                  lines={balanceLine}
                  width={600}
                  height={250}
                />
              </div>
            </div>

            {/* 详细数据表格 */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                详细数据
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-700">日期</th>
                      <th className="text-center py-2 px-3 text-gray-700">木</th>
                      <th className="text-center py-2 px-3 text-gray-700">火</th>
                      <th className="text-center py-2 px-3 text-gray-700">土</th>
                      <th className="text-center py-2 px-3 text-gray-700">金</th>
                      <th className="text-center py-2 px-3 text-gray-700">水</th>
                      <th className="text-center py-2 px-3 text-gray-700">平衡度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.data.slice().reverse().map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-900">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="text-center py-2 px-3" style={{ color: '#4ade80' }}>
                          {item.dynamic_wood}
                        </td>
                        <td className="text-center py-2 px-3" style={{ color: '#f87171' }}>
                          {item.dynamic_fire}
                        </td>
                        <td className="text-center py-2 px-3" style={{ color: '#fbbf24' }}>
                          {item.dynamic_earth}
                        </td>
                        <td className="text-center py-2 px-3" style={{ color: '#94a3b8' }}>
                          {item.dynamic_metal}
                        </td>
                        <td className="text-center py-2 px-3" style={{ color: '#60a5fa' }}>
                          {item.dynamic_water}
                        </td>
                        <td className="text-center py-2 px-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.balance_score >= 80
                              ? 'bg-green-100 text-green-800'
                              : item.balance_score >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.balance_score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无统计数据</h3>
              <p className="text-gray-600">请先记录一些身体数据后再来查看统计</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}