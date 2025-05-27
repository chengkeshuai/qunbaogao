import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { R2_BUCKET_NAME, R2_PUBLIC_URL, getObjectMetadata } from '@/app/lib/r2'; // 假设r2.ts导出了这些
import crypto from 'crypto'; // Import crypto for hashing

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Cloudflare R2 environment variables are not fully set for view route.");
  // 不在此处抛出错误，以便在构建时通过，但在运行时会失败
}

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

// Helper function to generate password prompt HTML
function getPasswordPromptHTML(filename: string, error?: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>请输入密码</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
  <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
    <h1 class="text-2xl font-semibold mb-4 text-center text-gray-700">受保护的内容</h1>
    <p class="text-gray-600 mb-6 text-center">此内容需要密码才能访问。</p>
    <form method="GET" action="/api/view/${filename}" class="space-y-4">
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">密码:</label>
        <div class="relative mt-1">
          <input type="password" name="password" id="passwordInput" required 
                 class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10">
          <button type="button" id="togglePasswordVisibility" 
                  class="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
                  aria-label="显示密码">
            <svg id="eyeIconOpen" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <svg id="eyeIconClosed" class="h-5 w-5 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l3.291 3.291M3 3l18 18" /></svg>
          </button>
        </div>
      </div>
      ${error ? `<p class="text-sm text-red-600">${error}</p>` : ''}
      <button type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
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
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.setAttribute('aria-label', type === 'password' ? '显示密码' : '隐藏密码');
        eyeIconOpen.classList.toggle('hidden');
        eyeIconClosed.classList.toggle('hidden');
      });
    }
  </script>
</body>
</html>
  `.trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;

  if (!filename) {
    return new NextResponse('Filename is required', { status: 400 });
  }

  // 确保环境变量已加载
  if (!R2_BUCKET_NAME || !S3.config.credentials) {
    console.error('R2 configuration is missing in GET /api/view');
    return new NextResponse('Server configuration error', { status: 500 });
  }

  const r2Key = `deployed-html/${filename}`;

  try {
    const metadata = await getObjectMetadata(r2Key);
    const passwordHash = metadata?.['password-hash'];

    if (passwordHash) {
      const url = new URL(request.url);
      const providedPassword = url.searchParams.get('password');

      if (!providedPassword) {
        return new NextResponse(getPasswordPromptHTML(filename), { 
          status: 200, // Serve the prompt page with 200 to allow form submission GET
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      const providedPasswordHash = crypto.createHash('sha256').update(providedPassword).digest('hex');
      if (providedPasswordHash !== passwordHash) {
        return new NextResponse(getPasswordPromptHTML(filename, '密码错误，请重试。'), { 
          status: 200, // Serve the prompt page with error, status 200
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
      // If password matches, proceed to fetch and return the object content
    }

    // Fetch and return object if no password or if password matched
    const getObjectCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
    });

    const { Body, ContentType } = await S3.send(getObjectCommand);

    if (!Body) {
      return new NextResponse('File not found or empty', { status: 404 });
    }

    // 将 ReadableStream 转换为 Buffer/string
    // @ts-ignore
    const chunks = [];
    // @ts-ignore
    for await (const chunk of Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const htmlContent = buffer.toString('utf-8');

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': ContentType || 'text/html; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error(`Error fetching ${filename} from R2:`, error);
    if (error.name === 'NoSuchKey') {
      return new NextResponse('File not found', { status: 404 });
    }
    return new NextResponse('Error fetching file', { status: 500 });
  }
} 