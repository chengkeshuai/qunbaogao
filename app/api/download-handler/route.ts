import { NextRequest, NextResponse } from 'next/server';

// 软件信息配置
const SOFTWARE_INFO = {
  name: '留痕-2.2.0',
  version: '2.2.0',
  downloadUrl: 'https://github.com/LC044/WeChatMsg/releases/download/v2.2.0/WeChatMsg.Setup.2.2.0.exe',
  description: '开源微信聊天记录导出工具，支持文本、图片、视频和语音导出',
  size: '约30MB',
  githubRepo: 'https://github.com/LC044/WeChatMsg',
  lastUpdated: '2025年5月',
  supportedOS: 'Windows 7/10/11',
  requirements: '需要安装.NET Framework 4.7.2或更高版本'
};

export async function GET(request: NextRequest) {
  try {
    // 获取用户代理信息，用于后续可能的统计分析
    const userAgent = request.headers.get('user-agent') || '';
    
    // 记录下载统计 (简单实现，实际项目中可能需要连接数据库)
    console.log(`留痕软件下载请求，用户代理：${userAgent}`);
    
    // 检查软件版本更新（可以扩展为从GitHub API获取最新版本）
    
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