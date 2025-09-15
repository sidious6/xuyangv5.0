'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, FileText, Eye } from 'lucide-react';

interface ConsultationRecord {
  id: string;
  timestamp: string;
  tongueImage?: string;
  questions: Array<{ question: string; answer: string; timestamp: Date }>;
  analysis: string;
  sessionId?: string;
}

export default function ConstitutionReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchConsultations();
    }
  }, [user, loading, router]);

  const fetchConsultations = async () => {
    try {
      // 获取用户token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No valid session');
        return;
      }

      const response = await fetch(`/api/consultations?userId=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConsultations(data.consultations || []);
      } else {
        console.error('获取问诊记录失败:', response.status, await response.text());
      }
    } catch (error) {
      console.error('获取问诊记录失败:', error);
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

  const getConsultationSummary = (questions: any[]) => {
    if (!questions || questions.length === 0) return '暂无问诊记录';
    return `完成了${questions.length}个问题的问诊`;
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

  if (selectedConsultation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm h-screen bg-gray-50 relative flex flex-col overflow-hidden">
          <header className="flex-shrink-0 bg-white px-4 py-4 border-b">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedConsultation(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-medium text-gray-900">问诊详情</h1>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formatDate(selectedConsultation.timestamp)}</span>
                </div>

                {selectedConsultation.tongueImage && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">舌诊图片</h3>
                    <img
                      src={selectedConsultation.tongueImage}
                      alt="舌诊图片"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="font-medium mb-2">问诊记录</h3>
                  <div className="space-y-2">
                    {selectedConsultation.questions.map((qa, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-sm text-gray-700 mb-1">问题{index + 1}：{qa.question}</p>
                        <p className="text-blue-600">{qa.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">体质分析报告</h3>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="whitespace-pre-line text-gray-800">
                      {selectedConsultation.analysis}
                    </div>
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
            {consultations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无问诊记录</h3>
                <p className="text-gray-600 mb-6">您还没有完成过问诊，快去体验一下吧！</p>
                <button
                  onClick={() => router.push('/consultation?mode=diagnosis')}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                  开始问诊
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-medium mb-2">问诊历史记录</h2>
                {consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedConsultation(consultation)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDate(consultation.timestamp)}</span>
                        </div>
                        <p className="text-gray-800 mb-2">{getConsultationSummary(consultation.questions)}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{consultation.analysis.slice(0, 100)}...</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {consultation.tongueImage && (
                          <img src={consultation.tongueImage} alt="舌诊" className="w-12 h-12 object-cover rounded border" />
                        )}
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
