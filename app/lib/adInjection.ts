// 广告注入功能

// Google AdSense广告代码模板
const ADSENSE_CODE = `
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
     crossorigin="anonymous"></script>
<!-- 顶部横幅广告 -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
     data-ad-slot="YOUR_AD_SLOT_ID"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
`;

// 在HTML内容中注入广告
export function injectAds(htmlContent: string, adPosition: 'top' | 'bottom' | 'both' = 'top'): string {
  // 如果HTML内容中已经包含广告代码，则不重复注入
  if (htmlContent.includes('adsbygoogle') || htmlContent.includes('googlesyndication')) {
    return htmlContent;
  }

  let modifiedContent = htmlContent;

  // 在body标签开始后注入顶部广告
  if (adPosition === 'top' || adPosition === 'both') {
    const bodyStartRegex = /<body[^>]*>/i;
    if (bodyStartRegex.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(
        bodyStartRegex,
        (match) => `${match}\n<div style="text-align: center; margin: 10px 0;">${ADSENSE_CODE}</div>`
      );
    }
  }

  // 在body标签结束前注入底部广告
  if (adPosition === 'bottom' || adPosition === 'both') {
    const bodyEndRegex = /<\/body>/i;
    if (bodyEndRegex.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(
        bodyEndRegex,
        `<div style="text-align: center; margin: 10px 0;">${ADSENSE_CODE}</div>\n</body>`
      );
    }
  }

  return modifiedContent;
}

// 检查HTML内容是否适合显示广告
export function isAdFriendly(htmlContent: string): boolean {
  const content = htmlContent.toLowerCase();
  
  // 检查是否包含不适合广告的内容
  const badKeywords = [
    '赌博', '彩票', '色情', '成人', '暴力', '恐怖',
    'gambling', 'casino', 'porn', 'adult', 'violence'
  ];
  
  for (const keyword of badKeywords) {
    if (content.includes(keyword)) {
      return false;
    }
  }
  
  // 检查内容长度（太短的内容不适合广告）
  if (content.length < 500) {
    return false;
  }
  
  return true;
}

// 获取广告配置
export function getAdConfig(): {
  enabled: boolean;
  publisherId: string;
  adSlotId: string;
  position: 'top' | 'bottom' | 'both';
} {
  return {
    enabled: process.env.ADSENSE_ENABLED === 'true',
    publisherId: process.env.ADSENSE_PUBLISHER_ID || 'ca-pub-YOUR_PUBLISHER_ID',
    adSlotId: process.env.ADSENSE_AD_SLOT_ID || 'YOUR_AD_SLOT_ID',
    position: (process.env.ADSENSE_POSITION as 'top' | 'bottom' | 'both') || 'top'
  };
}
