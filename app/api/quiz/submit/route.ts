import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { invalidateProgressCache } from '@/lib/db/tracking';

export async function POST(req: Request) {
    try {
        const { userId, documentId, score, totalQuestions, correctStreak } = await req.json();

        if (!userId || !documentId || score === undefined || !totalQuestions) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const scorePercentage = (score / totalQuestions) * 100;

        // 1. Record the quiz attempt
        const { error: attemptErr } = await supabase
            .from('quiz_attempts')
            .insert({
                user_id: userId,
                document_id: documentId,
                score_percentage: scorePercentage,
            });

        if (attemptErr) throw attemptErr;

        // 2. Update the user's adaptive difficulty profile (user_progress)
        const { data: existing } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('subject_id', documentId)
            .maybeSingle();

        // Determine new difficulty level based on performance
        let newLevel = 'Medium';
        const totalSolved = (existing?.total_questions_solved || 0) + totalQuestions;
        const newStreak = correctStreak || 0;

        if (scorePercentage >= 90 && newStreak >= 3) {
            newLevel = 'Hard';
        } else if (scorePercentage >= 70) {
            newLevel = 'Medium';
        } else {
            newLevel = 'Easy';
        }

        if (existing) {
            const { error: updateErr } = await supabase
                .from('user_progress')
                .update({
                    current_level: newLevel,
                    correct_streak: newStreak,
                    total_questions_solved: totalSolved,
                })
                .eq('id', existing.id);

            if (updateErr) throw updateErr;
        } else {
            const { error: insertErr } = await supabase
                .from('user_progress')
                .insert({
                    user_id: userId,
                    subject_id: documentId,
                    current_level: newLevel,
                    correct_streak: newStreak,
                    total_questions_solved: totalSolved,
                });

            if (insertErr) throw insertErr;
        }

        // 3. Mark some sections of this document as completed for the user
        // Fetch all sections for this document
        const { data: allSections } = await supabase
            .from('document_sections')
            .select('id')
            .eq('document_id', documentId);

        if (allSections && allSections.length > 0) {
            const { data: completedProgress } = await supabase
                .from('user_reading_progress')
                .select('section_id')
                .eq('user_id', userId)
                .eq('document_id', documentId)
                .eq('is_completed', true);

            const completedSectionIds = new Set((completedProgress || []).map(r => r.section_id));
            const uncompletedSections = allSections.filter(s => !completedSectionIds.has(s.id));

            // Mark up to 1 section as completed per quiz attempt
            const sectionsToComplete = uncompletedSections.slice(0, 1);
            if (sectionsToComplete.length > 0) {
                const inserts = sectionsToComplete.map(s => ({
                    user_id: userId,
                    document_id: documentId,
                    section_id: s.id,
                    is_completed: true
                }));
                const { error: readProgErr } = await supabase
                    .from('user_reading_progress')
                    .insert(inserts);

                if (readProgErr) {
                    console.error('Failed to update reading progress:', readProgErr.message);
                }
            }
        }

        // 4. Invalidate progress caches so dashboard reflects updated data
        await invalidateProgressCache(userId, documentId);

        return NextResponse.json({
            success: true,
            scorePercentage: Math.round(scorePercentage),
            newLevel,
            totalSolved,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
