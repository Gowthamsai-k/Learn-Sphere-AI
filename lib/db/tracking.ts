import { supabase } from '@/config/supabase';

export interface ProgressMetrics {
    readingProgress: string;
    quizzesTaken: number;
    averageQuizGrade: string;
    readinessIndex: string;
}

export interface TopicProgress {
    name: string;
    progress: number;
}

export interface OverallProgress {
    totalStudyTime: string;
    masteryLevel: string;
    masteryLevelCode: string;
    masteryPercentage: number;
    quizzesTaken: number;
    averageQuizGrade: string;
    streak: number;
    xp: number;
    topics: TopicProgress[];
}

export async function getProgressMetrics(userId: string, documentId: string): Promise<ProgressMetrics> {
    const { count: total } = await supabase
        .from('document_sections')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', documentId);

    const { count: completed } = await supabase
        .from('user_reading_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('document_id', documentId)
        .eq('is_completed', true);

    const readingCompletion = total && total > 0 ? ((completed || 0) / total) * 100 : 0;

    const { data: scores } = await supabase
        .from('quiz_attempts')
        .select('score_percentage')
        .eq('user_id', userId)
        .eq('document_id', documentId);

    const totalQuizzes = scores?.length || 0;
    const averageScore = totalQuizzes > 0 && scores
        ? scores.reduce((acc, q) => acc + q.score_percentage, 0) / totalQuizzes
        : 0;

    const totalReadinessIndex = (readingCompletion * 0.4) + (averageScore * 0.6);

    const metrics: ProgressMetrics = {
        readingProgress: `${Math.round(readingCompletion)}%`,
        quizzesTaken: totalQuizzes,
        averageQuizGrade: `${Math.round(averageScore)}%`,
        readinessIndex: `${Math.round(totalReadinessIndex)}%`
    };

    return metrics;
}

export async function getOverallProgress(userId: string): Promise<OverallProgress> {
    // 1. Fetch documents associated with this user
    const { data: progressRecords, error: progressErr } = await supabase
        .from('user_reading_progress')
        .select('document_id')
        .eq('user_id', userId);

    if (progressErr) {
        console.error('Failed to fetch user progress records:', progressErr.message);
    }

    const docIds = Array.from(new Set((progressRecords || []).map(r => r.document_id).filter(Boolean)));

    if (docIds.length === 0) {
        return {
            totalStudyTime: "0.0 hrs",
            masteryLevel: "Novice",
            masteryLevelCode: "Level 5",
            masteryPercentage: 0,
            quizzesTaken: 0,
            averageQuizGrade: "0%",
            streak: 0,
            xp: 0,
            topics: []
        };
    }

    const { data: docs } = await supabase
        .from('documents')
        .select('id, title')
        .in('id', docIds);


    let totalCompletedSections = 0;
    let totalQuizzesTaken = 0;
    let totalQuizScoresSum = 0;
    let totalReadinessSum = 0;
    const topics: TopicProgress[] = [];

    if (docs && docs.length > 0) {
        for (const doc of docs) {
            // Get total sections for this doc
            const { count: totalSec } = await supabase
                .from('document_sections')
                .select('*', { count: 'exact', head: true })
                .eq('document_id', doc.id);

            // Get completed sections for this doc
            const { count: compSec } = await supabase
                .from('user_reading_progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('document_id', doc.id)
                .eq('is_completed', true);

            const readPct = totalSec && totalSec > 0 ? ((compSec || 0) / totalSec) * 100 : 0;
            totalCompletedSections += (compSec || 0);

            // Get quiz attempts for this doc
            const { data: attempts } = await supabase
                .from('quiz_attempts')
                .select('score_percentage')
                .eq('user_id', userId)
                .eq('document_id', doc.id);

            const docQuizzes = attempts?.length || 0;
            totalQuizzesTaken += docQuizzes;

            const docQuizSum = attempts ? attempts.reduce((sum, att) => sum + att.score_percentage, 0) : 0;
            totalQuizScoresSum += docQuizSum;

            const docAvgQuiz = docQuizzes > 0 ? docQuizSum / docQuizzes : 0;
            const readiness = (readPct * 0.4) + (docAvgQuiz * 0.6);
            totalReadinessSum += readiness;

            topics.push({
                name: doc.title,
                progress: Math.round(readiness)
            });
        }
    }

    const docCount = docs?.length || 1;
    const overallReadiness = totalReadinessSum / docCount;
    const overallQuizAvg = totalQuizzesTaken > 0 ? totalQuizScoresSum / totalQuizzesTaken : 0;

    // Estimate total study time (5 mins per reading section completed, 10 mins per quiz)
    const studyHours = ((totalCompletedSections * 5) + (totalQuizzesTaken * 10)) / 60;
    const totalStudyTime = `${studyHours.toFixed(1)} hrs`;

    // Determine mastery level
    let masteryLevel = "Novice";
    let masteryLevelCode = "Level 5";
    if (overallReadiness >= 90) {
        masteryLevel = "Expert";
        masteryLevelCode = "Level 20";
    } else if (overallReadiness >= 75) {
        masteryLevel = "Advanced";
        masteryLevelCode = "Level 15";
    } else if (overallReadiness >= 50) {
        masteryLevel = "Intermediate";
        masteryLevelCode = "Level 10";
    }

    // Fetch additional metrics from user_progress table
    const { data: userProg } = await supabase
        .from('user_progress')
        .select('correct_streak, total_questions_solved')
        .eq('user_id', userId)
        .maybeSingle();

    const correctStreak = userProg?.correct_streak || 0;
    const totalQuestionsSolved = userProg?.total_questions_solved || 0;

    const metrics: OverallProgress = {
        totalStudyTime,
        masteryLevel,
        masteryLevelCode,
        masteryPercentage: Math.round(overallReadiness),
        quizzesTaken: totalQuizzesTaken,
        averageQuizGrade: `${Math.round(overallQuizAvg)}%`,
        streak: correctStreak,
        xp: totalQuestionsSolved * 15,
        topics
    };

    return metrics;
}

export async function invalidateProgressCache(userId: string, documentId: string): Promise<void> {
    // No-op (caches removed)
}
