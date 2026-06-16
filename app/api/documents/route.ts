import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const cookieHeader = req.headers.get('cookie') || '';
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;

        console.log('[Documents] cookie present:', Boolean(cookieHeader));
        console.log('[Documents] token extracted:', Boolean(token));

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = payload.userId;

        // Fetch distinct document IDs that this user has reading progress records for
        const { data: progressRecords, error: progressErr } = await supabase
            .from('user_reading_progress')
            .select('document_id')
            .eq('user_id', userId);

        if (progressErr) throw progressErr;

        const docIds = Array.from(new Set((progressRecords || []).map(r => r.document_id).filter(Boolean)));

        if (docIds.length === 0) {
            return NextResponse.json({ documents: [] });
        }

        // Fetch only those documents
        const { data: docs, error: docsErr } = await supabase
            .from('documents')
            .select('*')
            .in('id', docIds)
            .order('created_at', { ascending: false });

        if (docsErr) throw docsErr;

        return NextResponse.json({ documents: docs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

