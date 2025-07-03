import type { Metadata } from "next";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ImageCaptionTool from "@/app/components/ImageCaptionTool";

export const metadata: Metadata = {
  title: "图片字幕工具 - 群报告",
  description: "免费的在线图片字幕工具，为您的图片添加专业的字幕条。支持多种字幕样式和主题，一键生成带字幕的图片",
  keywords: "图片字幕,在线字幕工具,图片编辑,字幕制作,免费工具,群报告",
  openGraph: {
    title: "图片字幕工具 - 群报告",
    description: "免费的在线图片字幕工具，为您的图片添加专业的字幕条。支持多种字幕样式和主题，一键生成带字幕的图片",
    url: "https://qunbaogao.com/tools/image-caption",
    siteName: "群报告",
    locale: "zh_CN",
    type: "website",
  },
};

export default function ImageCaptionPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <ImageCaptionTool />
      </main>
      
      <Footer />
    </div>
  );
} 