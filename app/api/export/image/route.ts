import { NextRequest, NextResponse } from 'next/server';
import { uploadHtml } from '@/app/lib/r2';
import { v4 as uuidv4 } from 'uuid';

// 此接口将HTML内容保存并返回一个图片导出链接
// 实际的HTML到图片转换可以通过集成第三方服务完成，如Puppeteer服务、CloudConvert等
// 本示例中返回一个虚拟的导出链接
export async function POST(request: NextRequest) {
  try {
    // 解析请求内容
    const body = await request.json();
    
    // 验证HTML代码
    if (!body.htmlCode || typeof body.htmlCode !== 'string') {
      return NextResponse.json(
        { error: '缺少HTML代码或格式不正确' },
        { status: 400 }
      );
    }

    const htmlCode = body.htmlCode.trim();
    
    // 为图片输出添加特殊的打印样式
    const enhancedHtml = addImageExportStyles(htmlCode);
    
    // 生成唯一的导出文件名
    const exportId = uuidv4();
    const htmlFileName = `exports/image-${exportId}.html`;
    
    // 上传增强后的HTML
    const htmlUrl = await uploadHtml(enhancedHtml, htmlFileName);
    
    // 这里是虚拟的图片导出服务
    // 实际实现中，你需要调用图片导出服务的API
    // 例如：const imageUrl = await callImageExportService(htmlUrl);
    const imageExportUrl = `${htmlUrl}?export=image`;
    
    // 返回导出链接
    return NextResponse.json({ 
      url: imageExportUrl,
      message: '图片导出请求已接收，请等待处理完成后下载'
    });
  } catch (error) {
    console.error('处理图片导出请求时出错:', error);
    return NextResponse.json(
      { 
        error: '处理请求时出错',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

/**
 * 为图片导出添加特殊样式
 * @param html 原始HTML
 * @returns 增强的HTML
 */
function addImageExportStyles(html: string): string {
  // 检查是否已经是完整的HTML文档
  if (html.includes('<html') && html.includes('</html>')) {
    // 注入图片导出优化的CSS
    const imageStyles = `
    /* 图片导出优化 */
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: white;
        box-shadow: none;
      }
      
      .container {
        max-width: 100%;
        padding: 20px;
        box-sizing: border-box;
      }
      
      header, footer {
        display: block !important;
        margin: 20px 0;
      }
    }
    `;
    
    // 注入样式到head标签
    return html.replace('</head>', `<style>${imageStyles}</style></head>`);
  }
  
  // 如果不是完整HTML，包装它
  const pageTitle = html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || '聊天记录';
  const timestamp = new Date().toLocaleString('zh-CN');
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} - 图片导出</title>
  <style>
    /* 基础样式 */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: white;
      margin: 0;
      padding: 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: #2dc100;
    }
    
    /* 图片导出优化 */
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: white;
        box-shadow: none;
      }
      
      .container {
        max-width: 100%;
        padding: 20px;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header style="text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
      <h1 style="color: #2dc100;">${pageTitle}</h1>
      <p style="color: #777;">导出时间：${timestamp}</p>
    </header>
    
    ${html}
    
    <footer style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; text-align: center; font-size: 14px; color: #777;">
      <p>此图片由<a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://qunbaogao.com'}" style="color: #2dc100; text-decoration: none;">群报告</a>生成</p>
    </footer>
  </div>
</body>
</html>`;
} 