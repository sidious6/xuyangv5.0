import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // 打字速度，毫秒
  onComplete?: () => void; // 打字完成回调
  className?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 50, 
  onComplete,
  className = '' 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, getCharDelay(text[currentIndex]));

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  // 重置组件当文本改变时
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  // 根据字符类型调整打字速度
  const getCharDelay = (char: string): number => {
    if (/[\u4e00-\u9fa5]/.test(char)) {
      return speed; // 中文字符
    } else if (/[。，！？；：]/.test(char)) {
      return speed * 3; // 标点符号稍作停顿
    } else if (char === '\n') {
      return speed * 2; // 换行稍作停顿
    } else {
      return speed * 0.6; // 英文字符和数字更快
    }
  };

  return (
    <div className={className}>
      {displayedText}
    </div>
  );
};

export default TypewriterText;