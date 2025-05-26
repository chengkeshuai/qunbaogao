import { NextRequest, NextResponse } from 'next/server';
import { uploadHtml } from '@/app/lib/r2';

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

    // 简单验证HTML内容
    const htmlCode = body.htmlCode.trim();
    if (!htmlCode.includes('<html') || !htmlCode.includes('</html>')) {
      // 如果不是完整的HTML文档，则自动添加基本HTML结构
      const enhancedHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML预览页面</title>
</head>
<body>
  ${htmlCode}
</body>
</html>
      `.trim();
      
      // 上传增强后的HTML
      const url = await uploadHtml(enhancedHtml);
      return NextResponse.json({ url });
    }

    // 上传原始HTML
    const url = await uploadHtml(htmlCode);
    
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