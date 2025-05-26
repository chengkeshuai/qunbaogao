import { NextRequest, NextResponse } from 'next/server';
// import { uploadHtml } from '@/app/lib/r2'; // 旧的R2上传服务
import { uploadFileToCOS } from '@/lib/cos-upload'; // 新的COS上传服务

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

    let htmlContent = body.htmlCode.trim();

    // 如果不是完整的HTML文档，则自动添加基本HTML结构
    if (!htmlContent.includes('<html') || !htmlContent.includes('</html>')) {
      htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML预览页面</title>
</head>
<body>
  ${htmlContent}
</body>
</html>
      `.trim();
    }

    // 将HTML内容转换为Buffer
    const htmlBuffer = Buffer.from(htmlContent, 'utf-8');

    // 上传到COS
    const result = await uploadFileToCOS(
      htmlBuffer,
      'index.html', // 默认文件名
      'deployed-html' // COS中的文件夹
    );

    if (!result.success || !result.url) {
      return NextResponse.json(
        { error: result.error || '上传到COS失败' },
        { status: 500 }
      );
    }

    // 返回部署后的URL
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error('部署HTML失败:', error);
    return NextResponse.json(
      { error: '部署过程中发生错误' },
      { status: 500 }
    );
  }
} 