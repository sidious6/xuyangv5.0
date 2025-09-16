'use client';

import React, { useState } from 'react';
import { FIVE_ELEMENTS_RELATIONS } from '@/types/five-elements';

interface FiveElementsRelationProps {
  onElementClick?: (element: 'wood' | 'fire' | 'earth' | 'metal' | 'water') => void;
  size?: number;
  fiveElementsRatio?: {
    木: number;
    火: number;
    土: number;
    金: number;
    水: number;
  };
  userDayMasterElement?: string; // 用户的日干五行属性
}

export default function FiveElementsRelation({ onElementClick, size = 320, fiveElementsRatio, userDayMasterElement }: FiveElementsRelationProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [clickedElement, setClickedElement] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const centerX = size / 2;
  const centerY = size / 2;
  const circleRadius = size * 0.32;

  // 计算圆上五等分点的位置 - 木在顶部开始，顺时针排列
  const getElementPosition = (index: number, radius: number = circleRadius) => {
    const angle = (index * 72 - 90) * (Math.PI / 180); // 72度间隔，-90度让第一个点在顶部
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  // 创建箭头标记
  const createArrowMarker = (id: string, color: string) => (
    <defs>
      <marker
        id={id}
        markerWidth="6"
        markerHeight="6"
        refX="5"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L6,3 z" fill={color} />
      </marker>
    </defs>
  );

  const elements = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
  const positions = elements.map((_, index) => getElementPosition(index));

  // 获取元素的比例值
  const getElementRatio = (element: string): number => {
    if (!fiveElementsRatio) return 0;
    const elementMap = {
      'wood': '木',
      'fire': '火', 
      'earth': '土',
      'metal': '金',
      'water': '水'
    } as const;
    
    const chineseName = elementMap[element as keyof typeof elementMap];
    return fiveElementsRatio[chineseName] || 0;
  };

  // 获取五行元素的显示信息
  const getElementInfo = (element: string) => {
    const relation = FIVE_ELEMENTS_RELATIONS.find(r => r.element === element);
    return relation;
  };

  // 获取器官图标
  const getOrganIcon = (element: string) => {
    const iconProps = {
      width: "12",
      height: "12",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      className: element === 'metal' ? "text-gray-700" : "text-white/70"
    };

    switch (element) {
      case 'wood': // 肝
        return (
          <svg {...iconProps}>
            <path d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.5 4.5 3.5 5.5.5.3 1 .5 1.5.5h2c.5 0 1-.2 1.5-.5C16.5 12.5 18 10.5 18 8c0-3.5-2.5-6-6-6zm0 10c-2 0-4-1.5-4-4s2-4 4-4 4 1.5 4 4-2 4-4 4z"/>
          </svg>
        );
      case 'fire': // 心
        return (
          <svg {...iconProps}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        );
      case 'earth': // 脾胃
        return (
          <svg {...iconProps}>
            <path d="M12 2C8.69 2 6 4.69 6 8v8c0 3.31 2.69 6 6 6s6-2.69 6-6V8c0-3.31-2.69-6-6-6zm2 12c0 1.1-.9 2-2 2s-2-.9-2-2v-4c0-1.1.9-2 2-2s2 .9 2 2v4z"/>
          </svg>
        );
      case 'metal': // 肺
        return (
          <svg {...iconProps}>
            <path d="M12 2C7.58 2 4 5.58 4 10c0 2.21.9 4.21 2.35 5.65L12 21.31l5.65-5.66C19.1 14.21 20 12.21 20 10c0-4.42-3.58-8-8-8zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
          </svg>
        );
      case 'water': // 肾
        return (
          <svg {...iconProps}>
            <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2zm0 15c-1.38 0-2.5-1.12-2.5-2.5S10.62 12 12 12s2.5 1.12 2.5 2.5S13.38 17 12 17z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes ripple {
            0% {
              r: 28px;
              opacity: 0.6;
            }
            50% {
              opacity: 0.3;
            }
            100% {
              r: 80px;
              opacity: 0;
            }
          }
          .ripple-animation {
            animation: ripple 10s ease-out forwards;
          }
          .ripple-animation-delay-1 {
            animation: ripple 10s ease-out 1s forwards;
          }
          .ripple-animation-delay-2 {
            animation: ripple 10s ease-out 2s forwards;
          }
        `
      }} />
      <svg width={size} height={size} className="mx-auto">
        {/* 定义箭头标记 */}
        {createArrowMarker('keArrow', '#dc2626')}
        {createArrowMarker('shengArrow', '#16a34a')}
        
        {/* 背景圆圈 */}
        <circle
          cx={centerX}
          cy={centerY}
          r={circleRadius + 10}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.3"
        />

        {/* 相生关系 - 顺时针五角形连接 */}
        {elements.map((element, index) => {
          const relation = getElementInfo(element);
          if (!relation) return null;

          const targetIndex = elements.indexOf(relation.generates as any);
          if (targetIndex === -1) return null;

          const startPos = positions[index];
          const endPos = positions[targetIndex];
          
          // 计算线条的实际起点和终点，避免被圆圈遮挡
          const dx = endPos.x - startPos.x;
          const dy = endPos.y - startPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / distance;
          const unitY = dy / distance;
          
          // 圆圈半径是28，所以起点和终点各向内缩进30像素
          const start = {
            x: startPos.x + unitX * 30,
            y: startPos.y + unitY * 30
          };
          const end = {
            x: endPos.x - unitX * 30,
            y: endPos.y - unitY * 30
          };

          // 判断是否应该高亮这条线 - 相生关系
          const isHighlighted = selectedElement === element || selectedElement === relation.generates;

          return (
            <g key={`sheng-${element}`}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={isHighlighted ? "#16a34a" : "#16a34a"}
                strokeWidth={isHighlighted ? "4" : "2"}
                markerEnd="url(#shengArrow)"
                opacity={isHighlighted ? "1" : "0.3"}
                className="transition-all duration-300"
              />
            </g>
          );
        })}

        {/* 相克关系 - 正确的五角星连接 */}
        {elements.map((element, index) => {
          const relation = getElementInfo(element);
          if (!relation) return null;

          const targetIndex = elements.indexOf(relation.restricts as any);
          if (targetIndex === -1) return null;

          const startPos = positions[index];
          const endPos = positions[targetIndex];
          
          // 计算线条的实际起点和终点，避免被圆圈遮挡
          const dx = endPos.x - startPos.x;
          const dy = endPos.y - startPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / distance;
          const unitY = dy / distance;
          
          // 圆圈半径是28，所以起点和终点各向内缩进30像素
          const start = {
            x: startPos.x + unitX * 30,
            y: startPos.y + unitY * 30
          };
          const end = {
            x: endPos.x - unitX * 30,
            y: endPos.y - unitY * 30
          };

          // 判断是否应该高亮这条线
          const isHighlighted = selectedElement === element || selectedElement === relation.restricts;

          return (
            <g key={`ke-${element}`}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={isHighlighted ? "#dc2626" : "#dc2626"}
                strokeWidth={isHighlighted ? "4" : "3"}
                markerEnd="url(#keArrow)"
                opacity={isHighlighted ? "1" : "0.4"}
                className="transition-all duration-300"
              />
            </g>
          );
        })}

        {/* 五行元素圆圈 */}
        {elements.map((element, index) => {
          const position = positions[index];
          const relation = getElementInfo(element);
          const isClicked = clickedElement === element;
          const ratio = getElementRatio(element);
          const maxRatio = fiveElementsRatio ? Math.max(...Object.values(fiveElementsRatio)) : 100;

          const handleElementClick = () => {
            setClickedElement(element);
            setSelectedElement(selectedElement === element ? null : element); // 切换选中状态
            setTimeout(() => setClickedElement(null), 10000); // 动画持续时间10秒
            onElementClick?.(element);
          };

          // 计算填充高度（基于比例）
          const fillHeight = ratio > 0 ? (ratio / maxRatio) * 56 : 0; // 56是直径
          const fillY = position.y + 28 - fillHeight; // 从底部开始填充

          return (
            <g key={`circle-${element}`}>
              {/* 点击时的水波纹扩散效果 */}
              {isClicked && (
                <>
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r="28"
                    fill="none"
                    stroke={element === 'metal' ? '#f59e0b' : relation?.color || '#6b7280'}
                    strokeWidth="3"
                    opacity="0.6"
                    className="ripple-animation"
                  />
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r="28"
                    fill="none"
                    stroke={element === 'metal' ? '#f59e0b' : relation?.color || '#6b7280'}
                    strokeWidth="2"
                    opacity="0.4"
                    className="ripple-animation-delay-1"
                  />
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r="28"
                    fill="none"
                    stroke={element === 'metal' ? '#f59e0b' : relation?.color || '#6b7280'}
                    strokeWidth="1"
                    opacity="0.2"
                    className="ripple-animation-delay-2"
                  />
                </>
              )}
              
              {/* 高亮外圈 */}
              {selectedElement === element && (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="32"
                  fill="none"
                  stroke={element === 'metal' ? '#f59e0b' : relation?.color || '#6b7280'}
                  strokeWidth="3"
                  opacity="0.8"
                  className="animate-pulse"
                />
              )}

              {/* 定义裁剪路径用于圆形填充 */}
              <defs>
                <clipPath id={`clip-${element}-${index}`}>
                  <circle cx={position.x} cy={position.y} r="25" />
                </clipPath>
              </defs>
              
              {/* 背景圆圈（空的部分） */}
              <circle
                cx={position.x}
                cy={position.y}
                r="28"
                fill="#f3f4f6"
                stroke={element === 'metal' ? '#f59e0b' : '#ffffff'}
                strokeWidth="3"
                className="cursor-pointer transition-all duration-300"
                onClick={handleElementClick}
                filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.2))"
                opacity={selectedElement && selectedElement !== element ? "0.6" : "1"}
              />

              {/* 比例填充部分 */}
              {ratio > 0 && (
                <rect
                  x={position.x - 25}
                  y={fillY}
                  width="50"
                  height={fillHeight}
                  fill={
                    element === 'metal' ? '#fbbf24' : // 金元素使用黄色
                    element === 'earth' ? '#92400e' : // 土元素使用棕色
                    element === 'water' ? '#6b7280' : // 水元素使用较浅的灰色
                    relation?.color || '#6b7280'
                  }
                  clipPath={`url(#clip-${element}-${index})`}
                  className="cursor-pointer transition-all duration-500"
                  onClick={handleElementClick}
                  opacity={
                    selectedElement && selectedElement !== element ? "0.6" : 
                    element === 'water' ? "0.7" : // 水元素更透明
                    "0.9"
                  }
                />
              )}

              {/* 外圈边框 */}
              <circle
                cx={position.x}
                cy={position.y}
                r="28"
                fill="none"
                stroke={element === 'metal' ? '#f59e0b' : '#ffffff'}
                strokeWidth="3"
                className="cursor-pointer transition-all duration-300"
                onClick={handleElementClick}
                filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.2))"
                opacity={selectedElement && selectedElement !== element ? "0.6" : "1"}
              />
              
              {/* 元素文字 */}
              <text
                x={position.x}
                y={position.y - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-sm font-bold cursor-pointer select-none transition-all duration-300 ${
                  element === 'metal' ? 'fill-gray-800' : 'fill-gray-800'
                }`}
                onClick={handleElementClick}
                filter="drop-shadow(1px 1px 2px rgba(255,255,255,0.8))"
                opacity={selectedElement && selectedElement !== element ? "0.6" : "1"}
              >
                {relation?.name}
              </text>

              {/* 比例数字 */}
              {fiveElementsRatio && (
                <text
                  x={position.x}
                  y={position.y + 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-xs font-semibold cursor-pointer select-none transition-all duration-300 ${
                    element === 'metal' ? 'fill-gray-800' : 'fill-gray-800'
                  }`}
                  onClick={handleElementClick}
                  filter="drop-shadow(1px 1px 2px rgba(255,255,255,0.8))"
                  opacity={selectedElement && selectedElement !== element ? "0.6" : "1"}
                >
                  {ratio.toFixed(1)}%
                </text>
              )}
              
              {/* 器官图标 - 在球内底部 */}
              <foreignObject
                x={position.x - 6}
                y={position.y + 14}
                width="12"
                height="12"
                className="pointer-events-none"
                opacity={selectedElement && selectedElement !== element ? "0.6" : "0.7"}
              >
                {getOrganIcon(element)}
              </foreignObject>

              {/* 日干五行属性标识 - 皇冠图标 */}
              {userDayMasterElement === element && (
                <g>
                  {/* 皇冠背景圆圈 */}
                  <circle
                    cx={position.x}
                    cy={position.y - 35}
                    r="10"
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                  {/* 皇冠图标 */}
                  <foreignObject
                    x={position.x - 6}
                    y={position.y - 41}
                    width="12"
                    height="12"
                    className="pointer-events-none"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 16L3 7l5.5 5L12 4l3.5 8L21 7l-2 9H5z" fill="white" stroke="none"/>
                    </svg>
                  </foreignObject>
                  {/* 标签文字 */}
                  <text
                    x={position.x}
                    y={position.y - 50}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-bold fill-yellow-600"
                    filter="drop-shadow(1px 1px 2px rgba(255,255,255,0.8))"
                  >
                    本命
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>


      {/* 相生相克关系说明 */}
      <div className="mt-4 space-y-3">
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
            <div className="w-4 h-1 bg-green-600 rounded"></div>
            <span className="text-sm text-green-700 font-medium">相生关系</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full">
            <div className="w-4 h-1 bg-red-600 rounded"></div>
            <span className="text-sm text-red-700 font-medium">相克关系</span>
          </div>
        </div>
        <div className="text-center space-y-1">
          
        </div>
      </div>
    </div>
  );
}