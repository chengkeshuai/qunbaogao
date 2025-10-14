import { NextRequest, NextResponse } from 'next/server';
import { S3, R2_BUCKET_NAME } from '@/app/lib/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const r2Key = url.searchParams.get('r2Key');

  if (!r2Key) {
    return NextResponse.json({ error: 'R2 key is required' }, { status: 400 });
  }

  try {
    // 删除R2中的文件
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key
    });

    await S3.send(command);
    console.log(`Successfully deleted file from R2: ${r2Key}`);

    return NextResponse.json({ 
      message: 'File deleted successfully',
      deletedFile: r2Key
    });

  } catch (error: any) {
    console.error('Error deleting file from R2:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
