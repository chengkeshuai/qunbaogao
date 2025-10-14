// 用户管理和IP封禁功能

// 被封禁的IP列表（可以从数据库或配置文件加载）
const BLOCKED_IPS = new Set<string>([
  // 可以在这里添加被封禁的IP地址
  // '192.168.1.100',
  // '10.0.0.50'
]);

// 用户行为记录
interface UserBehavior {
  ip: string;
  uploadCount: number;
  lastUpload: Date;
  blockedContentCount: number;
  suspiciousActivity: string[];
}

// 内存中的用户行为记录（生产环境应该使用数据库）
const userBehaviors = new Map<string, UserBehavior>();

// 获取用户IP地址
export function getUserIP(request: Request): string {
  // 从各种可能的头部获取真实IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

// 检查IP是否被封禁
export function isIPBlocked(ip: string): boolean {
  return BLOCKED_IPS.has(ip);
}

// 记录用户行为
export function recordUserBehavior(ip: string, action: 'upload' | 'blocked_content' | 'suspicious', details?: string) {
  const behavior = userBehaviors.get(ip) || {
    ip,
    uploadCount: 0,
    lastUpload: new Date(),
    blockedContentCount: 0,
    suspiciousActivity: []
  };

  switch (action) {
    case 'upload':
      behavior.uploadCount++;
      behavior.lastUpload = new Date();
      break;
    case 'blocked_content':
      behavior.blockedContentCount++;
      break;
    case 'suspicious':
      if (details) {
        behavior.suspiciousActivity.push(`${new Date().toISOString()}: ${details}`);
      }
      break;
  }

  userBehaviors.set(ip, behavior);
  
  // 如果用户行为异常，自动封禁
  if (shouldAutoBlock(behavior)) {
    BLOCKED_IPS.add(ip);
    console.warn(`自动封禁IP: ${ip}, 原因: 异常行为`);
  }
}

// 判断是否应该自动封禁
function shouldAutoBlock(behavior: UserBehavior): boolean {
  // 1小时内上传超过10次
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (behavior.lastUpload > oneHourAgo && behavior.uploadCount > 10) {
    return true;
  }
  
  // 被阻止的内容超过3次
  if (behavior.blockedContentCount > 3) {
    return true;
  }
  
  // 可疑活动超过5次
  if (behavior.suspiciousActivity.length > 5) {
    return true;
  }
  
  return false;
}

// 获取用户行为统计
export function getUserBehavior(ip: string): UserBehavior | null {
  return userBehaviors.get(ip) || null;
}

// 手动封禁IP
export function blockIP(ip: string): void {
  BLOCKED_IPS.add(ip);
  console.log(`手动封禁IP: ${ip}`);
}

// 解封IP
export function unblockIP(ip: string): void {
  BLOCKED_IPS.delete(ip);
  console.log(`解封IP: ${ip}`);
}

// 获取所有被封禁的IP
export function getBlockedIPs(): string[] {
  return Array.from(BLOCKED_IPS);
}

// 获取用户行为统计
export function getAllUserBehaviors(): UserBehavior[] {
  return Array.from(userBehaviors.values());
}
