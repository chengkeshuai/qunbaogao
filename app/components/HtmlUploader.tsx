'use client';

import { useState, useRef, useCallback } from 'react';
// 假设你已经有某种方式引入了 Font Awesome，例如在全局CSS或Layout中
// import '@fortawesome/fontawesome-free/css/all.min.css'; 
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/react/24/outline'; // 引入Heroicons
import ToastNotification from './ToastNotification'; // 引入自定义Toast组件

interface UploadedFile {
  name: string;
  content: string;
}

export default function HtmlUploader() {
  const [htmlCode, setHtmlCode] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deployedInfo, setDeployedInfo] = useState<{ url: string; isPublic?: boolean; r2Url?: string; hasPassword?: boolean; isSet?: boolean; files?: {name: string}[] } | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [setLinkPassword, setSetLinkPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showUploaderPassword, setShowUploaderPassword] = useState(true);
  const [knowledgeBaseTitle, setKnowledgeBaseTitle] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'success' | 'error' | 'info' });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlCode(e.target.value);
    setUploadedFiles([]);
    setError('');
    setDeployedInfo(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setUploadedFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const fileToMove = newFiles[index];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;

      if (swapIndex < 0 || swapIndex >= newFiles.length) {
        return newFiles;
      }

      newFiles[index] = newFiles[swapIndex];
      newFiles[swapIndex] = fileToMove;
      return newFiles;
    });
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');
    setDeployedInfo(null);
    setHtmlCode('');

    const newUploadedFiles: UploadedFile[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'text/html' && !file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
            console.warn(`Skipping non-HTML file: ${file.name}`);
            continue;
        }
        const content = await readFileAsText(file);
        newUploadedFiles.push({ name: file.name, content });
      }

      if (newUploadedFiles.length === 0 && files.length > 0) {
        setError('未选择有效的 HTML 文件。');
        setUploadedFiles([]);
        setIsUploading(false);
        return;
      }
      
      setUploadedFiles(newUploadedFiles);

      if (newUploadedFiles.length > 1) {
        setActiveTab('set');
      } else if (newUploadedFiles.length === 1) {
        setHtmlCode(newUploadedFiles[0].content);
        setActiveTab('paste');
      }
    } catch (err) {
      setError('读取文件时出错: ' + (err as Error).message);
      setUploadedFiles([]);
    } finally {
      setIsUploading(false);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, []);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsUploading(true);
    setError('');
    setDeployedInfo(null);

    try {
      if (activeTab === 'set' && uploadedFiles.length > 0 ) { 
        const requestBody: { files: UploadedFile[]; title?: string; password?: string } = {
          files: uploadedFiles,
        };
        if (knowledgeBaseTitle.trim()) { 
          requestBody.title = knowledgeBaseTitle.trim();
        }
        if (setLinkPassword && password.trim().length > 0) {
          requestBody.password = password.trim();
        }

        const response = await fetch('/api/deploy-set', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '创建知识库失败，无法解析错误信息' }));
          throw new Error(errorData.error || '创建知识库失败');
        }
        const data = await response.json();
        setDeployedInfo({ ...data, isSet: true });

      } else { 
        let currentHtmlCode = htmlCode;
        if (!currentHtmlCode.trim() && uploadedFiles.length === 1 && activeTab === 'paste') {
          currentHtmlCode = uploadedFiles[0].content;
          setHtmlCode(currentHtmlCode); 
        }
        
        if (!currentHtmlCode.trim()) {
          setError('请上传或粘贴HTML代码');
          setIsUploading(false);
          return;
        }
        const requestBody: { htmlCode: string; password?: string } = { htmlCode: currentHtmlCode };
        if (setLinkPassword && password.trim().length > 0) {
          requestBody.password = password.trim();
        }

        const response = await fetch('/api/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '部署失败，无法解析错误信息' }));
          throw new Error(errorData.error || '部署失败');
        }
        const data = await response.json();
        setDeployedInfo({ ...data, isSet: false });
      }
    } catch (err) {
      setError((err as Error).message || '上传过程中发生错误');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (fileInputRef.current) {
        fileInputRef.current.files = files;
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
    }
  }, [handleFileChange]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex rounded-md overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => { setActiveTab('upload'); setUploadedFiles([]); setHtmlCode(''); setKnowledgeBaseTitle(''); setError(''); setDeployedInfo(null); }}
          className={`flex-1 py-3 px-4 text-center transition-colors font-semibold text-base md:text-lg rounded-tl-md rounded-bl-md ${
            activeTab === 'upload' || activeTab === 'set'
              ? 'bg-[#2dc100] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          {activeTab === 'set' && uploadedFiles.length > 0 ? '可调整文件顺序' : '上传 (支持单个或多个网页)'}
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('paste'); setUploadedFiles([]); setHtmlCode(''); setKnowledgeBaseTitle(''); setError(''); setDeployedInfo(null); }}
          className={`flex-1 py-3 px-4 text-center transition-colors font-semibold text-base md:text-lg rounded-tr-md rounded-br-md ${
            activeTab === 'paste'
              ? 'bg-[#2dc100] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-t border-r border-b border-gray-300'
          }`}
        >
          粘贴单个代码
        </button>
      </div>

      <ToastNotification 
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {(activeTab === 'upload' || activeTab === 'set') && (
          <div 
            className="w-full min-h-64 border border-gray-300 rounded-lg bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#2dc100] transition-colors p-6"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#2dc100] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-700">拖放您的HTML文件到此处</p>
            <p className="text-sm text-gray-500 mt-1 mb-3">或点击选择文件 (多个文件自动创建知识库)</p>
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
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            {uploadedFiles.length > 0 && (activeTab === 'upload' || activeTab === 'set') && (
              <div className="mt-4 w-full">
                <div className='flex justify-between items-center mb-2'>
                  <h4 className="font-semibold text-gray-700">
                    已选择 {uploadedFiles.length} 个文件:
                  </h4>
                  {uploadedFiles.length > 1 && activeTab === 'upload' && (
                    <button type="button" onClick={() => setActiveTab('set')} className="ml-2 text-sm text-[#2dc100] hover:underline">(配置知识库)</button>
                  )}
                </div>
                 {uploadedFiles.length > 1 && (
                  <p className="text-sm font-bold text-green-600 mb-2">提示：您可以通过文件名右侧的箭头调整文件在知识库中的顺序。</p>
                )}
                <ul className="list-none bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="text-sm text-gray-700 flex justify-between items-center p-2 hover:bg-gray-100 rounded">
                      <span className="truncate flex-grow mr-2">{file.name}</span>
                      {uploadedFiles.length > 1 && (
                        <div className="flex-shrink-0 space-x-1">
                          <button 
                            type="button" 
                            onClick={(e) =>{ e.stopPropagation(); moveFile(index, 'up');}} 
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Move up"
                          >
                            <ArrowUpCircleIcon className="h-5 w-5 text-gray-600" />
                          </button>
                          <button 
                            type="button" 
                            onClick={(e) => {e.stopPropagation(); moveFile(index, 'down');}} 
                            disabled={index === uploadedFiles.length - 1}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Move down"
                          >
                            <ArrowDownCircleIcon className="h-5 w-5 text-gray-600" />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                 {uploadedFiles.length === 1 && activeTab === 'upload' && (
                     <p className="text-xs text-gray-500 mt-1">选择单个文件将使用"粘贴代码"的方式部署。如需创建知识库，请选择多个文件，或在选择一个文件后点击上面的"(配置知识库)"链接。</p>
                 )}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'paste' && (
          <div className="space-y-2">
            {uploadedFiles.length === 1 && (
              <div className="flex items-center bg-[#e6f9e6] text-[#2dc100] p-2 rounded-lg mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>已加载文件内容：{uploadedFiles[0].name}</span>
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

        {activeTab === 'set' && uploadedFiles.length > 0 && (
          <div className="my-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">知识库设置</h3>
            <label htmlFor="knowledge-base-title" className="block text-sm font-medium text-gray-700 mb-1">
              设置知识库标题:
            </label>
            <input
              type="text"
              id="knowledge-base-title"
              value={knowledgeBaseTitle}
              onChange={(e) => setKnowledgeBaseTitle(e.target.value)}
              placeholder="例如：5月份群聊精华、年度聊天回忆、月度日报汇总等"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2dc100] focus:border-transparent focus:outline-none text-sm"
            />
             <p className="text-xs text-gray-500 mt-1">已选择 {uploadedFiles.length} 个文件将包含在此知识库中。</p>
          </div>
        )}
        
        {(htmlCode.trim() || uploadedFiles.length > 0) && (
          <>
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
                <span>
                  {activeTab === 'set' ? '设置访问密码' : '为此链接设置密码'}
                </span>
              </label>
            </div>

            {setLinkPassword && (
              <div className="my-4">
                <label htmlFor="link-password" className="block text-sm font-medium text-gray-700 mb-1">
                  {activeTab === 'set' ? '设置访问密码' : '设置访问密码:'}
                </label>
                <div className="relative">
                  <input 
                    type={showUploaderPassword ? 'text' : 'password'}
                    id="link-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={activeTab === 'set' ? "请输入知识库访问密码" : "请输入访问密码"}
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
          </>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading || (activeTab === 'paste' ? !htmlCode.trim() : uploadedFiles.length === 0)}
            className="px-4 py-2 bg-[#2dc100] text-white rounded-lg hover:bg-[#249c00] focus:outline-none focus:ring-2 focus:ring-[#2dc100] disabled:opacity-50"
          >
            {isUploading 
              ? '处理中...' 
              : (activeTab === 'set' ? '创建知识库' : '部署网页')}
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
          <h3 className="text-lg font-medium text-[#2dc100] mb-2">
            {deployedInfo.isSet ? '知识库创建成功！' : '部署成功！'}
          </h3>
          <p className="mb-2 text-[#238a00]">
            {deployedInfo.isSet 
              ? `您的知识库包含 ${deployedInfo.files?.length || 0} 个文件，已成功创建。`
              : '您的网页已成功部署。'}
            {deployedInfo.hasPassword ? 
              (deployedInfo.isSet ? '这是一个受密码保护的知识库链接：' : '这是一个受密码保护的链接：') :
              (deployedInfo.isSet ? '这是一个可公开访问的知识库链接：' : '这是一个可公开访问的链接：')
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
          {!deployedInfo.isSet && deployedInfo.r2Url && (
            <p className="mt-2 text-xs text-gray-500">原始R2存储路径: 
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
              {deployedInfo.isSet ? '访问知识库' : '访问网页'}
            </a>
            <button
              onClick={() => {
                if (deployedInfo && deployedInfo.url) { 
                  let urlToCopy = deployedInfo.url;
                  if (!urlToCopy.startsWith('http')) {
                    urlToCopy = window.location.origin + urlToCopy;
                  }
                  navigator.clipboard.writeText(urlToCopy)
                    .then(() => {
                      showToast('链接已复制到剪贴板', 'success');
                    })
                    .catch(err => {
                      console.error('复制失败:', err);
                      showToast('复制失败，请重试', 'error');
                    });
                } else {
                  showToast('无法复制链接，信息不完整。', 'error');
                }
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