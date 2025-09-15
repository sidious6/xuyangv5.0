'use client';

import { useEffect, useState } from 'react';

interface WeChatThinkingAnimationProps {
  className?: string;
}

export default function WeChatThinkingAnimation({ className = '' }: WeChatThinkingAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const text = "小煦正在思考中";
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % text.length);
    }, 150); // 每150ms切换一个字符

    return () => clearInterval(interval);
  }, [text.length]);

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex">
        {text.split('').map((char, index) => (
          <span
            key={index}
            className={`inline-block transition-all duration-150 ease-out ${
              index === currentIndex 
                ? 'text-blue-500 scale-110 -translate-y-0.5' 
                : 'text-gray-600 scale-100 translate-y-0'
            }`}
          >
            {char}
          </span>
        ))}
      </div>
      
      {/* 微信风格的跳跃点点 */}
      <div className="flex ml-2 items-center space-x-0.5">
        <div 
          className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" 
          style={{ animationDelay: '0s', animationDuration: '1.2s' }}
        />
        <div 
          className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" 
          style={{ animationDelay: '0.2s', animationDuration: '1.2s' }}
        />
        <div 
          className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" 
          style={{ animationDelay: '0.4s', animationDuration: '1.2s' }}
        />
      </div>
    </div>
  );
}