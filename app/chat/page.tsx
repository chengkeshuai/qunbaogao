import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatProcessor from '../components/ChatProcessor';

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">微信聊天记录转网页</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              上传或粘贴微信聊天记录，通过AI生成精美网页，一键分享群聊精华
            </p>
          </div>
          
          <div className="mt-8">
            <ChatProcessor />
          </div>
          
          {/* 特点介绍 */}
          <div className="mt-24 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">功能特点</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-12 w-12 bg-[#e6f9e6] text-[#2dc100] rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">智能聊天解析</h3>
                <p className="text-gray-600">
                  通过Gemini 2.5模型智能分析聊天记录，自动识别发言人、主题和重点内容，生成结构化网页
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-12 w-12 bg-[#e6f9e6] text-[#2dc100] rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">实时可视化生成</h3>
                <p className="text-gray-600">
                  代码生成过程完全可视化，实时看到AI如何将聊天记录转变为HTML代码并部署为网页
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-12 w-12 bg-[#e6f9e6] text-[#2dc100] rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">多种输出格式</h3>
                <p className="text-gray-600">
                  一次生成，多种输出 - 支持将聊天记录导出为网页链接、图片或PDF文档，满足不同分享需求
                </p>
              </div>
            </div>
          </div>
          
          {/* 应用场景 */}
          <div className="mt-24 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">应用场景</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">社群管理</h3>
                  <p className="text-gray-600 mb-4">
                    作为社群管理者，您可以将重要的群聊讨论整理成网页，方便成员回顾和新成员快速了解历史讨论内容，提升社群知识管理效率。
                  </p>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>群规和重要通知归档</li>
                    <li>精彩讨论永久保存</li>
                    <li>新成员快速入门</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">培训与教育</h3>
                  <p className="text-gray-600 mb-4">
                    将培训课程或教育讨论中的问答和思路整理成结构化网页，帮助学员复习和巩固知识点。
                  </p>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>课程讨论整理</li>
                    <li>问答资料库建设</li>
                    <li>学习笔记分享</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">会议记录</h3>
                  <p className="text-gray-600 mb-4">
                    将通过聊天软件进行的在线会议内容转换为正式的会议记录，包含决策、任务分配和后续行动项。
                  </p>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>决策过程记录</li>
                    <li>任务分配明确化</li>
                    <li>行动项追踪</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">知识管理</h3>
                  <p className="text-gray-600 mb-4">
                    将聊天中零散的知识点整合为结构化的知识库，方便团队成员查阅和学习。
                  </p>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>专业知识归档</li>
                    <li>常见问题解答</li>
                    <li>经验分享集锦</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 