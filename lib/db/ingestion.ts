import { InferenceClient } from '@huggingface/inference';
import { supabase } from '@/config/supabase';

const hf = new InferenceClient(process.env.HF_TOKEN);

export function chunkText(
    text: string,
    chunkSize = 800,
    overlap = 100
): string[] {
    const chunks: string[] = [];
    const step = chunkSize - overlap;

    // Guard: step must be at least 1 to avoid infinite loop
    if (step <= 0) throw new Error('chunkSize must be greater than overlap');

    let i = 0;
    while (i < text.length) {
        chunks.push(text.substring(i, Math.min(i + chunkSize, text.length)));
        i += step;
    }

    return chunks;
}

async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    // BAAI/bge-base-en-v1.5 → 768 dims, matching the vector(768) column in Supabase.
    const embeddings = await hf.featureExtraction({
        model: 'BAAI/bge-base-en-v1.5',
        inputs: texts,
    });

    return embeddings as number[][];
}

export async function ingestDocument(
    title: string,
    text: string,
    userId?: string
): Promise<string> {
    const { data: doc, error: docErr } = await supabase
        .from('documents')
        .insert({ title })
        .select()
        .single();

    if (docErr) throw docErr;

    const chunks = chunkText(text);
    console.log(`[Ingest] "${title}" → ${chunks.length} chunks to embed`);

    const recordsToInsert: { document_id: string; content: string; embedding: number[] }[] = [];
    const BATCH_SIZE = 32;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchChunks = chunks.slice(i, i + BATCH_SIZE);
        console.log(`[Ingest] Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (size ${batchChunks.length})...`);
        const embeddings = await generateEmbeddingsBatch(batchChunks);
        for (let idx = 0; idx < batchChunks.length; idx++) {
            recordsToInsert.push({
                document_id: doc.id,
                content: batchChunks[idx],
                embedding: embeddings[idx],
            });
        }
    }

    const { data: insertedSections, error: insertErr } = await supabase
        .from('document_sections')
        .insert(recordsToInsert)
        .select('id');

    if (insertErr) throw insertErr;

    if (userId && insertedSections?.length) {
        await supabase
            .from('user_reading_progress')
            .insert({
                user_id: userId,
                document_id: doc.id,
                section_id: insertedSections[0].id,
                is_completed: false,
            });
        console.log(`[Ingest DB] Created user_reading_progress for user ${userId}, document ${doc.id}, section ${insertedSections[0].id}`);
    }

    console.log(`[Ingest] Done. Document ID: ${doc.id}`);
    return doc.id;
}
