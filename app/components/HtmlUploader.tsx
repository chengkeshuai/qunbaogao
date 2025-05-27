'use client';

import { useState, useRef } from 'react';

export default function HtmlUploader() {
  const [htmlCode, setHtmlCode] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deployedInfo, setDeployedInfo] = useState<{ url: string; isPublic: boolean; r2Url?: string; hasPassword: boolean } | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('paste'); // 'upload' 或 'paste'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPrivateLink, setIsPrivateLink] = useState(false); // New state for private link
  const [password, setPassword] = useState(''); // New state for password input

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlCode(e.target.value);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setHtmlCode(event.target?.result as string);
      setUploadedFileName(file.name);
      setActiveTab('paste'); // 切换到粘贴模式显示内容
      setError('');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!htmlCode.trim()) {
      setError('请上传或粘贴HTML代码');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      setDeployedInfo(null); // Reset previous deployment info

      const requestBody: { htmlCode: string; isPrivate: boolean; password?: string } = {
        htmlCode,
        isPrivate: isPrivateLink,
      };

      if (isPrivateLink && password.trim().length > 0) {
        requestBody.password = password.trim();
      }

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody), // Send updated request body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '部署失败，无法解析错误信息' }));
        throw new Error(errorData.error || '部署失败');
      }

      const data = await response.json();
      setDeployedInfo(data); // Store the full deployment info
    } catch (err) {
      setError((err as Error).message || '上传过程中发生错误');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 选项卡按钮 */}
        <div className="flex rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'upload'
                ? 'bg-[#2dc100] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            上传
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-3 px-4 text-center transition-colors ${
              activeTab === 'paste'
                ? 'bg-[#2dc100] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            粘贴代码
          </button>
        </div>

        {/* 上传模式 */}
        {activeTab === 'upload' && (
          <div 
            className="w-full h-64 border border-gray-300 rounded-lg bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#2dc100] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#2dc100] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-700">拖放您的HTML文件到此处</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">或点击选择文件</p>
            <button
              type="button"
              className="px-4 py-2 bg-[#2dc100] text-white rounded-lg hover:bg-[#249c00] focus:outline-none"
              onClick={(e) => {
                e.stopPropagation(); // 防止事件冒泡
                fileInputRef.current?.click();
              }}
            >
              选择HTML文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
        
        {/* 粘贴模式 */}
        {activeTab === 'paste' && (
          <div className="space-y-2">
            {uploadedFileName && (
              <div className="flex items-center bg-[#e6f9e6] text-[#2dc100] p-2 rounded-lg mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>已成功上传文件：{uploadedFileName}</span>
              </div>
            )}
            <textarea
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2dc100] focus:border-transparent"
              placeholder="在此粘贴您的HTML代码..."
              value={htmlCode}
              onChange={handleTextChange}
            />
          </div>
        )}

        {/* Private link checkbox */}
        <div className="my-4">
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isPrivateLink}
              onChange={(e) => setIsPrivateLink(e.target.checked)}
              className="form-checkbox h-4 w-4 text-[#2dc100] rounded border-gray-300 focus:ring-[#2dc100]"
            />
            <span>生成私有链接</span>
          </label>
        </div>

        {/* Password input, shown if isPrivateLink is true */}
        {isPrivateLink && (
          <div className="my-4">
            <label htmlFor="link-password" className="block text-sm font-medium text-gray-700 mb-1">
              设置访问密码 (可选):
            </label>
            <input 
              type="password"
              id="link-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="留空则不设密码"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2dc100] focus:border-transparent text-sm"
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading}
            className="px-4 py-2 bg-[#2dc100] text-white rounded-lg hover:bg-[#249c00] focus:outline-none focus:ring-2 focus:ring-[#2dc100] disabled:opacity-50"
          >
            {isUploading ? '正在部署...' : '部署网页'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {deployedInfo && (
        <div className="mt-6 p-4 bg-[#e6f9e6] border border-[#2dc100]/30 rounded-lg">
          <h3 className="text-lg font-medium text-[#2dc100] mb-2">部署成功！</h3>
          <p className="mb-2 text-[#238a00]">
            您的网页已成功部署。
            {deployedInfo.isPublic ? 
              '可通过以下公开链接访问：' : 
              `这是一个私有链接${deployedInfo.hasPassword ? ' (已设置密码)' : ' (未设置密码)'}：`
            }
          </p>
          <a
            href={deployedInfo.url} // Use the main URL from deployedInfo
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-3 bg-white border border-[#2dc100]/30 rounded-lg text-[#2dc100] hover:underline text-center break-all"
          >
            {deployedInfo.url}
          </a>
          {!deployedInfo.isPublic && deployedInfo.r2Url && (
            <p className="mt-2 text-xs text-gray-500">原始R2链接 (仅供参考): 
              <a href={deployedInfo.r2Url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 break-all">{deployedInfo.r2Url}</a>
            </p>
          )}
          <div className="mt-4 flex gap-4 justify-center">
            <a
              href={deployedInfo.url} // Use the main URL
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#2dc100] text-white rounded-lg hover:bg-[#249c00]"
            >
              访问网页
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(deployedInfo.url); // Copy the main URL
                alert('链接已复制到剪贴板');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              复制链接
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 