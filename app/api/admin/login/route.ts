import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, generateSessionToken, generateLoginUrl } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    // 验证管理员凭据
    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 生成会话token
    const token = generateSessionToken();
    const redirectUrl = generateLoginUrl(token);

    return NextResponse.json({
      success: true,
      redirectUrl,
      message: '登录成功'
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
