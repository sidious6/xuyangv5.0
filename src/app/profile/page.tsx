'use client';

import { ChevronRight, Settings, Bell, HelpCircle, Shield, Heart, Calendar, Award } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Mobile Container */}
      <div className="w-full max-w-sm h-screen bg-white relative flex flex-col overflow-hidden">
        {/* Fixed Status Bar */}
        <div className="flex-shrink-0 bg-white px-4 py-1 flex items-center justify-between text-sm font-medium">
          <div className="text-gray-900">9:41</div>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
            </div>
            <svg className="w-6 h-3 ml-1" viewBox="0 0 24 12" fill="none">
              <rect x="1" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1"/>
              <rect x="2" y="3" width="18" height="6" rx="1" fill="currentColor"/>
              <rect x="21" y="4" width="2" height="4" rx="1" fill="currentColor"/>
            </svg>
          </div>
        </div>

        {/* Fixed Header */}
        <header className="flex-shrink-0 bg-white px-4 py-4 border-b border-gray-200">
          <h1 className="text-xl font-medium text-gray-900">我的</h1>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50">
          {/* Profile Section */}
          <div className="bg-white mx-4 mt-4 p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center">
              <span className="text-purple-700 text-xl font-medium">煦</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-medium text-gray-900 mb-1">煦养用户</h2>
              <p className="text-sm text-gray-600">已坚持养生 15 天</p>
            </div>
            <button className="p-2">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900">15</div>
              <div className="text-xs text-gray-600">记录天数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900">8.2</div>
              <div className="text-xs text-gray-600">平均睡眠</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900">良好</div>
              <div className="text-xs text-gray-600">整体状态</div>
            </div>
          </div>
        </div>

        {/* Health Overview */}
        <div className="px-4 mt-6">
          <h3 className="text-base font-medium text-gray-900 mb-3">健康概览</h3>
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-xl mb-4">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">本周健康指数</span>
            </div>
            <div className="text-2xl font-medium text-gray-900 mb-1">85分</div>
            <p className="text-xs text-gray-700">比上周提升了5分，继续保持！</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-4 mt-6 pb-24">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Health Records */}
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-900">健康档案</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Achievements */}
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-900">成就徽章</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Notifications */}
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-900">消息通知</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>

            {/* Privacy */}
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm text-gray-900">隐私设置</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Help */}
            <button className="w-full flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm text-gray-900">帮助中心</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Settings */}
            <button className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm text-gray-900">设置</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          </div>
        </div>

        {/* Fixed Bottom Navigation */}
        <div className="flex-shrink-0">
          <nav className="bg-white border-t border-gray-200">
            <div className="flex justify-around items-center py-1">
              <Link href="/" className="flex flex-col items-center py-2 px-3">
                <div className="w-6 h-6 mb-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-400">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-400">记录</span>
              </Link>

              <Link href="/community" className="flex flex-col items-center py-2 px-3">
                <div className="w-6 h-6 mb-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-400">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01 1l-2.7 3.6L8.5 11H5c-.83 0-1.5.67-1.5 1.5S4.17 14 5 14h2.5l2.7-3.6L13 13v9h3z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-400">社区</span>
              </Link>

              <div className="flex flex-col items-center py-2 px-3">
                <div className="w-6 h-6 mb-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-900">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19A2 2 0 0 0 5 21H19A2 2 0 0 0 21 19V9M19 19H5V3H13V9H19Z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-900 font-medium">我的</span>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
