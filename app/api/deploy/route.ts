import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/app/lib/r2'; // 恢复R2上传服务
// import { uploadFileToCOS } from '@/lib/cos-upload'; // 注释掉COS上传服务

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
    
    const htmlCode = body.htmlCode;
    const isPrivate = body.isPrivate === true; // Default to false if undefined

    // 验证HTML代码
    if (!htmlCode || typeof htmlCode !== 'string') {
      return NextResponse.json(
        { error: '缺少HTML代码或格式不正确' },
        { status: 400 }
      );
    }

    let htmlContent = htmlCode.trim();

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

    // 生成一个唯一的文件名，例如使用时间戳或UUID
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.html`;

    // 上传到R2
    const deployedUrl = await uploadToR2(
      `deployed-html/${uniqueFilename}`, // 在R2中的路径和文件名
      htmlBuffer,
      'text/html'
    );

    if (!deployedUrl) {
      return NextResponse.json(
        { error: '上传到R2失败' },
        { status: 500 }
      );
    }

    if (isPrivate) {
      // 对于私有链接，我们返回一个应用内路径
      // 浏览器会自动解析为 https://yourdomain.com/api/view/...
      const appViewUrl = `/api/view/${uniqueFilename}`;
      return NextResponse.json({ 
        url: appViewUrl, 
        isPublic: false,
        r2Url: deployedUrl // 原始R2链接也返回，供参考或后台使用
      });
    } else {
      // 对于公开链接，直接返回R2 URL
      return NextResponse.json({ url: deployedUrl, isPublic: true });
    }
  } catch (error) {
    console.error('部署HTML失败:', error);
    return NextResponse.json(
      { error: '部署过程中发生错误' },
      { status: 500 }
    );
  }
} 