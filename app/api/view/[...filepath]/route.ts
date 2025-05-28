import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { R2_BUCKET_NAME, getObjectMetadata } from '@/app/lib/r2'; // R2_PUBLIC_URL no longer used directly here
import crypto from 'crypto';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Cloudflare R2 environment variables are not fully set for view route.");
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
// The form action now needs to construct the full path if it contains slashes
function getPasswordPromptHTML(filepathForFormAction: string, error?: string): string {
  const WECHAT_GREEN = '#2dc100';
  const WECHAT_GREEN_HOVER = '#249c00';
  const displayFilename = filepathForFormAction.split('/').pop() || filepathForFormAction;

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>请输入密码 - ${displayFilename}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
  <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
    <h1 class="text-2xl font-semibold mb-4 text-center text-gray-700">受保护的内容</h1>
    <p class="text-gray-600 mb-6 text-center">此内容需要密码才能访问。</p>
    {/* Form action is empty, will submit to the current URL by default */}
    <form method="GET" action="" class="space-y-4">
      <div>
        <label for="passwordInput" class="block text-sm font-medium text-gray-700">密码:</label>
        <div class="relative mt-1">
          <input type="text" name="password" id="passwordInput" required
                 class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[${WECHAT_GREEN}] focus:border-[${WECHAT_GREEN}] sm:text-sm pr-10">
          <button type="button" id="togglePasswordVisibility" 
                  class="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label="隐藏密码">
            <svg id="eyeIconClosed" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l3.291 3.291M3 3l18 18" /></svg>
            <svg id="eyeIconOpen" class="h-5 w-5 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </button>
        </div>
      </div>
      ${error ? `<p class="text-sm text-red-600">${error}</p>` : ''}
      <button type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[${WECHAT_GREEN}] hover:bg-[${WECHAT_GREEN_HOVER}] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${WECHAT_GREEN}]">
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
        eyeIconOpen.classList.toggle('hidden', !isText);
        eyeIconClosed.classList.toggle('hidden', isText);
      });
    }
  </script>
</body>
</html>
  `.trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filepath: string[] } } // Changed from filename: string to filepath: string[]
) {
  const filepathParts = params.filepath;
  if (!filepathParts || filepathParts.length === 0) {
    return new NextResponse('Filepath is required', { status: 400 });
  }
  // Join the parts to form the full R2 key, which might include slashes for nested paths
  const r2Key = filepathParts.join('/');

  // Ensure R2 environment variables are loaded
  if (!R2_BUCKET_NAME || !S3.config.credentials) {
    console.error('R2 configuration is missing in GET /api/view');
    return new NextResponse('Server configuration error', { status: 500 });
  }

  try {
    // The r2Key used for getObjectMetadata should NOT include the "deployed-html/" prefix
    // if your uploadToR2 and other functions already handle this prefix internally.
    // Let's assume getObjectMetadata expects the key *as it is in the bucket*.
    // And the files in report sets are stored under `report_sets/[setId]/...` directly.
    // Files from single deploy are under `deployed-html/[filename]`. 
    // The r2Key constructed from filepathParts will be the actual key in the bucket.
    const metadata = await getObjectMetadata(r2Key); 
    const passwordHash = metadata?.['password-hash'];

    if (passwordHash) {
      const url = new URL(request.url);
      const providedPassword = url.searchParams.get('password');
      
      // Construct the path for the form action correctly
      // This is the path part of the URL, e.g., /api/view/report_sets/set_id/file.html
      const formActionPath = `/api/view/${r2Key}`;

      if (!providedPassword) {
        return new NextResponse(getPasswordPromptHTML(r2Key, undefined), { 
          status: 200, 
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      const providedPasswordHash = crypto.createHash('sha256').update(providedPassword).digest('hex');
      if (providedPasswordHash !== passwordHash) {
        return new NextResponse(getPasswordPromptHTML(r2Key, '密码错误，请重试。'), { 
          status: 200, 
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key, // Use the full r2Key directly
    });

    const { Body, ContentType } = await S3.send(getObjectCommand);

    if (!Body) {
      return new NextResponse('File not found or empty', { status: 404 });
    }

    const chunks = [];
    // @ts-ignore ReadableStream can be iterated over
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
    console.error(`Error fetching ${r2Key} from R2:`, error);
    if (error.name === 'NoSuchKey') {
      return new NextResponse('File not found', { status: 404 });
    }
    return new NextResponse('Error fetching file', { status: 500 });
  }
} 