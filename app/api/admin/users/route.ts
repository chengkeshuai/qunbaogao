import { NextRequest, NextResponse } from 'next/server';
import { 
  getBlockedIPs, 
  getAllUserBehaviors, 
  blockIP, 
  unblockIP,
  getUserIP 
} from '@/app/lib/userManagement';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'blocked') {
      // 获取被封禁的IP列表
      const blockedIPs = getBlockedIPs();
      return NextResponse.json({ blockedIPs });
    } else if (action === 'behaviors') {
      // 获取用户行为统计
      const behaviors = getAllUserBehaviors();
      return NextResponse.json({ behaviors });
    } else {
      // 获取所有信息
      const blockedIPs = getBlockedIPs();
      const behaviors = getAllUserBehaviors();
      return NextResponse.json({ blockedIPs, behaviors });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ip } = body;

    if (!action || !ip) {
      return NextResponse.json({ error: 'Action and IP are required' }, { status: 400 });
    }

    switch (action) {
      case 'block':
        blockIP(ip);
        return NextResponse.json({ message: `IP ${ip} has been blocked` });
      
      case 'unblock':
        unblockIP(ip);
        return NextResponse.json({ message: `IP ${ip} has been unblocked` });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
