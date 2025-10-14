import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics, getUrlAnalytics } from '@/app/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h';
    const specificUrl = url.searchParams.get('url');

    if (specificUrl) {
      // 获取特定URL的统计
      const analytics = getUrlAnalytics(specificUrl, timeRange);
      return NextResponse.json(analytics);
    } else {
      // 获取总体统计
      const analytics = getAnalytics(timeRange);
      return NextResponse.json(analytics);
    }
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
