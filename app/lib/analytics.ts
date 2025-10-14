// 访问统计和分析系统

interface PageView {
  id: string;
  url: string;
  referrer: string;
  userAgent: string;
  ip: string;
  timestamp: Date;
  isBot: boolean;
  country?: string;
  city?: string;
}

// 内存中的访问记录（生产环境应该使用数据库）
const pageViews: PageView[] = [];

// 记录页面访问
export function recordPageView(
  url: string,
  referrer: string,
  userAgent: string,
  ip: string
): void {
  const isBot = detectBot(userAgent);
  
  const pageView: PageView = {
    id: generateId(),
    url,
    referrer,
    userAgent,
    ip,
    timestamp: new Date(),
    isBot
  };

  pageViews.push(pageView);
  
  // 保持最近10000条记录
  if (pageViews.length > 10000) {
    pageViews.splice(0, pageViews.length - 10000);
  }
}

// 检测是否为机器人
function detectBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /googlebot/i,
    /bingbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegram/i,
    /wechat/i,
    /qq/i
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 获取访问统计
export function getAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
  const now = new Date();
  let startTime: Date;

  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const recentViews = pageViews.filter(view => view.timestamp >= startTime);
  const humanViews = recentViews.filter(view => !view.isBot);
  const botViews = recentViews.filter(view => view.isBot);

  // 按URL分组统计
  const urlStats = new Map<string, {
    totalViews: number;
    humanViews: number;
    botViews: number;
    uniqueIPs: Set<string>;
    referrers: Map<string, number>;
  }>();

  humanViews.forEach(view => {
    const stats = urlStats.get(view.url) || {
      totalViews: 0,
      humanViews: 0,
      botViews: 0,
      uniqueIPs: new Set<string>(),
      referrers: new Map<string, number>()
    };

    stats.totalViews++;
    stats.humanViews++;
    stats.uniqueIPs.add(view.ip);
    
    const referrer = view.referrer || 'direct';
    stats.referrers.set(referrer, (stats.referrers.get(referrer) || 0) + 1);
    
    urlStats.set(view.url, stats);
  });

  botViews.forEach(view => {
    const stats = urlStats.get(view.url) || {
      totalViews: 0,
      humanViews: 0,
      botViews: 0,
      uniqueIPs: new Set<string>(),
      referrers: new Map<string, number>()
    };

    stats.totalViews++;
    stats.botViews++;
    urlStats.set(view.url, stats);
  });

  // 转换为数组并排序
  const urlStatsArray = Array.from(urlStats.entries())
    .map(([url, stats]) => ({
      url,
      totalViews: stats.totalViews,
      humanViews: stats.humanViews,
      botViews: stats.botViews,
      uniqueVisitors: stats.uniqueIPs.size,
      topReferrers: Array.from(stats.referrers.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    }))
    .sort((a, b) => b.humanViews - a.humanViews);

  return {
    timeRange,
    totalViews: recentViews.length,
    humanViews: humanViews.length,
    botViews: botViews.length,
    uniqueVisitors: new Set(humanViews.map(v => v.ip)).size,
    topPages: urlStatsArray.slice(0, 20),
    hourlyStats: getHourlyStats(humanViews),
    referrerStats: getReferrerStats(humanViews)
  };
}

// 获取小时统计
function getHourlyStats(views: PageView[]) {
  const hourlyStats = new Map<number, number>();
  
  views.forEach(view => {
    const hour = view.timestamp.getHours();
    hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1);
  });

  return Array.from(hourlyStats.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);
}

// 获取来源统计
function getReferrerStats(views: PageView[]) {
  const referrerStats = new Map<string, number>();
  
  views.forEach(view => {
    const referrer = view.referrer || 'direct';
    referrerStats.set(referrer, (referrerStats.get(referrer) || 0) + 1);
  });

  return Array.from(referrerStats.entries())
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// 获取特定URL的详细统计
export function getUrlAnalytics(url: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
  const now = new Date();
  let startTime: Date;

  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const urlViews = pageViews.filter(view => 
    view.url.includes(url) && view.timestamp >= startTime
  );

  const humanViews = urlViews.filter(view => !view.isBot);
  const uniqueIPs = new Set(humanViews.map(v => v.ip));

  return {
    url,
    timeRange,
    totalViews: urlViews.length,
    humanViews: humanViews.length,
    botViews: urlViews.length - humanViews.length,
    uniqueVisitors: uniqueIPs.size,
    views: humanViews.map(view => ({
      timestamp: view.timestamp,
      ip: view.ip,
      referrer: view.referrer,
      userAgent: view.userAgent
    }))
  };
}
