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
}

interface ReportSetDetails {
  id: string;
  title: string | null;
  has_password?: boolean; // This might come from initial check if password is required
  files: ReportFile[];
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
  const [initialPassword, setInitialPassword] = useState(''); // For password prompt

  const [isLoading, setIsLoading] = useState(true);
  const [reportSet, setReportSet] = useState<ReportSetDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [currentFileKey, setCurrentFileKey] = useState<string | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // 新增：搜索词状态

  useEffect(() => {
    if (!setId) return;

    const fetchSetDetails = async (passwordAttempt?: string) => {
      setIsLoading(true);
      setError(null);
      setNeedsPassword(false);

      try {
        let url = `/api/get-set-details/${setId}`;
        if (passwordAttempt) {
          url += `?password=${encodeURIComponent(passwordAttempt)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();

        if (response.status === 401 && data.error === 'Password required') {
          setNeedsPassword(true);
          setIsLoading(false);
          return;
        }
        if (!response.ok) {
          throw new Error(data.error || '获取报告集详情失败');
        }
        
        setReportSet(data);
        if (data.files && data.files.length > 0) {
          // Default to the first file in the set, sorted by order_in_set
          const sortedFiles = [...data.files].sort((a, b) => a.order_in_set - b.order_in_set);
          setCurrentFileKey(sortedFiles[0].r2_object_key);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    // Check if password was provided in URL (e.g., after submitting a prompt)
    const queryPassword = searchParams.get('password');
    fetchSetDetails(queryPassword || undefined);

  }, [setId, searchParams]);

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // To re-trigger fetchSetDetails with the new password,
    // we can update the URL search params, which will cause the useEffect to re-run.
    // Or, call fetchSetDetails directly.
    // For simplicity with Next.js 13+ app router, updating URL is cleaner.
    const currentPath = window.location.pathname;
    router.push(`${currentPath}?password=${encodeURIComponent(initialPassword)}`);
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

  if (error && !needsPassword) { // Don't show generic error if it's a password prompt situation
    return (
      <div className="flex justify-center items-center h-screen bg-red-50">
        <div className="text-center p-8 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">加载错误</h2>
          <p className="text-red-700">{error}</p>
          <Link href="/" legacyBehavior>
            <a className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-[${WECHAT_GREEN}] rounded-lg hover:bg-[${WECHAT_GREEN_HOVER}]">
              返回首页
            </a>
          </Link>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="bg-gray-100 flex items-center justify-center h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-semibold mb-4 text-center text-gray-700">知识库受密码保护</h1>
          {reportSet?.title && <p className="text-gray-600 mb-2 text-center">标题: {reportSet.title}</p>}
          <p className="text-gray-600 mb-6 text-center">请输入访问密码</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="passwordInputSet" className="block text-sm font-medium text-gray-700">密码:</label>
              <div className="relative mt-1">
                <input 
                  type={showPasswordInput ? 'text' : 'password'} 
                  name="password" 
                  id="passwordInputSet" 
                  value={initialPassword} 
                  onChange={(e) => setInitialPassword(e.target.value)} 
                  required
                  className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[${WECHAT_GREEN}] focus:border-[${WECHAT_GREEN}] sm:text-sm pr-10`}
                />
                <button 
                  type="button" 
                  id="togglePasswordVisibilitySet" 
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPasswordInput ? "隐藏密码" : "显示密码"}
                >
                   {showPasswordInput ? (
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l3.291 3.291M3 3l18 18" /></svg>
                    ) : (
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>} {/* Display error from previous attempt if any */}
            <button type="submit" 
                    disabled={isLoading} // Disable button while submitting (isLoading state is reused)
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[${WECHAT_GREEN}] hover:bg-[${WECHAT_GREEN_HOVER}] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${WECHAT_GREEN}] disabled:opacity-50`}>
              {isLoading ? '验证中...' : '提交'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!reportSet || !reportSet.files || reportSet.files.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">知识库为空或未找到</h2>
            <p className="text-gray-600">此知识库不包含任何文件，或无法找到该知识库。</p>
            <Link href="/" legacyBehavior><a className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-[${WECHAT_GREEN}] rounded-lg hover:bg-[${WECHAT_GREEN_HOVER}]">返回首页</a></Link>
        </div>
      </div>
    );
  }
  
  // Sort files by order_in_set for display
  const sortedFiles = [...reportSet.files].sort((a, b) => a.order_in_set - b.order_in_set);

  // 新增：根据搜索词过滤文件
  const filteredFiles = sortedFiles.filter(file => 
    file.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <div 
        className={`sidebar-transition ${SIDEBAR_BG} shadow-lg flex-shrink-0 md:h-full overflow-y-auto flex flex-col
                    ${isSidebarCollapsed ? 'w-0 md:w-[68px] p-0 md:p-2' : 'w-full md:w-72 p-4'}`}
      >
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} mb-3`}>
          {!isSidebarCollapsed && (
            <h2 className={`text-xl font-semibold ${SIDEBAR_TITLE_COLOR} break-words truncate`}>
              {reportSet.title || '知识库'}
            </h2>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-1.5 rounded-md ${HOVER_ITEM_BG} ${SIDEBAR_TEXT_COLOR} focus:outline-none focus:ring-2 focus:ring-slate-500`}
            aria-label={isSidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            {isSidebarCollapsed ? (
              <Bars3Icon className="h-6 w-6" />
            ) : (
              <ChevronLeftIcon className="h-6 w-6" />
            )}
          </button>
        </div>

        {!isSidebarCollapsed && (
          <>
            {/* 新增搜索框 */}
            <div className="my-2.5">
              <input 
                type="text"
                placeholder="按文件名搜索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 py-1.5 ${SIDEBAR_TEXT_COLOR} bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-slate-500 focus:border-slate-500 outline-none text-sm placeholder-slate-400`}
              />
            </div>

            <div className="space-y-1.5 flex-grow overflow-y-auto pr-1 mr-[-4px]"> {/* 添加 pr 和 mr 来处理滚动条可能引起的宽度问题 */}
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setCurrentFileKey(file.r2_object_key)}
                    title={file.original_filename}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors break-all truncate
                                ${currentFileKey === file.r2_object_key 
                                  ? `${SELECTED_ITEM_BG} ${SELECTED_ITEM_TEXT}` 
                                  : `${SIDEBAR_TEXT_COLOR} ${HOVER_ITEM_BG}`}`}
                  >
                    {file.original_filename}
                  </button>
                ))
              ) : (
                <p className={`px-3 py-2 text-sm ${SIDEBAR_TEXT_COLOR} italic`}>未找到匹配的文件。</p>
              )}
            </div>
          </>
        )}
        
        {!isSidebarCollapsed && (
          <div className="mt-auto pt-3 border-t border-slate-300">
             <Link href="/" legacyBehavior>
                <a className={`w-full text-center block px-3 py-2 rounded-md text-sm font-medium transition-colors text-white bg-slate-500 hover:bg-slate-600`}>
                 返回群报告
                </a>
              </Link>
          </div>
        )}
      </div>

      {/* Main Content Iframe */}
      <div className={`flex-grow h-full w-full transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-0'}`}>
        {currentFileKey ? (
          <iframe
            src={`/api/view/${currentFileKey}`}
            title="HTML 内容预览"
            className="w-full h-full border-none bg-white shadow-inner"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Security sandbox settings
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