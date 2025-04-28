'use client';

import { useState, useRef } from 'react';

export default function HtmlUploader() {
  const [htmlCode, setHtmlCode] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ htmlCode }),
      });

      if (!response.ok) {
        throw new Error('部署失败');
      }

      const data = await response.json();
      setDeployedUrl(data.url);
    } catch (err) {
      setError((err as Error).message || '上传过程中发生错误');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            HTML代码
          </label>
          <textarea
            className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="在此粘贴您的HTML代码..."
            value={htmlCode}
            onChange={handleTextChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
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

          <button
            type="submit"
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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

      {deployedUrl && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium text-green-800 mb-2">部署成功！</h3>
          <p className="mb-2 text-green-700">您的网页已成功部署，可通过以下链接访问：</p>
          <a
            href={deployedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-3 bg-white border border-green-300 rounded-lg text-blue-600 hover:underline text-center"
          >
            {deployedUrl}
          </a>
          <div className="mt-4 flex gap-4 justify-center">
            <a
              href={deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              访问网页
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(deployedUrl);
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