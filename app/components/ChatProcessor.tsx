'use client';

import { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { preprocessChat, estimateTokenCount, needsChunking, chunkContent } from '../lib/chatPreprocessor';

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
    template: '请将以下微信聊天记录转换为一个美观的HTML网页，包含以下内容：\n1. 合适的标题，自动从聊天内容中提取或创建\n2. 清晰的发言人区分，使用不同颜色或样式\n3. 完全响应式设计，在手机和桌面设备上都能很好地显示\n4. 现代化的UI设计，使用CSS变量便于后期定制\n5. 适当的内容分段和组织，提高可读性\n6. 内置目录导航，方便跳转到不同部分\n7. 添加时间戳显示，便于了解对话时间线\n8. 精美的视觉元素和合适的图标'
  },
  {
    id: 'magazine',
    name: '杂志风格',
    description: '具有杂志排版风格的设计',
    template: '请将以下微信聊天记录转换为一个具有杂志排版风格的HTML网页。要求：\n1. 使用优雅的无衬线字体，考虑字间距和行高的美观设计\n2. 采用多栏布局，在大屏幕上呈现杂志般的阅读体验\n3. 自动提取重点内容，使用特殊设计强调显示\n4. 引用与正文使用不同的样式，增加层次感\n5. 包含目录索引，便于导航\n6. 添加精美的分隔线和装饰元素，增强杂志感\n7. 使用丰富的排版技巧，如首字下沉、段落间距变化等\n8. 在合适的位置添加自动生成的摘要或引言'
  },
  {
    id: 'dark-elegant',
    name: '暗黑华丽风格',
    description: '高级暗色调设计，带精美视觉元素',
    template: '特殊模板:暗黑华丽风格'
  },
  {
    id: 'report',
    name: '总结报告',
    description: '自动总结聊天内容要点',
    template: '请分析以下微信聊天记录，提取其中的关键信息和讨论要点，然后生成一个HTML格式的总结报告。包含：\n1. 清晰的报告标题和日期\n2. 讨论主题的概述和背景\n3. 关键决策和结论的突出显示\n4. 按时间或主题组织的讨论要点\n5. 重要行动项的列表，包括责任人和时间要求\n6. 讨论中提出的问题和解决方案的对比展示\n7. 添加数据可视化元素，如进度条、状态标识等\n8. 提供打印友好的布局'
  },
  {
    id: 'knowledge',
    name: '知识库',
    description: '将聊天记录整理为知识库',
    template: '请将以下微信聊天记录整理为一个结构化的HTML知识库页面。要求：\n1. 智能分析内容，自动提取主题和子主题\n2. 创建详细的章节和子章节结构\n3. 提供完整的内容索引和快捷导航系统\n4. 使用标签和高亮突出关键知识点\n5. 采用卡片式设计展示独立的知识单元\n6. 添加搜索功能相关的HTML和JS代码\n7. 提供交互元素如折叠/展开内容、目录跳转和返回顶部\n8. 使用面包屑导航显示当前内容在知识结构中的位置\n9. 自动生成每个主题的简短描述'
  },
  {
    id: 'interactive',
    name: '互动式展示',
    description: '添加互动元素的网页设计',
    template: '请将以下微信聊天记录转换为一个具有丰富互动元素的HTML网页。要求：\n1. 创建一个现代化、视觉吸引人的界面\n2. 实现消息的动态加载效果，模拟聊天应用的体验\n3. 添加消息过滤和分类功能的相关代码\n4. 实现亮色/暗色模式切换功能\n5. 添加消息搜索相关的页面元素和功能代码\n6. 集成响应式图片查看器，点击图片可放大\n7. 为长对话添加自动生成的时间线\n8. 使用HTML5和CSS3的高级特性增强用户体验\n9. 添加简单的统计信息显示，如消息数量、参与人数等'
  },
  {
    id: 'qa',
    name: '问答整理',
    description: '从聊天中提取问答内容',
    template: '请分析以下微信聊天记录，提取所有的问题与回答，并整理为一个结构清晰的HTML问答网页。要求：\n1. 自动识别聊天记录中的问题和相应的回答\n2. 按主题将问答内容分类组织\n3. 创建带锚点的目录，方便跳转到不同问题\n4. 为每个问题添加折叠/展开功能\n5. 在问题旁显示提问者信息\n6. 在回答旁显示回答者信息\n7. 针对多人回答同一问题的情况，整合不同回答并标明来源\n8. 添加搜索功能相关代码，方便查找特定问题\n9. 使用卡片式设计区分不同的问答对\n10. 添加投票或标记有用答案的功能元素'
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

      // 预处理聊天记录内容
      const preprocessedContent = preprocessChat(chatContent);
      
      // 估算Token数量
      const estimatedTokens = estimateTokenCount(preprocessedContent);
      
      // 获取选中的提示词模板
      const template = promptTemplates.find(t => t.id === selectedTemplate)?.template || promptTemplates[0].template;
      
      // 处理暗黑华丽风格特殊模板
      if (template === '特殊模板:暗黑华丽风格') {
        // 从服务器获取特殊模板内容
        try {
          setStreamContent('正在加载暗黑华丽风格模板...\n');
          const response = await fetch('/api/templates/dark-elegant');
          
          if (!response.ok) {
            throw new Error('无法加载暗黑华丽风格模板');
          }
          
          const darkElegantTemplate = await response.text();
          
          // 检查是否需要分块处理
          if (needsChunking(preprocessedContent)) {
            setStreamContent(prev => prev + '聊天记录较长，系统将分段处理以获得最佳效果...\n\n');
            
            // 分块处理逻辑
            const chunks = chunkContent(preprocessedContent);
            let fullHtml = '';
            
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              setStreamContent(prev => prev + `\n处理第 ${i+1}/${chunks.length} 部分...\n`);
              
              // 构建特定的提示词
              let chunkPrompt = darkElegantTemplate;
              if (i > 0) {
                chunkPrompt = `继续处理前面的聊天记录，这是第 ${i+1}/${chunks.length} 部分。请确保生成的HTML代码可以无缝衔接前面的内容：\n${darkElegantTemplate}`;
              }
              
              // 处理当前块
              const chunkResult = await processChunk(chunk, chunkPrompt);
              fullHtml += chunkResult;
            }
            
            setGeneratedHtml(fullHtml);
          } else {
            // 正常处理
            await processChunk(preprocessedContent, darkElegantTemplate, true);
          }
        } catch (error) {
          setError(`加载暗黑华丽风格模板失败: ${(error as Error).message}`);
          setIsGenerating(false);
          return;
        }
      } else {
        // 标准模板处理
        // 检查是否需要分块处理（处理超长聊天记录）
        if (needsChunking(preprocessedContent)) {
          // 对于超长聊天记录，先告知用户
          setStreamContent('聊天记录较长，系统将分段处理以获得最佳效果...\n\n');
          
          // 分块处理
          const chunks = chunkContent(preprocessedContent);
          let fullHtml = '';
          
          // 逐块处理
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            setStreamContent(prev => prev + `\n处理第 ${i+1}/${chunks.length} 部分...\n`);
            
            // 构建特定的提示词，针对分块处理场景
            let chunkPrompt = template;
            if (i > 0) {
              chunkPrompt = `继续处理前面的聊天记录，这是第 ${i+1}/${chunks.length} 部分。请确保生成的HTML代码可以无缝衔接前面的内容：\n${template}`;
            }
            
            // 处理当前块
            const chunkResult = await processChunk(chunk, chunkPrompt);
            fullHtml += chunkResult;
          }
          
          setGeneratedHtml(fullHtml);
        } else {
          // 正常处理
          await processChunk(preprocessedContent, template, true);
        }
      }
    } catch (err) {
      setError((err as Error).message || '处理聊天记录时出错');
      setIsGenerating(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理单个聊天块
  const processChunk = async (chunkContent: string, promptTemplate: string, setFinalHtml: boolean = false): Promise<string> => {
    // 使用Server-Sent Events (SSE) 获取流式响应
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // 发送请求
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatContent: chunkContent,
        promptTemplate: promptTemplate,
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
    let chunkHtml = '';

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
              chunkHtml += data.text;
            }

            if (data.finish && setFinalHtml) {
              setGeneratedHtml(chunkHtml);
              break;
            }
          } catch (e) {
            console.error('解析SSE数据时出错:', e);
          }
        }
      }
    }
    
    return chunkHtml;
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