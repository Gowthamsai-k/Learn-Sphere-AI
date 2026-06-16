import { NextResponse } from 'next/server';
import { performVectorSearch } from '@/lib/db/search';

export async function POST(req: Request) {
    try {
        const { question, documentId } = await req.json();
        if (!question || !documentId) {
            return NextResponse.json({ error: 'Missing question or documentId.' }, { status: 400 });
        }

        const matchesRaw = await performVectorSearch(question, documentId);
        const matches = (matchesRaw || []).map((m: any) => {
            const content = m.content;
            let text = '';
            if (typeof content === 'string') text = content;
            else if (content && typeof content === 'object') text = content.text || content.content || JSON.stringify(content);
            else text = String(content || '');
            return { ...m, content: text };
        });
        return NextResponse.json({ matches });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}