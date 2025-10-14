import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { S3, R2_BUCKET_NAME } from '@/app/lib/r2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getUrlAnalytics } from '@/app/lib/analytics';

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all'; // 'all', 'sets', 'single'
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const result: any = {
      knowledge_bases: [],
      single_files: [],
      total_knowledge_bases: 0,
      total_single_files: 0
    };

    // 查询知识库（多文件）
    if (type === 'all' || type === 'sets') {
      const { data: sets, error: setsError, count } = await supabaseAdmin
        .from('report_sets')
        .select(`
          id, 
          title, 
          created_at, 
          password_hash,
          report_files!inner(id, original_filename, r2_object_key, order_in_set)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (setsError) {
        console.error('Error fetching knowledge bases:', setsError);
      } else {
        result.knowledge_bases = sets?.map(set => {
          const viewUrl = `/view-set/${set.id}`;
          const analytics = getUrlAnalytics(viewUrl, '30d');
          
          return {
            id: set.id,
            title: set.title,
            created_at: set.created_at,
            has_password: !!set.password_hash,
            file_count: set.report_files?.length || 0,
            files: set.report_files?.map((file: any) => ({
              filename: file.original_filename,
              r2_key: file.r2_object_key,
              order: file.order_in_set
            })) || [],
            view_url: viewUrl,
            analytics: {
              total_views: analytics.humanViews,
              unique_visitors: analytics.uniqueVisitors,
              recent_views: analytics.humanViews
            }
          };
        }) || [];
        result.total_knowledge_bases = count || 0;
      }
    }

    // 查询单文件上传
    if (type === 'all' || type === 'single') {
      try {
        const command = new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          Prefix: 'deployed-html/',
          MaxKeys: limit,
          StartAfter: offset > 0 ? `deployed-html/offset-${offset}` : undefined
        });

        const response = await S3.send(command);
        const files = response.Contents?.map(obj => {
          const viewUrl = `/api/view/${obj.Key}`;
          const analytics = getUrlAnalytics(viewUrl, '30d');
          
          return {
            filename: obj.Key?.replace('deployed-html/', ''),
            r2_key: obj.Key,
            created_at: obj.LastModified,
            size: obj.Size,
            view_url: viewUrl,
            analytics: {
              total_views: analytics.humanViews,
              unique_visitors: analytics.uniqueVisitors,
              recent_views: analytics.humanViews
            }
          };
        }) || [];

        result.single_files = files;
        result.total_single_files = response.KeyCount || 0;
      } catch (r2Error) {
        console.error('Error fetching single files from R2:', r2Error);
        result.single_files = [];
        result.total_single_files = 0;
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in /api/admin/generated-pages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
