'use client';

import { useState, useRef } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, ArrowLeft, Bookmark, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'following'>('recommend');
  const [showComposer, setShowComposer] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerImages, setComposerImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feeds, setFeeds] = useState({
    recommend: [
      { id: 1, user: '老中医A', time: '3分钟前', type: 'image' as const, title: '郁金香花园', likes: 21, comments: 4, liked: false, bookmarked: false },
      { id: 2, user: '老中医B', time: '2小时前', type: 'text' as const, text: '今日养生，当以滋阴润肺为要，宜收敛神气，使心神安宁。', likes: 6, comments: 18, liked: false, bookmarked: false },
    ],
    following: [
      { id: 101, user: '好友C', time: '刚刚', type: 'text' as const, text: '晨练八段锦，气血舒畅。', likes: 2, comments: 0, liked: false, bookmarked: false },
      { id: 102, user: '好友D', time: '1小时前', type: 'image' as const, title: '山药薏米粥', likes: 8, comments: 3, liked: false, bookmarked: false },
    ],
  });
  const posts = feeds[activeTab];

  const [comments, setComments] = useState<Record<number, Array<{ id: number; user: string; text: string; time: string }>>>(
    {
      1: [{ id: 1, user: '用户X', text: '好美的花园', time: '刚刚' }],
      2: [{ id: 2, user: '用户Y', text: '学习了', time: '1分钟前' }],
      102: [{ id: 3, user: '用户Z', text: '看起来好好吃', time: '3分钟前' }],
    }
  );
  const [showCommentsFor, setShowCommentsFor] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');

  function toggleLike(id: number) {
    setFeeds(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p)
    }));
  }

  function toggleBookmark(id: number) {
    setFeeds(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p)
    }));
  }

  function openComments(id: number) {
    setShowCommentsFor(id);
    setNewComment('');
  }

  function submitComment() {
    if (!showCommentsFor || !newComment.trim()) return;
    const comment = { id: Date.now(), user: '我', text: newComment.trim(), time: '刚刚' };
    setComments(prev => ({
      ...prev,
      [showCommentsFor]: [...(prev[showCommentsFor] || []), comment]
    }));
    setFeeds(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(p => p.id === showCommentsFor ? { ...p, comments: p.comments + 1 } : p)
    }));
    setNewComment('');
  }

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

        {/* Fixed Header with Tabs */}
        <div className="flex-shrink-0 px-4 py-4 bg-white border-b border-transparent">
          <div className="relative mb-4">
            {/* Centered tabs */}
            <div className="flex justify-center gap-8">
              <button
                onClick={() => setActiveTab('recommend')}
                className={`text-base ${activeTab === 'recommend' ? 'text-black font-medium' : 'text-gray-500'}`}
              >
                推荐
              </button>
              <div className="relative">
                <button
                  onClick={() => setActiveTab('following')}
                  className={`text-base ${activeTab === 'following' ? 'text-black font-medium' : 'text-gray-500'}`}
                >
                  关注
                </button>
                {activeTab === 'following' && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-black rounded-full"></div>
                )}
              </div>
            </div>
            {/* Floating add button */}
            <button onClick={() => setShowComposer(true)} className="absolute right-0 top-0 p-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Posts Feed */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-4 space-y-6 pb-24">
            {posts.map((post) => (
              <div key={post.id} className="bg-white">
                {/* User Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${post.id % 2 ? 'bg-gray-200' : 'bg-blue-200'}`}>
                      <span className={`text-xs font-medium ${post.id % 2 ? 'text-gray-600' : 'text-blue-600'}`}>{post.user[0]}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{post.user}</h3>
                      <p className="text-xs text-gray-500">{post.time}</p>
                    </div>
                  </div>
                  <button>
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Post Body */}
                {post.type === 'image' ? (
                  <div className="mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-orange-200 to-red-200">
                    <div className="w-full h-64 flex items-center justify-center">
                      <div className="text-center text-gray-600">
                        <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">{post.title}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <p className="text-sm text-gray-900 leading-relaxed">{post.text}</p>
                  </div>
                )}

                {/* Engagement Actions */}
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1">
                    <Heart className={`w-5 h-5 ${post.liked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                    <span className="text-sm text-gray-600">{post.likes}</span>
                  </button>

                  <button onClick={() => openComments(post.id)} className="flex items-center gap-1">
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-600">{post.comments}</span>
                  </button>

                  <button onClick={() => toggleBookmark(post.id)} className="flex items-center gap-1">
                    <Bookmark className={`w-5 h-5 ${post.bookmarked ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />
                  </button>

                  <button className="flex items-center gap-1">
                    <Share className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
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

              <div className="flex flex-col items-center py-2 px-3">
                <div className="w-6 h-6 mb-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-900">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01 1l-2.7 3.6L8.5 11H5c-.83 0-1.5.67-1.5 1.5S4.17 14 5 14h2.5l2.7-3.6L13 13v9h3z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-900 font-medium">社区</span>
              </div>

              <Link href="/profile" className="flex flex-col items-center py-2 px-3">
                <div className="w-6 h-6 mb-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-400">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V19A2 2 0 0 0 5 21H19A2 2 0 0 0 21 19V9M19 19H5V3H13V9H19Z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-400">我的</span>
              </Link>
            </div>
          </nav>
        </div>


      </div>

      {/* 发帖弹窗 */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-medium text-gray-900">发帖子</h3>
              <button onClick={() => setShowComposer(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-500">×</span>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <textarea value={composerText} onChange={(e) => setComposerText(e.target.value)} className="w-full h-24 border rounded-lg p-2 text-sm" placeholder="分享你的想法…" />

              {/* 图片网格预览 */}
              {composerImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {composerImages.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img src={src} alt="上传图片" className="w-full h-24 object-cover rounded-lg" />
                      <button
                        onClick={() => setComposerImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        aria-label="删除图片"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 上传入口与说明 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-2 border rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <ImageIcon className="w-4 h-4 text-gray-600" />
                    添加图片
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;
                      const readers = files.slice(0, Math.max(0, 9 - composerImages.length)).map(file => {
                        return new Promise<string>((resolve) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(reader.result as string);
                          reader.readAsDataURL(file);
                        });
                      });
                      Promise.all(readers).then(imgs => setComposerImages(prev => [...prev, ...imgs]));
                      e.currentTarget.value = '';
                    }}
                  />
                  <div className="text-xs text-gray-500">最多9张</div>
                </div>
                <button
                  className="px-4 py-2 bg-black text-white text-xs rounded-lg disabled:opacity-50"
                  disabled={!composerText.trim() && composerImages.length === 0}
                  onClick={() => {
                    // 简单模拟发布，发布后重置
                    setComposerText('');
                    setComposerImages([]);
                    setShowComposer(false);
                  }}
                >
                  发布
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 评论抽屉 */}
      {showCommentsFor && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCommentsFor(null)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-w-sm mx-auto">
            <div className="w-full h-1.5 bg-gray-200 rounded-full mx-auto mb-3 max-w-[60px]" />
            <div className="max-h-[40vh] overflow-y-auto space-y-3">
              {(comments[showCommentsFor] || []).map(c => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">{c.user[0]}</div>
                  <div>
                    <div className="text-sm text-gray-900">{c.user}</div>
                    <div className="text-sm text-gray-700">{c.text}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="写评论…" />
              <button onClick={submitComment} className="px-3 py-2 bg-black text-white text-xs rounded-lg">发送</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
