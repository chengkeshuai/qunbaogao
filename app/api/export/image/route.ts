import { NextRequest, NextResponse } from 'next/server';
import { uploadHtml } from '@/app/lib/r2';

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
    
    // 上传HTML内容（这里复用现有的HTML上传功能）
    const htmlUrl = await uploadHtml(htmlCode);
    
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