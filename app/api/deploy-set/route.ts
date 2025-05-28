import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import crypto from 'crypto';
// import striptags from 'striptags';
// import nodejieba from 'nodejieba';

// 定义一个简单的停用词列表 (可以根据需要扩展)
/*
const CHINESE_STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '你', '他', '她', '它', '们', '这', '那', '之', '与', '和', '或', '虽然', '但是', '然而', '因此', '所以', '因为', '由于', '并且', '而且', '以及', '不但', '不仅', '也', '还', '就', '都', '只', '被', '把', '给', '对', '向', '从', '到', '于', '至', '以', '则', '即', '若', '而', '故', '乎', '哉', '也哉', '矣', '兮', '般', '似的',
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with',
  ' ', '\n', '\t', '\r', '.', ',', '?', '!', ';', ':', '"', "'", '(', ')', '[', ']', '{', '}', '-', '_', '/', '\\', '|', '@', '#', '$', '%', '^', '&', '*', '~', '`', '<', '>', '=', '+', '·', '‘', '’', '“', '”', '，', '。', '；', '：', '？', '！', '（', '）', '【', '】', '——', '……', ' ',
  'nbsp', 'gt', 'lt', 'amp', 'quot', 'apos'
]);
*/

// 加载nodejieba默认词典 (如果需要自定义词典，请查阅nodejieba文档)
// nodejieba.load(); // 通常在模块加载时自动完成，但显式调用也可以

const s3Client = new S3Client({
  region: process.env.CLOUDFLARE_R2_REGION || 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

interface UploadedFileData {
  name: string;
  content: string; // Base64 encoded string
}

interface ReportSet {
  id: string;
  title: string;
  password_hash?: string | null;
  password_salt?: string | null;
  user_id?: string | null; 
  created_at: string;
  updated_at: string;
}

/**
 * Extracts keywords from HTML content.
 * 1. Strips HTML tags.
 * 2. Performs word segmentation using nodejieba.
 * 3. Filters out stop words and single characters.
 * 4. Counts word frequencies.
 * 5. Returns the top N keywords.
 */
/*
function extractKeywords(htmlContent: string): string[] {
  if (!htmlContent) {
    return [];
  }
  try {
    const plainText = striptags(htmlContent);
    if (!plainText.trim()) {
      return [];
    }

    // nodejieba.load({
    //   userDict: './user.utf8.dict', // 可选：用户自定义词典
    // });

    const topKeywordsCount = 10; // 提取前10个高频词
    // 使用jieba进行分词，tag参数为true表示返回词性，我们这里不需要，只取词
    // cut_for_search 表示搜索引擎模式，会切出更多可能的词
    const words: string[] = nodejieba.cut(plainText); // 使用 nodejieba.cut，并显式声明类型
    
    const wordFrequencies: { [key: string]: number } = {};
    words.forEach((word: string) => { // 显式声明 word 类型
      const w = word.toLowerCase(); // 转为小写以统一计数
      if (w.length > 1 && !CHINESE_STOP_WORDS.has(w) && !/^\d+$/.test(w)) { // 过滤单个字符、停用词和纯数字
        wordFrequencies[w] = (wordFrequencies[w] || 0) + 1;
      }
    });

    const sortedKeywords = Object.entries(wordFrequencies)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([word]) => word);

    return sortedKeywords.slice(0, topKeywordsCount);
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return [];
  }
}
*/

export async function POST(request: NextRequest) {
  console.log('--- Deploy Set Request Headers ---', JSON.stringify(Object.fromEntries(request.headers.entries())));
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const formData = await request.formData();
    const uploadedFilesData = JSON.parse(formData.get('filesData') as string) as UploadedFileData[];
    const title = formData.get('title') as string;
    const password = formData.get('password') as string | undefined;
    let reportSetId = formData.get('reportSetId') as string | undefined;
    const userId = formData.get('userId') as string | null; // Assuming userId might be passed

    let passwordHash: string | null = null;
    let passwordSalt: string | null = null;

    if (password) {
      passwordSalt = crypto.randomBytes(16).toString('hex');
      passwordHash = crypto.pbkdf2Sync(password, passwordSalt, 1000, 64, `sha512`).toString(`hex`);
    }

    if (reportSetId) {
      // Update existing report set
      const { data, error } = await supabaseAdmin
        .from('report_sets')
        .update({
          title,
          password_hash: passwordHash,
          password_salt: passwordSalt,
          // updated_at will be handled by Supabase or trigger
        })
        .eq('id', reportSetId)
        .select('id')
        .single();
      if (error) throw error;
      reportSetId = data.id;
    } else {
      // Create new report set
      const { data, error } = await supabaseAdmin
        .from('report_sets')
        .insert({
          title,
          password_hash: passwordHash,
          password_salt: passwordSalt,
          user_id: userId === 'null' || userId === '' ? null : userId, // Handle 'null' string or empty string
        })
        .select('id')
        .single();
      if (error) throw error;
      if (!data) throw new Error('Failed to create report set, no ID returned.');
      reportSetId = data.id;
    }

    if (!reportSetId) {
      throw new Error('Report Set ID is undefined after create/update operation.');
    }

    const r2Folder = `report-sets/${reportSetId}`;
    const uploadedFileR2Keys: string[] = [];

    const filesToUploadPromises = uploadedFilesData.map(async (uploadedFileData, i) => {
      const originalFile = formData.get(uploadedFileData.name) as File;
      if (!originalFile) {
        console.error(`Original file not found in FormData for ${uploadedFileData.name}`);
        return; 
      }

      const fileContentBuffer = Buffer.from(uploadedFileData.content, 'base64');
      const uniqueFileR2Key = `${r2Folder}/${Date.now()}-${uploadedFileData.name}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || '',
          Key: uniqueFileR2Key,
          Body: fileContentBuffer,
          ContentType: originalFile.type,
        })
      );

      const newFileRecord = {
        original_filename: uploadedFileData.name,
        mime_type: originalFile.type,
        size_bytes: originalFile.size,
        r2_object_key: uniqueFileR2Key,
        report_set_id: reportSetId,
        order_in_set: i,
        // keywords: [], // Keyword extraction removed
      };

      const { data: existingFileData } = await supabaseAdmin
        .from('report_files')
        .select('id')
        .eq('original_filename', uploadedFileData.name)
        .eq('report_set_id', reportSetId)
        .single();

      if (existingFileData) {
        const { error: updateError } = await supabaseAdmin
          .from('report_files')
          .update({
            mime_type: originalFile.type,
            size_bytes: originalFile.size,
            r2_object_key: uniqueFileR2Key,
            order_in_set: i,
            // keywords: [], // Keyword extraction removed
          })
          .eq('id', existingFileData.id);
        if (updateError) {
          console.error(`Error updating file record ${uploadedFileData.name} for set ${reportSetId}:`, updateError);
        }
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('report_files')
          .insert(newFileRecord);
        if (insertError) {
          console.error(`Error inserting file record ${uploadedFileData.name} for set ${reportSetId}:`, insertError);
        }
      }
      uploadedFileR2Keys.push(uniqueFileR2Key);
    });

    await Promise.all(filesToUploadPromises);

    return NextResponse.json({ 
      message: 'Report set deployed successfully', 
      reportSetId: reportSetId,
      r2keys: uploadedFileR2Keys 
    });

  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json({ message: 'Deployment failed', error: error.message, details: error.stack }, { status: 500 });
  }
} 