import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompt-matrix';
import { getLanguageModel } from '@/lib/ai/generator';
import { safeParseJSON } from '@/lib/utils/json';

export async function POST(req: Request) {
    try {
        const { topicSummary, daysUntilExam } = await req.json();

        const { text } = await generateText({
            model: getLanguageModel(),
            prompt: SYSTEM_PROMPTS.planner(topicSummary, daysUntilExam),
        });

        return NextResponse.json(safeParseJSON(text));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}