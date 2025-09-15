'use client';

import { Menu, ChevronRight, Plus, Utensils, Heart, Moon, Stethoscope, Camera, Mic, X, Edit3, Save, ArrowLeft, Activity, Calendar, FileText, HelpCircle, Trash2 } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@supabase/supabase-js';
import { getLocalDateString, getDateStringDaysAgo } from '@/lib/supabase';

// 今日记录详情组件
function TodayRecordDetail({ user, onClose, onDataUpdate }: {
  user: User | null;
  onClose: () => void;
  onDataUpdate: () => void;
}) {
  const [todayData, setTodayData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const router = useRouter();

  // 加载今日详细数据
  const loadTodayData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { getLocalDateString, supabase } = await import('@/lib/supabase');
      const today = getLocalDateString();

      // 获取用户token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No valid session');
        return;
      }

      // 通过API获取今日数据
      const response = await fetch(`/api/records/daily-summary?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch today data');
      }

      const result = await response.json();
      if (result.success && result.data) {
        const todayLogs = {
          sleep: result.data.sleep,
          meals: result.data.meals || [],
          emotions: result.data.emotions || [],
          symptoms: result.data.symptoms || [],
        };
        setTodayData(todayLogs);

        // 初始化编辑数据
        setEditData({
          sleep: todayLogs.sleep || {},
          emotions: todayLogs.emotions || [],
          meals: todayLogs.meals || [],
          symptoms: todayLogs.symptoms || [],
        });
      }
    } catch (error) {
      console.error('Error loading today data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { db, getLocalDateString } = await import('@/lib/supabase');
      const today = getLocalDateString();

      // 保存睡眠记录
      if (editData.sleep && Object.keys(editData.sleep).length > 0) {
        await db.createOrUpdateSleepLog(user.id, today, editData.sleep);
      }

      // TODO: 保存其他记录类型（情绪、饮食、症状）
      // 这部分由用户自己实现数据库操作

      alert('保存成功！');
      setIsEditing(false);
      await loadTodayData();
      onDataUpdate();
    } catch (error) {
      console.error('Error saving:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 计算记录完成度
  const calculateProgress = () => {
    let completed = 0;
    const total = 4; // 睡眠、情绪、饮食、症状

    if (todayData?.sleep) completed++;
    if (todayData?.emotions && todayData.emotions.length > 0) completed++;
    if (todayData?.meals && todayData.meals.length > 0) completed++;
    if (todayData?.symptoms && todayData.symptoms.length > 0) completed++;

    return { completed, total };
  };

  // 跳转到AI总结
  const handleAISummary = async () => {
    console.log('点击AI总结按钮，当前todayData:', todayData);

    // 检查数据是否已加载
    if (!todayData) {
      alert('正在加载数据，请稍后再试...');
      return;
    }

    const progress = calculateProgress();
    console.log('进度检查:', progress);

    if (progress.completed < progress.total) {
      alert(`请完成所有记录项目后再进行AI总结（当前进度：${progress.completed}/${progress.total}）`);
      return;
    }

    // 构建记录内容作为输入
    const recordContent = {
      sleep: todayData?.sleep,
      emotions: todayData?.emotions,
      meals: todayData?.meals,
      symptoms: todayData?.symptoms,
      date: new Date().toISOString().split('T')[0]
    };

    console.log('准备生成AI总结，记录内容:', recordContent);

    // 调用新的内观总结API
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert('请先登录');
        return;
      }

      const response = await fetch('/api/neiguan-summary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: recordContent
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // 在当前页面展示AI总结，而不是跳转
          showAISummary(result.data);
        } else {
          alert('AI总结生成失败，请重试');
        }
      } else {
        alert('AI总结生成失败，请重试');
      }
    } catch (error) {
      console.error('AI总结生成错误:', error);
      alert('AI总结生成失败，请重试');
    }
  };

  // 显示AI总结
  const showAISummary = (summaryData: any) => {
    // 创建模态框显示AI总结
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl w-full max-w-sm max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h3 class="text-base font-medium text-gray-900">AI健康总结</h3>
          <button onclick="this.closest('.fixed').remove()" class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <span class="text-gray-500 text-base">×</span>
          </button>
        </div>
        <div class="p-4 space-y-4 overflow-y-auto flex-1">
          <div class="bg-blue-50 rounded-lg p-3">
            <h4 class="text-sm font-medium text-blue-900 mb-2">今日状态</h4>
            <p class="text-sm text-blue-800">${summaryData.status}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-3">
            <h4 class="text-sm font-medium text-green-900 mb-2">AI分析</h4>
            <p class="text-sm text-green-800 leading-relaxed">${summaryData.summary}</p>
          </div>
          ${summaryData.suggestions && summaryData.suggestions.length > 0 ? `
            <div class="bg-purple-50 rounded-lg p-3">
              <h4 class="text-sm font-medium text-purple-900 mb-2">建议</h4>
              <ul class="text-sm text-purple-800 space-y-1">
                ${summaryData.suggestions.map((s: string) => `<li class="flex items-start gap-2"><span class="text-purple-600 mt-1">•</span>${s}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
        <!-- 聊天输入框 -->
        <div class="border-t border-gray-100 p-4 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="flex-1 relative">
              <input
                type="text"
                id="aiSummaryInput"
                placeholder="有什么问题想问我吗？"
                class="w-full px-4 py-2 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                id="aiSummarySendBtn"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-colors bg-gray-300 text-gray-500"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // 获取输入框和发送按钮
    const input = modal.querySelector('#aiSummaryInput') as HTMLInputElement;
    const sendBtn = modal.querySelector('#aiSummarySendBtn') as HTMLButtonElement;

    // 更新发送按钮状态
    const updateSendButton = () => {
      const hasText = input.value.trim().length > 0;
      sendBtn.className = `absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-colors ${
        hasText 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`;
      sendBtn.disabled = !hasText;
    };

    // 监听输入变化
    input.addEventListener('input', updateSendButton);

    // 处理发送
    const handleSend = () => {
      const question = input.value.trim();
      if (question) {
        // 跳转到聊天页面并传递问题
        const url = `/consultation?question=${encodeURIComponent(question)}&context=ai-summary`;
        window.location.href = url;
      }
    };

    // 发送按钮点击事件
    sendBtn.addEventListener('click', handleSend);

    // 回车发送
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    });

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // 初始化按钮状态
    updateSendButton();
  };

  useEffect(() => {
    loadTodayData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-medium">今日记录详情</h3>
          <div className="w-9"></div>
        </div>
        <div className="text-center py-8 text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
      {/* 头部 */}
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-2">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-medium">今日记录详情</h3>
        <button
          onClick={() => isEditing ? saveEdit() : setIsEditing(true)}
          className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
          disabled={isLoading}
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          {isEditing ? '保存' : '编辑'}
        </button>
      </div>

      {/* 睡眠记录 */}
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-gray-900">睡眠记录</h4>
        </div>

        {todayData?.sleep ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">睡眠时长</label>
                {isEditing ? (
                  <select
                    className="w-full mt-1 p-2 border rounded-lg text-sm"
                    value={editData.sleep?.duration || ''}
                    onChange={(e) => setEditData({...editData, sleep: {...editData.sleep, duration: e.target.value}})}
                  >
                    <option value="">请选择</option>
                    <option value="小于6h">小于6h</option>
                    <option value="6-8h">6-8h</option>
                    <option value="8-10h">8-10h</option>
                    <option value="10h以上">10h以上</option>
                  </select>
                ) : (
                  <p className="text-gray-800 mt-1">{todayData.sleep.duration || '未记录'}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600">醒来感觉</label>
                {isEditing ? (
                  <select
                    className="w-full mt-1 p-2 border rounded-lg text-sm"
                    value={editData.sleep?.feeling || ''}
                    onChange={(e) => setEditData({...editData, sleep: {...editData.sleep, feeling: e.target.value}})}
                  >
                    <option value="">请选择</option>
                    <option value="精力充沛">精力充沛</option>
                    <option value="神清气爽">神清气爽</option>
                    <option value="略感疲惫">略感疲惫</option>
                    <option value="昏昏沉沉">昏昏沉沉</option>
                  </select>
                ) : (
                  <p className="text-gray-800 mt-1">{todayData.sleep.feeling || '未记录'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">惊醒次数</label>
              {isEditing ? (
                <select
                  className="w-full mt-1 p-2 border rounded-lg text-sm"
                  value={editData.sleep?.wakeup_times || ''}
                  onChange={(e) => setEditData({...editData, sleep: {...editData.sleep, wakeup_times: e.target.value}})}
                >
                  <option value="">请选择</option>
                  <option value="无">无</option>
                  <option value="1次">1次</option>
                  <option value="2次">2次</option>
                  <option value="3次以上">3次以上</option>
                </select>
              ) : (
                <p className="text-gray-800 mt-1">{todayData.sleep.wakeup_times || '未记录'}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">今日暂无睡眠记录</p>
        )}
      </div>

      {/* 情绪记录 */}
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-red-600" />
          <h4 className="font-medium text-gray-900">情绪记录</h4>
        </div>

        {todayData?.emotions && todayData.emotions.length > 0 ? (
          <div className="space-y-3">
            {todayData.emotions.map((emotion: any, index: number) => (
              <div key={emotion.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  {isEditing ? (
                    <select
                      className="text-2xl bg-transparent border-none outline-none"
                      value={editData.emotions?.[index]?.emoji || emotion.emoji}
                      onChange={(e) => {
                        const newEmotions = [...(editData.emotions || todayData.emotions)];
                        newEmotions[index] = {...newEmotions[index], emoji: e.target.value};
                        setEditData({...editData, emotions: newEmotions});
                      }}
                    >
                      <option value="😊">😊</option>
                      <option value="😐">😐</option>
                      <option value="😔">😔</option>
                      <option value="😤">😤</option>
                      <option value="🤯">🤯</option>
                      <option value="😌">😌</option>
                    </select>
                  ) : (
                    <span className="text-2xl">{emotion.emoji}</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(emotion.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600">强度</label>
                    {isEditing ? (
                      <input
                        type="range"
                        min="1"
                        max="10"
                        className="w-full mt-1"
                        value={editData.emotions?.[index]?.intensity || emotion.intensity}
                        onChange={(e) => {
                          const newEmotions = [...(editData.emotions || todayData.emotions)];
                          newEmotions[index] = {...newEmotions[index], intensity: parseInt(e.target.value)};
                          setEditData({...editData, emotions: newEmotions});
                        }}
                      />
                    ) : (
                      <p className="text-sm text-gray-700">强度: {emotion.intensity}/10</p>
                    )}
                  </div>

                  {emotion.description && (
                    <div>
                      <label className="text-xs text-gray-600">描述</label>
                      {isEditing ? (
                        <textarea
                          className="w-full mt-1 p-2 border rounded text-sm"
                          rows={2}
                          value={editData.emotions?.[index]?.description || emotion.description}
                          onChange={(e) => {
                            const newEmotions = [...(editData.emotions || todayData.emotions)];
                            newEmotions[index] = {...newEmotions[index], description: e.target.value};
                            setEditData({...editData, emotions: newEmotions});
                          }}
                        />
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">{emotion.description}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">今日暂无情绪记录</p>
        )}
      </div>

      {/* 饮食记录 */}
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Utensils className="w-5 h-5 text-green-600" />
          <h4 className="font-medium text-gray-900">饮食记录</h4>
        </div>

        {todayData?.meals && todayData.meals.length > 0 ? (
          <div className="space-y-3">
            {todayData.meals.map((meal: any, index: number) => (
              <div key={meal.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  {isEditing ? (
                    <select
                      className="text-sm font-medium bg-transparent border rounded px-2 py-1"
                      value={editData.meals?.[index]?.meal_type || meal.meal_type}
                      onChange={(e) => {
                        const newMeals = [...(editData.meals || todayData.meals)];
                        newMeals[index] = {...newMeals[index], meal_type: e.target.value};
                        setEditData({...editData, meals: newMeals});
                      }}
                    >
                      <option value="breakfast">早餐</option>
                      <option value="lunch">午餐</option>
                      <option value="dinner">晚餐</option>
                      <option value="snack">加餐</option>
                    </select>
                  ) : (
                    <span className="text-sm font-medium">
                      {meal.meal_type === 'breakfast' ? '早餐' :
                       meal.meal_type === 'lunch' ? '午餐' :
                       meal.meal_type === 'dinner' ? '晚餐' : '加餐'}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(meal.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-2">
                  {meal.feeling && (
                    <div>
                      <label className="text-xs text-gray-600">感受</label>
                      {isEditing ? (
                        <select
                          className="w-full mt-1 p-2 border rounded text-sm"
                          value={editData.meals?.[index]?.feeling || meal.feeling}
                          onChange={(e) => {
                            const newMeals = [...(editData.meals || todayData.meals)];
                            newMeals[index] = {...newMeals[index], feeling: e.target.value};
                            setEditData({...editData, meals: newMeals});
                          }}
                        >
                          <option value="很满足">很满足</option>
                          <option value="有点撑">有点撑</option>
                          <option value="刚刚好">刚刚好</option>
                          <option value="还想吃">还想吃</option>
                        </select>
                      ) : (
                        <p className="text-sm text-gray-700">感受: {meal.feeling}</p>
                      )}
                    </div>
                  )}

                  {meal.description && (
                    <div>
                      <label className="text-xs text-gray-600">描述</label>
                      {isEditing ? (
                        <textarea
                          className="w-full mt-1 p-2 border rounded text-sm"
                          rows={2}
                          value={editData.meals?.[index]?.description || meal.description}
                          onChange={(e) => {
                            const newMeals = [...(editData.meals || todayData.meals)];
                            newMeals[index] = {...newMeals[index], description: e.target.value};
                            setEditData({...editData, meals: newMeals});
                          }}
                        />
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">{meal.description}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">今日暂无饮食记录</p>
        )}
      </div>

      {/* 症状记录 */}
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-orange-600" />
          <h4 className="font-medium text-gray-900">症状记录</h4>
        </div>

        {todayData?.symptoms && todayData.symptoms.length > 0 ? (
          <div className="space-y-3">
            {todayData.symptoms.map((symptom: any, index: number) => (
              <div key={symptom.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  {isEditing ? (
                    <select
                      className="text-sm font-medium bg-transparent border rounded px-2 py-1"
                      value={editData.symptoms?.[index]?.body_part || symptom.body_part}
                      onChange={(e) => {
                        const newSymptoms = [...(editData.symptoms || todayData.symptoms)];
                        newSymptoms[index] = {...newSymptoms[index], body_part: e.target.value};
                        setEditData({...editData, symptoms: newSymptoms});
                      }}
                    >
                      <option value="头部">头部</option>
                      <option value="胸部">胸部</option>
                      <option value="腹部">腹部</option>
                      <option value="四肢">四肢</option>
                      <option value="腰背">腰背</option>
                      <option value="其他">其他</option>
                    </select>
                  ) : (
                    <span className="text-sm font-medium">{symptom.body_part}</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(symptom.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600">严重程度</label>
                    {isEditing ? (
                      <input
                        type="range"
                        min="1"
                        max="10"
                        className="w-full mt-1"
                        value={editData.symptoms?.[index]?.severity || symptom.severity}
                        onChange={(e) => {
                          const newSymptoms = [...(editData.symptoms || todayData.symptoms)];
                          newSymptoms[index] = {...newSymptoms[index], severity: parseInt(e.target.value)};
                          setEditData({...editData, symptoms: newSymptoms});
                        }}
                      />
                    ) : (
                      <p className="text-sm text-gray-700">严重程度: {symptom.severity}/10</p>
                    )}
                  </div>

                  {symptom.description && (
                    <div>
                      <label className="text-xs text-gray-600">描述</label>
                      {isEditing ? (
                        <textarea
                          className="w-full mt-1 p-2 border rounded text-sm"
                          rows={2}
                          value={editData.symptoms?.[index]?.description || symptom.description}
                          onChange={(e) => {
                            const newSymptoms = [...(editData.symptoms || todayData.symptoms)];
                            newSymptoms[index] = {...newSymptoms[index], description: e.target.value};
                            setEditData({...editData, symptoms: newSymptoms});
                          }}
                        />
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">{symptom.description}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">今日暂无症状记录</p>
        )}
      </div>

      {/* AI总结按钮 */}
      <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100">
        {(() => {
          const progress = calculateProgress();
          const isComplete = progress.completed === progress.total;

          return (
            <button
              onClick={handleAISummary}
              disabled={!isComplete}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                isComplete
                  ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isComplete ? 'AI 总结' : `AI 总结 (${progress.completed}/${progress.total})`}
            </button>
          );
        })()}
      </div>
    </div>
  );
}

// 历史记录详情组件
function HistoryRecordDetail({ user, date, onClose }: {
  user: User | null;
  date: string;
  onClose: () => void;
}) {
  const [historyData, setHistoryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载历史记录数据
  const loadHistoryData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { supabase } = await import('@/lib/supabase');

      // 获取用户token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No valid session');
        return;
      }

      // 通过API获取历史数据
      const response = await fetch(`/api/records/daily-summary?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history data');
      }

      const result = await response.json();
      if (result.success && result.data) {
        const logs = {
          sleep: result.data.sleep,
          meals: result.data.meals || [],
          emotions: result.data.emotions || [],
          symptoms: result.data.symptoms || [],
        };
        setHistoryData(logs);
      }
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();
  }, [user, date]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!historyData) {
    return (
      <div className="p-4 text-center text-gray-500">
        暂无记录数据
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[60vh]">
      <div className="p-4 space-y-4">
        {/* 日期标题 */}
        <div className="text-center pb-2 border-b border-gray-100">
          <h4 className="text-lg font-medium text-gray-900">
            {new Date(date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
        </div>

        {/* 睡眠记录 */}
        {historyData.sleep && (
          <div className="bg-blue-50 rounded-lg p-3">
            <h5 className="font-medium text-blue-900 mb-2 flex items-center">
              🌙 睡眠记录
            </h5>
            <div className="space-y-1 text-sm text-blue-800">
              {historyData.sleep.duration && (
                <p>睡眠时长：{historyData.sleep.duration}</p>
              )}
              {historyData.sleep.feeling && (
                <p>醒来感觉：{historyData.sleep.feeling}</p>
              )}
              {historyData.sleep.wakeup_times && (
                <p>惊醒次数：{historyData.sleep.wakeup_times}</p>
              )}
            </div>
          </div>
        )}

        {/* 情绪记录 */}
        {historyData.emotions && historyData.emotions.length > 0 && (
          <div className="bg-pink-50 rounded-lg p-3">
            <h5 className="font-medium text-pink-900 mb-2 flex items-center">
              ❤️ 情绪记录
            </h5>
            <div className="space-y-2">
              {historyData.emotions.map((emotion: any, index: number) => (
                <div key={index} className="text-sm text-pink-800">
                  <p>
                    {emotion.emoji} 强度：{emotion.intensity}/10
                    {emotion.description && ` (${emotion.description})`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 饮食记录 */}
        {historyData.meals && historyData.meals.length > 0 && (
          <div className="bg-green-50 rounded-lg p-3">
            <h5 className="font-medium text-green-900 mb-2 flex items-center">
              🍽️ 饮食记录
            </h5>
            <div className="space-y-2">
              {historyData.meals.map((meal: any, index: number) => {
                const mealType = meal.meal_type === 'breakfast' ? '早餐' :
                               meal.meal_type === 'lunch' ? '午餐' :
                               meal.meal_type === 'dinner' ? '晚餐' : '加餐';
                return (
                  <div key={index} className="text-sm text-green-800">
                    <p>
                      {mealType}
                      {meal.feeling && ` - 感受：${meal.feeling}`}
                      {meal.description && ` (${meal.description})`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 症状记录 */}
        {historyData.symptoms && historyData.symptoms.length > 0 && (
          <div className="bg-red-50 rounded-lg p-3">
            <h5 className="font-medium text-red-900 mb-2 flex items-center">
              🩺 症状记录
            </h5>
            <div className="space-y-2">
              {historyData.symptoms.map((symptom: any, index: number) => (
                <div key={index} className="text-sm text-red-800">
                  <p>
                    {symptom.body_part} - 严重程度：{symptom.severity}/10
                    {symptom.description && ` (${symptom.description})`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 如果没有任何记录 */}
        {!historyData.sleep &&
         (!historyData.emotions || historyData.emotions.length === 0) &&
         (!historyData.meals || historyData.meals.length === 0) &&
         (!historyData.symptoms || historyData.symptoms.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            该日期暂无记录
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showRecordOptions, setShowRecordOptions] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedRecordType, setSelectedRecordType] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sideMenuRef = useRef<HTMLDivElement>(null);
  const [dailySummaries, setDailySummaries] = useState<any[]>([]);
  const [avgSleepHours, setAvgSleepHours] = useState<number | null>(null);
  const [overallHealthStatus, setOverallHealthStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [wellnessPlan, setWellnessPlan] = useState<any>(null);
  const [todayData, setTodayData] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // 首次登录体质测试提醒
  const [showConstitutionTestReminder, setShowConstitutionTestReminder] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // 用户完成情况状态
  const [userCompletionStatus, setUserCompletionStatus] = useState({
    hasBirthInfo: false,
    hasConstitution: false,
    loading: true
  });

  // 记录表单状态
  const [sleepDuration, setSleepDuration] = useState<string>('');
  const [sleepFeeling, setSleepFeeling] = useState<string>('');
  const [sleepWakeup, setSleepWakeup] = useState<string>('');
  const [moodEmoji, setMoodEmoji] = useState<string>('');
  const [moodIntensity, setMoodIntensity] = useState<number>(5);
  const [foodMealTime, setFoodMealTime] = useState<string>('');
  const [foodFeeling, setFoodFeeling] = useState<string>('');
  const [foodDescription, setFoodDescription] = useState<string>('');
  const [foodImages, setFoodImages] = useState<string[]>([]);
  const [symptomPart, setSymptomPart] = useState<string>('');
  const [symptomSeverity, setSymptomSeverity] = useState<number>(3);

  // 处理菜单点击
  const handleMenuClick = () => {
    setShowSideMenu(!showSideMenu);
  };

  // 生成日历数据
  const generateCalendarData = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // 添加空白天数
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // 添加月份中的天数
    for (let day = 1; day <= daysInMonth; day++) {
      const hasRecord = dailySummaries.some(summary => {
        const summaryDate = new Date(summary.date);
        return summaryDate.getDate() === day &&
               summaryDate.getMonth() === month &&
               summaryDate.getFullYear() === year;
      });
      days.push({ day, hasRecord, isToday: day === today.getDate() });
    }

    return days;
  };

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRecordOptions(false);
      }
      if (sideMenuRef.current && !sideMenuRef.current.contains(event.target as Node)) {
        setShowSideMenu(false);
      }
    }

    if (showRecordOptions || showSideMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRecordOptions, showSideMenu]);

  // 身份验证检查
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
  }, [user, loading, router]);

  // 初始化和加载数据
  useEffect(() => {
    setIsMounted(true);
    if (user) {
      loadTodayData();
      loadDailySummaries();
      loadWellnessPlan();
      checkUserCompletionStatus();
      checkFirstTimeUser();
    }
  }, [user]);

  // 检查用户完成状态
  const checkUserCompletionStatus = async () => {
    if (!user) return;

    try {
      const { supabase } = await import('@/lib/supabase');

      // 检查用户的完成情况
      const { data: profile } = await supabase
        .from('profiles')
        .select('birth_year, birth_month, birth_day, gender, constitution')
        .eq('id', user.id)
        .single();

      const hasBirthInfo = !!(profile?.birth_year && profile?.birth_month && profile?.birth_day && profile?.gender);
      const hasConstitution = !!(profile?.constitution && profile?.constitution !== '待测');

      setUserCompletionStatus({
        hasBirthInfo,
        hasConstitution,
        loading: false
      });

      // 调试信息
      console.log('用户完成状态检查:', {
        profile,
        hasBirthInfo,
        hasConstitution,
        birth_year: profile?.birth_year,
        birth_month: profile?.birth_month,
        birth_day: profile?.birth_day,
        gender: profile?.gender,
        constitution: profile?.constitution
      });

      // 如果都没有完成，跳转到引导页面
      if (!hasBirthInfo && !hasConstitution) {
        router.push('/auth/onboarding');
        return;
      }
    } catch (error) {
      console.error('Error checking user completion status:', error);
      setUserCompletionStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // 检测是否为首次用户
  const checkFirstTimeUser = async () => {
    if (!user) return;

    try {
      const { supabase } = await import('@/lib/supabase');

      // 检查用户是否完成了引导（生辰信息和体质测试）
      const { data: profile } = await supabase
        .from('profiles')
        .select('birth_year, constitution')
        .eq('id', user.id)
        .single();

      const hasCompletedOnboarding = profile?.birth_year && profile?.constitution;

      // 如果没有完成引导，跳转到引导页面
      if (!hasCompletedOnboarding) {
        router.push('/auth/onboarding');
        return;
      }

      // 检查用户是否有任何记录
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const [sleepResult, mealResult, emotionResult, symptomResult] = await Promise.all([
        supabase.from('sleep_logs').select('id').eq('user_id', user.id).limit(1),
        supabase.from('meal_logs').select('id').eq('user_id', user.id).limit(1),
        supabase.from('emotion_logs').select('id').eq('user_id', user.id).limit(1),
        supabase.from('symptom_logs').select('id').eq('user_id', user.id).limit(1),
      ]);

      const hasAnyRecords = sleepResult.data?.length || mealResult.data?.length ||
                           emotionResult.data?.length || symptomResult.data?.length;

      // 如果没有任何记录，显示提醒
      if (!hasAnyRecords) {
        setIsFirstTimeUser(true);
        // 延迟显示提醒，让页面先加载完成
        setTimeout(() => {
          setShowConstitutionTestReminder(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking first time user:', error);
    }
  };

  // 加载今日数据
  const loadTodayData = async () => {
    if (!user) return;

    try {
      const { supabase } = await import('@/lib/supabase');
      const today = getLocalDateString();

      // 获取用户token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No valid session');
        return;
      }

      // 通过API获取今日数据
      const response = await fetch(`/api/records/daily-summary?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch today data');
      }

      const result = await response.json();
      if (result.success && result.data) {
        const todayLogs = {
          sleep: result.data.sleep,
          meals: result.data.meals || [],
          emotions: result.data.emotions || [],
          symptoms: result.data.symptoms || [],
        };
        setTodayData(todayLogs);
      }
    } catch (error) {
      console.error('Error loading today data:', error);
    }
  };

  // 获取所有历史记录数据
  const loadDailySummaries = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // 通过API获取最近30天的记录
      const { supabase } = await import('@/lib/supabase');

      // 获取用户token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No valid session');
        return;
      }

      // 获取最近30天的数据
      const promises = [];
      const dates = [];

      for (let i = 0; i < 30; i++) {
        const date = getDateStringDaysAgo(i);
        dates.push(date);

        // 通过API获取每日数据
        promises.push(
          fetch(`/api/records/daily-summary?date=${date}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }).then(async (response) => {
            if (!response.ok) {
              return { sleep: null, meals: [], emotions: [], symptoms: [] };
            }
            const result = await response.json();
            if (result.success && result.data) {
              return {
                sleep: result.data.sleep,
                meals: result.data.meals || [],
                emotions: result.data.emotions || [],
                symptoms: result.data.symptoms || [],
              };
            }
            return { sleep: null, meals: [], emotions: [], symptoms: [] };
          }).catch(() => {
            return { sleep: null, meals: [], emotions: [], symptoms: [] };
          })
        );
      }

      const allLogsArray = await Promise.all(promises);

      // 按“分条展示”需要，生成逐项 summary
      const mealTypeMapCN: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };





      // 创建生成单日汇总的函数
      const generateDailySummary = (logs: any, date: string) => {
        const mealTypeMapCN: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };

        const sleep_summary = logs.sleep
          ? [logs.sleep.duration, logs.sleep.feeling]
              .filter(Boolean)
              .join(' ')
          : undefined;

        const lastEmotion = (logs.emotions || []).slice(-1)[0];
        const emotion_summary = lastEmotion
          ? [lastEmotion.emoji, lastEmotion.description]
              .filter(Boolean)
              .join(' ')
          : undefined;

        const lastMeal = (logs.meals || []).slice(-1)[0];
        const meal_summary = lastMeal
          ? [mealTypeMapCN[lastMeal.meal_type] || lastMeal.meal_type, lastMeal.feeling || lastMeal.description]
              .filter(Boolean)
              .join(' ')
          : undefined;

        const symptom_summary = (logs.symptoms && logs.symptoms.length > 0)
          ? `已记录${logs.symptoms.length}个症状`
          : undefined;

        return {
          id: date,
          date: date,
          overall_summary: generateTodaySummary(logs),
          sleep_summary,
          emotion_summary,
          meal_summary,
          symptom_summary,
          created_at: new Date().toISOString(),
        };
      };

      // 生成最近30天的汇总数据
      const summaryData: any[] = [];
      let sleepTotalHours = 0;
      let sleepDays = 0;

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const logs = allLogsArray[i];
        const summary = generateDailySummary(logs, date);

        // 只添加有数据的日期
        if (summary.sleep_summary || summary.emotion_summary || summary.meal_summary || summary.symptom_summary) {
          summaryData.push(summary);
        }

        // 统计睡眠时长（小时）
        const dur = logs?.sleep?.duration as string | undefined;
        if (dur) {
          const match = dur.match(/(\d+(?:\.\d+)?)\s*h/);
          if (match && match[1]) {
            const hours = parseFloat(match[1]);
            if (!Number.isNaN(hours)) {
              sleepTotalHours += hours;
              sleepDays += 1;
            }
          } else if (dur.includes('6-8')) {
            sleepTotalHours += 7; sleepDays += 1;
          } else if (dur.includes('8-10')) {
            sleepTotalHours += 9; sleepDays += 1;
          } else if (dur.includes('10')) {
            sleepTotalHours += 10; sleepDays += 1;
          }
        }
      }

      setDailySummaries(summaryData);

      // 计算平均睡眠与健康状态
      if (sleepDays > 0) {
        const avg = sleepTotalHours / sleepDays;
        setAvgSleepHours(parseFloat(avg.toFixed(1)));
        if (avg >= 7.5) setOverallHealthStatus('良好');
        else if (avg >= 6) setOverallHealthStatus('一般');
        else setOverallHealthStatus('待改善');
      } else {
        setAvgSleepHours(null);
        setOverallHealthStatus('');
      }
    } catch (error) {
      console.error('Error loading daily records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载养生计划
  const loadWellnessPlan = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // 首先尝试从数据库获取今日的养生计划
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      const response = await fetch(`/api/wellness-plan?userId=${user.id}&date=${today}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      const result = await response.json();
      console.log('Load wellness plan result:', result);

      if (result.success && result.data) {
        console.log('Found existing plan:', result.data);
        setWellnessPlan(result.data);
        // 如果拿到的是fallback内容，则继续尝试后台生成一次
        if (result.data?.content?.generatedBy === 'fallback') {
          console.log('Existing plan is fallback, trying to regenerate...');
          await generateWellnessPlan();
        }
      } else {
        console.log('No existing plan found, generating new one...');
        // 如果没有今日计划，自动生成一个
        await generateWellnessPlan();
      }
    } catch (error) {
      console.error('Error loading wellness plan:', error);
      // 如果加载失败，也尝试生成一个
      await generateWellnessPlan();
    }
  };

  // 生成养生计划
  const generateWellnessPlan = async () => {
    if (!user || isGeneratingPlan) return;

    try {
      setIsGeneratingPlan(true);
      const today = new Date().toISOString().split('T')[0];

      // 获取用户token
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());

      const response = await fetch('/api/wellness-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          date: today,
          location: '上海', // 可以后续从用户设置或地理位置API获取
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setWellnessPlan(result.data);
      } else {
        console.error('Failed to generate wellness plan:', result.error);
        // 如果生成失败，不设置默认内容，让API的默认内容生效
        setWellnessPlan(null);
      }
    } catch (error) {
      console.error('Error generating wellness plan:', error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // 生成今日汇总文本
  const generateTodaySummary = (logs: any) => {
    const parts = [];
    if (logs.sleep) {
      parts.push(`睡眠${logs.sleep.duration || '未记录'}`);
    }
    if (logs.meals && logs.meals.length > 0) {
      parts.push(`已记录${logs.meals.length}餐`);
    }
    if (logs.emotions && logs.emotions.length > 0) {
      parts.push(`情绪${logs.emotions[logs.emotions.length - 1].emoji || '😐'}`);
    }
    if (logs.symptoms && logs.symptoms.length > 0) {
      parts.push(`${logs.symptoms.length}个症状`);
    }

    return parts.length > 0 ? parts.join('，') : '今日记录';
  };

  // 处理记录选项点击
  const handleRecordOption = (type: string) => {
    console.log(`记录类型: ${type}`);
    setShowRecordOptions(false);
    setSelectedRecordType(type);
  };

  // 处理卡片点击
  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId);
  };

  // 关闭详情卡片
  const closeCardDetail = () => {
    setSelectedCard(null);
  };

  // 保存睡眠记录
  const saveSleepRecord = async () => {
    console.log('saveSleepRecord called, user:', user);
    console.log('Sleep data:', { sleepDuration, sleepFeeling, sleepWakeup });

    if (!user) return;

    // 至少需要填写一个字段
    if (!sleepDuration && !sleepFeeling && !sleepWakeup) {
      alert('请至少填写一项睡眠信息');
      return;
    }

    try {
      setIsLoading(true);

      // 通过API保存睡眠记录
      const { supabase, getLocalDateString } = await import('@/lib/supabase');
      const today = getLocalDateString();

      // 获取用户token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('请先登录');
        return;
      }

      const response = await fetch('/api/records/sleep', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: today,
          duration: sleepDuration,
          feeling: sleepFeeling,
          wakeup_times: sleepWakeup,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert('睡眠记录保存成功！');
        closeRecordCard();
        loadDailySummaries(); // 重新加载数据

        // 重置表单
        setSleepDuration('');
        setSleepFeeling('');
        setSleepWakeup('');
      } else {
        console.error('Error saving sleep record:', result.error);
        alert(`保存失败：${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error saving sleep record:', error);
      console.error('Catch error details:', JSON.stringify(error, null, 2));
      alert(`保存失败：${error instanceof Error ? error.message : JSON.stringify(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存情绪记录
  const saveEmotionRecord = async () => {
    if (!user) return;
    
    if (!moodEmoji) {
      alert('请选择情绪表情');
      return;
    }

    try {
      setIsLoading(true);

      // 通过API保存情绪记录
      const { supabase, getLocalDateString } = await import('@/lib/supabase');
      const today = getLocalDateString();

      // 获取用户token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('请先登录');
        return;
      }

      const response = await fetch('/api/records/emotion', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: today,
          emoji: moodEmoji,
          intensity: moodIntensity,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert('情绪记录保存成功！');
        closeRecordCard();
        loadDailySummaries(); // 重新加载数据

        // 重置表单
        setMoodEmoji('');
        setMoodIntensity(5);
      } else {
        console.error('Error saving emotion record:', result.error);
        alert(`保存失败：${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error saving emotion record:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理图片上传
  const handleFoodImageUpload = async (file: File) => {
    if (!user) {
      alert('请先登录');
      return;
    }

    try {
      setIsLoading(true);
      
      // 上传图片到Supabase Storage
      const { supabase } = await import('@/lib/supabase');
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('user-media')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        alert('图片上传失败，请重试');
        return;
      }

      // 获取公共URL
      const { data: publicData } = supabase.storage
        .from('user-media')
        .getPublicUrl(fileName);

      if (publicData?.publicUrl) {
        setFoodImages(prev => [...prev, publicData.publicUrl]);
        alert('图片上传成功！');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('图片上传失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理拍照点击
  const handleFoodPhotoClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // 优先使用后置摄像头
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFoodImageUpload(file);
      }
    };
    input.click();
  };

  // 保存饮食记录
  const saveMealRecord = async () => {
    if (!user) return;

    if (!foodMealTime && !foodFeeling && !foodDescription && foodImages.length === 0) {
      alert('请至少填写一项饮食信息');
      return;
    }

    try {
      setIsLoading(true);
      const { supabase, getLocalDateString } = await import('@/lib/supabase');
      const today = getLocalDateString();

      // 获取用户token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('请先登录');
        return;
      }

      // 将前端中文选项映射为数据库允许的英文枚举
      const mealTypeMap: Record<string, 'breakfast' | 'lunch' | 'dinner' | 'snack'> = {
        早餐: 'breakfast',
        午餐: 'lunch',
        晚餐: 'dinner',
        加餐: 'snack',
        // 兼容直接使用英文值的情况
        breakfast: 'breakfast',
        lunch: 'lunch',
        dinner: 'dinner',
        snack: 'snack',
      } as const;
      const normalizedMealType = mealTypeMap[foodMealTime] ?? 'snack';

      // 通过API保存饮食记录
      const response = await fetch('/api/records/meal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: today,
          meal_type: normalizedMealType,
          feeling: foodFeeling,
          description: foodDescription,
          images: foodImages,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert('饮食记录保存成功！');
        closeRecordCard();
        loadDailySummaries(); // 重新加载数据

        // 重置表单
        setFoodMealTime('');
        setFoodFeeling('');
        setFoodDescription('');
        setFoodImages([]);
      } else {
        console.error('Error saving meal record:', result.error);
        alert(`保存失败：${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error saving meal record:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存症状记录
  const saveSymptomRecord = async () => {
    if (!user) return;

    if (!symptomPart && symptomSeverity === 3) {
      alert('请至少选择症状部位或调整严重程度');
      return;
    }

    try {
      setIsLoading(true);

      // 通过API保存症状记录
      const { supabase, getLocalDateString } = await import('@/lib/supabase');
      const today = getLocalDateString();

      // 获取用户token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('请先登录');
        return;
      }

      const response = await fetch('/api/records/symptom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: today,
          body_part: symptomPart,
          severity: symptomSeverity,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert('症状记录保存成功！');
        closeRecordCard();
        loadDailySummaries(); // 重新加载数据

        // 重置表单
        setSymptomPart('');
        setSymptomSeverity(3);
      } else {
        console.error('Error saving symptom record:', result.error);
        alert(`保存失败：${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error saving symptom record:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };



  // 关闭记录卡片
  const closeRecordCard = () => {
    setSelectedRecordType(null);
    // 重置表单状态
    setSleepDuration('');
    setSleepFeeling('');
    setSleepWakeup('');
    setMoodEmoji('');
    setMoodIntensity(5);
    setFoodMealTime('');
    setFoodFeeling('');
    setSymptomPart('');
    setSymptomSeverity(3);
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm h-screen bg-gray-50 relative flex flex-col overflow-hidden">
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
        <header className="flex-shrink-0 bg-white px-4 py-4 flex items-center gap-3">
          <button onClick={handleMenuClick} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-medium text-gray-900">煦养</h1>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* AI Assistant Banner */}
          <div className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-medium text-gray-900">基于中医智慧</h2>
                <p className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">小煦为您揭秘中医智慧</p>
              </div>
            </div>
            <Link
              href="/consultation"
              className="bg-gray-700 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1 hover:bg-gray-800 transition-colors whitespace-nowrap"
            >
              聊一聊
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Today Section */}
          <div className="px-4 mt-8">
            <h3 className="text-xl font-medium text-gray-900 mb-4">顺时</h3>

            <Link
              href="/shunshi"
              className="block bg-white border border-gray-100 shadow-sm p-5 rounded-xl cursor-pointer transition-all duration-200 active:scale-95"
            >
              {isGeneratingPlan ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  <span className="ml-2 text-sm text-gray-600">正在生成养生计划...</span>
                </div>
              ) : wellnessPlan?.content ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 text-base">{wellnessPlan.content.title}</h4>
                    <span className="text-xs text-gray-600">{wellnessPlan.content.subtitle}</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {wellnessPlan.content.description}
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <span className="text-sm text-gray-600">正在加载养生计划...</span>
                  </div>
                </div>
              )}
            </Link>
          </div>

          {/* Inner View Section */}
          <div className="px-4 mt-8 pb-24">
            <h3 className="text-xl font-medium text-gray-900 mb-4">内观</h3>

            <div className="space-y-4">
              {/* 体质测试卡片 - 只有当用户缺少信息时才显示 */}
              {(() => {
                console.log('卡片显示条件检查:', {
                  loading: userCompletionStatus.loading,
                  hasBirthInfo: userCompletionStatus.hasBirthInfo,
                  hasConstitution: userCompletionStatus.hasConstitution,
                  shouldShow: !userCompletionStatus.loading && (!userCompletionStatus.hasBirthInfo || !userCompletionStatus.hasConstitution)
                });
                return null;
              })()}
              {!userCompletionStatus.loading && (!userCompletionStatus.hasBirthInfo || !userCompletionStatus.hasConstitution) && (
                <Link
                  href="/complete-profile"
                  className="block bg-gradient-to-r from-blue-500 to-purple-600 border border-blue-100 shadow-sm p-5 rounded-xl cursor-pointer transition-all duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white text-base flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      {!userCompletionStatus.hasBirthInfo && !userCompletionStatus.hasConstitution
                        ? '完善个人信息'
                        : !userCompletionStatus.hasBirthInfo
                        ? '补充生辰信息'
                        : '补充体质测试'}
                    </h4>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-blue-100 leading-relaxed">
                    {!userCompletionStatus.hasBirthInfo && !userCompletionStatus.hasConstitution
                      ? '完善生辰信息和体质测试，获取个性化健康建议'
                      : !userCompletionStatus.hasBirthInfo
                      ? '填写您的出生信息，用于精准的健康分析'
                      : '完成体质测试，了解您的五行属性和健康特点'}
                  </p>
                  <div className="mt-3 flex items-center text-xs text-blue-200">
                    <span>
                      {!userCompletionStatus.hasBirthInfo && !userCompletionStatus.hasConstitution
                        ? '5-8分钟'
                        : !userCompletionStatus.hasBirthInfo
                        ? '2-3分钟'
                        : '3-5分钟'}
                    </span>
                    <span className="mx-2">•</span>
                    <span>个性化建议</span>
                    <span className="mx-2">•</span>
                    <span>
                      {!userCompletionStatus.hasBirthInfo && !userCompletionStatus.hasConstitution
                        ? '完整分析'
                        : '补充完善'}
                    </span>
                  </div>
                </Link>
              )}

              {/* 如果信息都完整了，这个卡片就完全不显示 */}
              {/* 加载状态 */}
              {isLoading ? (
                <div className="space-y-4">
                  {/* 今日记录骨架屏 */}
                  <div className="bg-white border border-gray-100 shadow-sm p-5 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                    </div>
                  </div>

                  {/* 历史记录骨架屏 */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-gray-100 shadow-sm p-5 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                      </div>
                    </div>
                  ))}

                  {/* 加载提示 */}
                  <div className="bg-white border border-gray-100 shadow-sm p-8 rounded-xl text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">正在加载内观记录...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* 今日记录卡片 */}
                  {(() => {
                    const today = getLocalDateString();
                    const todaySummary = dailySummaries.find(s => s.date === today);

                    if (todaySummary) {
                      return (
                        <div
                          className="bg-white border border-gray-100 shadow-sm p-5 rounded-xl cursor-pointer transition-all duration-200 active:scale-95"
                          onClick={() => handleCardClick('today')}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 text-base">今日记录</h4>
                            <span className="text-xs text-gray-600">
                              {new Date(today).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="text-base text-gray-800 space-y-2 leading-7">
                            {todaySummary.emotion_summary && (
                              <p><span className="font-medium text-gray-900">情绪：</span>{todaySummary.emotion_summary}</p>
                            )}
                            {todaySummary.sleep_summary && (
                              <p><span className="font-medium text-gray-900">睡眠：</span>{todaySummary.sleep_summary}</p>
                            )}
                            {todaySummary.meal_summary && (
                              <p><span className="font-medium text-gray-900">饮食：</span>{todaySummary.meal_summary}</p>
                            )}
                            {todaySummary.symptom_summary && (
                              <p><span className="font-medium text-gray-900">症状：</span>{todaySummary.symptom_summary}</p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* 历史记录卡片 */}
                  {dailySummaries.filter(s => s.date !== getLocalDateString()).map((summary) => (
                    <div
                      key={summary.id}
                      className="bg-white border border-gray-100 shadow-sm p-5 rounded-xl cursor-pointer transition-all duration-200 active:scale-95"
                      onClick={() => handleCardClick(`entry-${summary.id}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 text-base">每日记录</h4>
                        <span className="text-xs text-gray-600">
                          {new Date(summary.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-base text-gray-800 space-y-2 leading-7">
                        {summary.emotion_summary && (
                          <p><span className="font-medium text-gray-900">情绪：</span>{summary.emotion_summary}</p>
                        )}
                        {summary.sleep_summary && (
                          <p><span className="font-medium text-gray-900">睡眠：</span>{summary.sleep_summary}</p>
                        )}
                        {summary.meal_summary && (
                          <p><span className="font-medium text-gray-900">饮食：</span>{summary.meal_summary}</p>
                        )}
                        {summary.symptom_summary && (
                          <p><span className="font-medium text-gray-900">症状：</span>{summary.symptom_summary}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* 如果加载完成且没有记录，显示提示信息 */}
                  {!isLoading && dailySummaries.length === 0 && (
                    <div className="bg-white border border-gray-100 shadow-sm p-8 rounded-xl text-center">
                      <div className="text-6xl mb-4">📝</div>
                      <h4 className="font-medium text-gray-900 text-lg mb-2">还没有记录哦，快去记录一下吧！</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        点击上方记录按钮，开始记录你的睡眠、情绪、饮食和症状，<br />
                        让小煦为你提供个性化的健康建议。
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 详情卡片模态框 */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl w-full max-w-xs max-h-[70vh] overflow-hidden animate-in zoom-in-95 duration-300">
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-base font-medium text-gray-900">
                  {selectedCard === 'shunshi' ? '顺时养生' : '内观记录'}
                </h3>
                <button
                  onClick={closeCardDetail}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-gray-500 text-base">×</span>
                </button>
              </div>

              {/* 内容区域 */}
              <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
                {selectedCard === 'shunshi' && wellnessPlan?.content && (
                  <div className="p-4 space-y-4">
                    {/* 节气信息 */}
                    <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{wellnessPlan.content.title}</h4>
                        <span className="text-xs text-gray-600">{wellnessPlan.content.subtitle}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {wellnessPlan.content.description}
                      </p>
                    </div>

                    {/* 动态渲染各个部分 */}
                    {wellnessPlan.content.sections?.map((section: any, index: number) => (
                      <div key={index}>
                        <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-gray-700 rounded-full mr-2"></span>
                          {section.title}
                        </h5>

                        {section.content && (
                          <p className="text-xs text-gray-700 leading-relaxed pl-4">
                            {section.content}
                          </p>
                        )}

                        {section.items && (
                          <div className="pl-4 space-y-2">
                            {section.items.map((item: any, itemIndex: number) => (
                              <div key={itemIndex} className="flex items-start">
                                <span className="text-xs text-gray-900 font-medium mr-2 mt-0.5 min-w-[2rem]">
                                  {item.category}
                                </span>
                                <span className="text-xs text-gray-700">{item.advice}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {section.timeSlots && (
                          <div className="pl-4 bg-gray-50 rounded-lg p-3">
                            <div className="space-y-1">
                              {section.timeSlots.map((slot: any, slotIndex: number) => (
                                <p key={slotIndex} className="text-xs text-gray-700">
                                  <span className="font-medium text-gray-900">{slot.time}：</span>
                                  {slot.advice}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}



                {/* 今日记录详情页 */}
                {selectedCard === 'today' && (
                  <TodayRecordDetail
                    user={user}
                    onClose={closeCardDetail}
                    onDataUpdate={loadDailySummaries}
                  />
                )}

                {/* 历史记录详情页 */}
                {selectedCard && selectedCard.startsWith('entry-') && (
                  <HistoryRecordDetail
                    user={user}
                    date={selectedCard.replace('entry-', '')}
                    onClose={closeCardDetail}
                  />
                )}




              </div>
            </div>
          </div>
        )}

        {/* 记录卡片模态框 */}
        {selectedRecordType && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-xl w-full max-w-xs max-h-[75vh] overflow-hidden animate-in zoom-in-95 duration-300">
              {/* 头部 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-base font-medium text-gray-900">
                  记录{selectedRecordType}
                </h3>
                <button
                  onClick={closeRecordCard}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-gray-500 text-base">×</span>
                </button>
              </div>

              {/* 内容区域 */}
              <div className="overflow-y-auto max-h-[calc(75vh-60px)]">
                {selectedRecordType === '睡眠' && (
                  <div className="p-4 space-y-4">
                    {/* 睡眠记录内容 */}
                    <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">昨夜睡眠如何？</h4>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">睡眠时长</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {['小于6h', '6-8h', '8-10h', '10h以上'].map((duration) => (
                          <button
                            key={duration}
                            onClick={() => setSleepDuration(duration)}
                            className={`text-xs py-2 px-3 rounded-lg border transition-colors ${
                              sleepDuration === duration
                                ? 'border-gray-700 bg-gray-700 text-white'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {duration}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">醒来后的感觉</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {['精力充沛', '神清气爽', '略感疲惫', '昏昏沉沉'].map((feeling) => (
                          <button
                            key={feeling}
                            onClick={() => setSleepFeeling(feeling)}
                            className={`text-xs py-2 px-3 rounded-lg border transition-colors ${
                              sleepFeeling === feeling
                                ? 'border-gray-700 bg-gray-700 text-white'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {feeling}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">睡眠过程有无惊醒</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {['无', '1次', '2次', '3次以上'].map((wakeup) => (
                          <button
                            key={wakeup}
                            onClick={() => setSleepWakeup(wakeup)}
                            className={`text-xs py-2 px-3 rounded-lg border transition-colors ${
                              sleepWakeup === wakeup
                                ? 'border-gray-700 bg-gray-700 text-white'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {wakeup}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={saveSleepRecord}
                      disabled={isLoading}
                      className="w-full bg-gray-700 text-white text-sm py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '保存中...' : '保存记录'}
                    </button>
                  </div>
                )}

                {selectedRecordType === '情绪' && (
                  <div className="p-4 space-y-4">
                    {/* 情绪记录内容 */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">今日情绪状态</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {['😊', '😐', '😔', '😤', '😰', '😴'].map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => setMoodEmoji(emoji)}
                            className={`text-lg py-2 rounded-lg border transition-colors ${
                              moodEmoji === emoji
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-blue-200 hover:bg-blue-50'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">情绪强度</h5>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">轻微</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={moodIntensity}
                          onChange={(e) => setMoodIntensity(Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-600">强烈</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-xs text-blue-600 font-medium">{moodIntensity}/10</span>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">情绪原因</h5>
                      <textarea
                        className="w-full text-xs border rounded-lg p-2 h-16 resize-none"
                        placeholder="是什么引起了这种情绪..."
                      />
                    </div>

                    <button
                      onClick={saveEmotionRecord}
                      disabled={isLoading}
                      className="w-full bg-blue-500 text-white text-sm py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '保存中...' : '保存记录'}
                    </button>
                  </div>
                )}

                {selectedRecordType === '饮食' && (
                  <div className="p-4 space-y-4">
                    {/* 饮食记录内容 */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">今日饮食记录</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">用餐时间</span>
                          <select
                            className="text-xs border rounded px-2 py-1"
                            value={foodMealTime}
                            onChange={(e) => setFoodMealTime(e.target.value)}
                          >
                            <option value="">请选择</option>
                            <option value="早餐">早餐</option>
                            <option value="午餐">午餐</option>
                            <option value="晚餐">晚餐</option>
                            <option value="加餐">加餐</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">主要食物</h5>
                      <div className="space-y-2">
                        <textarea
                          value={foodDescription}
                          onChange={(e) => setFoodDescription(e.target.value)}
                          className="w-full text-xs border rounded-lg p-2 h-16 resize-none"
                          placeholder="记录今天吃了什么..."
                        />
                        <div 
                          onClick={handleFoodPhotoClick}
                          className="flex items-center justify-center p-3 border-2 border-dashed border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                        >
                          <div className="text-center">
                            <div className="text-green-600 mb-1">📷</div>
                            <p className="text-xs text-green-700 font-medium">拍照上传食物</p>
                            <p className="text-xs text-green-600">AI智能识别营养成分</p>
                          </div>
                        </div>
                        
                        {/* 显示已上传的图片 */}
                        {foodImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            {foodImages.map((imageUrl, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={imageUrl}
                                  alt={`食物图片 ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-lg"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFoodImages(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">饮食感受</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {['很满足', '有点撑', '刚刚好', '还想吃'].map((feeling) => (
                          <button
                            key={feeling}
                            onClick={() => setFoodFeeling(feeling)}
                            className={`text-xs py-2 px-3 rounded-lg border transition-colors ${
                              foodFeeling === feeling
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-green-200 hover:bg-green-50'
                            }`}
                          >
                            {feeling}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={saveMealRecord}
                      disabled={isLoading}
                      className="w-full bg-green-500 text-white text-sm py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '保存中...' : '保存记录'}
                    </button>
                  </div>
                )}

                {selectedRecordType === '病症' && (
                  <div className="p-4 space-y-4">
                    {/* 病症记录内容 */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">身体不适记录</h4>
                      <p className="text-xs text-gray-600">记录身体的不适症状，帮助了解健康状况</p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">症状部位</h5>
                      <div className="grid grid-cols-3 gap-2">
                        {['头部', '胸部', '腹部', '四肢', '腰背', '其他'].map((part) => (
                          <button
                            key={part}
                            onClick={() => setSymptomPart(part)}
                            className={`text-xs py-2 px-3 rounded-lg border transition-colors ${
                              symptomPart === part
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-red-200 hover:bg-red-50'
                            }`}
                          >
                            {part}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">症状描述</h5>
                      <textarea
                        className="w-full text-xs border rounded-lg p-2 h-16 resize-none"
                        placeholder="详细描述症状..."
                      />
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">严重程度</h5>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">轻微</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={symptomSeverity}
                          onChange={(e) => setSymptomSeverity(Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-600">严重</span>
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-xs text-red-600 font-medium">{symptomSeverity}/10</span>
                      </div>
                    </div>

                    <button
                      onClick={saveSymptomRecord}
                      disabled={isLoading}
                      className="w-full bg-red-500 text-white text-sm py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '保存中...' : '保存记录'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Area */}
        <div className="flex-shrink-0 relative" ref={menuRef}>
          {/* Record Options Menu */}
          {showRecordOptions && (
            <div className="absolute -top-60 right-6 z-40">
              <div className="transform transition-all duration-300 ease-out animate-in slide-in-from-bottom-5">
                {/* Options with Labels - Compact Vertical Layout */}
                <div className="bg-white rounded-xl shadow-lg p-2">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleRecordOption('睡眠')}
                      className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                      title="睡眠"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Moon className="w-4 h-4 text-gray-700" />
                      </div>
                      <span className="text-xs text-gray-700">睡眠</span>
                    </button>
                    <button
                      onClick={() => handleRecordOption('情绪')}
                      className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                      title="情绪"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-xs text-gray-700">情绪</span>
                    </button>
                    <button
                      onClick={() => handleRecordOption('饮食')}
                      className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                      title="饮食"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Utensils className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-700">饮食</span>
                    </button>
                    <button
                      onClick={() => handleRecordOption('病症')}
                      className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                      title="病症"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="text-xs text-gray-700">病症</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating Add Button */}
          <button
            onClick={() => setShowRecordOptions(!showRecordOptions)}
            className={`absolute -top-16 right-6 w-14 h-14 bg-purple-200 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-300 transition-all duration-300 z-30 ${
              showRecordOptions ? 'rotate-45' : 'rotate-0'
            }`}
          >
            <Plus className="w-7 h-7 text-white" />
          </button>

          {/* Bottom Navigation */}
          <nav className="bg-white border-t border-gray-200">
            <div className="flex justify-around items-center py-1">
              <div className="flex flex-col items-center py-2 px-3">
                <div className="w-6 h-6 mb-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-900">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-900 font-medium">记录</span>
              </div>

              <Link href="/community" className="flex flex-col items-center py-2 px-3">
                <div className="w-6 h-6 mb-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-400">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01 1l-2.7 3.6L8.5 11H5c-.83 0-1.5.67-1.5 1.5S4.17 14 5 14h2.5l2.7-3.6L13 13v9h3z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-400">社区</span>
              </Link>

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

      {/* 侧边栏菜单（相对手机容器定位） */}
      {showSideMenu && (
        <>
          {/* 遮罩层 - 只覆盖手机容器 */}
          <div
            className="absolute inset-0 bg-black/20 z-40"
            onClick={() => setShowSideMenu(false)}
          />

          {/* 侧边栏 - 从手机容器左侧滑出 */}
          <div
            ref={sideMenuRef}
            className={`absolute top-0 left-0 bottom-0 w-64 bg-white shadow-2xl z-50 transform transition-all duration-300 ${
              showSideMenu ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* 用户统计区域 */}
            <div className="p-4 bg-white border-b border-gray-100">
              <h2 className="text-base font-medium text-gray-900 mb-3">养生达人</h2>
              <div className="flex justify-between text-center">
                <div>
                  <div className="text-xl font-semibold text-gray-900">{dailySummaries.length}</div>
                  <div className="text-xs text-gray-500">记录天数</div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">{avgSleepHours ?? '-'}{avgSleepHours ? 'h' : ''}</div>
                  <div className="text-xs text-gray-500">平均睡眠</div>
                </div>
                <div>
                  <div className={`text-xl font-semibold ${overallHealthStatus === '良好' ? 'text-green-600' : overallHealthStatus === '一般' ? 'text-yellow-600' : 'text-red-600'}`}>{overallHealthStatus || '-'}</div>
                  <div className="text-xs text-gray-500">总体健康状况</div>
                </div>
              </div>
            </div>

            {/* 日历区域 */}
            <div className="px-6 pb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                {new Date().getFullYear()}年{new Date().getMonth() + 1}月
              </h3>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {/* 星期标题 */}
                  {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                    <div key={day} className="text-center text-gray-500 py-1 font-medium">
                      {day}
                    </div>
                  ))}
                  {/* 日期 */}
                  {generateCalendarData().map((dayData, index) => (
                    <div key={index} className="aspect-square flex items-center justify-center">
                      {dayData ? (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          dayData.isToday
                            ? 'bg-blue-500 text-white font-medium'
                            : dayData.hasRecord
                              ? 'bg-green-400 text-white font-medium'
                              : 'text-gray-700 hover:bg-white rounded-full transition-colors'
                        }`}>
                          {dayData.day}
                        </div>
                      ) : (
                        <div className="w-5 h-5"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 主要功能按钮 */}
            <div className="p-4 space-y-3">
              <button
                onClick={() => router.push('/constitution-reports')}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                体质报告
              </button>
              <button className="w-full bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <Activity className="w-4 h-4" />
                历史健康状况
              </button>
            </div>

            {/* 辅助功能 */}
            <div className="p-4">
              <h4 className="text-sm text-gray-500 mb-3">全部功能</h4>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">回收站</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <HelpCircle className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">帮助中心</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 首次登录体质测试提醒弹窗 - 已隐藏 */}
      {false && showConstitutionTestReminder && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center">
              {/* 图标 */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">欢迎使用煦养！</h3>

              {/* 描述 */}
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                为了给您提供更精准的健康建议，建议您先进行一次体质测试。
                <br />
                <span className="text-blue-600 font-medium">基于中医理论，仅需几分钟</span>
              </p>

              {/* 按钮组 */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowConstitutionTestReminder(false);
                    router.push('/constitution-test');
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  立即测试
                </button>

                <button
                  onClick={() => setShowConstitutionTestReminder(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  稍后再说
                </button>
              </div>

              {/* 提示文字 */}
              <p className="text-xs text-gray-500 mt-4">
                您也可以随时通过
                <span className="text-blue-600 font-medium">内观页面</span>
                进行体质测试
              </p>
            </div>
          </div>
        </div>
      )}

      </div>


    </div>
  );
}
