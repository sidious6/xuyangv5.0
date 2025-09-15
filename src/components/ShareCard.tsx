'use client';

import React from 'react';
import { Calendar, Heart, BookOpen, Leaf, Sun, Moon } from 'lucide-react';

interface ShareCardProps {
  title: string;
  subtitle: string;
  description: string;
  advice?: string;
  userName?: string;
  date?: string;
}

const ShareCard: React.FC<ShareCardProps> = ({
  title,
  subtitle,
  description,
  advice,
  userName = "用户",
  date = new Date().toLocaleDateString('zh-CN')
}) => {
  return (
    <div className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-2xl p-4 shadow-lg border border-gray-100 max-w-sm mx-auto">
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100/30 to-blue-100/30 rounded-full -mr-12 -mt-12 blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-yellow-100/30 to-green-100/30 rounded-full -ml-10 -mb-10 blur-xl"></div>
      
      {/* 顶部标题区域 */}
      <div className="relative z-10 text-center mb-4">
        <div className="text-xs text-gray-500 mb-1">@{userName}的今日养生</div>
        <div className="text-base font-semibold text-gray-800 mb-2">"{title}"</div>
        
        {/* 养生图标区域 - 缩小 */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-b from-green-200 to-green-400 rounded-full shadow-md mb-2 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
            <Leaf className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="text-xs text-gray-600 bg-white/70 rounded-full px-2 py-1 inline-block">
          {subtitle || date}
        </div>
      </div>
      
      {/* AI养生师建议 - 简化 */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <Heart className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">AI养生师</span>
        </div>
        
        <div className="text-sm font-medium text-gray-800 mb-1">
          {advice && advice.length > 40 ? advice.substring(0, 40) + '...' : (advice || "顺时而养，健康相伴")}
        </div>
        
        <div className="text-xs text-gray-600 leading-relaxed">
          {description.length > 60 ? description.substring(0, 60) + '...' : description}
        </div>
      </div>
      
      {/* 底部品牌标识 - 简化 */}
      <div className="relative z-10 flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
            <Leaf className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">煦养</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">AI 智能健康管家</div>
          {/* 二维码占位 - 缩小 */}
          <div className="w-8 h-8 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
            <div className="grid grid-cols-3 gap-px">
              {[...Array(9)].map((_, i) => (
                <div key={i} className={`w-0.5 h-0.5 ${i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-400'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
