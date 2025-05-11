import { NextRequest, NextResponse } from 'next/server';
import { uploadHtml } from '@/app/lib/r2';
import { v4 as uuidv4 } from 'uuid';

// 此接口将HTML内容保存并返回一个PDF导出链接
// 实际的HTML到PDF转换可以通过集成第三方服务完成，如Puppeteer服务、CloudConvert等
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
    
    // 为PDF输出添加特殊的打印样式
    const enhancedHtml = addPdfExportStyles(htmlCode);
    
    // 生成唯一的导出文件名
    const exportId = uuidv4();
    const htmlFileName = `exports/pdf-${exportId}.html`;
    
    // 上传增强后的HTML
    const htmlUrl = await uploadHtml(enhancedHtml, htmlFileName);
    
    // 这里是虚拟的PDF导出服务
    // 实际实现中，你需要调用PDF导出服务的API
    // 例如：const pdfUrl = await callPdfExportService(htmlUrl);
    const pdfExportUrl = `${htmlUrl}?export=pdf`;
    
    // 返回导出链接
    return NextResponse.json({ 
      url: pdfExportUrl,
      message: 'PDF导出请求已接收，请等待处理完成后下载'
    });
  } catch (error) {
    console.error('处理PDF导出请求时出错:', error);
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
 * 为PDF导出添加特殊样式
 * @param html 原始HTML
 * @returns 增强的HTML
 */
function addPdfExportStyles(html: string): string {
  // 检查是否已经是完整的HTML文档
  if (html.includes('<html') && html.includes('</html>')) {
    // 注入PDF导出优化的CSS
    const pdfStyles = `
    /* PDF导出优化 */
    @page {
      size: A4;
      margin: 1cm;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: white;
        box-shadow: none;
        font-size: 11pt;
      }
      
      .container {
        max-width: 100%;
        padding: 20px;
        box-sizing: border-box;
      }
      
      a {
        text-decoration: none;
        color: #2dc100;
      }
      
      header, footer {
        display: block !important;
        margin: 20px 0;
      }
      
      /* 分页控制 */
      h1, h2, h3 {
        page-break-after: avoid;
      }
      
      img {
        max-width: 100%;
        page-break-inside: avoid;
      }
      
      /* 添加页码 */
      .page-number:after {
        content: counter(page);
      }
    }
    `;
    
    // 注入样式到head标签
    return html.replace('</head>', `<style>${pdfStyles}</style></head>`);
  }
  
  // 如果不是完整HTML，包装它
  const pageTitle = html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] || '聊天记录';
  const timestamp = new Date().toLocaleString('zh-CN');
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} - PDF导出</title>
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
      padding: 30px;
      background: white;
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: #2dc100;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    p {
      margin-bottom: 0.8em;
    }
    
    /* PDF打印优化 */
    @page {
      size: A4;
      margin: 1cm;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: white;
        font-size: 11pt;
      }
      
      .container {
        max-width: 100%;
        padding: 0;
      }
      
      /* 分页控制 */
      h1, h2, h3 {
        page-break-after: avoid;
      }
      
      img {
        max-width: 100%;
        page-break-inside: avoid;
      }
      
      /* 添加页码 */
      .page-number:after {
        content: counter(page);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header style="text-align: center; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
      <h1 style="color: #2dc100; font-size: 24pt;">${pageTitle}</h1>
      <p style="color: #777;">导出时间：${timestamp}</p>
    </header>
    
    <main>
      ${html}
    </main>
    
    <footer style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; text-align: center; font-size: 9pt; color: #777;">
      <p>此PDF文档由<a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://qunbaogao.com'}" style="color: #2dc100; text-decoration: none;">群报告</a>生成</p>
      <div style="text-align: right; margin-top: 10px;">
        <span class="page-number">页码: </span>
      </div>
    </footer>
  </div>
</body>
</html>`;
} 