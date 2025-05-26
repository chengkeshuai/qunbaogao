import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { cosClient, BUCKET_NAME, buildFileUrl } from './cos-client';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * 上传单个文件到腾讯云 COS
 */
export async function uploadFileToCOS(
  file: File | Buffer,
  originalName: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  try {
    // 生成唯一的文件名
    const fileId = uuidv4();
    const fileExtension = originalName.split('.').pop();
    const key = `${folder}/${fileId}.${fileExtension}`;

    // 准备文件内容
    let body: Buffer;
    if (file instanceof File) {
      body = Buffer.from(await file.arrayBuffer());
    } else {
      body = file;
    }

    // 上传到 COS
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: getContentType(originalName),
      ACL: 'public-read',
    });

    await cosClient.send(command);

    return {
      success: true,
      url: buildFileUrl(key),
      key: key,
    };
  } catch (error) {
    console.error('COS 上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    };
  }
}

/**
 * 批量上传文件夹内容
 */
export async function uploadFolderToCOS(
  files: { name: string; content: Buffer }[],
  projectId: string
): Promise<{ success: boolean; urls: string[]; error?: string }> {
  try {
    const uploadPromises = files.map(async (file) => {
      const key = `projects/${projectId}/${file.name}`;
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.content,
        ContentType: getContentType(file.name),
        ACL: 'public-read',
      });

      await cosClient.send(command);
      return buildFileUrl(key);
    });

    const urls = await Promise.all(uploadPromises);

    return {
      success: true,
      urls: urls,
    };
  } catch (error) {
    console.error('批量上传失败:', error);
    return {
      success: false,
      urls: [],
      error: error instanceof Error ? error.message : '批量上传失败',
    };
  }
}

/**
 * 删除 COS 中的文件
 */
export async function deleteFileFromCOS(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await cosClient.send(command);
    return true;
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
}

/**
 * 根据文件名获取Content-Type
 */
function getContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: { [key: string]: string } = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
} 