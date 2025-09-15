'use client';

import React, { useState } from 'react';
import { FIVE_ELEMENTS_RELATIONS } from '@/types/five-elements';

interface FiveElementsData {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

interface FiveElementsChartProps {
  data: FiveElementsData;
  onElementClick?: (element: 'wood' | 'fire' | 'earth' | 'metal' | 'water') => void;
  size?: number;
}

export default function FiveElementsChart({ data, onElementClick, size = 300 }: FiveElementsChartProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.3;

  // 计算五边形顶点位置
  const getPointPosition = (index: number, offsetRadius: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180); // 72度间隔，-90度让第一个点在顶部
    return {
      x: centerX + offsetRadius * Math.cos(angle),
      y: centerY + offsetRadius * Math.sin(angle)
    };
  };

  // 生成五边形路径
  const generatePentagonPath = (values: number[]) => {
    if (values.length !== 5) return '';

    const points = values.map((value, index) => {
      // 标准化百分比到0-1范围，然后映射到半径
      const normalizedValue = Math.min(Math.max(value / 100, 0), 1);
      const pointRadius = radius * 0.3 + normalizedValue * radius * 0.7;
      return getPointPosition(index, pointRadius);
    });

    return points.map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';
  };

  // 获取元素的SVG路径
  const getElementPath = (element: string, index: number) => {
    const center = getPointPosition(index, radius * 0.15);
    const size = 25;

    switch (element) {
      case 'wood':
        return `M ${center.x} ${center.y - size/2} L ${center.x - size/3} ${center.y + size/3} L ${center.x + size/3} ${center.y + size/3} Z`;
      case 'fire':
        return `M ${center.x} ${center.y - size/2} Q ${center.x - size/3} ${center.y} ${center.x} ${center.y + size/3} Q ${center.x + size/3} ${center.y} ${center.x} ${center.y - size/2}`;
      case 'earth':
        return `M ${center.x - size/2} ${center.y} L ${center.x} ${center.y - size/2} L ${center.x + size/2} ${center.y} L ${center.x} ${center.y + size/2} Z`;
      case 'metal':
        return `M ${center.x - size/2} ${center.y} L ${center.x + size/2} ${center.y} M ${center.x} ${center.y - size/2} L ${center.x} ${center.y + size/2}`;
      case 'water':
        return `M ${center.x - size/2} ${center.y - size/4} Q ${center.x - size/4} ${center.y + size/4} ${center.x} ${center.y - size/4} Q ${center.x + size/4} ${center.y + size/4} ${center.x + size/2} ${center.y - size/4}`;
      default:
        return '';
    }
  };

  const elements = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
  const values = elements.map(element => data[element]);

  // 背景网格路径
  const gridPaths = [0.2, 0.4, 0.6, 0.8, 1.0].map(scale =>
    generatePentagonPath([20 * scale * 5, 20 * scale * 5, 20 * scale * 5, 20 * scale * 5, 20 * scale * 5])
  );

  // 数据多边形路径
  const dataPath = generatePentagonPath(values);

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="mb-2">
        {/* 背景网格 */}
        {gridPaths.map((path, index) => (
          <path
            key={index}
            d={path}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
            opacity={0.3 + index * 0.15}
          />
        ))}

        {/* 连接线 */}
        {elements.map((_, index) => {
          const point = getPointPosition(index, radius);
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={point.x}
              y2={point.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* 数据多边形 */}
        <path
          d={dataPath}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="rgb(59, 130, 246)"
          strokeWidth="2"
        />

        {/* 数据点 */}
        {elements.map((element, index) => {
          const value = data[element];
          const normalizedValue = Math.min(Math.max(value / 100, 0), 1);
          const pointRadius = radius * 0.3 + normalizedValue * radius * 0.7;
          const point = getPointPosition(index, pointRadius);
          const elementRelation = FIVE_ELEMENTS_RELATIONS.find(r => r.element === element);

          return (
            <g key={element}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill={elementRelation?.color || '#6b7280'}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-5 transition-all"
                onClick={() => onElementClick?.(element)}
                onMouseEnter={() => setHoveredElement(element)}
                onMouseLeave={() => setHoveredElement(null)}
              />
              <text
                x={point.x}
                y={point.y - 10}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-700"
              >
                {value.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* 五行符号 */}
        {elements.map((element, index) => {
          const elementRelation = FIVE_ELEMENTS_RELATIONS.find(r => r.element === element);
          const symbolPoint = getPointPosition(index, radius * 0.15);

          return (
            <g key={`symbol-${element}`}>
              <path
                d={getElementPath(element, index)}
                fill={elementRelation?.color || '#6b7280'}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onElementClick?.(element)}
                onMouseEnter={() => setHoveredElement(element)}
                onMouseLeave={() => setHoveredElement(null)}
              />
            </g>
          );
        })}

        {/* 元素标签 */}
        {elements.map((element, index) => {
          const elementRelation = FIVE_ELEMENTS_RELATIONS.find(r => r.element === element);
          const labelPoint = getPointPosition(index, radius * 1.2);

          return (
            <text
              key={`label-${element}`}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              className={`text-sm font-bold cursor-pointer ${
                hoveredElement === element ? 'scale-110' : ''
              } transition-transform`}
              fill={elementRelation?.color || '#6b7280'}
              onClick={() => onElementClick?.(element)}
              onMouseEnter={() => setHoveredElement(element)}
              onMouseLeave={() => setHoveredElement(null)}
            >
              {elementRelation?.name}
            </text>
          );
        })}
      </svg>

      {/* 图例 */}
      <div className="grid grid-cols-5 gap-2 w-full max-w-sm">
        {elements.map(element => {
          const elementRelation = FIVE_ELEMENTS_RELATIONS.find(r => r.element === element);
          return (
            <div
              key={`legend-${element}`}
              className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
              onClick={() => onElementClick?.(element)}
              onMouseEnter={() => setHoveredElement(element)}
              onMouseLeave={() => setHoveredElement(null)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: elementRelation?.color }}
              />
              <span className="text-xs text-gray-600">
                {elementRelation?.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}