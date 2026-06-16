import { InferenceClient } from '@huggingface/inference';
import { supabase } from '@/config/supabase';

const hf = new InferenceClient(process.env.HF_TOKEN);

/**
 * Generates a query embedding using the SAME model used during ingestion
 * (BAAI/bge-base-en-v1.5 → 768 dims). Using a different model (e.g. Gemini)
 * produces incompatible vector spaces and returns meaningless similarity scores.
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
    const embedding = await hf.featureExtraction({
        model: 'BAAI/bge-base-en-v1.5',
        inputs: text,
    });
    return embedding as number[];
}

export async function performVectorSearch(
    question: string,
    documentId: string,
    matchThreshold = 0.3,
    matchCount = 5
) {
    const embedding = await generateQueryEmbedding(question);

    const { data: matches, error } = await supabase.rpc('match_document_sections', {
        query_embedding: embedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_document_id: documentId,
    });

    if (error) throw error;
    return matches;
}
