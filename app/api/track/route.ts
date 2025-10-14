import { NextRequest, NextResponse } from 'next/server';
import { recordPageView } from '@/app/lib/analytics';
import { getUserIP } from '@/app/lib/userManagement';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, referrer, userAgent } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const ip = getUserIP(request);
    const finalUserAgent = userAgent || request.headers.get('user-agent') || 'unknown';
    const finalReferrer = referrer || request.headers.get('referer') || '';

    // 记录访问
    recordPageView(url, finalReferrer, finalUserAgent, ip);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Track error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
