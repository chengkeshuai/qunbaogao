/**
 * 聊天记录预处理工具
 * 用于清洗和格式化微信聊天记录，提高AI处理的质量
 */

/**
 * 预处理聊天记录
 * @param content 原始聊天记录内容
 * @returns 预处理后的聊天记录内容
 */
export function preprocessChat(content: string): string {
  if (!content || content.trim().length === 0) {
    return '';
  }

  let processedContent = content;

  // 1. 移除多余的空行
  processedContent = processedContent.replace(/\n{3,}/g, '\n\n');

  // 2. 识别并标准化聊天格式 - 支持多种常见微信聊天导出格式
  // 格式1：[昵称] 消息内容
  // 格式2：昵称：消息内容
  // 格式3：昵称(日期时间)：消息内容
  processedContent = processedContent.replace(/\[([^\]]+)\]\s*([^[]+)/g, '【$1】: $2\n');
  processedContent = processedContent.replace(/^([^:：\n]+)[：:]\s*(.+)$/gm, '【$1】: $2');
  processedContent = processedContent.replace(/^([^(（]+)[(（]([^)）]+)[)）][：:]\s*(.+)$/gm, '【$1】($2): $3');

  // 3. 移除常见的无意义系统消息
  const systemMessages = [
    /.*撤回了一条消息.*/g,
    /.*邀请.*加入了群聊.*/g,
    /.*加入了群聊.*/g,
    /.*移出了群聊.*/g,
    /.*退出了群聊.*/g,
    /.*群聊名称改为.*/g,
    /.*修改了群聊的聊天背景.*/g,
    /.*发起了视频通话.*/g,
    /.*发起了语音通话.*/g,
    /.*通话已结束.*/g,
    /.*开启了.*消息免打扰.*/g,
    /.*关闭了.*消息免打扰.*/g,
  ];

  systemMessages.forEach(pattern => {
    processedContent = processedContent.replace(pattern, '');
  });

  // 4. 合并同一发言人的连续消息
  const lines = processedContent.split('\n');
  const mergedLines: string[] = [];
  let currentSpeaker = '';
  let currentContent = '';

  for (const line of lines) {
    // 尝试匹配发言人格式
    const match = line.match(/^【([^】]+)】(?:\([^)]+\))?: (.+)$/);
    
    if (match) {
      const [_, speaker, content] = match;
      
      // 如果是新的发言人，保存之前的内容并开始新的
      if (speaker !== currentSpeaker && currentContent) {
        mergedLines.push(`【${currentSpeaker}】: ${currentContent}`);
        currentContent = content;
        currentSpeaker = speaker;
      } else {
        // 同一发言人，合并内容
        currentSpeaker = speaker;
        if (currentContent) {
          currentContent += '\n' + content;
        } else {
          currentContent = content;
        }
      }
    } else if (line.trim() && currentSpeaker) {
      // 如果不是典型的发言格式但有内容，且有当前发言人，则视为前一条消息的延续
      currentContent += '\n' + line;
    } else if (line.trim()) {
      // 不属于任何发言人的内容，直接添加
      mergedLines.push(line);
    }
  }

  // 添加最后一个发言人的内容
  if (currentSpeaker && currentContent) {
    mergedLines.push(`【${currentSpeaker}】: ${currentContent}`);
  }

  // 5. 最终清理
  processedContent = mergedLines.join('\n\n').trim();
  
  // 移除可能的敏感信息（电话号码、邮箱等）
  processedContent = processedContent.replace(/1[3-9]\d{9}/g, '[电话号码]');
  processedContent = processedContent.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[邮箱地址]');
  
  return processedContent;
}

/**
 * 估算聊天记录的长度
 * @param content 聊天记录内容
 * @returns 预估的token数量
 */
export function estimateTokenCount(content: string): number {
  if (!content) return 0;
  
  // 简单估算：中文每个字约为1.5个token，英文单词约为1.3个token
  // 这只是粗略估计，实际计算需要使用分词器
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
  const numbers = (content.match(/\d+/g) || []).length;
  const symbols = (content.match(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g) || []).length;
  
  return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + numbers + symbols);
}

/**
 * 检查内容是否需要分段处理
 * @param content 聊天记录内容
 * @param maxTokens 单次处理的最大token数量
 * @returns 是否需要分段处理
 */
export function needsChunking(content: string, maxTokens: number = 100000): boolean {
  return estimateTokenCount(content) > maxTokens;
}

/**
 * 将长聊天记录分割成较小的块
 * @param content 聊天记录内容
 * @param maxTokens 每个块的最大token数量
 * @returns 分割后的内容块数组
 */
export function chunkContent(content: string, maxTokens: number = 100000): string[] {
  if (!needsChunking(content, maxTokens)) {
    return [content];
  }

  const lines = content.split('\n');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokenCount = 0;

  for (const line of lines) {
    const lineTokens = estimateTokenCount(line);
    
    if (currentTokenCount + lineTokens > maxTokens && currentChunk.length > 0) {
      // 当前块已满，保存并开始新块
      chunks.push(currentChunk.join('\n'));
      currentChunk = [line];
      currentTokenCount = lineTokens;
    } else {
      // 添加到当前块
      currentChunk.push(line);
      currentTokenCount += lineTokens;
    }
  }

  // 添加最后一个块
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  return chunks;
} 