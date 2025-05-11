import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// 使用环境变量中的API密钥
const API_KEY = process.env.GEMINI_API_KEY!;
// 模型名称
const MODEL_NAME = "gemini-1.0-pro";

export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const { prompt, messages, template } = await req.json();

    // 初始化Google AI客户端
    const genAI = new GoogleGenAI({ apiKey: API_KEY });

    // 根据特定模板使用不同的提示词
    let fullPrompt = "";
    
    if (template === "dark-elegant") {
      // 对于"暗黑华丽风格"，我们使用特定的提示词
      try {
        const templateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/templates/dark-elegant`);
        if (!templateResponse.ok) {
          throw new Error("无法获取暗黑华丽风格模板");
        }
        const templateData = await templateResponse.json();
        const templatePrompt = templateData.template;
        fullPrompt = templatePrompt.replace("{prompt}", prompt);
      } catch (error) {
        console.error("获取暗黑华丽风格模板失败:", error);
        // 如果无法获取模板，则退回使用原始prompt
        fullPrompt = prompt;
      }
    } else {
      // 对于其他模板或无模板，构建包含历史消息的提示
      fullPrompt = messages
        .map((msg: { role: string; parts: { text: string }[] }) =>
          msg.parts.map((part) => part.text).join("\n")
        )
        .join("\n") + `\n${prompt}`;
    }

    // 确保fullPrompt不为空
    if (!fullPrompt.trim()) {
      return NextResponse.json(
        { error: "提示内容不能为空" },
        { status: 400 }
      );
    }

    // 获取模型，并将generationConfig和safetySettings移到这里
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
      ],
    });

    // 创建流式响应
    const streamResult = await model.generateContentStream([{ text: fullPrompt }]);

    // 创建一个可读流用于Next.js响应
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
        } catch (error) {
          console.error("流式处理错误:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    // 返回流式响应
    return new NextResponse(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Gemini API 错误:", error);
    // 根据错误类型返回不同的错误信息
    if (error instanceof Error && error.message.includes("API key not valid")) {
      return NextResponse.json(
        { error: "Gemini API 密钥无效或未设置" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "处理请求失败" },
      { status: 500 }
    );
  }
} 