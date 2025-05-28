'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface ReportFile {
  id: string;
  original_filename: string;
  r2_object_key: string;
  created_at?: string;
  order_in_set?: number | null;
  // keywords?: string[]; // Temporarily removed
}

interface ReportSetDetails {
  id: string;
  title: string;
  files: ReportFile[];
  password_hash?: string; // Keep if needed for other logic, or remove if only password_required is used
  password_required?: boolean; // New field from API
  password_prompt_message?: string; // New field from API
  created_at?: string;
  user_id?: string;
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
  const params = useParams<{ setId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setId } = params;

  const [reportSet, setReportSet] = useState<ReportSetDetails | null>(null);
  const [currentFileKey, setCurrentFileKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordPromptMessage, setPasswordPromptMessage] = useState<string | null>(null);
  const [userProvidedToken, setUserProvidedToken] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setUserProvidedToken(urlToken);
    }
  }, [searchParams, setId, router]);

  useEffect(() => {
    if (setId) {
      const fetchReportSetDetails = async () => {
        setIsLoading(true);
        setPasswordRequired(false);
        setPasswordPromptMessage(null);
        setReportSet(null);

        try {
          const url = userProvidedToken ? `/api/get-set-details/${setId}?token=${userProvidedToken}` : `/api/get-set-details/${setId}`;
          const response = await fetch(url);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: '无法解析错误响应' }));
            console.error("Error fetching report set details:", response.status, errorData);
            setPasswordPromptMessage(errorData.message || `加载知识库失败 (状态: ${response.status})`);
            setReportSet(null);
            setIsLoading(false);
            return;
          }

          const data: ReportSetDetails = await response.json();

          if (data.password_required) {
            setReportSet(data);
            setPasswordRequired(true);
            setPasswordPromptMessage(data.password_prompt_message || '此知识库受密码保护。');
            if (data.files && data.files.length > 0) {
              // Sort by order_in_set, then by original_filename as a fallback
              const sortedFiles = [...data.files].sort((a, b) => (a.order_in_set ?? Infinity) - (b.order_in_set ?? Infinity) || a.original_filename.localeCompare(b.original_filename));
              setCurrentFileKey(sortedFiles[0].r2_object_key);
            } else {
              setCurrentFileKey(null);
            }
          } else {
            setReportSet(data);
            setPasswordRequired(false);
            setPasswordPromptMessage(null);
            if (data.files && data.files.length > 0) {
              // Sort by order_in_set, then by original_filename as a fallback
              const sortedFiles = [...data.files].sort((a, b) => (a.order_in_set ?? Infinity) - (b.order_in_set ?? Infinity) || a.original_filename.localeCompare(b.original_filename));
              setCurrentFileKey(sortedFiles[0].r2_object_key);
            } else {
              setCurrentFileKey(null);
            }
          }
        } catch (e: any) {
          console.error('获取知识库详情时发生网络或解析错误:', e);
          setPasswordPromptMessage('无法连接到服务器或解析数据失败: ' + e.message);
          setReportSet(null);
        }
        setIsLoading(false);
      };
      fetchReportSetDetails();
    }
  }, [setId, userProvidedToken]);

  // Effect to listen for password token from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Basic security: check origin if possible, though for file:// or sandboxed iframes it might be null
      // if (event.origin !== window.location.origin) { 
      //   console.warn("Message from untrusted origin ignored:", event.origin);
      //   return;
      // }

      if (event.data && event.data.type === 'knowledgeBasePasswordValidated' && event.data.token) {
        console.log('Received password token from iframe:', event.data.token);
        setUserProvidedToken(event.data.token);
        // Optionally, clear password_required and prompt message if they were set
        setPasswordRequired(false);
        setPasswordPromptMessage(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Empty dependency array, so it runs once on mount and cleans up on unmount

  const handleFileSelect = (key: string) => {
    setCurrentFileKey(key);
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

  if (!reportSet && !isLoading && passwordPromptMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">访问出错</h1>
          <p className="text-gray-700">{passwordPromptMessage || '无法加载知识库信息。'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
          >
            返回群报告首页
          </button>
        </div>
      </div>
    );
  }

  if (!reportSet || !reportSet.files || reportSet.files.length === 0) {
    return <div className="flex justify-center items-center h-screen"><p className="text-lg text-gray-600">未找到报告集。</p></div>;
  }
  
  // Sort files by order_in_set for display, then by original_filename as a fallback
  const sortedFiles = [...reportSet.files].sort((a, b) => (a.order_in_set ?? Infinity) - (b.order_in_set ?? Infinity) || a.original_filename.localeCompare(b.original_filename));

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

          <div className={`px-3 mt-2.5 flex-grow overflow-y-auto 
                         ${isSidebarCollapsed ? 'space-y-1 group-hover:space-y-1.5' : 'space-y-1.5'}
                         ${isSidebarCollapsed ? 'pr-0' : 'pr-1 mr-[-4px]'}`}>
            {sortedFiles.length > 0 ? (
              sortedFiles.map((file) => (
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
                没有文件。
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
            src={(() => {
              let srcUrl = `/api/view/${currentFileKey}`;
              const queryParams = [];
              if (userProvidedToken && reportSet?.password_hash) {
                queryParams.push(`token=${encodeURIComponent(userProvidedToken)}`);
              }
              queryParams.push('isInsideKnowledgeBase=true');
              
              if (queryParams.length > 0) {
                srcUrl += '?' + queryParams.join('&');
              }
              return srcUrl;
            })()}
            title={reportSet?.files.find(f => f.r2_object_key === currentFileKey)?.original_filename || '文件内容'}
            className="w-full h-full border-none"
          ></iframe>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-lg text-gray-500">
              {reportSet && reportSet.files.length > 0 
                ? "请从左侧选择一个文件查看。" 
                : "此报告集没有可查看的文件。"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
