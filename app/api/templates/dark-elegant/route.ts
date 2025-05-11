import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// 暗黑华丽风格模板API
export async function GET(request: NextRequest) {
  try {
    // 检查是否已有保存的模板文件
    const templateDir = path.join('/tmp', 'data/templates');
    const templatePath = path.join(templateDir, 'dark-elegant.txt');
    
    try {
      // 检查目录是否存在
      try {
        await fsPromises.access(templateDir);
      } catch (error) {
        // 目录不存在，创建它
        await fsPromises.mkdir(templateDir, { recursive: true });
      }
      
      // 尝试读取现有模板文件
      const templateContent = await fsPromises.readFile(templatePath, 'utf-8');
      // 返回JSON格式的模板内容
      return NextResponse.json({ template: templateContent }); 
    } catch (error) {
      // 如果文件不存在，创建默认的暗黑华丽风格模板
      const darkElegantTemplate = `任务：根据提供的微信群聊天记录（txt格式）生成今日群日报，输出为风格固定、一致的HTML页面，适合截图分享

## 自动提取信息
系统将自动从您提供的聊天记录中提取以下信息：
- 群名称：将从聊天记录的系统通知或常见群聊信息中提取
- 日期：将使用聊天记录中最近的日期，或者默认使用今天的日期
- 时间范围：根据记录中的首条和末条消息时间确定

## 日报模式选择
- 日报模式：[完整版/简化版] (默认为完整版)
- 如果需要简化版，请在提交时注明"生成简化版日报"

## 简化版说明
如选择"简化版"，将只生成以下核心部分：
- 今日讨论热点（最多3个）
- 重要消息汇总
- 话唠榜（仅前3名）
- 简化版词云
日报内容更精简，适合快速浏览和分享。

## 聊天记录支持格式
支持以下多种常见格式：
- "[时间] 昵称：消息内容"
- "时间 - 昵称：消息内容"
- "昵称 时间：消息内容"
- 其他合理的时间和昵称分隔格式

如未能识别消息格式或未找到有效记录，将显示提示信息并尝试按最佳猜测处理。

## 输出要求
必须使用以下固定的HTML模板和CSS样式，仅更新内容部分，确保每次生成的页面风格完全一致。使用严格定义的深色科技风格。

## HTML结构模板

\`\`\`html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>[群名称]日报 - [日期]</title>
    <style>
        /* 严格定义的CSS样式，确保风格一致性 */
        :root {
            --bg-primary: #0f0e17;
            --bg-secondary: #1a1925;
            --bg-tertiary: #252336;
            --text-primary: #fffffe;
            --text-secondary: #a7a9be;
            --accent-primary: #ff8906;
            --accent-secondary: #f25f4c;
            --accent-tertiary: #e53170;
            --accent-blue: #3da9fc;
            --accent-purple: #7209b7;
            --accent-cyan: #00b4d8;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'SF Pro Display', 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            font-size: 16px;
            width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            padding: 30px 0;
            background-color: var(--bg-secondary);
            margin-bottom: 30px;
        }
        
        h1 {
            font-size: 36px;
            font-weight: 700;
            color: var(--accent-primary);
            margin-bottom: 10px;
        }
\`\`\``;

      // 写入模板到文件
      await fsPromises.writeFile(templatePath, darkElegantTemplate, 'utf-8');
      
      // 创建续写部分（第二部分）
      const secondPartPath = path.join(templateDir, 'dark-elegant-part2.txt');
      const darkElegantTemplatePart2 = `
        .date {
            font-size: 18px;
            color: var(--text-secondary);
            margin-bottom: 20px;
        }
        
        .meta-info {
            display: flex;
            justify-content: center;
            gap: 20px;
        }
        
        .meta-info span {
            background-color: var(--bg-tertiary);
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
        }
        
        section {
            background-color: var(--bg-secondary);
            margin-bottom: 30px;
            padding: 25px;
        }
        
        h2 {
            font-size: 28px;
            font-weight: 600;
            color: var(--accent-blue);
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--accent-blue);
        }
        
        h3 {
            font-size: 22px;
            font-weight: 600;
            color: var(--accent-primary);
            margin: 15px 0 10px 0;
        }
        
        h4 {
            font-size: 18px;
            font-weight: 600;
            color: var(--accent-secondary);
            margin: 12px 0 8px 0;
        }
        
        p {
            margin-bottom: 15px;
        }
        
        ul, ol {
            margin-left: 20px;
            margin-bottom: 15px;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        a {
            color: var(--accent-blue);
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        /* 卡片容器样式 */
        .topics-container, .tutorials-container, .messages-container, 
        .dialogues-container, .qa-container, .participants-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
        }`;
      
      await fsPromises.writeFile(secondPartPath, darkElegantTemplatePart2, 'utf-8');
      
      // 返回JSON格式的模板内容
      return NextResponse.json({ template: darkElegantTemplate }); 
    }
  } catch (error) {
    console.error('处理模板请求时出错:', error);
    return NextResponse.json(
      { 
        error: '处理请求时出错',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// POST方法用于从客户端上传新的模板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.template || typeof body.template !== 'string') {
      return NextResponse.json(
        { error: '缺少模板内容或格式不正确' },
        { status: 400 }
      );
    }
    
    // 保存模板
    const templateDir = path.join('/tmp', 'data/templates');
    const templatePath = path.join(templateDir, 'dark-elegant.txt');
    
    // 确保目录存在
    try {
      await fsPromises.access(templateDir);
    } catch (error) {
      await fsPromises.mkdir(templateDir, { recursive: true });
    }
    
    // 写入模板
    await fsPromises.writeFile(templatePath, body.template, 'utf-8');
    
    return NextResponse.json({ success: true, message: '模板已更新' });
  } catch (error) {
    console.error('更新模板时出错:', error);
    return NextResponse.json(
      { 
        error: '处理请求时出错',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
} 