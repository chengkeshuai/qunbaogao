import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

// 创建S3客户端(Cloudflare R2兼容S3 API)
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * 将HTML内容上传到R2
 * @param htmlContent HTML内容
 * @returns 上传后的URL
 */
export async function uploadHtml(htmlContent: string): Promise<string> {
  const uniqueId = uuidv4();
  const fileName = `${uniqueId}.html`;
  
  // 创建上传任务
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: htmlContent,
      ContentType: 'text/html',
      ACL: 'public-read', // 设置为公开可读
    },
  });

  // 执行上传
  await upload.done();
  
  // 返回可访问的URL
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
} 