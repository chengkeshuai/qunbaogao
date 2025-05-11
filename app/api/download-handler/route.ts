import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

// 软件信息配置
const SOFTWARE_INFO = {
  name: '留痕-2.2.0',
  version: '2.2.0',
  // 改为本地文件下载路径
  downloadUrl: '/local-software/WeChatMsg.Setup.2.2.0.exe',
  description: '开源微信聊天记录导出工具，支持文本、图片、视频和语音导出',
  size: '约30MB',
  githubRepo: 'https://github.com/LC044/WeChatMsg',
  lastUpdated: '2023年5月',
  supportedOS: 'Windows 7/10/11',
  requirements: '需要安装.NET Framework 4.7.2或更高版本'
};

export async function GET(request: NextRequest) {
  try {
    // 获取用户代理信息，用于后续可能的统计分析
    const userAgent = request.headers.get('user-agent') || '';
    
    // 记录下载统计 (简单实现，实际项目中可能需要连接数据库)
    console.log(`留痕软件下载请求，用户代理：${userAgent}`);
    
    // 返回软件信息
    return NextResponse.json(SOFTWARE_INFO);
  } catch (error) {
    console.error('处理下载请求时出错:', error);
    return NextResponse.json(
      { 
        error: '处理请求时出错',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// 添加新的路由处理函数，用于提供本地软件文件下载
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '未提供软件文件' }, { status: 400 });
    }
    
    // 确保public/local-software目录存在
    const publicDir = path.join(process.cwd(), 'public');
    const softwareDir = path.join(publicDir, 'local-software');
    
    try {
      await fsPromises.access(softwareDir);
    } catch (error) {
      // 目录不存在，创建它
      await fsPromises.mkdir(softwareDir, { recursive: true });
    }
    
    // 保存上传的文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(softwareDir, 'WeChatMsg.Setup.2.2.0.exe');
    await fsPromises.writeFile(filePath, buffer);
    
    return NextResponse.json({
      success: true,
      message: '软件文件已成功上传',
      downloadUrl: SOFTWARE_INFO.downloadUrl
    });
  } catch (error) {
    console.error('上传软件文件时出错:', error);
    return NextResponse.json(
      {
        error: '处理上传请求时出错',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
} 