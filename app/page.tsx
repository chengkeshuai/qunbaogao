import Header from './components/Header';
import Footer from './components/Footer';
import HtmlUploader from './components/HtmlUploader';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 功能选择卡片 */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">群报告 - 群聊内容转网页工具</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              选择合适的工具，将群聊内容转换为精美网页
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Link href="/chat" className="block bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-xl">
                <div className="p-6">
                  <div className="w-16 h-16 bg-[#e6f9e6] text-[#2dc100] rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">微信聊天记录转网页</h2>
                  <p className="text-gray-600 mb-4">
                    上传微信聊天记录TXT文件，通过AI生成精美网页，导出多种格式
                  </p>
                  <div className="bg-[#f3f9f3] p-3 rounded-lg">
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium">特点：</span> 智能分析、多种模板、代码生成可视化
                    </p>
                  </div>
                </div>
                <div className="bg-[#e6f9e6] text-center py-3">
                  <span className="text-[#2dc100] font-medium">开始使用 →</span>
                </div>
              </Link>
              
              <Link href="/" className="block bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-xl">
                <div className="p-6">
                  <div className="w-16 h-16 bg-[#e6f9e6] text-[#2dc100] rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">HTML代码转可访问网页</h2>
                  <p className="text-gray-600 mb-4">
                    上传或粘贴HTML代码，快速部署为可在多端设备访问的网页
                  </p>
                  <div className="bg-[#f3f9f3] p-3 rounded-lg">
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium">特点：</span> 快速部署、专属链接、云端存储
                    </p>
                  </div>
                </div>
                <div className="bg-[#e6f9e6] text-center py-3">
                  <span className="text-[#2dc100] font-medium">立即尝试 →</span>
                </div>
              </Link>
            </div>
          </div>
                    
          <div className="border-t border-gray-200 pt-16 mt-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">HTML代码转可访问网页</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              上传或粘贴您的HTML代码，我们将为您生成一个可在多端设备访问的网页，并提供专属链接。
            </p>
          </div>
          
          <div className="mt-8">
            <HtmlUploader />
          </div>
          
          {/* 简单三步流程 */}
          <div className="mt-16 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">简单三步流程</h2>
            <p className="text-center text-lg text-gray-600 mb-10">无需技术知识，轻松将HTML代码转为可访问网页</p>

            <div className="flex flex-col md:flex-row justify-between items-stretch gap-4 md:gap-2">
              {/* 第一步 */}
              <div className="flex flex-col items-center text-center w-full md:w-1/3 bg-white rounded-lg p-4">
                <div className="bg-[#e6f9e6] p-6 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#2dc100]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">上传或粘贴代码</h3>
                <p className="text-base text-gray-600">将HTML代码粘贴到文本框中或上传HTML文件</p>
              </div>

              {/* 连接线 */}
              <div className="hidden md:flex items-center justify-center w-12">
                <div className="h-0.5 w-full bg-[#2dc100]/30"></div>
              </div>

              {/* 第二步 */}
              <div className="flex flex-col items-center text-center w-full md:w-1/3 bg-white rounded-lg p-4">
                <div className="bg-[#e6f9e6] p-6 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#2dc100]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">一键部署</h3>
                <p className="text-base text-gray-600">点击&quot;部署网页&quot;按钮，系统自动处理并部署</p>
              </div>

              {/* 连接线 */}
              <div className="hidden md:flex items-center justify-center w-12">
                <div className="h-0.5 w-full bg-[#2dc100]/30"></div>
              </div>

              {/* 第三步 */}
              <div className="flex flex-col items-center text-center w-full md:w-1/3 bg-white rounded-lg p-4">
                <div className="bg-[#e6f9e6] p-6 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#2dc100]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">分享访问</h3>
                <p className="text-base text-gray-600">获取专属链接，一键分享给他人或多端访问</p>
              </div>
            </div>
          </div>
          
          {/* 关于群报告 */}
          <div className="mt-24 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-12">
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">关于群报告</h2>
                  <p className="text-lg text-gray-700 mb-4">
                    群报告是一个专为群聊内容分享设计的可视化平台。无需复杂部署，简单几步即可将聊天记录或HTML代码变成可访问的网页。
                  </p>
                  <p className="text-lg text-gray-700 mb-6">
                    我们使用先进的云存储技术和AI生成技术，确保您的网页安全、稳定且持久可访问，让分享和展示变得简单高效。
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start">
                      <svg className="h-6 w-6 text-[#2dc100] mt-1 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-base text-gray-700">简单易用的界面</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="h-6 w-6 text-[#2dc100] mt-1 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-base text-gray-700">AI智能处理</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="h-6 w-6 text-[#2dc100] mt-1 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-base text-gray-700">一键生成可分享链接</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="h-6 w-6 text-[#2dc100] mt-1 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-base text-gray-700">适配多种终端设备</span>
                    </div>
                  </div>
                  
                  <Link href="/chat" className="inline-flex items-center text-lg text-[#2dc100] hover:text-[#249c00]">
                    <span>尝试聊天转网页功能</span>
                    <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
                
                <div className="flex items-center justify-center p-12">
                  {/* 微信图标 - 直接使用微信图标，无背景 */}
                  <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="280" height="280" viewBox="0 0 375 374.999991" preserveAspectRatio="xMidYMid meet" version="1.0" className="mx-auto">
                    <path fill="#2dc100" d="M 375 318.75 C 375 349.75 349.75 375 318.75 375 L 56.25 375 C 25.25 375 0 349.75 0 318.75 L 0 56.25 C 0 25.25 25.25 0 56.25 0 L 318.75 0 C 349.75 0 375 25.25 375 56.25 Z M 375 318.75 " fillOpacity="1" fillRule="nonzero"/>
                    <path fill="#ffffff" d="M 251 139.75 C 220.75 141.25 194.5 150.5 173 171.25 C 151.5 192.25 141.5 217.75 144.25 249.75 C 132.5 248.25 121.75 246.75 110.75 245.75 C 107 245.5 102.5 246 99.5 247.75 C 89 253.75 79 260.5 67 267.75 C 69.25 257.75 70.5 249.25 73.25 240.75 C 75 234.5 74.25 231.25 68.5 227.25 C 32 201.5 16.75 163.25 28.25 123.75 C 38.75 87.25 64.75 65 100.25 53.5 C 148.5 37.75 202.75 53.75 232.25 92.25 C 242.75 106 249.25 121.5 251 139.75 Z M 111.75 127.5 C 112 120.25 105.75 113.75 98.25 113.5 C 90.75 113.25 84.25 119 84.25 126.5 C 84 134 89.75 140.25 97.5 140.5 C 105 140.75 111.5 135 111.75 127.5 Z M 184.5 113.5 C 177 113.75 170.75 120 170.75 127.25 C 171 134.75 177 140.75 184.75 140.5 C 192.5 140.5 198.25 134.5 198.25 126.75 C 198.25 119.5 192 113.5 184.5 113.5 Z M 184.5 113.5 " fillOpacity="1" fillRule="nonzero"/>
                    <path fill="#ffffff" d="M 319 328.5 C 309.5 324.25 300.75 317.75 291.25 316.75 C 282 315.75 272 321.25 262.25 322.25 C 232.5 325.25 206 317 184 296.75 C 142.25 258.25 148.25 199 196.5 167.25 C 239.5 139.25 302.5 148.5 332.75 187.5 C 359.25 221.5 356 266.75 323.75 295.25 C 314.5 303.5 311 310.25 317 321.25 C 318.25 323.5 318.25 326 319 328.5 Z M 210 223 C 216 223 221 218.25 221.25 212.25 C 221.5 205.75 216.25 200.5 210 200.5 C 203.75 200.5 198.5 206 198.5 212.25 C 198.75 218 203.75 223 210 223 Z M 280.25 200.5 C 274.25 200.5 269.25 205.25 269 211.25 C 268.75 217.75 273.75 223 280 223 C 286 223 291 218.5 291.25 212.25 C 291.5 205.75 286.5 200.5 280.25 200.5 Z M 280.25 200.5 " fillOpacity="1" fillRule="nonzero"/>
                  </svg>
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
