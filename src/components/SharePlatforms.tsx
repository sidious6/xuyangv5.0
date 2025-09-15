'use client';

import React from 'react';
import { MessageCircle, Share2, Download, Users, Camera, Heart } from 'lucide-react';

interface SharePlatformsProps {
  onPlatformSelect: (platform: string) => void;
  onSaveImage: () => void;
}

const SharePlatforms: React.FC<SharePlatformsProps> = ({ onPlatformSelect, onSaveImage }) => {
  const platforms = [
    {
      id: 'wechat',
      name: '微信',
      icon: MessageCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      id: 'moments',
      name: '朋友圈',
      icon: Camera,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      id: 'qq',
      name: 'QQ',
      icon: MessageCircle,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      id: 'qzone',
      name: 'QQ空间',
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    }
  ];

  return (
    <div className="bg-white">
      {/* 分享平台选项 */}
      <div className="grid grid-cols-4 gap-3 p-4">
        {platforms.map((platform) => {
          const IconComponent = platform.icon;
          return (
            <button
              key={platform.id}
              onClick={() => onPlatformSelect(platform.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`w-10 h-10 ${platform.color} rounded-full flex items-center justify-center`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-700">{platform.name}</span>
            </button>
          );
        })}
      </div>
      
      {/* 分隔线 */}
      <div className="border-t border-gray-100"></div>
      
      {/* 底部操作按钮 */}
      <div className="flex">
        <button
          onClick={onSaveImage}
          className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">保存</span>
        </button>
        
        <div className="w-px bg-gray-200"></div>
        
        <button
          onClick={() => onPlatformSelect('share')}
          className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-50 transition-colors"
        >
          <Share2 className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">分享</span>
        </button>
      </div>
    </div>
  );
};

export default SharePlatforms;
