import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/app/lib/r2'; // 恢复R2上传服务
// import { uploadFileToCOS } from '@/lib/cos-upload'; // 注释掉COS上传服务
import crypto from 'crypto'; // Import crypto for hashing

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
    // const isPrivate = body.isPrivate === true; // This is no longer used to determine URL type
    const password = body.password as string | undefined;

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

    let r2Metadata: Record<string, string> | undefined;
    let hasPasswordSet = false;
    if (password && password.trim().length > 0) { // Password is only set if provided
      const passwordHash = crypto.createHash('sha256').update(password.trim()).digest('hex');
      r2Metadata = { 'password-hash': passwordHash };
      hasPasswordSet = true;
    }

    // 上传到R2
    const deployedUrl = await uploadToR2(
      `deployed-html/${uniqueFilename}`, // 在R2中的路径和文件名
      htmlBuffer,
      'text/html',
      r2Metadata // Pass metadata to R2 upload function
    );

    if (!deployedUrl) {
      return NextResponse.json(
        { error: '上传到R2失败' },
        { status: 500 }
      );
    }

    // Always return an app-internal path
    const appViewUrl = `/api/view/${uniqueFilename}`;
    return NextResponse.json({ 
      url: appViewUrl, 
      // isPublic: false, // This field might be redundant now or always false
      hasPassword: hasPasswordSet,
      r2Url: deployedUrl // 原始R2链接仍然可以返回，供参考或后台使用
    });

  } catch (error) {
    console.error('部署HTML失败:', error);
    return NextResponse.json(
      { error: '部署过程中发生错误' },
      { status: 500 }
    );
  }
} 