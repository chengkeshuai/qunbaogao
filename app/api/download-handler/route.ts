import { NextRequest, NextResponse } from 'next/server';

// 软件信息配置
const SOFTWARE_INFO = {
  name: '留痕-2.1.1',
  version: '2.1.1',
  downloadUrl: 'https://github.com/LC044/WeChatMsg/releases/download/v2.1.1/WeChatMsg.Setup.2.1.1.exe',
  description: '开源微信聊天记录导出工具',
  size: '约25MB',
  githubRepo: 'https://github.com/LC044/WeChatMsg'
};

export async function GET(request: NextRequest) {
  try {
    // 记录下载统计 (可以在这里添加下载统计的代码)
    
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