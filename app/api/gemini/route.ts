import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// 更新为使用最新的Gemini 2.5 Pro模型
const MODEL_NAME = "gemini-2.5-pro-preview-05-06";
const API_KEY = process.env.GEMINI_API_KEY || '';

// 初始化Gemini API客户端
const ai = new GoogleGenAI({ apiKey: API_KEY });

type StreamData = {
  text: string;
  finish: boolean;
};

export async function POST(request: NextRequest) {
  try {
    // 验证API密钥是否配置
    if (!API_KEY) {
      return NextResponse.json(
        { error: '未配置Gemini API密钥' },
        { status: 500 }
      );
    }

    // 解析请求内容
    const body = await request.json();
    
    // 验证聊天内容和提示词模板
    if (!body.chatContent || typeof body.chatContent !== 'string') {
      return NextResponse.json(
        { error: '缺少聊天内容或格式不正确' },
        { status: 400 }
      );
    }

    const chatContent = body.chatContent;
    const promptTemplate = body.promptTemplate || '将聊天记录转换为美观的HTML网页';

    // 构建完整提示词
    const fullPrompt = `${promptTemplate}\n\n以下是聊天记录内容:\n${chatContent}\n\n请生成完整可用的HTML代码，确保代码具有良好的移动端适配性和页面样式。`;

    // 创建流式响应，添加优化后的参数
    const stream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: fullPrompt,
      // 添加增强参数设置
      generationConfig: {
        temperature: 0.7,     // 控制创意度，0.7是一个平衡值
        topP: 0.95,           // 控制多样性
        topK: 64,             // 保持默认值
        maxOutputTokens: 8192, // 增加输出上限，但保持在合理范围内
        stopSequences: []     // 可根据需要设置停止序列
      },
      // 设置安全设置，确保内容适当
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        }
      ]
    });
    
    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');

    // 创建流式响应
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          
          // 处理流式响应
          for await (const chunk of stream) {
            // 提取文本内容
            const chunkText = chunk.text || '';
            fullResponse += chunkText;
            
            // 发送数据块
            const data: StreamData = {
              text: chunkText,
              finish: false
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          }
          
          // 发送完成信号
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                text: fullResponse,
                finish: true
              })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error('生成内容时出错:', error);
          const errorData = {
            error: '处理请求时出错',
            details: (error as Error).message
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers,
    });
  } catch (error) {
    console.error('处理请求时出错:', error);
    return NextResponse.json(
      { 
        error: '处理请求时出错',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
} 