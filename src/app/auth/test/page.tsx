'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthTestPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          身份验证测试页面
        </h1>

        {user ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                ✅ 登录成功
              </h2>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>用户ID:</strong> {user.id}</p>
                <p><strong>邮箱:</strong> {user.email}</p>
                <p><strong>姓名:</strong> {user.user_metadata?.full_name || '未设置'}</p>
                <p><strong>创建时间:</strong> {new Date(user.created_at).toLocaleString('zh-CN')}</p>
                <p><strong>邮箱验证:</strong> {user.email_confirmed_at ? '已验证' : '未验证'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                退出登录
              </button>
              
              <Link
                href="/"
                className="block w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-center"
              >
                返回主页
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                ⚠️ 未登录
              </h2>
              <p className="text-sm text-yellow-700">
                您当前未登录，请先登录或注册账户。
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-center"
              >
                去登录
              </Link>
              
              <Link
                href="/auth/register"
                className="block w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-center"
              >
                去注册
              </Link>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">测试步骤：</h3>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. 访问注册页面创建新账户</li>
            <li>2. 检查是否直接登录（无需邮箱验证）</li>
            <li>3. 退出登录后尝试重新登录</li>
            <li>4. 验证所有功能是否正常</li>
          </ol>
        </div>
      </div>
    </div>
  );
}