import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { supabase } from '@/config/supabase';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompt-matrix';
import { getLanguageModel } from '@/lib/ai/generator';
import { safeParseJSON } from '@/lib/utils/json';
import { performVectorSearch } from '@/lib/db/search';

export async function POST(req: Request) {
    try {
        const { documentId, userId } = await req.json();

        // Fetch adaptive user profile state
        const { data: profile } = await supabase
            .from('user_progress')
            .select('current_level')
            .eq('user_id', userId)
            .single();

        const difficulty = profile?.current_level || 'Medium';

        // Fetch document title so the LLM knows what subject it's quizzing on
        const { data: doc } = await supabase
            .from('documents')
            .select('title')
            .eq('id', documentId)
            .single();

        const docTitle = doc?.title || 'the document';

        // Semantic retrieval: use a broad "key concepts" probe to pull the most
        // topically rich sections from the document, rather than blindly taking
        // the first N chunks (which are usually intro/table-of-contents text).
        const semanticMatches = await performVectorSearch(
            `key concepts, main ideas, important definitions and principles in ${docTitle}`,
            documentId,
            0.2,  // low threshold to cast a wider net across the document
            8     // fetch 8 sections for richer context
        );

        let context = semanticMatches?.map((s: any) => s.content).join('\n\n---\n\n') || '';

        // Fallback: if vector search returned nothing (e.g. embeddings not stored yet),
        // sample sections spread evenly across the whole document instead of LIMIT 3.
        if (!context.trim()) {
            console.warn('[Quiz] Vector search returned no results, falling back to sampled sections');
            const { data: allSections } = await supabase
                .from('document_sections')
                .select('content')
                .eq('document_id', documentId)
                .order('id', { ascending: true });

            if (allSections && allSections.length > 0) {
                // Pick up to 6 sections spread evenly across the document
                const total = allSections.length;
                const picks = Math.min(6, total);
                const step = Math.max(1, Math.floor(total / picks));
                const sampled = Array.from({ length: picks }, (_, i) => allSections[i * step]).filter(Boolean);
                context = sampled.map(s => s.content).join('\n\n---\n\n');
            }
        }

        const { text } = await generateText({
            model: getLanguageModel(),
            prompt: SYSTEM_PROMPTS.quizGeneration(difficulty, docTitle, context),
        });

        return NextResponse.json(safeParseJSON(text));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}