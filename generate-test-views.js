#!/usr/bin/env node

// 生成测试访问数据的脚本

const testUrls = [
  '/view-set/d13170a4-9b9b-4d0b-b36d-8c5a2cde63b0',
  '/view-set/4bd39449-01e5-4168-96f7-dc056e4e79f7',
  '/api/view/deployed-html/1748441169370-uj0u93cqbcd.html',
  '/api/view/deployed-html/1748352042401-laljzg49dq.html'
];

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
];

const referrers = [
  'https://www.google.com/search?q=群报告',
  'https://www.baidu.com/s?wd=HTML生成器',
  'https://weixin.qq.com/',
  'https://www.qq.com/',
  'direct'
];

function generateRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

async function generateTestViews() {
  console.log('🚀 生成测试访问数据...\n');
  
  const baseUrl = 'http://localhost:3000';
  const viewsToGenerate = 50;
  
  for (let i = 0; i < viewsToGenerate; i++) {
    const url = testUrls[Math.floor(Math.random() * testUrls.length)];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    const referrer = referrers[Math.floor(Math.random() * referrers.length)];
    const ip = generateRandomIP();
    
    try {
      const response = await fetch(`${baseUrl}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          'Referer': referrer === 'direct' ? '' : referrer,
          'X-Forwarded-For': ip
        },
        body: JSON.stringify({
          url: `${baseUrl}${url}`,
          referrer: referrer === 'direct' ? '' : referrer,
          userAgent: userAgent
        })
      });
      
      if (response.ok) {
        console.log(`✅ 生成访问记录 ${i + 1}/${viewsToGenerate}: ${url}`);
      } else {
        console.log(`❌ 失败 ${i + 1}/${viewsToGenerate}: ${url}`);
      }
      
      // 随机延迟
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      
    } catch (error) {
      console.log(`❌ 错误 ${i + 1}/${viewsToGenerate}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 测试数据生成完成！');
  console.log('📊 现在可以访问管理后台查看访问统计：http://localhost:3000/admin');
}

generateTestViews().catch(console.error);
