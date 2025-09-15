'use client';

import { useState } from 'react';
import ThinkingAnimation from '@/components/ThinkingAnimation';
import WeChatThinkingAnimation from '@/components/WeChatThinkingAnimation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TestThinkingPage() {
  const [showAnimation, setShowAnimation] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </Link>
          <h1 className="text-lg font-medium text-gray-900">思考动画测试</h1>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">显示动画</span>
            <button
              onClick={() => setShowAnimation(!showAnimation)}
              className={`w-12 h-6 rounded-full transition-colors ${
                showAnimation ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  showAnimation ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-3">AI 消息示例：</div>
            
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              {showAnimation ? (
                <ThinkingAnimation className="text-sm leading-relaxed" />
              ) : (
                <div className="text-sm leading-relaxed text-gray-600">
                  你好！我是小煦，很高兴为你服务。有什么可以帮助你的吗？
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-800 mb-3">动画风格对比：</div>
            
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-2">原版动画：</div>
                <ThinkingAnimation className="text-sm" />
              </div>
              
              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-2">微信风格：</div>
                <WeChatThinkingAnimation className="text-sm" />
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• 动画会循环播放每个字符的跳跃效果</p>
            <p>• 每200ms切换一个字符高亮</p>
            <p>• 末尾有三个跳跃的小点</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Link 
              href="/consultation"
              className="block w-full bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              前往咨询页面测试
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}