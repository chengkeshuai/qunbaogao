'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
          <h1 className="text-2xl font-semibold mb-4 text-center text-gray-700">报告集受密码保护</h1>
          {reportSet?.title && <p className="text-gray-600 mb-2 text-center">标题: {reportSet.title}</p>}
          <p className="text-gray-600 mb-6 text-center">请输入密码以访问此报告集。</p>
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
            <h2 className="text-2xl font-bold text-gray-700 mb-4">报告集为空或未找到</h2>
            <p className="text-gray-600">此报告集不包含任何文件，或无法找到该报告集。</p>
            <Link href="/" legacyBehavior><a className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-[${WECHAT_GREEN}] rounded-lg hover:bg-[${WECHAT_GREEN_HOVER}]">返回首页</a></Link>
        </div>
      </div>
    );
  }
  
  // Sort files by order_in_set for display
  const sortedFiles = [...reportSet.files].sort((a, b) => a.order_in_set - b.order_in_set);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white shadow-md p-4 space-y-2 overflow-y-auto flex-shrink-0 md:h-full">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 break-words">
          {reportSet.title || '报告集'}
        </h2>
        {sortedFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => setCurrentFileKey(file.r2_object_key)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors break-all
                        ${currentFileKey === file.r2_object_key 
                          ? `bg-[${WECHAT_GREEN}] text-white` 
                          : 'text-gray-700 hover:bg-gray-200'}`}
          >
            {file.original_filename}
          </button>
        ))}
         <Link href="/" legacyBehavior>
            <a className={`mt-4 w-full text-center block px-3 py-2 rounded-md text-sm font-medium transition-colors text-white bg-gray-500 hover:bg-gray-600`}>
             返回首页
            </a>
          </Link>
      </div>

      {/* Main Content Iframe */}
      <div className="flex-grow p-1 md:p-0 h-full w-full">
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