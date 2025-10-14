import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { S3, R2_BUCKET_NAME } from '@/app/lib/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { setId: string } }
) {
  const { setId } = params;

  if (!setId) {
    return NextResponse.json({ error: 'Set ID is required' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
  }

  try {
    // 1. 获取知识库的文件列表
    const { data: files, error: filesError } = await supabaseAdmin
      .from('report_files')
      .select('r2_object_key')
      .eq('report_set_id', setId);

    if (filesError) {
      console.error('Error fetching files for deletion:', filesError);
      return NextResponse.json({ error: 'Failed to fetch files for deletion' }, { status: 500 });
    }

    // 2. 删除R2中的文件
    if (files && files.length > 0) {
      const deletePromises = files.map(file => {
        const command = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: file.r2_object_key
        });
        return S3.send(command);
      });

      try {
        await Promise.all(deletePromises);
        console.log(`Successfully deleted ${files.length} files from R2`);
      } catch (r2Error) {
        console.error('Error deleting files from R2:', r2Error);
        // 继续删除数据库记录，即使R2删除失败
      }
    }

    // 3. 删除数据库中的文件记录
    const { error: deleteFilesError } = await supabaseAdmin
      .from('report_files')
      .delete()
      .eq('report_set_id', setId);

    if (deleteFilesError) {
      console.error('Error deleting files from database:', deleteFilesError);
      return NextResponse.json({ error: 'Failed to delete files from database' }, { status: 500 });
    }

    // 4. 删除知识库记录
    const { error: deleteSetError } = await supabaseAdmin
      .from('report_sets')
      .delete()
      .eq('id', setId);

    if (deleteSetError) {
      console.error('Error deleting knowledge base from database:', deleteSetError);
      return NextResponse.json({ error: 'Failed to delete knowledge base from database' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Knowledge base and all associated files deleted successfully',
      deletedFiles: files?.length || 0
    });

  } catch (error: any) {
    console.error('Unexpected error in delete knowledge base:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
