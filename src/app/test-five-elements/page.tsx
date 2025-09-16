'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestFiveElementsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testCalculation = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 获取当前用户
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('用户未登录');
        return;
      }

      console.log('当前用户ID:', session.user.id);

      // 测试数据：2003年2月13日4时
      const testData = {
        userId: session.user.id,
        birthYear: 2003,
        birthMonth: 2,
        birthDay: 13,
        birthHour: 4,
        name: '测试用户',
        gender: 'male'
      };

      console.log('发送测试数据:', testData);

      const response = await fetch('/api/profile/birth-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const data = await response.json();
      console.log('API响应:', data);

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || '计算失败');
      }
    } catch (err) {
      console.error('测试错误:', err);
      setError('请求失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const checkProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('用户未登录');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('查询用户档案失败:', error);
        setError('查询失败: ' + error.message);
      } else {
        console.log('用户档案:', data);
        setResult({ profileData: data });
      }
    } catch (err) {
      console.error('查询错误:', err);
      setError('查询失败: ' + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">五行计算测试</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试操作</h2>
          <div className="space-x-4">
            <button
              onClick={testCalculation}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '计算中...' : '测试五行计算'}
            </button>
            <button
              onClick={checkProfile}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              查看用户档案
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            测试数据：2003年2月13日4时（癸未年 甲寅月 己亥日 丙寅时）
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>错误：</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">计算结果</h2>
            <div className="space-y-4">
              {result.fiveElementsRatio && (
                <div>
                  <h3 className="text-lg font-medium mb-2">五行比例</h3>
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div className="p-3 bg-green-100 rounded">
                      <div className="font-semibold">木</div>
                      <div className="text-xl">{result.fiveElementsRatio.木}%</div>
                    </div>
                    <div className="p-3 bg-red-100 rounded">
                      <div className="font-semibold">火</div>
                      <div className="text-xl">{result.fiveElementsRatio.火}%</div>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded">
                      <div className="font-semibold">土</div>
                      <div className="text-xl">{result.fiveElementsRatio.土}%</div>
                    </div>
                    <div className="p-3 bg-gray-100 rounded">
                      <div className="font-semibold">金</div>
                      <div className="text-xl">{result.fiveElementsRatio.金}%</div>
                    </div>
                    <div className="p-3 bg-blue-100 rounded">
                      <div className="font-semibold">水</div>
                      <div className="text-xl">{result.fiveElementsRatio.水}%</div>
                    </div>
                  </div>
                </div>
              )}

              {result.baziInfo && (
                <div>
                  <h3 className="text-lg font-medium mb-2">八字信息</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p><strong>八字：</strong>{result.baziInfo.chart}</p>
                    <p><strong>日主：</strong>{result.baziInfo.dayMaster}（{result.baziInfo.dayMasterElement}）</p>
                    <p><strong>强弱：</strong>{result.baziInfo.strength}</p>
                    <p><strong>季节：</strong>{result.baziInfo.season}</p>
                  </div>
                </div>
              )}

              {result.profileData && (
                <div>
                  <h3 className="text-lg font-medium mb-2">用户档案数据</h3>
                  <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(result.profileData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
