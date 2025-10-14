// 内容检测和过滤功能

// 不良关键词列表（可以根据需要扩展）
const BAD_KEYWORDS = [
  // 赌博相关
  '加拿大28', '杀组预测', '九龙团队', '彩票', '赌博', '博彩',
  '时时彩', '快三', '六合彩', '澳门', '拉斯维加斯',
  
  // 其他不良内容
  '色情', '成人', '暴力', '恐怖', '诈骗', '传销',
  '毒品', '枪支', '黑客', '破解', '盗版'
];

// 检测HTML内容中的不良关键词
export function detectBadContent(htmlContent: string, filename: string): {
  isBad: boolean;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  const reasons: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // 检测文件名
  const filenameLower = filename.toLowerCase();
  for (const keyword of BAD_KEYWORDS) {
    if (filenameLower.includes(keyword.toLowerCase())) {
      reasons.push(`文件名包含敏感词汇: ${keyword}`);
      riskLevel = 'high';
    }
  }
  
  // 检测HTML内容
  const contentLower = htmlContent.toLowerCase();
  for (const keyword of BAD_KEYWORDS) {
    if (contentLower.includes(keyword.toLowerCase())) {
      reasons.push(`内容包含敏感词汇: ${keyword}`);
      if (riskLevel === 'low') riskLevel = 'medium';
    }
  }
  
  // 检测可疑的URL模式
  const suspiciousUrls = [
    /https?:\/\/[^\/]*casino[^\/]*/i,
    /https?:\/\/[^\/]*bet[^\/]*/i,
    /https?:\/\/[^\/]*gambling[^\/]*/i,
    /https?:\/\/[^\/]*porn[^\/]*/i
  ];
  
  for (const pattern of suspiciousUrls) {
    if (pattern.test(htmlContent)) {
      reasons.push('包含可疑的外部链接');
      riskLevel = 'high';
    }
  }
  
  // 检测可疑的JavaScript代码
  const suspiciousJs = [
    /window\.open\s*\(/i,
    /document\.write\s*\(/i,
    /eval\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i
  ];
  
  for (const pattern of suspiciousJs) {
    if (pattern.test(htmlContent)) {
      reasons.push('包含可疑的JavaScript代码');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
  }
  
  return {
    isBad: reasons.length > 0,
    reasons,
    riskLevel
  };
}

// 获取内容检测的详细报告
export function getContentReport(htmlContent: string, filename: string) {
  const detection = detectBadContent(htmlContent, filename);
  
  return {
    ...detection,
    wordCount: htmlContent.length,
    hasImages: /<img[^>]*>/i.test(htmlContent),
    hasLinks: /<a[^>]*href/i.test(htmlContent),
    hasScripts: /<script[^>]*>/i.test(htmlContent),
    hasStyles: /<style[^>]*>/i.test(htmlContent),
    timestamp: new Date().toISOString()
  };
}
