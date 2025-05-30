import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { R2_BUCKET_NAME, getObjectMetadata } from '@/app/lib/r2';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import crypto from 'crypto';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Cloudflare R2 environment variables are not fully set");
}

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

// 生成密码输入表单HTML
function getPasswordPromptHTML(setId: string, fileIndex: number, error?: string, knowledgeBaseTitle?: string): string {
  const WECHAT_GREEN = '#2dc100';
  const WECHAT_GREEN_HOVER = '#249c00';
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${knowledgeBaseTitle ? `${knowledgeBaseTitle} - 密码保护` : '知识库 - 密码保护'}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    .wechat-green-btn {
      background-color: #2dc100;
      color: white;
    }
    .wechat-green-btn:hover {
      background-color: #249c00;
    }
  </style>
</head>
<body class="bg-gray-100 h-screen flex items-center justify-center">
  <div class="max-w-md w-full mx-auto bg-white rounded-lg shadow-md overflow-hidden p-6">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">${knowledgeBaseTitle || '知识库内容'}</h1>
      <p class="text-gray-600">此内容受密码保护</p>
    </div>
    <form action="/api/direct-view/${setId}/${fileIndex}" method="GET" class="space-y-4">
      <div>
        <label for="passwordInput" class="block text-sm font-medium text-gray-700 mb-1">请输入密码</label>
        <div class="relative rounded-md shadow-sm">
          <input type="text" 
                 name="password" 
                 id="passwordInput"
                 class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 sm:text-sm border border-gray-300 rounded-md" 
                 placeholder="输入访问密码"
                 required>
          <button type="button" 
                  id="togglePasswordVisibility" 
                  class="absolute inset-y-0 right-0 px-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-500"
                  aria-label="隐藏密码">
            <svg id="eyeIconClosed" class="h-5 w-5 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l3.291 3.291M3 3l18 18" /></svg>
            <svg id="eyeIconOpen" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </button>
        </div>
      </div>
      ${error ? `<p class="text-sm text-red-600 text-center">${error}</p>` : ''}
      <input type="hidden" name="isInsideKnowledgeBase" value="true">
      <button type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white wechat-green-btn">
        提交
      </button>
    </form>
  </div>
  <script>
    const passwordInput = document.getElementById('passwordInput');
    const toggleButton = document.getElementById('togglePasswordVisibility');
    const eyeIconOpen = document.getElementById('eyeIconOpen');
    const eyeIconClosed = document.getElementById('eyeIconClosed');
    if (passwordInput && toggleButton && eyeIconOpen && eyeIconClosed) {
      toggleButton.addEventListener('click', function() {
        const isText = passwordInput.getAttribute('type') === 'text';
        passwordInput.setAttribute('type', isText ? 'password' : 'text');
        this.setAttribute('aria-label', isText ? '显示密码' : '隐藏密码');
        eyeIconOpen.classList.toggle('hidden', isText);
        eyeIconClosed.classList.toggle('hidden', !isText);
      });
    }
  </script>
</body>
</html>
  `.trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  console.log(`[Direct View] Request URL: ${request.url}`);
  
  if (!params || params.params.length < 2) {
    return new NextResponse('Invalid parameters. Format: /api/direct-view/[setId]/[fileIndex]', { status: 400 });
  }
  
  const setId = params.params[0];
  const fileIndex = parseInt(params.params[1]);
  
  if (isNaN(fileIndex)) {
    return new NextResponse('Invalid file index', { status: 400 });
  }
  
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return new NextResponse('Database connection error', { status: 500 });
  }
  
  // 获取查询参数
  const url = new URL(request.url);
  const providedPassword = url.searchParams.get('password');
  const token = url.searchParams.get('token');
  const isInsideKnowledgeBase = url.searchParams.get('isInsideKnowledgeBase') === 'true';
  
  // 先检查知识库是否受密码保护
  try {
    // 获取知识库信息
    const { data: setData, error: setError } = await supabaseAdmin
      .from('report_sets')
      .select('id, title, password_hash')
      .eq('id', setId)
      .single();
    
    if (setError) {
      console.error(`[Direct View] Error fetching set data for ${setId}:`, setError.message);
      return new NextResponse('Set not found or database error', { status: 404 });
    }
    
    const isPasswordProtected = !!setData.password_hash;
    let passwordIsValid = false;
    
    // 如果知识库受密码保护，需要验证密码
    if (isPasswordProtected) {
      const actualPasswordToVerify = token || providedPassword;
      
      if (actualPasswordToVerify) {
        const hashedPassword = crypto.createHash('sha256').update(actualPasswordToVerify.trim()).digest('hex');
        if (hashedPassword === setData.password_hash) {
          passwordIsValid = true;
        } else {
          // 密码不正确，显示密码输入表单并提示错误
          console.log(`[Direct View] Password mismatch for set ${setId}`);
          return new NextResponse(getPasswordPromptHTML(setId, fileIndex, '密码错误，请重试。', setData.title), { 
            status: 200, 
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      } else {
        // 未提供密码，显示密码输入表单
        console.log(`[Direct View] Password required for set ${setId}, but none provided`);
        return new NextResponse(getPasswordPromptHTML(setId, fileIndex, undefined, setData.title), { 
          status: 200, 
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }
    
    // 密码验证通过或不需要密码，继续获取文件
    const { data: files, error: filesError } = await supabaseAdmin
      .from('report_files')
      .select('original_filename, r2_object_key')
      .eq('report_set_id', setId)
      .order('order_in_set', { ascending: true });
    
    if (filesError || !files || files.length === 0) {
      console.error(`[Direct View] Error fetching files for set ${setId}:`, filesError?.message || 'No files found');
      return new NextResponse('Files not found', { status: 404 });
    }
    
    if (fileIndex < 0 || fileIndex >= files.length) {
      return new NextResponse(`File index out of range (0-${files.length-1})`, { status: 400 });
    }
    
    const file = files[fileIndex];
    console.log(`[Direct View] Accessing file: ${file.original_filename}, R2 key: ${file.r2_object_key}`);
    
    // 尝试从R2获取文件
    const getObjectCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: file.r2_object_key,
    });
    
    try {
      const { Body, ContentType } = await S3.send(getObjectCommand);
      
      if (!Body) {
        return new NextResponse('File content not found', { status: 404 });
      }
      
      const chunks = [];
      // @ts-ignore ReadableStream can be iterated over
      for await (const chunk of Body) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      let htmlContent = buffer.toString('utf-8');
      
      // 如果是在知识库内部并且有密码验证，注入脚本将密码传递给父窗口
      if (isInsideKnowledgeBase && isPasswordProtected && passwordIsValid && (token || providedPassword)) {
        const passwordToSend = token || providedPassword;
        // 在HTML内容的</body>前注入脚本
        const postMessageScript = `
        <script>
          // 发送密码给父窗口
          window.parent.postMessage({
            type: 'knowledgeBasePasswordValidated',
            token: '${passwordToSend?.trim()}',
            setId: '${setId}'
          }, '*');
        </script>
        `;
        
        // 注入脚本到HTML内容中
        htmlContent = htmlContent.replace('</body>', `${postMessageScript}</body>`);
      }
      
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': ContentType || 'text/html; charset=utf-8',
        },
      });
    } catch (r2Error: any) {
      console.error(`[Direct View] Error fetching from R2: ${r2Error.message}`);
      console.log(`[Direct View] Trying alternative approach with filename`);
      
      // 尝试使用原始文件名构建的路径
      const alternativeKey = `report_sets/${setId}/${file.original_filename}`;
      console.log(`[Direct View] Trying alternative key: ${alternativeKey}`);
      
      try {
        const getAltObjectCommand = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: alternativeKey,
        });
        
        const { Body, ContentType } = await S3.send(getAltObjectCommand);
        
        if (!Body) {
          return new NextResponse('File content not found with alternative key', { status: 404 });
        }
        
        const chunks = [];
        // @ts-ignore ReadableStream can be iterated over
        for await (const chunk of Body) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        let htmlContent = buffer.toString('utf-8');
        
        // 如果是在知识库内部并且有密码验证，注入脚本将密码传递给父窗口
        if (isInsideKnowledgeBase && isPasswordProtected && passwordIsValid && (token || providedPassword)) {
          const passwordToSend = token || providedPassword;
          // 在HTML内容的</body>前注入脚本
          const postMessageScript = `
          <script>
            // 发送密码给父窗口
            window.parent.postMessage({
              type: 'knowledgeBasePasswordValidated',
              token: '${passwordToSend?.trim()}',
              setId: '${setId}'
            }, '*');
          </script>
          `;
          
          // 注入脚本到HTML内容中
          htmlContent = htmlContent.replace('</body>', `${postMessageScript}</body>`);
        }
        
        return new NextResponse(htmlContent, {
          status: 200,
          headers: {
            'Content-Type': ContentType || 'text/html; charset=utf-8',
          },
        });
      } catch (altError: any) {
        console.error(`[Direct View] Alternative approach also failed: ${altError.message}`);
        return new NextResponse(`Failed to fetch file content. Original error: ${r2Error.message}, Alt error: ${altError.message}`, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error(`[Direct View] Unexpected error:`, error);
    return new NextResponse(`Unexpected error: ${error.message}`, { status: 500 });
  }
} 