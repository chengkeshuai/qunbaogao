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
 * @param customFileName 可选的自定义文件名
 * @returns 上传后的URL
 */
export async function uploadHtml(htmlContent: string, customFileName?: string): Promise<string> {
  // 如果提供了自定义文件名则使用，否则生成随机文件名
  const fileName = customFileName || `${uuidv4()}.html`;
  
  // 创建上传任务
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: htmlContent,
      ContentType: 'text/html',
      ACL: 'public-read', // 设置为公开可读
      CacheControl: 'max-age=31536000', // 添加缓存控制，提高性能
    },
  });

  // 执行上传
  await upload.done();
  
  // 返回可访问的URL
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
}

/**
 * 将图片内容上传到R2
 * @param imageContent 图片内容（Buffer或Blob）
 * @param mimeType 图片MIME类型
 * @returns 上传后的URL
 */
export async function uploadImage(imageContent: Buffer | Blob, mimeType: string): Promise<string> {
  const uniqueId = uuidv4();
  const extension = mimeType.split('/')[1] || 'png';
  const fileName = `images/${uniqueId}.${extension}`;
  
  // 创建上传任务
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: imageContent,
      ContentType: mimeType,
      ACL: 'public-read',
      CacheControl: 'max-age=31536000',
    },
  });

  // 执行上传
  await upload.done();
  
  // 返回可访问的URL
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
} 