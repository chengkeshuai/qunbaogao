import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/app/lib/r2'; // 假设r2.ts导出了这些

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

  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `deployed-html/${filename}`, // 文件在R2中的完整路径
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