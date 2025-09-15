import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/upload/sign
// body: { path: string, contentType: string }
export async function POST(req: Request) {
  try {
    const { path, contentType } = await req.json();
    if (!path || !contentType) {
      return NextResponse.json({ ok: false, error: 'path and contentType are required' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.json({ ok: false, error: 'Supabase env is missing' }, { status: 500 });
    }

    const supabase = createClient(url, key);

    // 创建签名上传URL，60秒过期
    const { data, error } = await supabase.storage
      .from('user-media')
      .createSignedUploadUrl(path, {
        upsert: true
      });

    if (error || !data) {
      return NextResponse.json({ ok: false, error: error?.message || 'signing failed' }, { status: 500 });
    }

    // 获取公共URL
    const { data: publicUrlData } = supabase.storage
      .from('user-media')
      .getPublicUrl(path);

    return NextResponse.json({
      ok: true,
      data: {
        signedUrl: data.signedUrl,
        path,
        publicUrl: publicUrlData.publicUrl
      }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown error' }, { status: 500 });
  }
}

