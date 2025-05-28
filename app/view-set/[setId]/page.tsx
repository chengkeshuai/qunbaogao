'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface ReportFile {
  id: string;
  original_filename: string;
  r2_object_key: string;
  order_in_set: number;
  // keywords?: string[]; // 字段已移除
}

interface ReportSetDetails {
  id: string;
  title: string;
  files: ReportFile[];
  password_protected: boolean;
  // user_id?: string | null; // 根据需要添加
  // created_at: string;
  // updated_at: string;
}

const WECHAT_GREEN = '#2dc100';
const WECHAT_GREEN_HOVER = '#249c00';

// 定义新的颜色常量
const SIDEBAR_BG = 'bg-slate-100'; // 侧边栏背景色
const SIDEBAR_TEXT_COLOR = 'text-slate-700';
const SIDEBAR_TITLE_COLOR = 'text-slate-800';
const SELECTED_ITEM_BG = 'bg-slate-600'; // 选中项背景
const SELECTED_ITEM_TEXT = 'text-white';
const HOVER_ITEM_BG = 'hover:bg-slate-300';

export default function ViewSetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const setId = params.setId as string;
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [reportSet, setReportSet] = useState<ReportSetDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFileKey, setCurrentFileKey] = useState<string | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (setId) {
      const fetchReportSetDetails = async () => {
        setIsLoading(true);
        try {
          const url = token ? `/api/get-set-details/${setId}?token=${token}` : `/api/get-set-details/${setId}`;
          const response = await fetch(url);
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              const errorData = await response.json();
              setError(errorData.message || '需要密码或密码错误');
              setShowPasswordInput(true); 
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            setReportSet(null); 
            return;
          }
          const data: ReportSetDetails = await response.json();
          setReportSet(data);
          setShowPasswordInput(false);
          setError(null);
          if (data.files && data.files.length > 0) {
            // 默认选中第一个文件
            // setCurrentFileKey(data.files[0].r2_object_key);
          }
        } catch (err: any) {
          setError(err.message || '加载报告集失败');
          setReportSet(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReportSetDetails();
    }
  }, [setId, token]);

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
    router.push(`/view-set/${setId}?token=${encodeURIComponent(password)}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 mx-auto"></div>
          <p className="text-lg text-gray-600">正在加载报告集...</p>
        </div>
        <style jsx>{`
          .loader {
            border-top-color: ${WECHAT_GREEN};
            animation: spinner 1.5s linear infinite;
          }
          @keyframes spinner {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          /* 添加侧边栏过渡动画 */
          .sidebar-transition {
            transition: width 0.3s ease-in-out, padding 0.3s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  if (error && showPasswordInput && !reportSet) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">请输入访问密码</h2>
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">密码</label>
              <input
                type="password"
                name="password"
                id="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button 
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              提交
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/" legacyBehavior>
              <a className="text-sm text-indigo-600 hover:text-indigo-500">返回首页</a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !reportSet) { // General error, not password related, or password attempt failed but not showing input
    return <div className="flex justify-center items-center h-screen"><p className="text-lg text-red-500">错误: {error}</p></div>;
  }

  if (!reportSet) {
    return <div className="flex justify-center items-center h-screen"><p className="text-lg text-gray-600">未找到报告集。</p></div>;
  }
  
  // Sort files by order_in_set for display
  const sortedFiles = [...reportSet.files].sort((a, b) => a.order_in_set - b.order_in_set);

  // 根据搜索词过滤文件
  const filteredFiles = sortedFiles.filter(file => {
    const term = searchTerm.toLowerCase();
    return file.original_filename.toLowerCase().includes(term);
  });

  return (
    <div className="flex h-screen antialiased text-gray-900 bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 flex flex-col justify-between 
                    ${SIDEBAR_BG} ${SIDEBAR_TEXT_COLOR} 
                    transition-all duration-300 ease-in-out shadow-lg 
                    ${isSidebarCollapsed ? 'w-16 hover:w-64 group' : 'w-64'}`}
      >
        <div>
          <div className={`flex items-center justify-between p-3 h-16 border-b border-slate-300 
                         ${isSidebarCollapsed ? 'group-hover:justify-between' : 'justify-between'}`}>
            <h1 className={`text-xl font-bold ${SIDEBAR_TITLE_COLOR} 
                           ${isSidebarCollapsed ? 'hidden group-hover:block' : 'block'} truncate`}>
              {reportSet.title}
            </h1>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-1 rounded-md ${SIDEBAR_TEXT_COLOR} hover:bg-slate-300 focus:outline-none 
                         focus:ring-2 focus:ring-inset focus:ring-slate-400`}
              title={isSidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            >
              {isSidebarCollapsed ? <Bars3Icon className="h-6 w-6" /> : <ChevronLeftIcon className="h-6 w-6" />}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="px-3 pt-3">
              <input 
                type="text"
                placeholder="搜索文件..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 py-1.5 ${SIDEBAR_TEXT_COLOR} bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-none text-sm placeholder-slate-400`}
              />
            </div>
          )}

          <div className={`px-3 mt-2.5 flex-grow overflow-y-auto 
                         ${isSidebarCollapsed ? 'space-y-1 group-hover:space-y-1.5' : 'space-y-1.5'}
                         ${isSidebarCollapsed && !searchTerm ? 'pr-0' : 'pr-1 mr-[-4px]'}`}>
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setCurrentFileKey(file.r2_object_key)}
                  title={file.original_filename}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors break-all truncate
                              ${currentFileKey === file.r2_object_key 
                                ? `${SELECTED_ITEM_BG} ${SELECTED_ITEM_TEXT}` 
                                : `${SIDEBAR_TEXT_COLOR} ${HOVER_ITEM_BG}`}
                              ${isSidebarCollapsed ? 'group-hover:block' : 'block'}`}
                >
                  <span className={`${isSidebarCollapsed ? 'hidden group-hover:inline' : 'inline'}`}>{file.original_filename}</span>
                  {isSidebarCollapsed && <span className="inline group-hover:hidden">{file.original_filename.substring(0,1)}</span>} {/* Show first letter when collapsed and not hovered */}
                </button>
              ))
            ) : (
              <p className={`px-3 py-2 text-sm ${SIDEBAR_TEXT_COLOR} italic 
                            ${isSidebarCollapsed ? 'hidden group-hover:block' : 'block'}`}>
                {searchTerm ? '未找到匹配的文件。' : '没有文件。'}
              </p>
            )}
          </div>
        </div>
        
        <div className={`p-3 border-t border-slate-300 ${isSidebarCollapsed ? 'hidden group-hover:block' : 'block'}`}>
           <Link href="/" legacyBehavior>
              <a className={`w-full text-center block px-3 py-2 rounded-md text-sm font-medium transition-colors text-white bg-slate-500 hover:bg-slate-600`}>
               返回群报告
              </a>
            </Link>
        </div>
      </div>

      {/* Main Content Iframe */}
      <div className={`flex-grow h-full transition-all duration-300 ease-in-out 
                     ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {currentFileKey ? (
          <iframe
            src={`/api/view/${currentFileKey}`}
            title="HTML 内容预览"
            className="w-full h-full border-none bg-white shadow-inner"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          <div className="w-full h-full flex justify-center items-center bg-white">
            <p className="text-gray-500">请从左侧选择一个文件查看。</p>
          </div>
        )}
      </div>
    </div>
  );
}
