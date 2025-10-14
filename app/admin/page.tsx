'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface KnowledgeBase {
  id: string;
  title: string;
  created_at: string;
  has_password: boolean;
  file_count: number;
  files: Array<{
    filename: string;
    r2_key: string;
    order: number;
  }>;
  view_url: string;
  analytics: {
    total_views: number;
    unique_visitors: number;
    recent_views: number;
  };
}

interface SingleFile {
  filename: string;
  r2_key: string;
  created_at: string;
  size: number;
  view_url: string;
  analytics: {
    total_views: number;
    unique_visitors: number;
    recent_views: number;
  };
}

interface AdminData {
  knowledge_bases: KnowledgeBase[];
  single_files: SingleFile[];
  total_knowledge_bases: number;
  total_single_files: number;
}

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [type, setType] = useState<'all' | 'sets' | 'single'>('all');
  const [limit, setLimit] = useState(20);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [blockedIPs, setBlockedIPs] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/admin/generated-pages?type=${type}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('获取数据失败');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const result = await response.json();
        setUserData(result);
        setBlockedIPs(result.blockedIPs || []);
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?timeRange=${analyticsTimeRange}`);
      if (response.ok) {
        const result = await response.json();
        setAnalytics(result);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  // 检查认证状态
  useEffect(() => {
    const token = searchParams.get('token');
    const hash = searchParams.get('hash');
    
    if (!token || !hash) {
      // 没有认证信息，重定向到登录页面
      router.push('/admin/login');
      return;
    }
    
    // 验证会话
    fetch('/api/admin/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, hash })
    })
    .then(response => response.json())
    .then(data => {
      if (data.valid) {
        setIsAuthenticated(true);
        fetchData();
        fetchUserData();
        fetchAnalytics();
      } else {
        router.push('/admin/login');
      }
    })
    .catch(() => {
      router.push('/admin/login');
    });
  }, [searchParams, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deleteKnowledgeBase = async (setId: string) => {
    if (!confirm('确定要删除这个知识库吗？此操作不可撤销！')) {
      return;
    }

    setDeleting(setId);
    try {
      const response = await fetch(`/api/admin/delete-knowledge-base/${setId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除失败');
      }

      // 刷新数据
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(null);
    }
  };

  const deleteSingleFile = async (r2Key: string) => {
    if (!confirm('确定要删除这个文件吗？此操作不可撤销！')) {
      return;
    }

    setDeleting(r2Key);
    try {
      const response = await fetch(`/api/admin/delete-single-file?r2Key=${encodeURIComponent(r2Key)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除失败');
      }

      // 刷新数据
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(null);
    }
  };

  const blockUser = async (ip: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block', ip })
      });
      
      if (response.ok) {
        setBlockedIPs(prev => [...prev, ip]);
      }
    } catch (err) {
      setError('封禁用户失败');
    }
  };

  const unblockUser = async (ip: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unblock', ip })
      });
      
      if (response.ok) {
        setBlockedIPs(prev => prev.filter(blockedIP => blockedIP !== ip));
      }
    } catch (err) {
      setError('解封用户失败');
    }
  };

  // 如果未认证，显示加载状态
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">验证身份中...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>错误: {error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              重试
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">用户生成网页管理</h1>
          
          {/* 控制面板 */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">显示类型</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as 'all' | 'sets' | 'single')}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">全部</option>
                <option value="sets">知识库</option>
                <option value="single">单文件</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">显示数量</label>
              <select 
                value={limit} 
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <button 
              onClick={fetchData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-6"
            >
              刷新数据
            </button>
          </div>

          {/* 统计信息 */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">知识库总数</h3>
                <p className="text-2xl font-bold text-blue-600">{data.total_knowledge_bases}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">单文件总数</h3>
                <p className="text-2xl font-bold text-green-600">{data.total_single_files}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">被封禁IP数</h3>
                <p className="text-2xl font-bold text-red-600">{blockedIPs.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800">独立访客</h3>
                <p className="text-2xl font-bold text-purple-600">{analytics?.uniqueVisitors || 0}</p>
              </div>
            </div>
          )}

          {/* 访问统计 */}
          {analytics && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">访问统计</h2>
                <select 
                  value={analyticsTimeRange} 
                  onChange={(e) => {
                    setAnalyticsTimeRange(e.target.value as '1h' | '24h' | '7d' | '30d');
                    setTimeout(() => fetchAnalytics(), 100);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="1h">最近1小时</option>
                  <option value="24h">最近24小时</option>
                  <option value="7d">最近7天</option>
                  <option value="30d">最近30天</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800">总访问量</h3>
                  <p className="text-xl font-bold text-blue-600">{analytics.totalViews}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">真实用户</h3>
                  <p className="text-xl font-bold text-green-600">{analytics.humanViews}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800">机器人</h3>
                  <p className="text-xl font-bold text-yellow-600">{analytics.botViews}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800">独立访客</h3>
                  <p className="text-xl font-bold text-purple-600">{analytics.uniqueVisitors}</p>
                </div>
              </div>

              {/* 热门页面 */}
              {analytics.topPages && analytics.topPages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">热门页面</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">页面URL</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">真实访问</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">独立访客</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">主要来源</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {analytics.topPages.slice(0, 10).map((page: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              <div className="max-w-xs truncate" title={page.url}>
                                {page.url}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{page.humanViews}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{page.uniqueVisitors}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {page.topReferrers[0] ? page.topReferrers[0][0] : 'direct'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 来源统计 */}
              {analytics.referrerStats && analytics.referrerStats.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">访问来源</h3>
                  <div className="space-y-2">
                    {analytics.referrerStats.slice(0, 5).map((ref: any, index: number) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <span className="text-sm text-gray-700">
                          {ref.referrer === 'direct' ? '直接访问' : ref.referrer}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{ref.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 用户管理 */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">用户管理</h2>
            
            {/* 被封禁的IP */}
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">被封禁的IP地址</h3>
              {blockedIPs.length > 0 ? (
                <div className="space-y-2">
                  {blockedIPs.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-50 p-3 rounded">
                      <span className="text-red-800 font-mono">{ip}</span>
                      <button
                        onClick={() => unblockUser(ip)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        解封
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无被封禁的IP</p>
              )}
            </div>

            {/* 用户行为统计 */}
            {userData?.behaviors && userData.behaviors.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">用户行为统计</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP地址</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">上传次数</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">被阻止内容</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">可疑活动</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">最后上传</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {userData.behaviors.map((behavior: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-mono text-gray-900">{behavior.ip}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{behavior.uploadCount}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{behavior.blockedContentCount}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{behavior.suspiciousActivity.length}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {formatDate(behavior.lastUpload)}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {!blockedIPs.includes(behavior.ip) && (
                              <button
                                onClick={() => blockUser(behavior.ip)}
                                className="text-red-600 hover:text-red-800"
                              >
                                封禁
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 知识库列表 */}
          {(type === 'all' || type === 'sets') && data?.knowledge_bases && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">知识库 ({data.knowledge_bases.length})</h2>
              <div className="space-y-4">
                {data.knowledge_bases.map((kb) => (
                  <div key={kb.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{kb.title}</h3>
                      <div className="flex gap-2">
                        {kb.has_password && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            有密码
                          </span>
                        )}
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {kb.file_count} 个文件
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {kb.analytics.total_views} 次访问
                        </span>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          {kb.analytics.unique_visitors} 独立访客
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      创建时间: {formatDate(kb.created_at)}
                    </p>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">文件列表:</p>
                      <div className="flex flex-wrap gap-1">
                        {kb.files.map((file, index) => (
                          <span 
                            key={index}
                            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {file.filename}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <a 
                        href={kb.view_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        查看知识库 →
                      </a>
                      <button
                        onClick={() => deleteKnowledgeBase(kb.id)}
                        disabled={deleting === kb.id}
                        className="inline-flex items-center text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                      >
                        {deleting === kb.id ? '删除中...' : '删除'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 单文件列表 */}
          {(type === 'all' || type === 'single') && data?.single_files && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">单文件上传 ({data.single_files.length})</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            文件名
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            创建时间
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            文件大小
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            访问量
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            独立访客
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.single_files.map((file, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {file.filename}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {formatDate(file.created_at)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {file.analytics.total_views}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {file.analytics.unique_visitors}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex gap-2">
                            <a 
                              href={file.view_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              查看 →
                            </a>
                            <button
                              onClick={() => deleteSingleFile(file.r2_key)}
                              disabled={deleting === file.r2_key}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              {deleting === file.r2_key ? '删除中...' : '删除'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data && data.knowledge_bases.length === 0 && data.single_files.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无数据</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
