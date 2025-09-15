'use client';

import React, { useRef } from 'react';
import { X } from 'lucide-react';
import ShareCard from './ShareCard';
import SharePlatforms from './SharePlatforms';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: {
    title: string;
    subtitle: string;
    description: string;
    advice?: string;
    userName?: string;
  };
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareData }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePlatformSelect = (platform: string) => {
    const shareText = `${shareData.title} - ${shareData.description}`;
    const shareUrl = window.location.href;
    
    switch (platform) {
      case 'wechat':
        // 微信分享逻辑
        if (navigator.share) {
          navigator.share({
            title: shareData.title,
            text: shareText,
            url: shareUrl,
          });
        } else {
          // 复制到剪贴板作为备选方案
          navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          alert('内容已复制到剪贴板，请粘贴到微信');
        }
        break;
      case 'moments':
        // 朋友圈分享逻辑
        if (navigator.share) {
          navigator.share({
            title: shareData.title,
            text: shareText,
            url: shareUrl,
          });
        } else {
          navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          alert('内容已复制到剪贴板，请粘贴到朋友圈');
        }
        break;
      case 'qq':
        // QQ分享逻辑
        const qqUrl = `mqqwpa://im/chat?chat_type=wpa&uin=${shareText}`;
        window.open(qqUrl, '_blank');
        break;
      case 'qzone':
        // QQ空间分享逻辑
        const qzoneUrl = `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareData.title)}&desc=${encodeURIComponent(shareText)}`;
        window.open(qzoneUrl, '_blank');
        break;
      case 'share':
        // 系统原生分享
        if (navigator.share) {
          navigator.share({
            title: shareData.title,
            text: shareText,
            url: shareUrl,
          });
        } else {
          navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          alert('内容已复制到剪贴板');
        }
        break;
    }
    
    onClose();
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: 'transparent',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      // 创建下载链接
      const link = document.createElement('a');
      link.download = `顺时养生-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      onClose();
    } catch (error) {
      console.error('保存图片失败:', error);
      alert('保存图片失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="w-full max-w-sm bg-white rounded-t-2xl animate-slide-up">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">分享到</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* 分享卡片预览 */}
        <div className="p-4 bg-gray-50">
          <div ref={cardRef}>
            <ShareCard
              title={shareData.title}
              subtitle={shareData.subtitle}
              description={shareData.description}
              advice={shareData.advice}
              userName={shareData.userName}
            />
          </div>
        </div>
        
        {/* 分享平台选择 */}
        <SharePlatforms
          onPlatformSelect={handlePlatformSelect}
          onSaveImage={handleSaveImage}
        />
        
        {/* 取消按钮 */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 text-center text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
          >
            取消
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ShareModal;
