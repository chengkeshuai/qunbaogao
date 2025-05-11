import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// 使用环境变量中的API密钥
const API_KEY = process.env.GEMINI_API_KEY!;
// 模型名称
const MODEL_NAME = "gemini-2.5-pro-preview-05-06";

export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const { prompt, messages = [], template } = await req.json();

    // 初始化Google AI客户端
    const ai = new GoogleGenAI({ apiKey: API_KEY });

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
        .map((msg: { role: string; parts: { text: string }[] }) => {
          if (msg && Array.isArray(msg.parts)) {
            return msg.parts.map((part) => part.text).join("\n");
          }
          return "";
        })
        .join("\n") + `\n${prompt}`;
    }

    // 确保fullPrompt不为空
    if (!fullPrompt.trim()) {
      return NextResponse.json(
        { error: "提示内容不能为空" },
        { status: 400 }
      );
    }

    // 直接通过 ai.models.generateContentStream 调用 API
    // 并将 model, contents, generationConfig 和 safetySettings 作为参数传入
    const streamResult = await ai.models.generateContentStream({
      model: MODEL_NAME, 
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }], // 根据文档，contents 是一个数组
      // 将 generationConfig 的属性直接放在 config 下，safetySettings 也直接在 config 下
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
        ],
      }
    });

    // 创建一个可读流用于Next.js响应
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // 直接迭代 streamResult (它本身就是异步迭代器)
          for await (const chunk of streamResult) { 
            // chunk.text 是一个属性，不是方法
            const chunkText = chunk.text; 
            if (chunkText) { // 确保 text 存在
                controller.enqueue(new TextEncoder().encode(chunkText));
            }
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