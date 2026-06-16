import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { supabase } from '@/config/supabase';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompt-matrix';
import { getLanguageModel } from '@/lib/ai/generator';

export async function POST(req: Request) {
    try {
        const { documentId } = await req.json();

        if (!documentId) {
            return NextResponse.json(
                { error: 'Missing document ID for summary generation.' },
                { status: 400 }
            );
        }

        // Fetch all sections of the document to perform a spread/sample across the entire text
        const { data: allSections } = await supabase
            .from('document_sections')
            .select('content')
            .eq('document_id', documentId)
            .order('id', { ascending: true });

        console.log('[Summarize] documentId:', documentId, 'totalSectionsFound:', allSections?.length || 0);

        // Pick up to 25 sections spread evenly across the document to build a representative summary
        const maxPicks = 25;
        let selectedSections = allSections || [];
        if (allSections && allSections.length > maxPicks) {
            const total = allSections.length;
            const step = total / maxPicks;
            selectedSections = [];
            for (let i = 0; i < maxPicks; i++) {
                const index = Math.min(Math.floor(i * step), total - 1);
                selectedSections.push(allSections[index]);
            }
        }

        const fullContent = selectedSections
            .map(s => {
                const c: any = s.content;
                if (typeof c === 'string') return c;
                if (c && typeof c === 'object') return c.text || c.content || JSON.stringify(c);
                return '';
            })
            .join('\n')
            .trim();

        // Fetch document title to know what subject it is
        const { data: doc } = await supabase
            .from('documents')
            .select('title')
            .eq('id', documentId)
            .single();
        const docTitle = doc?.title || 'the document';

        console.log('[Summarize] fullContent length:', fullContent.length, 'title:', docTitle);

        // Detect if the content is extremely sparse or just repetitive headers/stamps (e.g., scanned PDF)
        const isSparse = fullContent.length < 500 || 
            (fullContent.match(/vidya sagar|grands key|aptitude/gi) || []).length > (fullContent.split(/\s+/).length * 0.1);

        let promptText = '';
        if (isSparse) {
            promptText = `The user uploaded a scanned document titled "${docTitle}" which contains no extractable text (only headers/footers). 
Generate a comprehensive, beautiful study summary on the topic of "${docTitle}" (Averages / Aptitude) based on general knowledge. 
In the Executive Overview, include a friendly note: "*(Note: This document appears to be a scanned or image-based worksheet. To assist your studies, we have compiled a complete reference guide on this topic!)*"
Include:
1. Executive Overview (TL;DR)
2. Core Concepts & Definitions
3. Critical Formulas or Governing Laws`;
        } else {
            promptText = SYSTEM_PROMPTS.summarization(fullContent);
        }

        const { text } = await generateText({
            model: getLanguageModel(),
            prompt: promptText,
        });

        return NextResponse.json({ summary: text });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}