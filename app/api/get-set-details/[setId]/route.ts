import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import crypto from 'crypto';

// Assuming ReportFile type is defined elsewhere and matches this structure
// If not, define a local interface here:
interface ReportFile {
  id: string;
  original_filename: string;
  r2_object_key: string;
  created_at: string;
  sort_order: number | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { setId: string } }
) {
  const { setId } = params;
  const url = new URL(request.url);
  const token = url.searchParams.get('token'); // Token is expected to be the raw password for simplicity

  if (!setId) {
    return NextResponse.json({ message: 'Set ID is required' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error('Supabase admin client is not initialized in /api/get-set-details.');
    return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
  }

  try {
    const { data: setData, error: setError } = await supabaseAdmin
      .from('report_sets')
      .select('id, title, password_hash, created_at, user_id')
      .eq('id', setId)
      .single();

    if (setError || !setData) {
      console.error('Error fetching report set or set not found:', setError?.message || 'Set not found');
      return NextResponse.json({ message: 'Report set not found or database error' }, { status: 404 });
    }

    const isPasswordProtected = !!setData.password_hash;
    let passwordIsValid = false;

    if (isPasswordProtected) {
      if (token) {
        const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');
        if (hashedToken === setData.password_hash) {
          passwordIsValid = true;
        }
      }

      if (!passwordIsValid) {
        // Password is required and either not provided or incorrect.
        // Fetch files list to display in the sidebar even before password entry.
        const { data: filesData, error: filesError } = await supabaseAdmin
          .from('report_files')
          .select('id, original_filename, r2_object_key, created_at, sort_order')
          .eq('report_set_id', setId)
          .order('sort_order');
        
        let filesForPrompt: ReportFile[] = [];
        if (filesError) {
            console.error('Error fetching files for password-protected set (metadata for prompt):', filesError.message);
            // If files can't be fetched, send empty array but still provide title and prompt
        } else {
            filesForPrompt = filesData || [];
        }

        return NextResponse.json({
          id: setData.id,
          title: setData.title,
          password_required: true,
          password_prompt_message: '此知识库受密码保护，请输入密码以查看内容。',
          files: filesForPrompt, 
          created_at: setData.created_at,
          user_id: setData.user_id,
        }, { status: 200 }); // Return 200 so frontend can process this
      }
    }

    // If not password protected OR password is valid, proceed to fetch full details
    const { data: files, error: filesError } = await supabaseAdmin
      .from('report_files')
      .select('id, original_filename, r2_object_key, created_at, sort_order')
      .eq('report_set_id', setId)
      .order('sort_order');

    if (filesError) {
      console.error('Error fetching files for report set:', filesError.message);
      return NextResponse.json({ message: 'Error fetching files for report set' }, { status: 500 });
    }

    return NextResponse.json({
      id: setData.id,
      title: setData.title,
      // Do not send password_hash to the client if access is granted
      files: (files as ReportFile[]) || [],
      created_at: setData.created_at,
      user_id: setData.user_id,
      // No password_required field here means access is granted and password was valid or not needed
    });

  } catch (error: any) {
    console.error('Unexpected error in /api/get-set-details:', error.message || error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
} 