'use client';

import { useState, useRef } from 'react';

export default function SoftwareUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 验证文件类型（仅接受.exe文件）
    if (!selectedFile.name.endsWith('.exe')) {
      setError('请上传.exe格式的软件文件');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
    setMessage(`已选择文件: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('请先选择一个文件');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      setMessage('上传中...');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/download-handler', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }

      const data = await response.json();
      setIsSuccess(true);
      setMessage(`上传成功! 下载链接: ${data.downloadUrl}`);
    } catch (err) {
      setError((err as Error).message || '上传过程中发生错误');
      setIsSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">留痕软件上传</h2>
      <p className="text-sm text-gray-600 mb-4">
        上传留痕软件(.exe文件)供用户下载。上传后的文件将替换当前版本。
      </p>

      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#2dc100] transition-colors mb-4"
        onClick={() => fileInputRef.current?.click()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#2dc100] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-gray-700">点击选择或拖放.exe文件到此处</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".exe"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {message && (
        <div className={`p-3 mb-4 rounded-lg ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full px-4 py-2 bg-[#2dc100] text-white rounded-lg hover:bg-[#249c00] focus:outline-none focus:ring-2 focus:ring-[#2dc100] disabled:opacity-50"
      >
        {isUploading ? '上传中...' : '上传软件'}
      </button>
    </div>
  );
} 