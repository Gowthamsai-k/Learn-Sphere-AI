import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { getSession } from '@/lib/sessions';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { documentId } = await req.json();
    const cookieHeader = req.headers.get('cookie') || '';
    const sid = cookieHeader.match(/sid=([^;]+)/)?.[1] || null;
    const token = cookieHeader.match(/token=([^;]+)/)?.[1] || null;

    let session = null;
    if (sid) session = await getSession(sid);
    let payload = null;
    if (token) payload = await verifyToken(token);

    const { data: sections, error } = await supabase
      .from('document_sections')
      .select('id,content')
      .eq('document_id', documentId)
      .limit(50);

    return NextResponse.json({ cookieHeader, sid, session, tokenPresent: Boolean(token), payload, sections, error });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
