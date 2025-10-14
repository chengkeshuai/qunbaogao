import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, hash } = body;

    if (!token || !hash) {
      return NextResponse.json({ valid: false, error: '缺少认证信息' }, { status: 400 });
    }

    // 验证会话
    const isValid = verifySession(token, hash);

    return NextResponse.json({
      valid: isValid,
      message: isValid ? '会话有效' : '会话无效'
    });

  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json({ valid: false, error: '服务器错误' }, { status: 500 });
  }
}
