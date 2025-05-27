'use client';

import { useState, useRef } from 'react';
// 假设你已经有某种方式引入了 Font Awesome，例如在全局CSS或Layout中
// import '@fortawesome/fontawesome-free/css/all.min.css'; 

export default function HtmlUploader() {
  const [htmlCode, setHtmlCode] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deployedInfo, setDeployedInfo] = useState<{ url: string; isPublic: boolean; r2Url?: string; hasPassword: boolean } | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [setLinkPassword, setSetLinkPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showUploaderPassword, setShowUploaderPassword] = useState(true);

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
      setActiveTab('paste');
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
      setDeployedInfo(null);

      const requestBody: { htmlCode: string; password?: string } = {
        htmlCode,
      };

      if (setLinkPassword && password.trim().length > 0) {
        requestBody.password = password.trim();
      }

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '部署失败，无法解析错误信息' }));
        throw new Error(errorData.error || '部署失败');
      }

      const data = await response.json();
      setDeployedInfo(data);
    } catch (err) {
      setError((err as Error).message || '上传过程中发生错误');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 text-center transition-colors font-semibold text-base md:text-lg rounded-tl-md rounded-bl-md ${
              activeTab === 'upload'
                ? 'bg-[#2dc100] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            上传
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-3 px-4 text-center transition-colors font-semibold text-base md:text-lg rounded-tr-md rounded-br-md ${
              activeTab === 'paste'
                ? 'bg-[#2dc100] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-t border-r border-b border-gray-300'
            }`}
          >
            粘贴代码
          </button>
        </div>

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
                e.stopPropagation();
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
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2dc100] focus:border-transparent focus:outline-none"
              placeholder="在此粘贴您的HTML代码..."
              value={htmlCode}
              onChange={handleTextChange}
            />
          </div>
        )}

        <div className="my-4">
          <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={setLinkPassword}
              onChange={(e) => {
                setSetLinkPassword(e.target.checked);
                if (!e.target.checked) {
                  setPassword('');
                }
              }}
              className="form-checkbox h-4 w-4 text-[#2dc100] rounded border-gray-300 focus:ring-[#2dc100]/50 focus:ring-offset-0 focus:ring-1"
              id="setLinkPasswordCheckbox"
            />
            <span>为此链接设置密码 (可选)</span>
          </label>
        </div>

        {setLinkPassword && (
          <div className="my-4">
            <label htmlFor="link-password" className="block text-sm font-medium text-gray-700 mb-1">
              设置访问密码 (可选):
            </label>
            <div className="relative">
              <input 
                type={showUploaderPassword ? 'text' : 'password'}
                id="link-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="留空则不设密码"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2dc100] focus:border-transparent focus:outline-none text-sm pr-10"
              />
              <button 
                type="button"
                onClick={() => setShowUploaderPassword(!showUploaderPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showUploaderPassword ? "隐藏密码" : "显示密码"}
              >
                {showUploaderPassword ? (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l3.291 3.291M3 3l18 18" /></svg>
                ) : (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
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
            {deployedInfo.hasPassword ? 
              '这是一个受密码保护的链接：' : 
              '这是一个公开访问的链接 (通过您的域名提供)：'
            }
          </p>
          <a
            href={deployedInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-3 bg-white border border-[#2dc100]/30 rounded-lg text-[#2dc100] hover:underline text-center break-all"
          >
            {deployedInfo.url}
          </a>
          {!deployedInfo.isPublic && deployedInfo.r2Url && (
            <p className="mt-2 text-xs text-gray-500">原始R2存储路径 (仅供参考): 
              <a href={deployedInfo.r2Url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 break-all">{deployedInfo.r2Url}</a>
            </p>
          )}
          <div className="mt-4 flex gap-4 justify-center">
            <a
              href={deployedInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#2dc100] text-white rounded-lg hover:bg-[#249c00]"
            >
              访问网页
            </a>
            <button
              onClick={() => {
                let urlToCopy = deployedInfo.url;
                if (!urlToCopy.startsWith('http')) {
                  urlToCopy = window.location.origin + urlToCopy;
                }
                navigator.clipboard.writeText(urlToCopy);
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