'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HealthReportUploadProps {
  onUploadComplete?: (report: any) => void;
  className?: string;
}

interface Report {
  id: string;
  title: string;
  report_type: string;
  file_url: string;
  file_name: string;
  status: string;
  created_at: string;
}

const reportTypes = [
  { id: 'blood_test', name: '血液检查' },
  { id: 'urine_test', name: '尿液检查' },
  { id: 'imaging', name: '影像检查' },
  { id: 'general', name: '常规体检' },
  { id: 'other', name: '其他' }
];

export default function HealthReportUpload({ onUploadComplete, className = '' }: HealthReportUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('general');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('不支持的文件类型。支持的格式：JPEG, PNG, GIF, PDF, DOC, DOCX');
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('文件过大。最大支持10MB');
        return;
      }

      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim() || !user) {
      setError('请选择文件并填写标题');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('reportType', reportType);

      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/health-reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.ok) {
        // Reset form
        setSelectedFile(null);
        setTitle('');
        setReportType('general');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        if (onUploadComplete) {
          onUploadComplete(result.report);
        }
      } else {
        setError(result.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return '上传中';
      case 'processing':
        return '分析中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {!selectedFile ? (
          <div className="space-y-2">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={isUploading}
              >
                点击选择文件
              </button>
              <span className="text-gray-500"> 或拖拽文件到此处</span>
            </div>
            <p className="text-sm text-gray-500">
              支持 JPEG, PNG, GIF, PDF, DOC, DOCX 格式，最大 10MB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <FileText className="w-12 h-12 text-blue-500 mx-auto" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setTitle('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              <X className="w-4 h-4 inline mr-1" />
              重新选择
            </button>
          </div>
        )}
      </div>

      {/* Form Fields */}
      {selectedFile && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              报告标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入报告标题"
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              报告类型 *
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUploading}
            >
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading || !title.trim()}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                上传中...
              </>
            ) : (
              '上传报告'
            )}
          </button>
        </div>
      )}
    </div>
  );
}