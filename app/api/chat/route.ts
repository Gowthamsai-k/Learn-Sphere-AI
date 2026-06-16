import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { supabase } from '@/config/supabase';
import { performVectorSearch } from '@/lib/db/search';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompt-matrix';
import { getLanguageModel } from '@/lib/ai/generator';

export async function POST(req: Request) {
    const { messages, documentId } = await req.json();
    if (!documentId) {
        return NextResponse.json({ error: 'Missing documentId for chat.' }, { status: 400 });
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: 'No chat messages provided.' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1].content;
    if (!lastUserMessage || typeof lastUserMessage !== 'string') {
        return NextResponse.json({ error: 'Invalid user message for chat.' }, { status: 400 });
    }

    // Fetch document title
    const { data: doc } = await supabase
        .from('documents')
        .select('title')
        .eq('id', documentId)
        .single();
    const docTitle = doc?.title || 'the document';

    // Check if the document has sparse/scanned content
    const { data: sampleSections } = await supabase
        .from('document_sections')
        .select('content')
        .eq('document_id', documentId)
        .limit(5);

    const totalTextLength = (sampleSections || []).reduce((acc: number, s: any) => acc + (typeof s.content === 'string' ? s.content.length : 0), 0);
    const isDocSparse = (sampleSections || []).length === 0 || totalTextLength < 500 || 
        (sampleSections || []).every((s: any) => {
            const textContent = typeof s.content === 'string' ? s.content : '';
            const hitCount = (textContent.match(/vidya sagar|grands key|aptitude/gi) || []).length;
            const wordCount = textContent.split(/\s+/).length;
            return wordCount > 0 && hitCount > (wordCount * 0.1);
        });

    console.log('[Chat] documentId:', documentId, 'title:', docTitle, 'isDocSparse:', isDocSparse);

    let systemPrompt = '';
    if (isDocSparse) {
        systemPrompt = `You are LearnSphere AI, a helpful tutor. The user is asking a question about the document "${docTitle}".
This document appears to be a scanned or image-based file with no extractable text.
Answer the user's question completely and accurately using your general knowledge about the topic of "${docTitle}".
At the very beginning or end of your response, add a short, polite note in italics: *(Note: This document appears to be scanned or image-based, so I am answering using general knowledge of the topic.)*`;
    } else {
        // Use our modular search helper
        const matchesRaw = await performVectorSearch(lastUserMessage, documentId, 0.2, 4);
        const matches = (matchesRaw || []).map((m: any) => {
            const content = m.content;
            let text = '';
            if (typeof content === 'string') text = content;
            else if (content && typeof content === 'object') text = content.text || content.content || JSON.stringify(content);
            else text = String(content || '');
            return { ...m, content: text };
        });

        const validContext = matches.filter((m: any) => m.content && m.content.trim().length > 0);
        const contextBlock = validContext.length > 0
            ? validContext.map((m: any, idx: number) => `[Source ${idx + 1}]: ${m.content}`).join('\n\n')
            : 'No relevant context found.';
        systemPrompt = SYSTEM_PROMPTS.chatWithCitations(contextBlock);
    }

    const result = await streamText({
        model: getLanguageModel(),
        system: systemPrompt,
        messages,
    });

    return result.toTextStreamResponse();
}