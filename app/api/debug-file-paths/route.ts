import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
  }

  const url = new URL(request.url);
  const setId = url.searchParams.get('setId');

  try {
    if (!setId) {
      // 如果没有提供setId，获取最近的5个知识库
      const { data: sets, error: setsError } = await supabaseAdmin
        .from('report_sets')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (setsError) {
        return NextResponse.json({ error: setsError.message }, { status: 500 });
      }
      
      return NextResponse.json({ sets });
    } else {
      // 如果提供了setId，获取该知识库的文件信息
      const { data: files, error: filesError } = await supabaseAdmin
        .from('report_files')
        .select('id, original_filename, r2_object_key, created_at, order_in_set')
        .eq('report_set_id', setId)
        .order('order_in_set');
      
      if (filesError) {
        return NextResponse.json({ error: filesError.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        setId,
        files,
        fileCount: files?.length || 0
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 