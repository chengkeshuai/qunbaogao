import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export const metadata: Metadata = {
  title: "实用工具 - 群报告",
  description: "群报告提供的实用工具集合，包括图片字幕工具等，帮助您更高效地处理各种文档和媒体文件",
  keywords: "实用工具,图片字幕,群报告,在线工具,免费工具",
  openGraph: {
    title: "实用工具 - 群报告",
    description: "群报告提供的实用工具集合，包括图片字幕工具等，帮助您更高效地处理各种文档和媒体文件",
    url: "https://qunbaogao.com/tools",
    siteName: "群报告",
    locale: "zh_CN",
    type: "website",
  },
};

export default function ToolsPage() {
  const tools = [
    {
      id: "image-caption",
      title: "图片字幕工具",
      description: "为图片添加专业的字幕条，支持多种字幕样式和主题，一键生成带字幕的图片",
      href: "/tools/image-caption",
      icon: "🖼️",
      features: ["多种主题预设", "自定义字体样式", "批量字幕处理", "高质量输出"],
      status: "已上线"
    },
    // 为未来的工具预留空间
    {
      id: "coming-soon-1",
      title: "更多工具",
      description: "我们正在开发更多实用工具，敬请期待...",
      href: "#",
      icon: "🚀",
      features: ["即将推出"],
      status: "开发中"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">实用工具</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              群报告为您提供一系列实用的在线工具，帮助您更高效地处理文档、图片和其他媒体文件。所有工具均免费使用，无需注册。
            </p>
          </div>

          {/* 工具网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <div key={tool.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                <div className="p-6">
                  {/* 工具图标和状态 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{tool.icon}</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tool.status === '已上线' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tool.status}
                    </span>
                  </div>

                  {/* 工具标题和描述 */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-[#2dc100] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {tool.description}
                  </p>

                  {/* 功能特点 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">功能特点：</h4>
                    <ul className="space-y-1">
                      {tool.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <i className="fas fa-check-circle text-[#2dc100] mr-2 text-xs"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 操作按钮 */}
                  <div className="mt-auto">
                    {tool.status === '已上线' ? (
                      <Link 
                        href={tool.href}
                        className="block w-full bg-[#2dc100] text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-[#249c00] transition-colors duration-200"
                      >
                        开始使用
                      </Link>
                    ) : (
                      <button 
                        disabled
                        className="block w-full bg-gray-100 text-gray-400 text-center py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                      >
                        敬请期待
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 说明信息 */}
          <div className="mt-16 bg-gradient-to-r from-[#e6f9e6] to-[#f0fdf4] rounded-xl p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">关于实用工具</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                    <i className="fas fa-rocket text-[#2dc100] text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">完全免费</h3>
                  <p className="text-gray-600 text-sm">所有工具完全免费使用，无需注册或付费</p>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                    <i className="fas fa-shield-alt text-[#2dc100] text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">安全可靠</h3>
                  <p className="text-gray-600 text-sm">数据处理均在本地完成，保护您的隐私安全</p>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                    <i className="fas fa-magic text-[#2dc100] text-2xl"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">简单易用</h3>
                  <p className="text-gray-600 text-sm">界面简洁直观，无需学习即可上手使用</p>
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