-- Setup SQL for LearnSphere AI Database in Supabase
-- Run these queries in your Supabase SQL Editor (https://supabase.com/dashboard/project/thomklnaljqgwdwjchtw/sql/new)

-- 1. Enable the pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the documents master table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the document sections table for chunks and embeddings
CREATE TABLE IF NOT EXISTS public.document_sections (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(768) -- 768 dimensions for Google's text-embedding-004 model
);

-- 4. Create an HNSW index for high-performance cosine similarity searches
CREATE INDEX IF NOT EXISTS document_sections_hnsw_idx 
ON public.document_sections 
USING hnsw (embedding vector_cosine_ops);

-- 5. Create the match_document_sections RPC function for semantic queries
CREATE OR REPLACE FUNCTION public.match_document_sections (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  filter_document_id UUID
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_sections.id,
    document_sections.content,
    1 - (document_sections.embedding <=> query_embedding) AS similarity
  FROM document_sections
  WHERE document_sections.document_id = filter_document_id
    AND 1 - (document_sections.embedding <=> query_embedding) > match_threshold
  ORDER BY document_sections.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

-- 6. Create the user_progress table for tracking personalized difficulty
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    subject_id UUID,
    current_level TEXT DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
    correct_streak INT DEFAULT 0,
    total_questions_solved INT DEFAULT 0,
    CONSTRAINT unique_user_subject UNIQUE (user_id, subject_id)
);

-- 7. Create the user_reading_progress table for tracking read completion
CREATE TABLE IF NOT EXISTS public.user_reading_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    section_id BIGINT REFERENCES public.document_sections(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_section UNIQUE (user_id, section_id)
);

-- 8. Create the quiz_attempts table for tracking test scores
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    score_percentage FLOAT NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
