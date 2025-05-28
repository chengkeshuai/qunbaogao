import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/app/lib/r2';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import crypto from 'crypto';
import striptags from 'striptags';
import nodejieba from 'nodejieba';

// 定义一个简单的停用词列表 (可以根据需要扩展)
const CHINESE_STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '你', '他', '她', '它', '们', '这', '那', '之', '与', '和', '或', '虽然', '但是', '然而', '因此', '所以', '因为', '由于', '并且', '而且', '以及', '不但', '不仅', '也', '还', '就', '都', '只', '被', '把', '给', '对', '向', '从', '到', '于', '至', '以', '则', '即', '若', '而', '故', '乎', '哉', '也哉', '矣', '兮', '般', '似的',
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with',
  ' ', '\n', '\t', '\r', '.', ',', '?', '!', ';', ':', '"', "'", '(', ')', '[', ']', '{', '}', '-', '_', '/', '\\', '|', '@', '#', '$', '%', '^', '&', '*', '~', '`', '<', '>', '=', '+', '·', '‘', '’', '“', '”', '，', '。', '？', '！', '；', '：', '（', '）', '【', '】', '——', '……', '《', '》', '〈', '〉'
]);

// 加载nodejieba默认词典 (如果需要自定义词典，请查阅nodejieba文档)
// nodejieba.load(); // 通常在模块加载时自动完成，但显式调用也可以

interface UploadedFile {
  name: string;
  content: string;
}

interface RequestBody {
  files: UploadedFile[];
  title?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not initialized. Check server logs.' },
        { status: 500 }
      );
    }

    const body: RequestBody = await request.json();
    const { files, title, password } = body;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '至少需要上传一个HTML文件来创建报告集' },
        { status: 400 }
      );
    }

    // 1. Create Report Set in Supabase
    let reportSetPasswordHash: string | null = null;
    if (password && password.trim().length > 0) {
      reportSetPasswordHash = crypto.createHash('sha256').update(password.trim()).digest('hex');
    }

    const { data: reportSetData, error: reportSetError } = await supabaseAdmin
      .from('report_sets')
      .insert({
        title: title?.trim() || null,
        password_hash: reportSetPasswordHash,
        // user_id: null, // For future user integration
      })
      .select('id, title')
      .single();

    if (reportSetError || !reportSetData) {
      console.error('Error creating report set:', reportSetError);
      return NextResponse.json(
        { error: '创建报告集失败: ' + (reportSetError?.message || '未知错误') },
        { status: 500 }
      );
    }

    const setId = reportSetData.id;
    const finalSetTitle = reportSetData.title;

    // 2. Process and upload each file
    const uploadedFileRecords = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let htmlContent = file.content.trim();

      // Normalize HTML if not a full document
      if (!htmlContent.includes('<html') || !htmlContent.includes('</html>')) {
        htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${file.name || 'HTML预览页面'}</title>
</head>
<body>
  ${htmlContent}
</body>
</html>
        `.trim();
      }

      const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
      // Sanitize original filename for use in R2 key, replacing non-alphanumeric chars
      const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const uniqueFileR2Key = `report_sets/${setId}/${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${sanitizedOriginalName}`;

      const r2Url = await uploadToR2(
        uniqueFileR2Key,
        htmlBuffer,
        'text/html'
      );

      if (!r2Url) {
        console.error(`Failed to upload file ${file.name} to R2 for set ${setId}`);
        continue;
      }

      // --- 新增：提取关键词 ---
      let keywords: string[] = [];
      try {
        const plainText = striptags(htmlContent, [], ' ').replace(/\s+/g, ' ').trim(); // 移除HTML标签，并将多个空格替换为单个空格
        if (plainText.length > 0) {
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

          keywords = Object.entries(wordFrequencies)
            .sort(([, a], [, b]) => b - a) // 按频率降序排序
            .slice(0, topKeywordsCount)    // 取前N个
            .map(([word]) => word);         // 只取词本身
        }
      } catch (kwError) {
        console.error(`Error extracting keywords for file ${file.name}:`, kwError);
        // 关键词提取失败不应阻止文件记录的创建，keywords将为空数组
      }
      // --- 关键词提取结束 ---

      const { error: fileInsertError } = await supabaseAdmin
        .from('report_files')
        .insert({
          report_set_id: setId,
          original_filename: file.name,
          r2_object_key: uniqueFileR2Key,
          order_in_set: i,
          keywords: keywords, // 存储关键词
        });

      if (fileInsertError) {
        console.error(`Error inserting file record ${file.name} for set ${setId}:`, fileInsertError);
        // TODO: Similar rollback consideration
        continue;
      }
      uploadedFileRecords.push({ name: file.name, r2_object_key: uniqueFileR2Key });
    }
    
    if (uploadedFileRecords.length === 0 && files.length > 0) {
        // This means all file uploads or DB inserts failed. Potentially delete the report_set entry.
        console.error(`No files were successfully processed for set ${setId}. Deleting the set.`);
        await supabaseAdmin.from('report_sets').delete().match({ id: setId });
        return NextResponse.json(
            { error: '报告集中的所有文件均未能成功处理，报告集未创建。' },
            { status: 500 }
        );
    }


    // 3. Return success response
    const viewSetUrl = `/view-set/${setId}`;
    return NextResponse.json({
      url: viewSetUrl,
      setId: setId,
      title: finalSetTitle,
      files: uploadedFileRecords.map(f => ({ name: f.name })),
      hasPassword: !!reportSetPasswordHash,
      message: `报告集创建成功，包含 ${uploadedFileRecords.length} 个文件。`
    });

  } catch (error) {
    console.error('创建报告集失败:', error);
    let errorMessage = '创建报告集过程中发生未知错误';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 