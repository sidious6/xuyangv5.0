'use client';

import React, { useEffect, useState } from 'react';

interface LineChartProps {
  data: Array<{
    date: string;
    [key: string]: number | string;
  }>;
  lines: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  width?: number;
  height?: number;
  showLegend?: boolean;
}

export default function LineChart({
  data,
  lines,
  width = 600,
  height = 300,
  showLegend = true
}: LineChartProps) {
  const [windowWidth, setWindowWidth] = useState(600);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // 设置初始宽度
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-gray-500">暂无数据</p>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = Math.max(600, windowWidth - 40) - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 找到数据的最大值和最小值
  const allValues = data.flatMap(d =>
    lines.map(line => Number(d[line.key]) || 0)
  );
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;

  // 计算X轴和Y轴的比例
  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) =>
    chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // 生成路径数据
  const generatePath = (lineKey: string) => {
    return data.map((d, i) => {
      const x = xScale(i) + padding.left;
      const y = yScale(Number(d[lineKey]) || 0) + padding.top;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // 生成网格线
  const gridLines = Array.from({ length: 6 }, (_, i) => {
    const y = padding.top + (i * chartHeight / 5);
    const value = maxValue - (i * valueRange / 5);
    return { y, value };
  });

  // 生成X轴标签
  const xLabels = data.map((d, i) => {
    const x = xScale(i) + padding.left;
    const date = new Date(d.date);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    return { x, label };
  });

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {/* 背景网格 */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={width - padding.right}
              y2={line.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={line.y + 4}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              {Math.round(line.value)}
            </text>
          </g>
        ))}

        {/* X轴 */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#374151"
          strokeWidth="2"
        />

        {/* X轴标签 */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {label.label}
          </text>
        ))}

        {/* 数据线 */}
        {lines.map(line => (
          <g key={line.key}>
            <path
              d={generatePath(line.key)}
              fill="none"
              stroke={line.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 数据点 */}
            {data.map((d, i) => (
              <circle
                key={i}
                cx={xScale(i) + padding.left}
                cy={yScale(Number(d[line.key]) || 0) + padding.top}
                r="3"
                fill={line.color}
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </g>
        ))}
      </svg>

      {/* 图例 */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {lines.map(line => (
            <div key={line.key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: line.color }}
              />
              <span className="text-sm text-gray-700">{line.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}