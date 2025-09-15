'use client';

import { useEffect, useState } from 'react';

interface ThinkingAnimationProps {
  className?: string;
}

export default function ThinkingAnimation({ className = '' }: ThinkingAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const text = "小煦正在思考中";
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % text.length);
    }, 180); // 每180ms切换一个字符的动画

    return () => clearInterval(interval);
  }, [text.length]);

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex">
        {text.split('').map((char, index) => (
          <span
            key={index}
            className={`inline-block transition-all duration-200 ease-out ${
              index === currentIndex 
                ? 'text-blue-500 scale-105 -translate-y-0.5 font-medium' 
                : 'text-gray-600 scale-100 translate-y-0'
            }`}
            style={{
              transitionDelay: `${index * 20}ms`,
            }}
          >
            {char}
          </span>
        ))}
      </div>
      
      {/* 跳跃的点点 */}
      <div className="flex ml-2 items-end">
        <span 
          className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" 
          style={{ animationDelay: '0s', animationDuration: '0.8s' }}
        />
        <span 
          className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce mx-0.5" 
          style={{ animationDelay: '0.15s', animationDuration: '0.8s' }}
        />
        <span 
          className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" 
          style={{ animationDelay: '0.3s', animationDuration: '0.8s' }}
        />
      </div>
    </div>
  );
}