'use client';

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

// Supabase Storage 图片URL前缀
const SUPABASE_URL = 'https://jdqoibfhbgkpnttxbnos.supabase.co/storage/v1/object/public/qunbaogao';

export default function TutorialPage() {
  // Markdown教程内容
  const tutorialContent = `
## 教程：把微信聊天记录变成可视化报告

### 1.用「留痕」软件导出聊天记录.txt

软件下载：关注上方公众号，后台回复 群报告

软件下载安装，双击打开会显示目标路径。
![下载安装](${SUPABASE_URL}/liuhenanzhuan.png)

打开后，需要先点"获取信息"再点"解析数据"。
![解析信息](${SUPABASE_URL}/liuhenjiexi.png)

点击你要导出的群，右上角"导出聊天记录"，**此处一定要注意**，选择「导出TXT」（有日期和时间），不要选择「Ai对话专用TXT」（没有日期和时间）。
![下载txt](${SUPABASE_URL}/liuhenxiazai.jpg)

消息类型全选即可，日期根据需要选择，可以选择时间段也可以按天导出，导出成功之后点击「打开」，就能看到聊天记录.txt 了。

### 2.用 gemini 2.5 pro 生成 HTML 代码

> 地址：https://aistudio.google.com/
模型：Gemini 2.5 Pro Preview 05-06

![上传txt](${SUPABASE_URL}/liuhenjiexi.png)

把导出的聊天记录.txt 和提示词.txt 一起上传，点击运行即可，gemini 2.5 就开始疯狂输出代码，这也是目前唯一一个支持较大上下文的模型。

提示词下载：关注上方公众号，后台回复 群报告

![生成效果](${SUPABASE_URL}/ribaoxiaoguo.png)

正常群聊几十K大小，一般一百多秒 gemini 2.5 就生成完了，生成的 HTML 文件下载到本地即可。

### 3.群报告一键转可访问网页

进入首页→点击上传→点击"部署网页"，一个可访问网址就生成了，如果担心内容泄露，可以设置密码。
![单网页](${SUPABASE_URL}/danwangye.png)

如果文件很多，想按日期分开，在第1步导出时选择日期按天一个一个导出，第2步时一个一个生成，就会得到多个 HTML 文件。比如：
- 1月1日.html
- 1月2日.html
- 1月3日.html

![知识库](${SUPABASE_URL}/zhishikushuangchuan.png)

多个文件上传时，直接选中多个文件即可，自动进入「知识库」模式，上传界面可以上下移动文件位置排序，可以设置知识库标题和访问密码，然后点击"部署知识库"即可生成可访问链接。

## 后续扩展功能

计划扩展功能：
- 使用腾讯 Edgeone Pages 部署，对微信生态更加友好
- 支持知识库新增文件，一个置顶链接可任意增加内容
- 群聊能用到的好玩小工具软件...
`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">群报告使用教程</h1>
          
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                // 自定义组件渲染
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 mb-6" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-medium text-gray-900 mt-6 mb-3" {...props} />,
                p: ({node, ...props}) => <p className="mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6" {...props} />,
                li: ({node, ...props}) => <li className="mb-2" {...props} />,
                a: ({node, href, ...props}) => (
                  <a 
                    href={href} 
                    className="text-[#2dc100] hover:underline" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    {...props} 
                  />
                ),
                img: ({node, src, alt, ...props}) => (
                  <div className="my-6 relative">
                    <img 
                      src={src} 
                      alt={alt || ''} 
                      className="rounded-lg shadow-md w-full h-auto" 
                      {...props} 
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center">{alt}</p>
                  </div>
                ),
              }}
            >
              {tutorialContent}
            </ReactMarkdown>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 