import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "使用教程 - 群报告HTML转网页工具",
  description: "详细图文教程，指导您如何使用群报告将HTML文件转换为可访问网页，包括单个文件上传和知识库创建",
  keywords: "群报告,HTML转网页,教程,知识库,微信聊天记录,HTML转换,群聊记录,会议记录",
  openGraph: {
    title: "使用教程 - 群报告HTML转网页工具",
    description: "详细图文教程，指导您如何使用群报告将HTML文件转换为可访问网页，包括单个文件上传和知识库创建",
    url: "https://qunbaogao.com/tutorial",
    siteName: "群报告",
    locale: "zh_CN",
    type: "website",
  },
};

export default function TutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 