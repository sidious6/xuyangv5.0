'use client';

import { useState, useEffect } from 'react';

interface FiveElementsRatio {
  木: number;
  火: number;
  土: number;
  金: number;
  水: number;
}

interface FiveElementsDisplayProps {
  userId?: string;
  ratio?: FiveElementsRatio;
  showTitle?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const elementColors = {
  木: 'bg-green-500',
  火: 'bg-red-500',
  土: 'bg-yellow-500',
  金: 'bg-gray-500',
  水: 'bg-blue-500'
};

const elementBgColors = {
  木: 'bg-green-100',
  火: 'bg-red-100',
  土: 'bg-yellow-100',
  金: 'bg-gray-100',
  水: 'bg-blue-100'
};

export default function FiveElementsDisplay({ 
  userId, 
  ratio, 
  showTitle = true, 
  size = 'medium' 
}: FiveElementsDisplayProps) {
  const [fiveElementsRatio, setFiveElementsRatio] = useState<FiveElementsRatio | null>(ratio || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 如果没有传入ratio但有userId，则从API获取
  useEffect(() => {
    if (!ratio && userId) {
      fetchFiveElementsRatio();
    }
  }, [userId, ratio]);

  const fetchFiveElementsRatio = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/profile/birth-info?userId=${userId}`);
      const data = await response.json();

      if (data.success && data.data.fiveElementsRatio) {
        setFiveElementsRatio(data.data.fiveElementsRatio);
      } else {
        setError('未找到五行数据');
      }
    } catch (err) {
      console.error('获取五行比例失败:', err);
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算最大值用于进度条
  const maxValue = fiveElementsRatio ? Math.max(...Object.values(fiveElementsRatio)) : 0;

  // 根据size确定样式
  const sizeClasses = {
    small: {
      container: 'text-sm',
      element: 'p-2',
      bar: 'h-2',
      text: 'text-xs'
    },
    medium: {
      container: 'text-base',
      element: 'p-3',
      bar: 'h-3',
      text: 'text-sm'
    },
    large: {
      container: 'text-lg',
      element: 'p-4',
      bar: 'h-4',
      text: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm">{error}</p>
        {userId && (
          <button 
            onClick={fetchFiveElementsRatio}
            className="mt-2 text-blue-500 text-sm hover:underline"
          >
            重试
          </button>
        )}
      </div>
    );
  }

  if (!fiveElementsRatio) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">暂无五行数据</p>
        <p className="text-xs text-gray-400 mt-1">完成体质测试后显示</p>
      </div>
    );
  }

  // 检查是否所有值都为0
  const isAllZero = Object.values(fiveElementsRatio).every(value => value === 0);
  if (isAllZero) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">五行数据计算中...</p>
        <p className="text-xs text-gray-400 mt-1">请完成体质测试以获取准确数据</p>
      </div>
    );
  }

  return (
    <div className={`${classes.container}`}>
      {showTitle && (
        <h3 className="font-semibold text-gray-800 mb-4">五行比例</h3>
      )}
      
      <div className="space-y-3">
        {Object.entries(fiveElementsRatio).map(([element, value]) => (
          <div key={element} className="flex items-center space-x-3">
            {/* 元素名称 */}
            <div className={`${classes.element} ${elementBgColors[element as keyof typeof elementBgColors]} rounded-lg flex items-center justify-center min-w-[3rem] font-medium`}>
              {element}
            </div>
            
            {/* 进度条 */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className={`${classes.text} text-gray-600`}>{value.toFixed(1)}%</span>
              </div>
              <div className={`${classes.bar} bg-gray-200 rounded-full overflow-hidden`}>
                <div 
                  className={`h-full ${elementColors[element as keyof typeof elementColors]} transition-all duration-500 ease-out`}
                  style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 总和验证（调试用） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400">
          总和: {Object.values(fiveElementsRatio).reduce((sum, val) => sum + val, 0).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
