import { NextResponse } from 'next/server';
import { getProgressMetrics, getOverallProgress } from '@/lib/db/tracking';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const documentId = searchParams.get('documentId');

        if (!userId) return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });

        if (documentId && documentId !== 'undefined' && documentId !== 'null' && documentId !== '') {
            const metrics = await getProgressMetrics(userId, documentId);
            return NextResponse.json({ metrics });
        } else {
            const metrics = await getOverallProgress(userId);
            return NextResponse.json({ overall: metrics });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}