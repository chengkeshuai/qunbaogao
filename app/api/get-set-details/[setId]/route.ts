import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { setId: string } }
) {
  const setId = params.setId;
  if (!setId) {
    return NextResponse.json({ error: 'Set ID is required' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase admin client is not initialized.' },
      { status: 500 }
    );
  }

  try {
    // 1. Fetch report set details (including password hash)
    const { data: reportSet, error: reportSetError } = await supabaseAdmin
      .from('report_sets')
      .select('id, title, password_hash')
      .eq('id', setId)
      .single();

    if (reportSetError) {
      console.error(`Error fetching report set ${setId}:`, reportSetError);
      if (reportSetError.code === 'PGRST116') { // PostgREST error for " dokładnie jeden wiersz" (exactly one row) - not found
        return NextResponse.json({ error: '报告集未找到' }, { status: 404 });
      }
      return NextResponse.json({ error: '获取报告集信息失败' }, { status: 500 });
    }

    if (!reportSet) {
      return NextResponse.json({ error: '报告集未找到' }, { status: 404 });
    }

    // 2. Check password if required
    if (reportSet.password_hash) {
      const url = new URL(request.url);
      const providedPassword = url.searchParams.get('password');

      if (!providedPassword) {
        return NextResponse.json(
          { error: 'Password required', title: reportSet.title, id: reportSet.id }, // Send title for context on prompt page
          { status: 401 } // Unauthorized
        );
      }

      const providedPasswordHash = crypto
        .createHash('sha256')
        .update(providedPassword)
        .digest('hex');

      if (providedPasswordHash !== reportSet.password_hash) {
        return NextResponse.json(
          { error: 'Incorrect password', title: reportSet.title, id: reportSet.id }, // Send title for context
          { status: 403 } // Forbidden
        );
      }
    }

    // 3. Fetch files in the report set, ordered by order_in_set
    const { data: files, error: filesError } = await supabaseAdmin
      .from('report_files')
      .select('id, original_filename, r2_object_key, order_in_set')
      .eq('report_set_id', setId)
      .order('order_in_set', { ascending: true });

    if (filesError) {
      console.error(`Error fetching files for report set ${setId}:`, filesError);
      return NextResponse.json({ error: '获取报告集文件列表失败' }, { status: 500 });
    }

    return NextResponse.json({
      id: reportSet.id,
      title: reportSet.title,
      files: files || [],
      // Potentially, we could add a flag here if password was successfully validated,
      // but the fact that we proceed means it's either not set or validated.
    });

  } catch (error) {
    console.error(`Error in get-set-details for ${setId}:`, error);
    return NextResponse.json({ error: '获取报告集详情时发生内部错误' }, { status: 500 });
  }
} 