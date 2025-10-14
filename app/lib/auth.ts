// 简单的管理后台认证系统

import crypto from 'crypto';

// 管理后台配置
const ADMIN_CONFIG = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  sessionSecret: process.env.ADMIN_SESSION_SECRET || 'your-secret-key-change-this',
  sessionMaxAge: 24 * 60 * 60 * 1000, // 24小时
};

// 生成会话token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// 验证管理员凭据
export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password;
}

// 生成会话哈希
export function generateSessionHash(token: string): string {
  return crypto
    .createHmac('sha256', ADMIN_CONFIG.sessionSecret)
    .update(token)
    .digest('hex');
}

// 验证会话
export function verifySession(token: string, hash: string): boolean {
  const expectedHash = generateSessionHash(token);
  return hash === expectedHash;
}

// 检查是否已登录
export function isAuthenticated(request: Request): boolean {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const hash = url.searchParams.get('hash');
  
  if (!token || !hash) {
    return false;
  }
  
  return verifySession(token, hash);
}

// 生成登录URL
export function generateLoginUrl(token: string): string {
  const hash = generateSessionHash(token);
  return `/admin?token=${token}&hash=${hash}`;
}
