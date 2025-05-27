import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/app/lib/r2';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import crypto from 'crypto';

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
        // No specific metadata per file in set for now
      );

      if (!r2Url) {
        // TODO: Consider rollback or cleanup if one file fails? For MVP, proceed but log error.
        console.error(`Failed to upload file ${file.name} to R2 for set ${setId}`);
        // Optionally, skip adding this file to report_files or return an error for the whole set
        // For now, we'll let it proceed and the file just won't be in the set if R2 upload failed.
        // A more robust solution would delete the report_set or mark it as errored.
        continue; // Or throw, causing the set creation to fail
      }

      const { error: fileInsertError } = await supabaseAdmin
        .from('report_files')
        .insert({
          report_set_id: setId,
          original_filename: file.name,
          r2_object_key: uniqueFileR2Key,
          order_in_set: i,
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