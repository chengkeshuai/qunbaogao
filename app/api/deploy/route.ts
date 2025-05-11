import { NextRequest, NextResponse } from 'next/server';
import { uploadHtml } from '@/app/lib/r2';
import { v4 as uuidv4 } from 'uuid';

/**
 * 增强HTML内容
 * @param html 原始HTML内容
 * @returns 增强后的HTML内容
 */
function enhanceHtml(html: string): string {
  // 检查是否已经是完整的HTML文档
  const isCompleteHtml = html.includes('<html') && html.includes('</html>');
  
  if (isCompleteHtml) {
    // 已经是完整HTML，我们需要对它进行增强
    
    // 1. 添加viewport元标签确保移动端适配（如果没有）
    if (!html.includes('viewport')) {
      html = html.replace('<head>', '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }
    
    // 2. 添加字符集标签（如果没有）
    if (!html.includes('charset')) {
      html = html.replace('<head>', '<head>\n  <meta charset="UTF-8">');
    }
    
    // 3. 添加生成标识
    const generatedMeta = `<meta name="generator" content="群报告AI聊天记录转换工具 ${new Date().toISOString().split('T')[0]}">`;
    html = html.replace('</head>', `  ${generatedMeta}\n</head>`);
    
    return html;
  } else {
    // 不是完整HTML，需要包装
    const pageTitle = html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || '聊天记录';
    const timestamp = new Date().toLocaleString('zh-CN');
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="群报告AI聊天记录转换工具 ${new Date().toISOString().split('T')[0]}">
  <title>${pageTitle} - 群报告</title>
  <meta name="description" content="由群报告AI工具自动整理的微信聊天记录">
  <meta name="created" content="${timestamp}">
  <style>
    /* 基础样式优化 */
    :root {
      --primary-color: #2dc100;
      --text-color: #333;
      --bg-color: #f9f9f9;
      --card-bg: #fff;
      --border-color: #eaeaea;
      --header-color: #1a8e00;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --primary-color: #42d919;
        --text-color: #e0e0e0;
        --bg-color: #1a1a1a;
        --card-bg: #2a2a2a;
        --border-color: #3a3a3a;
        --header-color: #42d919;
      }
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      background-color: var(--bg-color);
      margin: 0;
      padding: 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: var(--header-color);
    }
    
    /* 响应式设计增强 */
    @media (max-width: 768px) {
      .container {
        padding: 15px;
      }
    }
    
    /* 打印样式优化 */
    @media print {
      body {
        background-color: white;
        color: black;
      }
      
      .container {
        max-width: 100%;
        padding: 0;
      }
      
      a {
        text-decoration: none;
        color: black;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${html}
    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border-color); text-align: center; font-size: 14px; color: #777;">
      <p>此页面由<a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://qunbaogao.com'}" style="color: var(--primary-color); text-decoration: none;">群报告</a>AI聊天记录转换工具自动生成 - ${timestamp}</p>
    </footer>
  </div>
</body>
</html>`;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证请求正文
    if (!request.body) {
      return NextResponse.json(
        { error: '缺少请求正文' },
        { status: 400 }
      );
    }

    // 解析请求内容
    const body = await request.json();
    
    // 验证HTML代码
    if (!body.htmlCode || typeof body.htmlCode !== 'string') {
      return NextResponse.json(
        { error: '缺少HTML代码或格式不正确' },
        { status: 400 }
      );
    }

    // 增强HTML内容
    const htmlCode = body.htmlCode.trim();
    const enhancedHtml = enhanceHtml(htmlCode);
    
    // 生成唯一文件名
    const fileName = `${uuidv4()}.html`;
    
    // 上传增强后的HTML，传递文件名参数
    const url = await uploadHtml(enhancedHtml, fileName);
    
    // 返回部署后的URL
    return NextResponse.json({ url });
  } catch (error) {
    console.error('部署HTML失败:', error);
    return NextResponse.json(
      { error: '部署过程中发生错误' },
      { status: 500 }
    );
  }
} 