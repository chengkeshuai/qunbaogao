'use client';

import { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
}

// 预定义的提示词模板
const promptTemplates: PromptTemplate[] = [
  {
    id: 'default',
    name: '标准网页',
    description: '生成标准的网页布局',
    template: '请将以下微信聊天记录转换为一个美观的HTML网页，包含以下内容：1. 适当的标题和日期 2. 清晰的发言人区分 3. 良好的移动端适配性 4. 简洁美观的界面设计 5. 基础的CSS样式。'
  },
  {
    id: 'magazine',
    name: '杂志风格',
    description: '具有杂志排版风格的设计',
    template: '请将以下微信聊天记录转换为一个具有杂志排版风格的HTML网页。要求：1. 使用优雅的字体和排版 2. 分栏布局 3. 突出重点内容 4. 引用与正文区分明显 5. 包含简洁的目录或导航。'
  },
  {
    id: 'report',
    name: '总结报告',
    description: '自动总结聊天内容要点',
    template: '请分析以下微信聊天记录，提取其中的关键信息和讨论要点，然后生成一个HTML格式的总结报告。包含：1. 讨论主题概述 2. 关键决策和结论 3. 重要行动项 4. 讨论中提出的问题和解决方案 5. 美观的网页布局和样式。'
  },
  {
    id: 'knowledge',
    name: '知识库',
    description: '将聊天记录整理为知识库',
    template: '请将以下微信聊天记录整理为一个结构化的HTML知识库页面。要求：1. 按主题分类信息 2. 创建章节和子章节 3. 提供内容索引和快速导航 4. 突出重要知识点 5. 使用卡片式设计展示关键信息 6. 加入必要的交互元素如目录跳转和返回顶部。'
  },
];

export default function ChatProcessor() {
  const [activeTab, setActiveTab] = useState('paste');
  const [chatContent, setChatContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(promptTemplates[0].id);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [streamContent, setStreamContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [deployedUrl, setDeployedUrl] = useState('');
  const [showGeneratedCode, setShowGeneratedCode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // 当组件卸载时关闭EventSource连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 监听streamContent变化，自动滚动到底部
  useEffect(() => {
    if (codeContainerRef.current && isGenerating) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    }
  }, [streamContent, isGenerating]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatContent(e.target.value);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型（仅接受.txt文件）
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      setError('请上传TXT格式的聊天记录文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setChatContent(event.target?.result as string);
      setUploadedFileName(file.name);
      setActiveTab('paste'); // 切换到粘贴模式显示内容
      setError('');
    };
    reader.readAsText(file);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
  };

  const processChat = async () => {
    if (!chatContent.trim()) {
      setError('请上传或粘贴聊天记录内容');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      setGeneratedHtml('');
      setStreamContent('');
      setIsGenerating(true);
      setShowGeneratedCode(true);
      setDeployedUrl('');

      // 获取选中的提示词模板
      const template = promptTemplates.find(t => t.id === selectedTemplate)?.template || promptTemplates[0].template;

      // 使用Server-Sent Events (SSE) 获取流式响应
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // 构建查询参数
      const params = new URLSearchParams();
      
      // 设置SSE的响应头
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatContent,
          promptTemplate: template,
        }),
      });

      // 检查响应
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let fullHtml = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.text) {
                // 使用函数形式的setState以确保正确的状态更新顺序
                setStreamContent(prev => {
                  const newContent = prev + data.text;
                  // 在下一个微任务中滚动到底部，确保DOM已更新
                  setTimeout(() => {
                    if (codeContainerRef.current) {
                      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
                    }
                  }, 0);
                  return newContent;
                });
                fullHtml += data.text;
              }

              if (data.finish) {
                setGeneratedHtml(fullHtml);
                break;
              }
            } catch (e) {
              console.error('解析SSE数据时出错:', e);
            }
          }
        }
      }

      setIsGenerating(false);
    } catch (err) {
      setError((err as Error).message || '处理聊天记录时出错');
      setIsGenerating(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const deployHtml = async () => {
    if (!generatedHtml.trim()) {
      setError('没有可部署的HTML代码');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // 调用部署API
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ htmlCode: generatedHtml }),
      });

      if (!response.ok) {
        throw new Error('部署失败');
      }

      const data = await response.json();
      setDeployedUrl(data.url);
    } catch (err) {
      setError((err as Error).message || '部署过程中发生错误');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportAsImage = async () => {
    if (!generatedHtml.trim()) {
      setError('没有可导出的HTML代码');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // 调用图片导出API
      const response = await fetch('/api/export/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ htmlCode: generatedHtml }),
      });

      if (!response.ok) {
        throw new Error('导出图片失败');
      }

      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (err) {
      setError((err as Error).message || '导出图片过程中发生错误');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportAsPdf = async () => {
    if (!generatedHtml.trim()) {
      setError('没有可导出的HTML代码');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // 调用PDF导出API
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ htmlCode: generatedHtml }),
      });

      if (!response.ok) {
        throw new Error('导出PDF失败');
      }

      const data = await response.json();
      window.open(data.url, '_blank');
    } catch (err) {
      setError((err as Error).message || '导出PDF过程中发生错误');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSoftware = async () => {
    try {
      const response = await fetch('/api/download-handler');
      if (!response.ok) {
        throw new Error('获取软件信息失败');
      }
      
      const data = await response.json();
      window.open(data.downloadUrl, '_blank');
    } catch (err) {
      setError((err as Error).message || '下载软件时出错');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">使用指南</h3>
        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
          <li>
            <span className="font-medium">获取聊天记录：</span> 
            首先<button 
              onClick={downloadSoftware}
              className="text-[#2dc100] hover:underline font-medium mx-1"
            >
              下载留痕软件
            </button>用于导出微信聊天记录
          </li>
          <li>
            <span className="font-medium">上传聊天记录：</span> 
            将导出的TXT格式聊天记录上传或粘贴到文本框
          </li>
          <li>
            <span className="font-medium">选择生成模板：</span> 
            选择合适的输出样式模板
          </li>
          <li>
            <span className="font-medium">生成并发布：</span> 
            点击生成按钮，系统将使用AI处理聊天记录并生成HTML代码
          </li>
        </ol>
      </div>

      <div className="space-y-6">
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
            上传聊天记录
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
            粘贴聊天内容
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
            <p className="text-lg font-medium text-gray-700">拖放您的TXT聊天记录文件到此处</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">或点击选择文件</p>
            <button
              type="button"
              className="px-4 py-2 bg-[#2dc100] text-white rounded-lg hover:bg-[#249c00] focus:outline-none"
              onClick={(e) => {
                e.stopPropagation(); // 防止事件冒泡
                fileInputRef.current?.click();
              }}
            >
              选择TXT文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
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
              placeholder="在此粘贴您的聊天记录内容..."
              value={chatContent}
              onChange={handleTextChange}
            />
          </div>
        )}

        {/* 选择提示词模板 */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium mb-1">
            选择生成样式模板
          </label>
          <select
            value={selectedTemplate}
            onChange={handleTemplateChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2dc100] focus:border-transparent"
          >
            {promptTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.description}
              </option>
            ))}
          </select>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={processChat}
            disabled={isProcessing || !chatContent.trim()}
            className="px-4 py-2 bg-[#2dc100] text-white rounded-lg hover:bg-[#249c00] focus:outline-none focus:ring-2 focus:ring-[#2dc100] disabled:opacity-50"
          >
            {isGenerating ? '正在生成...' : '生成网页代码'}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* 生成代码预览 */}
      {(isGenerating || showGeneratedCode) && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {isGenerating ? '代码生成中...' : '生成的HTML代码'}
            </h3>
            {isGenerating && (
              <div className="animate-pulse flex">
                <div className="h-2 w-2 bg-[#2dc100] rounded-full mr-1"></div>
                <div className="h-2 w-2 bg-[#2dc100] rounded-full mr-1 animate-pulse-delay-200"></div>
                <div className="h-2 w-2 bg-[#2dc100] rounded-full animate-pulse-delay-400"></div>
              </div>
            )}
          </div>
          
          <div 
            ref={codeContainerRef}
            className="bg-gray-900 rounded-md overflow-hidden max-h-96 overflow-y-auto"
          >
            <SyntaxHighlighter
              language="html"
              style={atomDark}
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {streamContent || '// 等待代码生成...'}
            </SyntaxHighlighter>
          </div>
          
          {!isGenerating && generatedHtml && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={deployHtml}
                disabled={isProcessing}
                className="px-4 py-2 bg-[#2dc100] text-white rounded-lg hover:bg-[#249c00] focus:outline-none disabled:opacity-50"
              >
                {isProcessing ? '处理中...' : '部署为网页'}
              </button>
              <button
                onClick={exportAsImage}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none disabled:opacity-50"
              >
                导出为图片
              </button>
              <button
                onClick={exportAsPdf}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none disabled:opacity-50"
              >
                导出为PDF
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedHtml);
                  alert('HTML代码已复制到剪贴板');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none"
              >
                复制代码
              </button>
            </div>
          )}
        </div>
      )}

      {/* 部署成功提示 */}
      {deployedUrl && (
        <div className="mt-6 p-4 bg-[#e6f9e6] border border-[#2dc100]/30 rounded-lg">
          <h3 className="text-lg font-medium text-[#2dc100] mb-2">部署成功！</h3>
          <p className="mb-2 text-[#238a00]">您的网页已成功部署，可通过以下链接访问：</p>
          <a
            href={deployedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-3 bg-white border border-[#2dc100]/30 rounded-lg text-[#2dc100] hover:underline text-center"
          >
            {deployedUrl}
          </a>
          <div className="mt-4 flex gap-4 justify-center">
            <a
              href={deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#2dc100] text-white rounded-lg hover:bg-[#249c00]"
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