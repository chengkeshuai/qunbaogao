import { S3Client } from '@aws-sdk/client-s3';

// 腾讯云 COS 配置 - 新加坡地域
export const cosClient = new S3Client({
  region: 'ap-singapore',
  endpoint: 'https://cos.ap-singapore.myqcloud.com',
  credentials: {
    accessKeyId: process.env.COS_SECRET_ID!,
    secretAccessKey: process.env.COS_SECRET_KEY!,
  },
  forcePathStyle: false,
});

export const BUCKET_NAME = 'qunbaogao-1302957102';
export const COS_REGION = 'ap-singapore';

// 构建文件访问URL
export function buildFileUrl(key: string): string {
  return `https://${BUCKET_NAME}.cos.${COS_REGION}.myqcloud.com/${key}`;
}

// 基础上传配置
export const uploadConfig = {
  bucket: BUCKET_NAME,
  region: COS_REGION,
  maxFileSize: 25 * 1024 * 1024, // 25MB limit for EdgeOne Pages
}; 