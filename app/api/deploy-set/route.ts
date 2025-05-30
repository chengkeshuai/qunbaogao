import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import crypto from 'crypto';
import { uploadToR2 } from '@/app/lib/r2';
import { R2_BUCKET_NAME } from '@/app/lib/r2';
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

// Ensure R2 environment variables are loaded
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Cloudflare R2 environment variables are not fully set for deploy-set route.");
  // Potentially throw an error or return a specific response if config is incomplete
}

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

interface UploadedFile {
  name: string;
  content: string;
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
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get('title') as string || 'Untitled Report Set';
    const password = formData.get('password') as string | null;
    const filesInfoString = formData.get('filesInfo') as string;

    if (!filesInfoString) {
      return NextResponse.json({ error: 'Files information is missing' }, { status: 400 });
    }
    const filesInfo: Array<{ name: string; content: string }> = JSON.parse(filesInfoString);

    if (!filesInfo || filesInfo.length === 0) {
      return NextResponse.json({ error: 'No files provided for the report set' }, { status: 400 });
    }

    let passwordHash: string | null = null;
    if (password && password.trim().length > 0) {
      passwordHash = crypto.createHash('sha256').update(password.trim()).digest('hex');
    }

    const { data: reportSetData, error: reportSetError } = await supabaseAdmin
      .from('report_sets')
      .insert([{ title, password_hash: passwordHash }])
      .select('id')
      .single();

    if (reportSetError || !reportSetData) {
      console.error('Error creating report set:', reportSetError);
      return NextResponse.json({ error: 'Failed to create report set' }, { status: 500 });
    }
    const reportSetId = reportSetData.id;

    const filesToInsert = filesInfo.map((file, index) => ({
      report_set_id: reportSetId,
      original_filename: file.name,
      r2_object_key: `report_sets/${reportSetId}/${encodeURIComponent(file.name)}`,
      order_in_set: index, // Use existing order_in_set column
    }));

    const { error: insertFilesError } = await supabaseAdmin
      .from('report_files')
      .insert(filesToInsert);

    if (insertFilesError) {
      console.error('Error inserting files metadata to Supabase:', insertFilesError);
      // Attempt to clean up the created report_set entry if files fail to insert
      await supabaseAdmin.from('report_sets').delete().eq('id', reportSetId);
      return NextResponse.json({ error: 'Failed to save files metadata' }, { status: 500 });
    }

    // Upload files to R2
    for (const file of filesInfo) {
      const r2Key = `report_sets/${reportSetId}/${encodeURIComponent(file.name)}`;
      try {
        await S3.send(new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: r2Key,
          Body: file.content,
          ContentType: 'text/html; charset=utf-8',
          Metadata: passwordHash ? { 'password-hash': passwordHash } : undefined,
        }));
      } catch (r2Error) {
        console.error(`Error uploading ${file.name} to R2:`, r2Error);
        // Rollback: delete already uploaded files for this set and Supabase entries
        // This part can be complex and might need a more robust transaction-like mechanism
        // For now, just log and return an error
        return NextResponse.json({ error: `Failed to upload ${file.name} to R2` }, { status: 500 });
      }
    }

    const appViewUrl = `/view-set/${reportSetId}`;
    return NextResponse.json({
      message: 'Report set created and files uploaded successfully!',
      url: appViewUrl,
      isPublic: !passwordHash,
      hasPassword: !!passwordHash,
      isSet: true,
      files: filesInfo.map(f => ({ name: f.name })),
      title: title,
    });

  } catch (error: any) {
    console.error('Error in /api/deploy-set POST handler:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 