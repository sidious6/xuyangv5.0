import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用实验性功能
  experimental: {
    // 优化服务器组件
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },

  // 图片优化配置
  images: {
    domains: ['uvdsfdlshxpktxihdbar.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },

  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // 头部配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
