'use client';

import { useState, useEffect } from 'react';
import { FileText, BarChart3, TrendingUp, AlertTriangle, CheckCircle, Eye, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HealthReportDisplayProps {
  reportId?: string;
  onAnalysisComplete?: (analysis: any) => void;
}

interface HealthReport {
  id: string;
  title: string;
  report_type: string;
  file_url: string;
  file_name: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  extracted_data?: any;
  tcm_interpretation?: string;
  recommendations?: string[];
  created_at: string;
}

interface Indicator {
  name: string;
  value: string;
  unit?: string;
  reference_range?: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  category: string;
}

export default function HealthReportDisplay({ reportId, onAnalysisComplete }: HealthReportDisplayProps) {
  const { user } = useAuth();
  const [report, setReport] = useState<HealthReport | null>(null);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [tcmAnalysis, setTcmAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reportId) {
      fetchReport(reportId);
    }
  }, [reportId]);

  const fetchReport = async (id: string) => {
    if (!user) return;

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/health-reports', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      const result = await response.json();
      if (result.ok) {
        const foundReport = result.reports.find((r: HealthReport) => r.id === id);
        if (foundReport) {
          setReport(foundReport);
          if (foundReport.extracted_data?.indicators) {
            setIndicators(foundReport.extracted_data.indicators);
          }
          if (foundReport.tcm_interpretation) {
            setTcmAnalysis(JSON.parse(foundReport.tcm_interpretation));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('获取报告失败');
    }
  };

  const handleAnalyze = async () => {
    if (!report || !user) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/health-reports/${report.id}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      const result = await response.json();
      if (result.ok) {
        // Refetch the report to get updated analysis
        await fetchReport(report.id);
        if (onAnalysisComplete) {
          onAnalysisComplete(result.analysis);
        }
      } else {
        setError(result.error || '分析失败');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('分析过程中出现错误');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      case 'critical':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal':
        return '正常';
      case 'high':
        return '偏高';
      case 'low':
        return '偏低';
      case 'critical':
        return '异常';
      default:
        return '未知';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="w-4 h-4" />;
      case 'high':
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'low':
        return <TrendingUp className="w-4 h-4 rotate-180" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  if (!report) {
    return <div className="text-gray-500 text-center py-4">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">{report.title}</h3>
              <p className="text-sm text-gray-500">{report.file_name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(report.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              report.status === 'completed' ? 'bg-green-100 text-green-700' :
              report.status === 'processing' ? 'bg-blue-100 text-blue-700' :
              report.status === 'failed' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {report.status === 'completed' ? '已完成' :
               report.status === 'processing' ? '分析中' :
               report.status === 'failed' ? '失败' : '上传中'}
            </span>
            <button
              onClick={() => window.open(report.file_url, '_blank')}
              className="text-gray-400 hover:text-gray-600"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {report.status === 'uploading' && (
          <div className="mt-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">报告已上传，等待AI分析...</p>
            </div>
          </div>
        )}

        {report.status === 'uploading' && (
          <div className="mt-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? '分析中...' : '开始AI分析'}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Indicators Chart */}
      {indicators.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            检查指标
          </h4>
          <div className="space-y-2">
            {indicators.slice(0, 8).map((indicator, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-2">
                  {getStatusIcon(indicator.status)}
                  <div>
                    <span className="text-sm font-medium text-gray-900">{indicator.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{indicator.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {indicator.value} {indicator.unit}
                  </span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(indicator.status)}`}>
                    {getStatusText(indicator.status)}
                  </span>
                </div>
              </div>
            ))}
            {indicators.length > 8 && (
              <div className="text-center py-2">
                <span className="text-xs text-gray-500">
                  还有 {indicators.length - 8} 项指标...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TCM Analysis */}
      {tcmAnalysis && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">中医解读</h4>

          {tcmAnalysis.tcm_diagnosis && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">辨证分析</h5>
              <p className="text-sm text-gray-600 leading-relaxed">{tcmAnalysis.tcm_diagnosis}</p>
            </div>
          )}

          {tcmAnalysis.five_elements_analysis && Object.keys(tcmAnalysis.five_elements_analysis).length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">五行分析</h5>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(tcmAnalysis.five_elements_analysis).map(([element, analysis]: [string, any]) => (
                  <div key={element} className="text-center p-2 bg-white rounded-lg">
                    <div className="text-xs font-medium text-gray-900 mb-1">
                      {element === 'wood' ? '木' :
                       element === 'fire' ? '火' :
                       element === 'earth' ? '土' :
                       element === 'metal' ? '金' : '水'}
                    </div>
                    <div className="text-xs text-gray-500">{analysis}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tcmAnalysis.recommendations && tcmAnalysis.recommendations.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">调理建议</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {tcmAnalysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tcmAnalysis.precautions && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">注意事项</h5>
              <p className="text-sm text-gray-600 leading-relaxed">{tcmAnalysis.precautions}</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-sm text-blue-800 font-medium">AI正在分析您的体检报告</p>
              <p className="text-xs text-blue-600">这可能需要几分钟时间，请稍候...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}